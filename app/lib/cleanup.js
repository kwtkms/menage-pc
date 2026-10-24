'use strict';
// L'analyse « Nettoyage » : repère ce qui peut partir, catégorie par catégorie.
// Rien n'est supprimé ici — on ne fait que lister.
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { makeLimiter, diskOf, key, checkAbort, ago, direntType, isUnder, DAY } = require('./util');
const scan = require('./scan');
const safety = require('./safety');

const limit = makeLimiter(48);
const BIG = 500 * 1024 * 1024;
const DUP_MIN = 1024 * 1024;
const FULL_HASH_MAX = 512 * 1024 * 1024;
const OLD_DOWNLOAD = 90 * DAY;

const DEV_DIRS = {
  node_modules: 'dépendances npm — se réinstallent avec « npm install »',
  '.next': 'build Next.js — régénéré au prochain lancement',
  '.nuxt': 'build Nuxt — régénéré au prochain lancement',
  '.svelte-kit': 'build SvelteKit — régénéré',
  '.angular': 'cache Angular — régénéré',
  '.parcel-cache': 'cache Parcel — régénéré',
  '.turbo': 'cache Turborepo — régénéré',
  __pycache__: 'bytecode Python — régénéré automatiquement',
  '.pytest_cache': 'cache pytest — régénéré',
  '.mypy_cache': 'cache mypy — régénéré',
  '.ruff_cache': 'cache ruff — régénéré',
  '.gradle': 'cache Gradle du projet — régénéré',
};
const INSTALLER = new Set(['exe', 'msi', 'msix', 'msixbundle', 'appx', 'appxbundle']);
const VIRTUAL_DISK = /\.(vhdx?|avhdx|vmdk|vdi|qcow2)$/i;
const bySize = (a, b) => (b.size || 0) - (a.size || 0);
const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

const lstatL = p => limit(() => fsp.lstat(p));
const statSafe = p => lstatL(p).catch(() => null);
const readdirSafe = p => limit(() => fsp.readdir(p, { withFileTypes: true })).catch(() => null);
const typeOf = (dir, e) => direntType(dir, e, lstatL);

async function measure(p, ctx, st) {
  st = st || await statSafe(p);
  if (!st || st.isSymbolicLink()) return null;
  if (st.isDirectory()) {
    const s = await scan.dirSize(p, ctx);
    return { type: 'dir', size: s.size, disk: s.disk, files: s.files, mtime: st.mtimeMs };
  }
  return { type: 'file', size: st.size, disk: diskOf(st), files: 1, mtime: st.mtimeMs };
}

const item = (p, m, extra) => ({
  path: p, name: path.basename(p), type: m.type, size: m.size, disk: m.disk, files: m.files, mtime: m.mtime,
  level: safety.level(p), cloud: safety.isCloud(p), ...extra,
});

// ---------- Fichiers temporaires ----------
async function tempCat(ctx) {
  const notes = [];
  const items = [];
  for (const d of [os.tmpdir(), safety.winTemp]) {
    const ents = await readdirSafe(d);
    if (!ents) {
      notes.push(`${d} : accès refusé sans droits administrateur. Le « Nettoyage de disque » de Windows (bouton plus bas) s'en occupe.`);
      continue;
    }
    await Promise.all(ents.map(async e => {
      if (/^menage-/.test(e.name) || await typeOf(d, e) === 'link') return; // nos fichiers de travail, liens
      const p = path.join(d, e.name);
      const m = await measure(p, ctx);
      if (!m) return;
      const old = Date.now() - m.mtime > DAY;
      items.push(item(p, m, {
        note: old ? `modifié ${ago(m.mtime)}` : 'récent — sans doute utilisé en ce moment, laissé décoché',
        checked: old,
      }));
    }));
  }
  items.sort(bySize);
  return {
    id: 'temp', title: 'Fichiers temporaires', icon: 'temp', safe: true,
    desc: "Restes d'installations et de programmes. Windows les recrée si besoin ; ceux utilisés en ce moment seront simplement ignorés.",
    items, notes,
  };
}

