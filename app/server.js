'use strict';
// Ménage PC — serveur local. N'écoute que sur 127.0.0.1 et exige un jeton aléatoire
// (injecté dans la page) : aucun site web ne peut piloter les suppressions.
if (!process.env.UV_THREADPOOL_SIZE) process.env.UV_THREADPOOL_SIZE = '16';

const http = require('http');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { key, diskOf, httpError, rmForce, AbortError, direntType } = require('./lib/util');
const scan = require('./lib/scan');
const safety = require('./lib/safety');
const shell = require('./lib/shell');
const cleanup = require('./lib/cleanup');

const PORT = Number(process.env.MENAGE_PORT) || 4747;
const HOST = '127.0.0.1';
const APP_URL = `http://127.0.0.1:${PORT}/`;
const TOKEN = crypto.randomBytes(24).toString('hex');
const PUB = path.join(__dirname, 'public');
const IDLE_MS = 5 * 60 * 1000;
const NO_OPEN = process.argv.includes('--no-open');

let lastSeen = Date.now();
let streams = 0;
let known = {};
let lastReport = null;

// ---------- Utilitaires HTTP ----------
function send(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}
function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', c => { size += c.length; if (size > 8e6) { reject(httpError(413, 'Requête trop grosse')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch { reject(httpError(400, 'JSON invalide')); } });
    req.on('error', reject);
  });
}
function openSSE(res) {
  res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
  res.write('retry: 3600000\n\n'); // pas de reconnexion automatique
  streams++;
  const ac = new AbortController();
  res.on('close', () => { streams--; lastSeen = Date.now(); ac.abort(); });
  return {
    signal: ac.signal,
    send(event, data) { if (!res.writableEnded) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); },
    end() { if (!res.writableEnded) res.end(); },
  };
}
const expand = p => String(p || '').trim().replace(/^"|"$/g, '').replace(/%([^%]+)%/g, (m, v) => process.env[v] ?? m);
function needPath(p) {
  const x = expand(p);
  if (!x || !path.isAbsolute(x)) throw httpError(400, `Chemin invalide : ${p || '(vide)'}`);
  return path.resolve(x);
}

// ---------- Emplacements ----------
async function getPlaces() {
  const home = safety.home;
  const L = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
  const quick = [
    ['Dossier personnel', home, 'home'],
    ['Bureau', known.desktop, 'desktop'],
    ['Documents', known.documents, 'doc'],
    ['Téléchargements', known.downloads, 'download'],
    ['Images', known.pictures, 'image'],
    ['Vidéos', known.videos, 'video'],
    ['Musique', known.music, 'music'],
    ['OneDrive', process.env.OneDrive, 'cloud'],
    ['Données des applis', L, 'gear'],
    ['Temporaires', os.tmpdir(), 'temp'],
  ];
  const out = [];
  for (const [name, p, icon] of quick) {
    if (!p) continue;
    try { if ((await fsp.stat(p)).isDirectory()) out.push({ name, path: p, icon }); } catch { /* absent */ }
  }
  const drives = [];
  for (let c = 67; c <= 90; c++) { // C: à Z:
    const root = String.fromCharCode(c) + ':\\';
    try {
      const s = await fsp.statfs(root);
      const sys = root.toLowerCase() === (process.env.SystemDrive || 'C:').toLowerCase() + '\\';
      drives.push({ root, name: sys ? `Disque système (${root.slice(0, 2)})` : `Disque (${root.slice(0, 2)})`, total: s.blocks * s.bsize, free: s.bavail * s.bsize });
    } catch { /* lecteur absent */ }
  }
  return { home, quick: out, drives };
}

