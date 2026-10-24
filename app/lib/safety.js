'use strict';
// Ce qui ne doit jamais partir, et ce qui demande une confirmation renforcée.
// Vérifié côté serveur : l'interface ne peut pas contourner ces règles.
const os = require('os');
const path = require('path');
const { key, isUnder } = require('./util');

const home = os.homedir();
const sysDrive = (process.env.SystemDrive || 'C:') + '\\';
const win = process.env.SystemRoot || path.join(sysDrive, 'Windows');
const winTemp = path.join(win, 'Temp');
const pf = process.env.ProgramFiles || path.join(sysDrive, 'Program Files');
const pf86 = process.env['ProgramFiles(x86)'] || path.join(sysDrive, 'Program Files (x86)');
const pd = process.env.ProgramData || path.join(sysDrive, 'ProgramData');
const appData = path.join(home, 'AppData');
const appDir = path.resolve(__dirname, '..', '..'); // le dossier de l'application elle-même
let oneDrive = process.env.OneDrive || null;

// Tout ce qui est dessous est intouchable.
const blockTree = [
  win,
  path.join(sysDrive, '$Recycle.Bin'),
  path.join(sysDrive, 'System Volume Information'),
  path.join(sysDrive, 'Recovery'),
  path.join(sysDrive, 'Boot'),
  path.join(pf, 'WindowsApps'),
  appDir,
];

// Le dossier lui-même est intouchable (son contenu, lui, peut être trié).
const blockExact = new Set([
  pf, pf86, pd,
  path.join(sysDrive, 'Users'), path.join(sysDrive, 'Users', 'Public'), path.join(sysDrive, 'Users', 'Default'),
  home, appData,
  path.join(appData, 'Local'), path.join(appData, 'Roaming'), path.join(appData, 'LocalLow'),
  path.join(appData, 'Local', 'Temp'),
  path.join(sysDrive, 'pagefile.sys'), path.join(sysDrive, 'hiberfil.sys'), path.join(sysDrive, 'swapfile.sys'),
  path.join(sysDrive, 'DumpStack.log.tmp'), path.join(sysDrive, 'bootmgr'), path.join(sysDrive, 'BOOTNXT'),
  ...['Desktop', 'Documents', 'Downloads', 'Pictures', 'Videos', 'Music', 'Favorites', 'Contacts', 'Links', 'Saved Games', 'Searches', 'OneDrive']
    .map(n => path.join(home, n)),
].map(key));
if (oneDrive) blockExact.add(key(oneDrive));

// Supprimable, mais seulement après une case « je sais ce que je fais ».
const warnTree = [pf, pf86, pd, appData];

function setKnownFolders(list) {
  for (const p of list) if (p) blockExact.add(key(p));
}
function setOneDrive(p) {
  if (!p) return;
  oneDrive = p;
  blockExact.add(key(p));
}

// Caches repérés par l'analyse « Nettoyage » : dans AppData, mais sans risque.
const allowed = new Set();
const allow = p => allowed.add(key(p));

function level(p) {
  const k = key(p);
  if (/^[a-z]:\\?$/.test(k) || k.startsWith('\\\\')) return 'block'; // racines de disque, chemins réseau
  // Le contenu des dossiers temporaires (pas le dossier lui-même) part sans confirmation renforcée.
  for (const t of [winTemp, os.tmpdir()]) if (isUnder(p, t) && k !== key(t)) return 'ok';
  if (blockExact.has(k)) return 'block';
  // Éléments système à la racine d'un disque (Config.Msi, Documents and Settings…)
  if (/^[a-z]:\\$/.test(key(path.dirname(p))) && isSystemName(path.basename(p))) return 'block';
  if (blockTree.some(t => isUnder(p, t))) return 'block';
  if (allowed.has(k)) return 'ok';
  if (warnTree.some(t => isUnder(p, t))) return 'warn';
  return 'ok';
}

const isCloud = p => !!oneDrive && isUnder(p, oneDrive);

const SYSTEM_NAMES = new Set([
  'desktop.ini', 'thumbs.db', 'iconcache.db', '$recycle.bin', 'system volume information', 'pagefile.sys',
  'hiberfil.sys', 'swapfile.sys', 'dumpstack.log', 'dumpstack.log.tmp', '$windows.~bt', '$windows.~ws',
  '$winreagent', '$sysreset', '$getcurrent', 'recovery', 'config.msi', 'documents and settings', 'bootmgr',
  'bootnxt', 'boot', '.onedrive', 'onedrivetemp',
]);
const isSystemName = n => { const l = n.toLowerCase(); return SYSTEM_NAMES.has(l) || l.startsWith('ntuser.'); };

module.exports = { level, allow, isCloud, isSystemName, setKnownFolders, setOneDrive, home, appData, winTemp };