// ---------- Caches d'applications ----------
const exists = async p => !!(await statSafe(p));
async function subdirs(dir) {
  const out = [];
  for (const e of (await readdirSafe(dir)) || []) if (await typeOf(dir, e) === 'dir') out.push(e.name);
  return out;
}

async function cachesCat(ctx) {
  const L = process.env.LOCALAPPDATA || path.join(safety.home, 'AppData', 'Local');
  const R = process.env.APPDATA || path.join(safety.home, 'AppData', 'Roaming');
  const LL = path.join(safety.home, 'AppData', 'LocalLow');
  const found = new Map(); // clé -> { path, label, hint, checked }
  const add = (p, label, hint, checked = true) => { if (!found.has(key(p))) found.set(key(p), { path: p, label, hint, checked }); };

  // Navigateurs Chromium : caches de chaque profil + caches de shaders communs.
  const PROFILE_CACHES = ['Cache', 'Code Cache', 'GPUCache', 'DawnCache', 'DawnGraphiteCache', 'DawnWebGPUCache'];
  const ROOT_CACHES = ['ShaderCache', 'GrShaderCache', 'GraphiteDawnCache'];
  const browsers = [
    ['Google Chrome', path.join(L, 'Google', 'Chrome', 'User Data')],
    ['Microsoft Edge', path.join(L, 'Microsoft', 'Edge', 'User Data')],
    ['Brave', path.join(L, 'BraveSoftware', 'Brave-Browser', 'User Data')],
    ['Vivaldi', path.join(L, 'Vivaldi', 'User Data')],
    ['Opera', path.join(L, 'Opera Software', 'Opera Stable')],
    ['Opera GX', path.join(L, 'Opera Software', 'Opera GX Stable')],
    ['Opera', path.join(R, 'Opera Software', 'Opera Stable')],
    ['Opera GX', path.join(R, 'Opera Software', 'Opera GX Stable')],
  ];
  for (const [name, ud] of browsers) {
    const names = await subdirs(ud);
    if (!names.length) continue;
    const profiles = [ud, ...names.filter(n => /^(Default|Profile \d+|Guest Profile|System Profile)$/.test(n)).map(n => path.join(ud, n))];
    for (const pr of profiles) {
      const prName = pr === ud ? '' : ` (${path.basename(pr)})`;
      for (const c of PROFILE_CACHES) if (await exists(path.join(pr, c))) add(path.join(pr, c), `${name} — ${c}${prName}`, `ferme ${name} avant`);
    }
    for (const c of ROOT_CACHES) if (await exists(path.join(ud, c))) add(path.join(ud, c), `${name} — ${c}`, `ferme ${name} avant`);
  }

  // Firefox
  const ffProfiles = path.join(L, 'Mozilla', 'Firefox', 'Profiles');
  for (const n of await subdirs(ffProfiles)) {
    for (const c of ['cache2', 'startupCache']) {
      const p = path.join(ffProfiles, n, c);
      if (await exists(p)) add(p, `Firefox — ${c}`, 'ferme Firefox avant');
    }
  }

  // Applications Electron (Discord, VS Code, Canva…) : repérées à leur « GPUCache » / « Code Cache ».
  const ELECTRON = ['Cache', 'Code Cache', 'GPUCache', 'DawnCache', 'DawnGraphiteCache', 'DawnWebGPUCache', 'CachedData', 'CachedExtensionVSIXs'];
  for (const base of [R, L]) {
    for (const n of await subdirs(base)) {
      if (/^(Microsoft|Google|Packages|Temp|Mozilla|Opera Software|BraveSoftware|Vivaldi)$/i.test(n)) continue;
      const d = path.join(base, n);
      if (!(await exists(path.join(d, 'GPUCache'))) && !(await exists(path.join(d, 'Code Cache')))) continue;
      for (const c of ELECTRON) if (await exists(path.join(d, c))) add(path.join(d, c), `${n} — ${c}`, `ferme ${n} avant`);
    }
  }

  // Caches connus, régénérés automatiquement. Les caches de shaders restent décochés :
  // les jeux les reconstruisent, mais saccadent un peu au premier lancement.
  const SHADER = 'reconstruit tout seul, mais les jeux peuvent saccader au 1er lancement';
  const explicit = [
    [path.join(L, 'D3DSCache'), 'Cache de shaders DirectX', SHADER, false],
    [path.join(L, 'NVIDIA', 'DXCache'), 'Cache de shaders NVIDIA (DirectX)', SHADER, false],
    [path.join(L, 'NVIDIA', 'GLCache'), 'Cache de shaders NVIDIA (OpenGL)', SHADER, false],
    [path.join(L, 'NVIDIA', 'OptixCache'), 'Cache NVIDIA OptiX', SHADER, false],
    [path.join(LL, 'NVIDIA', 'PerDriverVersion', 'DXCache'), 'Ancien cache de shaders NVIDIA', SHADER, false],
    [path.join(L, 'CrashDumps'), 'Rapports de plantage', 'inutiles sauf pour déboguer'],
    [path.join(L, 'Microsoft', 'Windows', 'WER'), "Rapports d'erreurs Windows", 'inutiles au quotidien'],
    [path.join(L, 'Microsoft', 'Windows', 'INetCache'), 'Cache Internet Windows', 'régénéré'],
    [path.join(L, 'npm-cache'), 'Cache npm', 'retéléchargé au prochain « npm install »'],
    [path.join(L, 'pip', 'Cache'), 'Cache pip (Python)', 'retéléchargé au besoin'],
    [path.join(L, 'Yarn', 'Cache'), 'Cache Yarn', 'retéléchargé au besoin'],
    [path.join(L, 'Steam', 'htmlcache'), 'Cache du navigateur de Steam', 'ferme Steam avant'],
    [path.join(L, 'UnrealEngine', 'Common', 'DerivedDataCache'), 'Cache Unreal Engine (DDC)', 'reconstruit à la prochaine ouverture'],
    [path.join(L, 'SquirrelTemp'), "Restes d'installations (Squirrel)", 'inutile'],
  ];
  for (const [p, label, hint, checked] of explicit) if (await exists(p)) add(p, label, hint, checked);
  const epic = path.join(L, 'EpicGamesLauncher', 'Saved');
  for (const n of await subdirs(epic)) {
    if (/^webcache/i.test(n)) add(path.join(epic, n), `Epic Games Launcher — ${n}`, "ferme l'Epic Games Launcher avant");
  }

  const items = [];
  await Promise.all([...found.values()].map(async f => {
    const m = await measure(f.path, ctx);
    if (!m || m.disk < 1024 * 1024) return; // on ignore ce qui fait moins d'1 Mo
    safety.allow(f.path); // cache connu : pas de confirmation « dossier d'application »
    items.push(item(f.path, m, { label: f.label, note: f.hint, checked: f.checked }));
  }));
  items.sort(bySize);
  return {
    id: 'caches', title: "Caches d'applications", icon: 'cache', safe: true,
    desc: "Copies temporaires que les navigateurs, jeux et applis refont tout seuls. Ferme l'appli concernée avant : ses fichiers ouverts ne partent pas.",
    items, notes: [],
  };
}