// Taille sans passer par le cache (le contenu de la corbeille change sans arrêt).
async function sizeNoCache(p) {
  let ents;
  try { ents = await fsp.readdir(p, { withFileTypes: true }); } catch { return 0; }
  let t = 0;
  for (const e of ents) {
    if (e.isSymbolicLink()) continue;
    const c = path.join(p, e.name);
    if (e.isDirectory()) t += await sizeNoCache(c);
    else { try { t += diskOf(await fsp.lstat(c)); } catch { /* ignoré */ } }
  }
  return t;
}

async function recycleInfo() {
  if (!known.sid) return { size: null, count: null };
  let size = 0;
  let count = 0;
  for (const d of (await getPlaces()).drives) {
    const dir = path.join(d.root, '$Recycle.Bin', known.sid);
    let ents;
    try { ents = await fsp.readdir(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of ents) {
      if (e.name.startsWith('$I')) count++;
      if (!e.name.startsWith('$R')) continue;
      const p = path.join(dir, e.name);
      size += e.isDirectory() ? await sizeNoCache(p) : await fsp.lstat(p).then(diskOf, () => 0);
    }
  }
  return { size, count };
}

// ---------- Actions ----------
async function doDelete(body) {
  const paths = Array.isArray(body.paths) ? body.paths : [];
  if (!paths.length) throw httpError(400, 'Aucun élément à supprimer');
  const results = [];
  const todo = [];
  for (const raw of paths) {
    let p;
    try { p = needPath(raw); } catch (e) { results.push({ path: String(raw), ok: false, error: e.message }); continue; }
    const lvl = safety.level(p);
    if (lvl === 'block') { results.push({ path: p, ok: false, error: 'Protégé : élément système ou dossier indispensable' }); continue; }
    if (lvl === 'warn' && !body.acceptWarn) { results.push({ path: p, ok: false, error: 'Confirmation renforcée requise (dossier système ou application)' }); continue; }
    let st;
    try { st = await fsp.lstat(p); } catch { results.push({ path: p, ok: false, error: 'Introuvable (déjà supprimé ?)' }); continue; }
    const c = st.isDirectory() ? scan.cache.get(key(p)) : { disk: diskOf(st) };
    todo.push({ p, bytes: c ? c.disk : null });
  }
  if (todo.length) {
    if (body.permanent) {
      for (const t of todo) {
        const failed = await rmForce(t.p);
        const still = await fsp.lstat(t.p).then(() => true, () => false);
        results.push(still
          ? { path: t.p, ok: false, partial: true, error: `${failed} élément(s) n'ont pas pu être supprimés (utilisés par un programme ou protégés)` }
          : { path: t.p, ok: true, bytes: t.bytes });
      }
    } else {
      const out = await shell.recycle(todo.map(t => t.p));
      out.forEach((r, i) => results.push({ ...r, bytes: r.ok ? todo[i].bytes : null }));
    }
    scan.forget(todo.map(t => t.p));
  }
  return { results, permanent: !!body.permanent };
}

const BAD_NAME = /[\\/:*?"<>|\x00-\x1f]/;
async function doRename(body) {
  const p = needPath(body.path);
  const name = String(body.name || '').trim();
  if (!name || name === '.' || name === '..' || BAD_NAME.test(name) || /[. ]$/.test(name)) throw httpError(400, 'Nom invalide (interdits : \\ / : * ? " < > | et point ou espace final)');
  if (safety.level(p) === 'block') throw httpError(403, 'Élément protégé : renommage refusé');
  const dest = path.join(path.dirname(p), name);
  if (key(dest) !== key(p) && await fsp.lstat(dest).then(() => true, () => false)) throw httpError(409, 'Un élément porte déjà ce nom ici');
  await fsp.rename(p, dest);
  scan.forget([p, dest]);
  return { path: dest };
}

async function doMkdir(body) {
  const parent = needPath(body.path);
  const name = String(body.name || '').trim();
  if (!name || BAD_NAME.test(name) || /[. ]$/.test(name)) throw httpError(400, 'Nom invalide');
  const dest = path.join(parent, name);
  await fsp.mkdir(dest);
  scan.forget([dest]);
  return { path: dest };
}

const TEXT_EXT = new Set('txt md markdown log json xml yml yaml ini cfg conf toml csv tsv js mjs cjs ts jsx tsx py java c cpp h hpp cs html htm css scss sql sh bat cmd ps1 php rb go rs lua gitignore env properties srt vtt nfo'.split(' '));
async function readText(p) {
  const st = await fsp.stat(p);
  if (!st.isFile()) throw httpError(400, "Ce n'est pas un fichier");
  if (scan.isCloudOnly(p, await fsp.lstat(p))) return { cloudOnly: true };
  const fh = await fsp.open(p, 'r');
  try {
    const buf = Buffer.alloc(Math.min(st.size, 64 * 1024));
    const { bytesRead } = await fh.read(buf, 0, buf.length, 0);
    const b = buf.subarray(0, bytesRead);
    if (b.includes(0)) return { binary: true };
    let text = b.toString('utf8');
    if ((text.match(/\uFFFD/g) || []).length > 8) text = b.toString('latin1');
    return { text, truncated: st.size > bytesRead };
  } finally { await fh.close(); }
}

const PREVIEW_TYPES = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', jfif: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp',
  ico: 'image/x-icon', avif: 'image/avif', svg: 'image/svg+xml',
  mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm', mkv: 'video/webm', mov: 'video/mp4',
  mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', opus: 'audio/ogg', m4a: 'audio/mp4', flac: 'audio/flac', aac: 'audio/aac',
  pdf: 'application/pdf',
};
async function serveFile(req, res, p) {
  const type = PREVIEW_TYPES[path.extname(p).slice(1).toLowerCase()];
  if (!type) return send(res, 415, { error: 'Aperçu non disponible pour ce type' });
  const st = await fsp.lstat(p);
  if (!st.isFile()) return send(res, 400, { error: "Ce n'est pas un fichier" });
  if (scan.isCloudOnly(p, st)) return send(res, 409, { error: 'Fichier en ligne uniquement : pas d’aperçu pour ne pas le télécharger' });
  const headers = { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store', 'Accept-Ranges': 'bytes' };
  // Un SVG ou autre fichier piégé ne doit jamais exécuter de script sur notre origine.
  if (type !== 'application/pdf') headers['Content-Security-Policy'] = "sandbox; default-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'unsafe-inline'";
  let start = 0;
  let end = st.size - 1;
  let status = 200;
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (m && st.size > 0) {
    if (m[1]) { start = Number(m[1]); if (m[2]) end = Math.min(Number(m[2]), st.size - 1); } else if (m[2]) start = Math.max(0, st.size - Number(m[2]));
    if (start > end || start >= st.size) { res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }); return res.end(); }
    status = 206;
    headers['Content-Range'] = `bytes ${start}-${end}/${st.size}`;
  }
  headers['Content-Length'] = st.size ? end - start + 1 : 0;
  res.writeHead(status, headers);
  if (!st.size) return res.end();
  fs.createReadStream(p, { start, end }).on('error', () => res.destroy()).pipe(res);
}

