'use strict';
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

// Limiteur de concurrence en LIFO : la dernière demande passe en premier, ce qui
// donne la priorité au dossier que l'on vient d'ouvrir sur un calcul plus ancien.
function makeLimiter(max) {
  let active = 0;
  const queue = [];
  const next = () => {
    if (active >= max || !queue.length) return;
    active++;
    const { fn, res, rej } = queue.pop();
    Promise.resolve().then(fn).then(res, rej).finally(() => { active--; next(); });
  };
  return fn => new Promise((res, rej) => { queue.push({ fn, res, rej }); next(); });
}

// Windows ne distingue pas la casse : clé de cache normalisée.
const key = p => path.resolve(p).toLowerCase();

// libuv remplit st.blocks à partir de l'AllocationSize NTFS : c'est la taille réellement
// occupée sur le disque (0 pour un fichier OneDrive « en ligne uniquement »).
const diskOf = st => (typeof st.blocks === 'number' ? st.blocks * 512 : st.size);

function ancestors(p) {
  const out = [];
  let cur = path.resolve(p);
  for (;;) {
    const parent = path.dirname(cur);
    if (parent === cur) break;
    out.push(parent);
    cur = parent;
  }
  return out;
}

// readdir marque TOUT point d'analyse comme un lien — y compris les dossiers OneDrive
// (Bureau, Documents, Images…). lstat, lui, ne répond « lien » que pour les vrais liens
// symboliques et jonctions : on lui demande confirmation.
async function direntType(dir, e, lstat = p => fsp.lstat(p)) {
  if (!e.isSymbolicLink()) return e.isDirectory() ? 'dir' : 'file';
  try {
    const st = await lstat(path.join(dir, e.name));
    return st.isSymbolicLink() ? 'link' : st.isDirectory() ? 'dir' : 'file';
  } catch { return 'link'; }
}

function isUnder(child, parent) {
  const c = key(child);
  const pa = key(parent);
  return c === pa || c.startsWith(pa.endsWith('\\') ? pa : pa + '\\');
}

class AbortError extends Error {
  constructor() { super('Annulé'); this.name = 'AbortError'; }
}
function checkAbort(signal) {
  if (signal && signal.aborted) throw new AbortError();
}

function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

// Suppression définitive qui continue malgré les fichiers verrouillés et ne suit
// jamais les jonctions. Renvoie le nombre d'éléments qui n'ont pas pu être supprimés.
async function rmForce(p) {
  let st;
  try { st = await fsp.lstat(p); } catch (e) { return e.code === 'ENOENT' ? 0 : 1; }
  if (st.isSymbolicLink()) {
    try { await fsp.unlink(p); return 0; } catch { /* jonction de dossier */ }
    try { await fsp.rmdir(p); return 0; } catch { return 1; }
  }
  if (st.isDirectory()) {
    let names;
    try { names = await fsp.readdir(p); } catch { return 1; }
    let failed = 0;
    for (let i = 0; i < names.length; i += 16) {
      const r = await Promise.all(names.slice(i, i + 16).map(n => rmForce(path.join(p, n))));
      failed += r.reduce((a, b) => a + b, 0);
    }
    if (!failed) { try { await fsp.rmdir(p); } catch { failed++; } }
    return failed;
  }
  try { await fsp.unlink(p); return 0; } catch (e) {
    if (e.code === 'EPERM') { // fichier en lecture seule
      try { await fsp.chmod(p, 0o666); await fsp.unlink(p); return 0; } catch { /* verrouillé */ }
    }
    return 1;
  }
}

const DAY = 86400000;
function ago(t) {
  const d = (Date.now() - t) / DAY;
  if (d < 1) return "aujourd'hui";
  if (d < 2) return 'hier';
  if (d < 31) return `il y a ${Math.floor(d)} jours`;
  if (d < 365) return `il y a ${Math.max(1, Math.floor(d / 30.4))} mois`;
  const y = Math.floor(d / 365);
  return `il y a ${y} an${y > 1 ? 's' : ''}`;
}

module.exports = { makeLimiter, key, diskOf, ancestors, isUnder, direntType, AbortError, checkAbort, httpError, rmForce, ago, DAY };