// ---------- Téléchargements ----------
async function downloadsCat(dl) {
  const items = [];
  const ents = dl ? await readdirSafe(dl) : null;
  if (ents) {
    await Promise.all(ents.map(async e => {
      if (safety.isSystemName(e.name) || await typeOf(dl, e) !== 'file') return; // les sous-dossiers sont du rangement, pas du déchet
      const p = path.join(dl, e.name);
      const m = await measure(p);
      if (!m) return;
      const ext = path.extname(e.name).slice(1).toLowerCase();
      const installer = INSTALLER.has(ext);
      if (!installer && Date.now() - m.mtime < OLD_DOWNLOAD) return;
      const note = installer ? `installateur, téléchargé ${ago(m.mtime)} — sert rarement une 2e fois` : `téléchargé ${ago(m.mtime)}, jamais modifié depuis`;
      items.push(item(p, m, { note, checked: false }));
    }));
  }
  items.sort(bySize);
  return {
    id: 'downloads', title: 'Vieux téléchargements', icon: 'download', safe: false,
    desc: "Installateurs (.exe, .msi) déjà utilisés et fichiers de Téléchargements vieux de plus de 3 mois. À vérifier : rien n'est coché d'office.",
    items, notes: dl ? [] : ['Dossier Téléchargements introuvable.'],
  };
}