// ---------- Flux (SSE) ----------
async function streamSizes(res, p) {
  const sse = openSSE(res);
  let files = 0;
  let current = '';
  const ctx = { signal: sse.signal, onFile() { files++; }, onDir(d) { current = d; } };
  const timer = setInterval(() => sse.send('progress', { files, current }), 300);
  try {
    const ents = await fsp.readdir(p, { withFileTypes: true });
    const dirs = [];
    for (const e of ents) if (await direntType(p, e) === 'dir') dirs.push(e.name);
    await Promise.all(dirs.map(async name => {
      const s = await scan.dirSize(path.join(p, name), ctx);
      sse.send('size', { name, ...s });
    }));
    sse.send('done', await scan.dirSize(p, ctx));
  } catch (e) {
    if (!(e instanceof AbortError)) sse.send('fail', { message: e.message });
  } finally { clearInterval(timer); sse.end(); }
}

async function streamSearch(res, p, q) {
  const sse = openSSE(res);
  const ctx = { signal: sse.signal, dirs: 0, current: '' };
  let batch = [];
  const flush = () => { if (batch.length) { sse.send('hits', { items: batch }); batch = []; } };
  const timer = setInterval(() => { flush(); sse.send('progress', { dirs: ctx.dirs, current: ctx.current }); }, 250);
  try {
    const r = await scan.search(p, q, ctx, it => batch.push(it));
    flush();
    sse.send('done', r);
  } catch (e) {
    sse.send('fail', { message: e.message });
  } finally { clearInterval(timer); sse.end(); }
}

