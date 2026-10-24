'use strict';
// Listage des dossiers, calcul récursif des tailles (avec cache) et recherche.
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { makeLimiter, key, diskOf, ancestors, checkAbort, httpError, direntType } = require('./util');
const safety = require('./safety');

const limit = makeLimiter(32);
const cache = new Map(); // clé de chemin -> { size, disk, files, dirs, denied, at }

async function dirSize(p, ctx = {}) {
  const k = key(p);
  const hit = cache.get(k);
  if (hit) return hit;
  checkAbort(ctx.signal);
  let ents;
  try {
    ents = await limit(() => fsp.readdir(p, { withFileTypes: true }));
  } catch {
    const r = { size: 0, disk: 0, files: 0, dirs: 0, denied: 1, at: Date.now() };
    cache.set(k, r);
    return r;
  }
  if (ctx.onDir) ctx.onDir(p);
  const t = { size: 0, disk: 0, files: 0, dirs: 0, denied: 0 };
  await Promise.all(ents.map(async e => {
    const type = await direntType(p, e, x => limit(() => fsp.lstat(x)));
    if (type === 'link') return; // jonctions : jamais suivies (boucles, double comptage)
    const cp = path.join(p, e.name);
    if (type === 'dir') {
      const s = await dirSize(cp, ctx);
      t.size += s.size; t.disk += s.disk; t.files += s.files; t.dirs += s.dirs + 1; t.denied += s.denied;
      return;
    }
    checkAbort(ctx.signal);
    try {
      const st = await limit(() => fsp.lstat(cp));
      t.size += st.size; t.disk += diskOf(st); t.files++;
      if (ctx.onFile) ctx.onFile();
    } catch { t.denied++; }
  }));
  t.at = Date.now();
  cache.set(k, t);
  return t;
}

// Après une suppression / un renommage : on oublie le sous-arbre et toute la chaîne
// des parents. Les dossiers voisins restent en cache, donc le recalcul est rapide.
function forget(paths) {
  const exact = new Set();
  const prefixes = [];
  for (const p of paths) {
    const k = key(p);
    exact.add(k);
    prefixes.push(k.endsWith('\\') ? k : k + '\\');
    for (const a of ancestors(p)) exact.add(key(a));
  }
  for (const k of [...cache.keys()]) {
    if (exact.has(k) || prefixes.some(pre => k.startsWith(pre))) cache.delete(k);
  }
}

const isCloudOnly = (p, st) => st.blocks === 0 && st.size > 4096 && safety.isCloud(p);

function pickSize(c) {
  return { size: c.size, disk: c.disk, files: c.files, dirs: c.dirs, denied: c.denied, at: c.at };
}

async function listDir(raw) {
  const p = path.resolve(raw);
  let st;
  try { st = await fsp.stat(p); } catch { throw httpError(404, `Dossier introuvable : ${p}`); }
  if (!st.isDirectory()) throw httpError(400, `Ce n'est pas un dossier : ${p}`);
  let ents;
  try { ents = await fsp.readdir(p, { withFileTypes: true }); } catch (e) {
    throw httpError(403, e.code === 'EPERM' || e.code === 'EACCES'
      ? `Accès refusé à ${p} (réservé à Windows ou à l'administrateur)` : e.message);
  }
  const entries = await Promise.all(ents.map(async e => {
    const full = path.join(p, e.name);
    const it = { name: e.name, path: full, type: e.isSymbolicLink() ? 'link' : e.isDirectory() ? 'dir' : 'file' };
    try {
      const s = await fsp.lstat(full);
      it.type = s.isSymbolicLink() ? 'link' : s.isDirectory() ? 'dir' : 'file'; // voir direntType
      it.mtime = s.mtimeMs;
      if (it.type === 'file') {
        it.size = s.size;
        it.disk = diskOf(s);
        if (isCloudOnly(full, s)) it.cloudOnly = true;
      }
    } catch { it.error = true; }
    if (it.type === 'dir') {
      const c = cache.get(key(full));
      if (c) Object.assign(it, pickSize(c));
    }
    if (it.type === 'link') { try { it.target = await fsp.readlink(full); } catch { /* ignoré */ } }
    it.level = safety.level(full);
    if (safety.isSystemName(e.name)) it.system = true;
    if (safety.isCloud(full)) it.cloud = true;
    return it;
  }));
  const parent = path.dirname(p);
  const c = cache.get(key(p));
  return {
    path: p,
    parent: parent === p ? null : parent,
    level: safety.level(p),
    cloud: safety.isCloud(p),
    entries,
    cached: c ? pickSize(c) : null,
  };
}

// Recherche récursive par nom (sans accents ni casse), jokers * et ? acceptés.
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function matcher(q) {
  const nq = norm(q.trim());
  if (/[*?]/.test(nq)) {
    const re = new RegExp('^' + nq.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
    return name => re.test(norm(name));
  }
  return name => norm(name).includes(nq);
}

async function search(root, q, ctx, onHit, max = 2000) {
  const match = matcher(q);
  let hits = 0;
  let truncated = false;
  async function rec(dir) {
    if (ctx.signal.aborted || truncated) return;
    let ents;
    try { ents = await limit(() => fsp.readdir(dir, { withFileTypes: true })); } catch { return; }
    ctx.dirs = (ctx.dirs || 0) + 1;
    ctx.current = dir;
    const subs = [];
    for (const e of ents) {
      const type = await direntType(dir, e);
      if (type === 'link') continue;
      const full = path.join(dir, e.name);
      if (type === 'dir') subs.push(full);
      if (!match(e.name)) continue;
      if (hits >= max) { truncated = true; return; }
      hits++;
      const it = { name: e.name, path: full, type, parent: dir };
      try {
        const s = await fsp.lstat(full);
        it.mtime = s.mtimeMs;
        if (it.type === 'file') { it.size = s.size; it.disk = diskOf(s); if (isCloudOnly(full, s)) it.cloudOnly = true; }
      } catch { it.error = true; }
      if (it.type === 'dir') { const c = cache.get(key(full)); if (c) Object.assign(it, pickSize(c)); }
      it.level = safety.level(full);
      if (safety.isSystemName(e.name)) it.system = true;
      if (safety.isCloud(full)) it.cloud = true;
      onHit(it);
    }
    await Promise.all(subs.map(rec));
  }
  await rec(path.resolve(root));
  return { hits, truncated };
}

module.exports = { cache, dirSize, forget, listDir, search, isCloudOnly, limit };