// ---------- Parcours du profil : dev, gros fichiers, doublons, dossiers vides ----------
// Doublons et dossiers vides : seulement dans tes dossiers à toi (roots). Ailleurs, un
// « doublon » ou un dossier vide appartient souvent à un logiciel (jeux, extensions…).
async function walkProfile(ctx, roots = []) {
  const home = safety.home;
  const rootKeys = new Set(roots.filter(Boolean).map(key));
  const skip = new Set([key(os.tmpdir())]);
  const out = { dev: [], big: [], cand: [] };

  async function rec(dir, flags) {
    checkAbort(ctx.signal);
    const ents = await readdirSafe(dir);
    if (!ents) return { files: 1, empty: [] }; // illisible : on ne le déclare pas vide
    ctx.dirs++;
    ctx.current = dir;
    let files = 0;
    let empty = [];
    await Promise.all(ents.map(async e => {
      const full = path.join(dir, e.name);
      const type = await typeOf(dir, e);
      if (type === 'link') { files++; return; }
      if (type === 'dir') {
        const lname = e.name.toLowerCase();
        if (skip.has(key(full))) { files++; return; }
        const f = {
          top: false,
          appdata: flags.appdata || key(full) === key(safety.appData),
          dot: flags.dot || (flags.top && e.name.startsWith('.')), // .vscode, .cache, .claude… : dossiers d'outils
          git: flags.git || lname === '.git',
          content: flags.content || rootKeys.has(key(full)),
        };
        if (!f.appdata && !f.dot && !flags.git && hasOwn(DEV_DIRS, lname)) {
          files++;
          out.dev.push({ path: full, kind: lname });
          return;
        }
        const sub = await rec(full, f);
        files += sub.files;
        if (sub.empty.length) empty = empty.concat(sub.empty);
        return;
      }
      files++;
      ctx.files++;
      const st = await statSafe(full);
      if (!st) return;
      const cloudOnly = scan.isCloudOnly(full, st);
      if (st.size >= BIG) out.big.push({ path: full, st, cloudOnly, appdata: flags.appdata, dot: flags.dot });
      if (flags.content && !flags.git && !flags.dot && !cloudOnly && st.size >= DUP_MIN) out.cand.push({ path: full, st });
    }));
    if (files === 0 && flags.content && !flags.git && !flags.dot) {
      const name = path.basename(dir);
      if (safety.level(dir) === 'ok' && !name.startsWith('.')) empty = [dir];
    }
    return { files, empty };
  }

  const res = await rec(home, { top: true, appdata: false, dot: false, git: false, content: rootKeys.has(key(home)) });
  out.empty = res.empty;
  return out;
}

async function devCat(list, ctx) {
  const items = [];
  await Promise.all(list.map(async d => {
    const m = await measure(d.path, ctx);
    if (!m || m.size === 0) return;
    const project = path.dirname(d.path);
    const pst = await statSafe(project);
    const when = pst ? ` · projet modifié ${ago(pst.mtimeMs)}` : '';
    items.push(item(d.path, m, { label: `${path.basename(project)} › ${d.kind}`, note: DEV_DIRS[d.kind] + when, checked: false }));
  }));
  items.sort(bySize);
  return {
    id: 'dev', title: 'Dossiers de développement', icon: 'code', safe: false,
    desc: 'node_modules, builds et caches de tes projets. Supprimables sans perte : ils se régénèrent à la prochaine installation ou compilation. (Extensions VS Code et dossiers cachés ignorés.)',
    items, notes: [],
  };
}