async function streamCleanup(res) {
  const sse = openSSE(res);
  const ctx = { signal: sse.signal, phase: 'Démarrage', files: 0, dirs: 0, current: '', dupDone: 0 };
  const timer = setInterval(() => sse.send('progress', { phase: ctx.phase, files: ctx.files, dirs: ctx.dirs, current: ctx.current }), 400);
  try {
    lastReport = await cleanup.analyze(ctx, known);
    sse.send('done', lastReport);
  } catch (e) {
    if (!(e instanceof AbortError)) sse.send('fail', { message: e.message });
  } finally { clearInterval(timer); sse.end(); }
}

// ---------- Routeur ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };
const PAGE_CSP = "default-src 'self'; img-src 'self' data: blob:; media-src 'self'; frame-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'";

async function handle(req, res) {
  const host = String(req.headers.host || '').toLowerCase();
  if (host !== `127.0.0.1:${PORT}` && host !== `localhost:${PORT}`) return send(res, 403, { error: 'Hôte refusé' });
  const url = new URL(req.url, APP_URL);
  const route = `${req.method} ${url.pathname}`;
  const q = n => url.searchParams.get(n);

  if (req.method === 'GET' && !url.pathname.startsWith('/api/')) {
    const file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    if (!/^[a-z0-9_.-]+$/i.test(file)) return send(res, 404, { error: 'Introuvable' });
    let body;
    try { body = await fsp.readFile(path.join(PUB, file)); } catch { return send(res, 404, { error: 'Introuvable' }); }
    const ext = path.extname(file);
    if (file === 'index.html') body = Buffer.from(body.toString('utf8').replace('__TOKEN__', TOKEN));
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-store', 'Content-Security-Policy': PAGE_CSP, 'X-Content-Type-Options': 'nosniff' });
    return res.end(body);
  }
  if (route === 'GET /api/hello') return send(res, 200, { app: 'menage-pc' });
  if (req.headers['x-token'] !== TOKEN && q('t') !== TOKEN) return send(res, 401, { error: 'Jeton invalide — recharge la page' });
  lastSeen = Date.now();

  switch (route) {
    case 'GET /api/places': return send(res, 200, await getPlaces());
    case 'GET /api/list': return send(res, 200, await scan.listDir(needPath(q('path'))));
    case 'GET /api/sizes': return streamSizes(res, needPath(q('path')));
    case 'GET /api/search': {
      const s = String(q('q') || '').trim();
      if (!s) throw httpError(400, 'Recherche vide');
      return streamSearch(res, needPath(q('path')), s);
    }
    case 'GET /api/file': return serveFile(req, res, needPath(q('path')));
    case 'GET /api/text': return send(res, 200, await readText(needPath(q('path'))));
    case 'GET /api/cleanup': return streamCleanup(res);
    case 'GET /api/cleanup/last': return send(res, 200, { report: lastReport });
    case 'GET /api/recycle': return send(res, 200, await recycleInfo());
    case 'POST /api/ping': return send(res, 200, { ok: true });
    case 'POST /api/delete': return send(res, 200, await doDelete(await readJson(req)));
    case 'POST /api/rename': return send(res, 200, await doRename(await readJson(req)));
    case 'POST /api/mkdir': return send(res, 200, await doMkdir(await readJson(req)));
    case 'POST /api/refresh': { const p = needPath((await readJson(req)).path); scan.forget([p]); return send(res, 200, { ok: true }); }
    case 'POST /api/open': { const p = needPath((await readJson(req)).path); await fsp.lstat(p); shell.open(p); return send(res, 200, { ok: true }); }
    case 'POST /api/reveal': { const p = needPath((await readJson(req)).path); await fsp.lstat(p); shell.reveal(p); return send(res, 200, { ok: true }); }
    case 'POST /api/special': shell.openSpecial((await readJson(req)).what); return send(res, 200, { ok: true });
    case 'POST /api/recycle/empty': await shell.emptyRecycleBin(); return send(res, 200, await recycleInfo());
    case 'POST /api/quit': send(res, 200, { ok: true }); setTimeout(() => process.exit(0), 200); return undefined;
    default: return send(res, 404, { error: 'Route inconnue' });
  }
}