function bigCat(list) {
  const items = list
    .map(b => item(b.path, { type: 'file', size: b.st.size, disk: diskOf(b.st), files: 1, mtime: b.st.mtimeMs }, {
      note: [
        VIRTUAL_DISK.test(b.path) ? 'disque virtuel (WSL, Docker, machine virtuelle…) : le supprimer efface tout ce qu’il contient' : null,
        b.cloudOnly ? 'en ligne uniquement (OneDrive) : ne prend pas de place sur ce PC' : null,
        b.appdata && !VIRTUAL_DISK.test(b.path) ? "fichier d'application (AppData) : vérifie avant" : null,
        b.dot ? "dans un dossier d'outil caché : souvent un cache ou un modèle retéléchargeable" : null,
        `modifié ${ago(b.st.mtimeMs)}`,
      ].filter(Boolean).join(' · '),
      cloudOnly: b.cloudOnly || undefined,
      checked: false,
    }))
    .sort(bySize)
    .slice(0, 150);
  return {
    id: 'big', title: 'Gros fichiers (plus de 500 Mo)', icon: 'big', safe: false,
    desc: 'Les plus gros fichiers de ton dossier personnel. Vidéos, images disque, sauvegardes oubliées… à toi de juger.',
    items, notes: [],
  };
}

// Doublons : même taille -> même empreinte d'échantillons -> même empreinte complète.
async function sampleHash(p, size) {
  const fh = await fsp.open(p, 'r');
  try {
    const h = crypto.createHash('sha1');
    const chunk = 64 * 1024;
    const offsets = [0, Math.max(0, size - chunk)];
    for (let i = 1; i <= 4; i++) offsets.push(Math.floor((size * i) / 5));
    const buf = Buffer.alloc(chunk);
    for (const off of offsets) {
      const { bytesRead } = await fh.read(buf, 0, chunk, off);
      h.update(buf.subarray(0, bytesRead));
    }
    return h.digest('hex');
  } finally { await fh.close(); }
}
function fullHash(p) {
  return new Promise((resolve, reject) => {
    const h = crypto.createHash('sha1');
    fs.createReadStream(p, { highWaterMark: 1024 * 1024 })
      .on('data', d => h.update(d)).on('error', reject).on('end', () => resolve(h.digest('hex')));
  });
}
async function groupBy(list, fn) {
  const m = new Map();
  await Promise.all(list.map(async x => {
    let k;
    try { k = await limit(() => fn(x)); } catch { return; }
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(x);
  }));
  return [...m.values()].filter(g => g.length > 1);
}

// L'exemplaire proposé à garder : celui qu'un projet utilise (dossier assets, public, src…),
// puis hors Téléchargements, sans « (1) » / « copie » dans le nom, sinon le plus ancien.
// Ex. du 13/09 : une vidéo WhatsApp copiée dans « maquette\assets » — c'est la copie du site
// qu'il faut garder, sinon la maquette casse.
const COPY_NAME = /\(\d+\)|\bcop(ie|y)\b/i;
const USED_DIR = /[\\/](assets?|public|static|src|res|media|img)[\\/]/i;
function keepScore(c, downloads) {
  return (USED_DIR.test(c.path) ? -2 : 0)
    + (downloads && isUnder(c.path, downloads) ? 2 : 0)
    + (COPY_NAME.test(path.basename(c.path)) ? 1 : 0);
}

async function dupsCat(cands, ctx, downloads) {
  // Même fichier vu deux fois (liens physiques) : on ne garde qu'une entrée par inode.
  const seen = new Set();
  const uniq = cands.filter(c => { const k = `${c.st.dev}:${c.st.ino}`; if (seen.has(k)) return false; seen.add(k); return true; });
  const sizeGroups = await groupBy(uniq, c => c.st.size);
  const groups = [];
  for (const g of sizeGroups) {
    checkAbort(ctx.signal);
    ctx.current = path.dirname(g[0].path);
    const size = g[0].st.size;
    for (const g2 of await groupBy(g, c => sampleHash(c.path, size))) {
      const final = size <= FULL_HASH_MAX ? await groupBy(g2, c => fullHash(c.path)) : [g2];
      for (const g3 of final) {
        const sorted = g3.sort((a, b) => keepScore(a, downloads) - keepScore(b, downloads) || a.st.mtimeMs - b.st.mtimeMs);
        groups.push({
          size,
          exact: size <= FULL_HASH_MAX,
          items: sorted.map((c, i) => item(c.path, { type: 'file', size, disk: diskOf(c.st), files: 1, mtime: c.st.mtimeMs }, {
            note: i === 0 ? 'exemplaire proposé à garder' : `copie · modifié ${ago(c.st.mtimeMs)}`,
            checked: false,
          })),
        });
      }
    }
  }
  groups.sort((a, b) => b.size * (b.items.length - 1) - a.size * (a.items.length - 1));
  return {
    id: 'dups', title: 'Fichiers en double', icon: 'dups', safe: false,
    desc: "Fichiers au contenu identique (octet pour octet) rangés à plusieurs endroits de tes dossiers (Bureau, Documents, Téléchargements, Images, Vidéos, Musique, OneDrive). Le 1er de chaque groupe est proposé à garder : celui hors Téléchargements, sans « (1) » dans le nom, sinon le plus ancien.",
    groups: groups.slice(0, 300), notes: [],
  };
}

async function emptyCat(list) {
  const items = [];
  for (const p of list) {
    const st = await statSafe(p);
    if (!st) continue;
    items.push(item(p, { type: 'dir', size: 0, disk: 0, files: 0, mtime: st.mtimeMs }, { note: `vide · modifié ${ago(st.mtimeMs)}`, checked: false }));
  }
  items.sort((a, b) => a.path.localeCompare(b.path, 'fr'));
  return {
    id: 'empty', title: 'Dossiers vides', icon: 'empty', safe: false,
    desc: "Dossiers de tes dossiers personnels qui ne contiennent aucun fichier (même dans leurs sous-dossiers). Ne libère pas de place, mais range. Certains servent peut-être de cases à remplir : regarde avant.",
    items, notes: [],
  };
}

async function analyze(ctx, known) {
  ctx.files = 0; ctx.dirs = 0; ctx.current = '';
  const roots = [known.desktop, known.documents, known.downloads, known.pictures, known.videos, known.music, process.env.OneDrive];
  const cats = [];
  ctx.phase = 'Fichiers temporaires';
  cats.push(await tempCat(ctx));
  ctx.phase = "Caches d'applications";
  cats.push(await cachesCat(ctx));
  ctx.phase = 'Téléchargements';
  const dl = await downloadsCat(known.downloads);
  ctx.phase = 'Parcours du dossier personnel';
  const walk = await walkProfile(ctx, roots);
  const dlKeys = new Set(dl.items.map(i => key(i.path)));
  ctx.phase = 'Dossiers de développement';
  const dev = await devCat(walk.dev, ctx);
  ctx.phase = 'Recherche de doublons';
  const dups = await dupsCat(walk.cand, ctx, known.downloads);
  const big = bigCat(walk.big.filter(b => !dlKeys.has(key(b.path))));
  const empty = await emptyCat(walk.empty);
  cats.push(dl, dev, big, dups, empty);
  return { at: Date.now(), scanned: { files: ctx.files, dirs: ctx.dirs }, categories: cats };
}

module.exports = { analyze, walkProfile };