const server = http.createServer((req, res) => {
  handle(req, res).catch(e => {
    if (res.headersSent) { res.destroy(); return; }
    const status = e.status || (e.code === 'ENOENT' ? 404 : e.code === 'EPERM' || e.code === 'EACCES' ? 403 : e.code === 'EBUSY' ? 409 : 500);
    const msg = e.status ? e.message
      : e.code === 'ENOENT' ? 'Introuvable (déplacé ou supprimé ?)'
      : e.code === 'EPERM' || e.code === 'EACCES' ? 'Accès refusé'
      : e.code === 'EBUSY' ? 'Élément utilisé par un autre programme'
      : e.code === 'EEXIST' ? 'Existe déjà' : e.message;
    send(res, e.code === 'EEXIST' ? 409 : status, { error: msg });
  });
});

function openWindow() {
  const pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const pf = process.env.ProgramFiles || 'C:\\Program Files';
  const candidates = [
    path.join(pf86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(pf, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(pf, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  ];
  const exe = candidates.find(c => fs.existsSync(c));
  const child = exe
    ? spawn(exe, [`--app=${APP_URL}`, '--window-size=1440,900'], { detached: true, stdio: 'ignore' })
    : spawn(path.join(process.env.SystemRoot || 'C:\\Windows', 'explorer.exe'), [APP_URL], { detached: true, stdio: 'ignore' });
  child.on('error', () => {});
  child.unref();
}

server.on('error', async e => {
  if (e.code !== 'EADDRINUSE') { console.error(e); process.exit(1); }
  try {
    const r = await fetch(`${APP_URL}api/hello`);
    if ((await r.json()).app === 'menage-pc') {
      console.log('Ménage PC tourne déjà : ouverture de la fenêtre.');
      if (!NO_OPEN) openWindow();
      setTimeout(() => process.exit(0), 500);
      return;
    }
  } catch { /* pas nous */ }
  console.error(`Le port ${PORT} est déjà utilisé par un autre programme.`);
  process.exit(1);
});

(async () => {
  known = await shell.userInfo();
  safety.setKnownFolders([known.desktop, known.documents, known.downloads, known.pictures, known.videos, known.music]);
  safety.setOneDrive(process.env.OneDrive);
  server.listen(PORT, HOST, () => {
    console.log(`Ménage PC : ${APP_URL}`);
    console.log('Ferme cette fenêtre (ou le bouton « Quitter » de l’appli) pour arrêter.');
    if (!NO_OPEN) openWindow();
  });
  // Arrêt automatique quand plus aucune fenêtre ne donne signe de vie.
  setInterval(() => {
    if (streams === 0 && Date.now() - lastSeen > IDLE_MS) { console.log('Plus de fenêtre ouverte : arrêt.'); process.exit(0); }
  }, 30000).unref();
})();
