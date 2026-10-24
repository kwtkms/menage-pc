'use strict';
/* Ménage PC — interface. Aucune dépendance externe. */

const TOKEN = document.querySelector('meta[name="token"]').content;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const enc = encodeURIComponent;

// ---------------------------------------------------------------- icônes
const FOLDER_D = 'M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2h7.5A2.5 2.5 0 0 1 21 9.5v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z';
const IC = {
  back: '<path d="M15 18l-6-6 6-6"/>',
  fwd: '<path d="M9 18l6-6-6-6"/>',
  up: '<path d="M12 19V5"/><path d="M5 12l7-7 7 7"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.34-5.66L20 8.5"/><path d="M20 3.5v5h-5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  trash: '<path d="M4 7h16"/><path d="M9 7V4.5h6V7"/><path d="M6 7l1 13h10l1-13"/><path d="M10 11v5M14 11v5"/>',
  external: '<path d="M14 4h6v6"/><path d="M10 14L20 4"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  pencil: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  open: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
  home: '<path d="M4 11l8-7 8 7"/><path d="M6 9.5V20h12V9.5"/>',
  desktop: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  doc: '<path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  download: '<path d="M12 4v11"/><path d="M7 10l5 5 5-5"/><path d="M5 20h14"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  video: '<rect x="3" y="5" width="14" height="14" rx="2"/><path d="M17 10l4-2.5v9L17 14"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  cloud: '<path d="M7 18h10.5a4 4 0 0 0 .6-7.96A6 6 0 0 0 6.3 10.1 4 4 0 0 0 7 18z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M2.5 12h3M18.5 12h3M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"/>',
  temp: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5"/><path d="M9.5 2.5h5"/>',
  drive: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 14h.01M10.5 14h.01"/>',
  power: '<path d="M12 3v9"/><path d="M6.4 6.6a8 8 0 1 0 11.2 0"/>',
  broom: '<path d="M20 3l-7 7"/><path d="M12.5 9.5c-2.6-1.2-5.4-.3-7 2.2L3 21l9.3-2.5c2.5-1.6 3.4-4.4 2.2-7z"/><path d="M7.5 16.5l2 2"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 1.9 1.9.8-1.9.8L19 20.4l-.8-1.9-1.9-.8 1.9-.8z"/>',
  'folder-line': `<path d="${FOLDER_D}"/>`,
  'folder-plus': `<path d="${FOLDER_D}"/><path d="M12 10.5v6M9 13.5h6"/>`,
  folder: `<path d="${FOLDER_D}" fill="currentColor" stroke="none"/>`,
  file: '<path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" fill="currentColor" fill-opacity=".14"/><path d="M14 3v5h5"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  warn: '<path d="M12 3.5l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  code: '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>',
  big: '<path d="M5 20V11M10 20V5M15 20v-6M20 20V9M3 20h18"/>',
  dups: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  empty: `<path d="${FOLDER_D}" stroke-dasharray="3 2.6"/>`,
  cache: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
  play: '<path d="M8 5l11 7-11 7z"/>',
};
function icon(name, cls = 'ic') {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('class', cls);
  s.setAttribute('aria-hidden', 'true');
  s.innerHTML = IC[name] || IC.file; // chaînes statiques uniquement
  return s;
}
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) el.append(c instanceof Node ? c : String(c));
  return el;
}
const btn = (label, ic, onclick, cls = 'btn') => h('button', { class: cls, onclick, type: 'button' }, ic ? icon(ic) : null, label ? h('span', { text: label }) : null);

// ---------------------------------------------------------------- serveur
async function api(url, body) {
  let r;
  try {
    r = await fetch(url, body === undefined
      ? { headers: { 'X-Token': TOKEN } }
      : { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Token': TOKEN }, body: JSON.stringify(body) });
  } catch {
    $('#dead').hidden = false;
    throw new Error('Ménage PC ne répond plus');
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `Erreur ${r.status}`);
  return j;
}
function sse(url, on) {
  const es = new EventSource(`${url}${url.includes('?') ? '&' : '?'}t=${TOKEN}`);
  let closed = false;
  const close = () => { if (!closed) { closed = true; es.close(); } };
  for (const ev of new Set([...Object.keys(on), 'done', 'fail'])) {
    es.addEventListener(ev, e => {
      if (closed) return;
      const d = JSON.parse(e.data);
      if (ev === 'done' || ev === 'fail') close();
      if (on[ev]) on[ev](d);
    });
  }
  es.onerror = () => { if (closed) return; close(); if (on.fail) on.fail({ message: 'Connexion interrompue' }); };
  return { close, get closed() { return closed; } };
}
const fileUrl = p => `/api/file?path=${enc(p)}&t=${TOKEN}`;

// ---------------------------------------------------------------- formats
const UNITS = ['o', 'Ko', 'Mo', 'Go', 'To'];
function fmtSize(n) {
  if (n == null) return '—';
  if (n < 1024) return `${n} o`;
  let v = n;
  let i = 0;
  while (v >= 1024 && i < UNITS.length - 1) { v /= 1024; i++; }
  return `${(v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)).replace('.', ',')} ${UNITS[i]}`;
}
const NF = new Intl.NumberFormat('fr-FR');
const fmtNum = n => NF.format(n || 0);
const DF = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const fmtDate = t => (t ? DF.format(new Date(t)) : '');
const plural = (n, one, many) => `${fmtNum(n)} ${n > 1 ? many : one}`;
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const COLL = new Intl.Collator('fr', { numeric: true, sensitivity: 'base' });
function ago(t) {
  const d = (Date.now() - t) / 86400000;
  if (d < 1) return "aujourd'hui";
  if (d < 2) return 'hier';
  if (d < 31) return `il y a ${Math.floor(d)} j`;
  if (d < 365) return `il y a ${Math.max(1, Math.floor(d / 30.4))} mois`;
  const y = Math.floor(d / 365);
  return `il y a ${y} an${y > 1 ? 's' : ''}`;
}
const baseName = p => p.replace(/[\\/]+$/, '').split(/[\\/]/).pop() || p;
const parentOf = p => { const m = /^(.*[\\/])[^\\/]+[\\/]?$/.exec(p); if (!m) return null; const d = m[1]; return /^[A-Za-z]:\\$/.test(d) ? d : d.replace(/[\\/]$/, ''); };

// ---------------------------------------------------------------- types de fichiers
const KIND_EXT = {
  image: 'jpg jpeg jfif png gif webp bmp heic heif tif tiff svg ico avif raw cr2 nef arw dng psd',
  video: 'mp4 mkv avi mov wmv webm flv m4v mpg mpeg 3gp ts',
  audio: 'mp3 wav flac aac ogg opus m4a wma',
  doc: 'pdf doc docx xls xlsx ppt pptx odt ods odp txt md rtf csv epub',
  archive: 'zip rar 7z tar gz bz2 xz iso cab tgz img vhd vhdx',
  exe: 'exe msi msix appx bat cmd ps1 lnk dll sys',
  code: 'js mjs cjs ts jsx tsx py java c cpp h hpp cs html htm css scss json xml yml yaml sh go rs php rb lua sql ini cfg toml log',
};
const EXT2KIND = {};
for (const [k, list] of Object.entries(KIND_EXT)) for (const x of list.split(' ')) EXT2KIND[x] = k;
const extOf = n => { const i = n.lastIndexOf('.'); return i > 0 ? n.slice(i + 1).toLowerCase() : ''; };
const kindOf = e => (e.type === 'dir' ? 'dir' : e.type === 'link' ? 'link' : EXT2KIND[extOf(e.name)] || 'file');
const KIND_LABEL = { dir: 'Dossier', link: 'Lien système', image: 'Image', video: 'Vidéo', audio: 'Audio', doc: 'Document', archive: 'Archive', exe: 'Programme', code: 'Texte / code', file: 'Fichier' };
function typeLabel(e) {
  const k = kindOf(e);
  if (k === 'dir' || k === 'link') return KIND_LABEL[k];
  const x = extOf(e.name);
  return x ? `${KIND_LABEL[k]} ${x.toUpperCase()}` : KIND_LABEL[k];
}
const fileIcon = e => icon(kindOf(e) === 'dir' ? 'folder' : kindOf(e) === 'link' ? 'link' : 'file', `fi k-${kindOf(e)}`);
const CHIPS = [['all', 'Tout'], ['dir', 'Dossiers'], ['image', 'Images'], ['video', 'Vidéos'], ['audio', 'Audio'], ['doc', 'Documents'], ['archive', 'Archives'], ['exe', 'Programmes']];
const PREVIEWABLE = new Set('jpg jpeg jfif png gif webp bmp ico avif svg mp4 m4v webm mkv mov mp3 wav ogg opus m4a flac aac pdf'.split(' '));
const TEXTUAL = new Set('txt md markdown log json xml yml yaml ini cfg conf toml csv tsv js mjs cjs ts jsx tsx py java c cpp h hpp cs html htm css scss sql sh bat cmd ps1 php rb go rs lua gitignore env properties srt vtt nfo'.split(' '));

// ---------------------------------------------------------------- état
function load(k, d) { try { const v = localStorage.getItem(`menage.${k}`); return v == null ? d : JSON.parse(v); } catch { return d; } }
function save(k, v) { try { localStorage.setItem(`menage.${k}`, JSON.stringify(v)); } catch { /* stockage indisponible */ } }

const S = {
  view: 'explore',
  path: null, data: null, entries: [], byPath: new Map(), shown: [],
  hist: [], fut: [],
  sel: new Set(), focus: null, anchor: null,
  sort: load('sort', { key: 'size', dir: -1 }),
  kind: 'all', q: '',
  showSystem: load('showSystem', false),
  showPreview: load('showPreview', true),
  limit: 400,
  total: null, sizing: null, search: null,
  places: null,
  report: null, csel: new Set(), clean: null, cleanMore: new Set(), cleanClosed: new Set(),
};

// ---------------------------------------------------------------- toasts, modales, menus
function toast(msg, kind = 'info', ms = 4500, action = null) {
  const el = h('div', { class: `toast t-${kind}` },
    kind === 'busy' ? h('span', { class: 'spin' }) : icon(kind === 'error' ? 'warn' : kind === 'warn' ? 'warn' : 'info'),
    h('span', { class: 'toast-msg', text: msg }));
  const close = () => { el.classList.add('out'); setTimeout(() => el.remove(), 200); };
  if (action) el.append(h('button', { class: 'toast-act', type: 'button', text: action.label, onclick: () => { close(); action.fn(); } }));
  if (kind !== 'busy') el.append(h('button', { class: 'toast-x', type: 'button', title: 'Fermer', onclick: close }, icon('x')));
  $('#toasts').append(el);
  if (ms && kind !== 'busy') setTimeout(close, ms);
  return { close, set(m) { el.querySelector('.toast-msg').textContent = m; } };
}

let modalResolve = null;
function modal({ title, body, actions, danger = false, wide = false, onOpen }) {
  closeMenu();
  return new Promise(resolve => {
    const back = $('#modal');
    const done = v => { back.hidden = true; back.replaceChildren(); modalResolve = null; resolve(v); };
    modalResolve = done;
    const box = h('div', { class: `modal${wide ? ' wide' : ''}${danger ? ' danger' : ''}`, role: 'dialog', 'aria-modal': 'true' },
      h('header', {}, h('h2', { text: title }), h('button', { class: 'ib', type: 'button', title: 'Fermer (Échap)', onclick: () => done(null) }, icon('x'))),
      h('div', { class: 'modal-body' }, body),
      h('footer', {}, actions.map(a => h('button', {
        class: `btn ${a.cls || ''}`, type: 'button', 'data-default': a.default ? '1' : null,
        onclick: () => { const v = a.value(); if (v !== undefined) done(v); },
      }, a.icon ? icon(a.icon) : null, h('span', { text: a.label })))));
    back.replaceChildren(box);
    back.hidden = false;
    back.onmousedown = e => { if (e.target === back) done(null); };
    if (onOpen) onOpen(box, done);
    else (box.querySelector('[data-default]') || box.querySelector('footer .btn')).focus();
  });
}

function openMenu(x, y, items) {
  const m = $('#menu');
  m.replaceChildren(...items.map(it => (it === '-' ? h('div', { class: 'sep' }) : h('button', {
    type: 'button', class: `mi${it.danger ? ' danger' : ''}`, disabled: it.disabled ? true : null,
    onclick: () => { closeMenu(); it.fn(); },
  }, icon(it.icon || 'open'), h('span', { text: it.label }), it.kbd ? h('kbd', { text: it.kbd }) : null))));
  m.hidden = false;
  const r = m.getBoundingClientRect();
  m.style.left = `${Math.min(x, innerWidth - r.width - 8)}px`;
  m.style.top = `${Math.min(y, innerHeight - r.height - 8)}px`;
}
function closeMenu() { $('#menu').hidden = true; }

// ---------------------------------------------------------------- barre latérale
async function loadPlaces() {
  try { S.places = await api('/api/places'); } catch (e) { toast(e.message, 'error'); return; }
  const ul = $('#places');
  ul.replaceChildren(...S.places.quick.map(p => h('li', {},
    h('button', { class: 'place', type: 'button', dataset: { path: p.path }, title: p.path, onclick: () => { setView('explore'); go(p.path); } },
      icon(p.icon), h('span', { text: p.name })))));
  $('#drives').replaceChildren(...S.places.drives.map(d => {
    const used = d.total - d.free;
    const pct = d.total ? used / d.total : 0;
    return h('li', {}, h('button', { class: 'drive', type: 'button', dataset: { path: d.root }, onclick: () => { setView('explore'); go(d.root); } },
      h('div', { class: 'drive-top' }, icon('drive'), h('span', { text: d.name })),
      h('div', { class: `meter${pct > 0.9 ? ' hot' : ''}` }, h('i', { style: `width:${(pct * 100).toFixed(1)}%` })),
      h('small', { text: `${fmtSize(d.free)} libres sur ${fmtSize(d.total)}` })));
  }));
  markPlace();
}
function markPlace() {
  for (const b of $$('.place, .drive')) b.classList.toggle('on', !!S.path && b.dataset.path.toLowerCase().replace(/\\$/, '') === S.path.toLowerCase().replace(/\\$/, ''));
}
async function loadBin() {
  const box = $('#bin');
  let b;
  try { b = await api('/api/recycle'); } catch { return; }
  const empty = !b.count;
  box.replaceChildren(
    h('div', { class: 'bin-info' }, icon('trash'), h('div', {},
      h('b', { text: b.size == null ? '?' : empty ? 'Vide' : fmtSize(b.size) }),
      h('small', { text: empty ? 'rien à vider' : plural(b.count, 'élément', 'éléments') }))),
    h('div', { class: 'bin-acts' },
      btn('Ouvrir', null, () => api('/api/special', { what: 'recycle' }), 'btn sm'),
      empty ? null : btn('Vider', null, emptyBin, 'btn sm danger-ghost')));
  S.bin = b;
}
async function emptyBin() {
  const b = S.bin || {};
  const ok = await modal({
    title: 'Vider la corbeille ?', danger: true,
    body: h('div', {}, h('p', {}, `${plural(b.count || 0, 'élément sera supprimé', 'éléments seront supprimés')} définitivement (${fmtSize(b.size)}).`),
      h('p', { class: 'muted', text: "C'est ce qui libère réellement la place sur le disque. Impossible de revenir en arrière ensuite." })),
    actions: [{ label: 'Annuler', value: () => null, default: true }, { label: 'Vider définitivement', cls: 'danger', icon: 'trash', value: () => true }],
  });
  if (!ok) return;
  const t = toast('Vidage de la corbeille…', 'busy');
  try { await api('/api/recycle/empty', {}); toast(`Corbeille vidée : ${fmtSize(b.size)} libérés`, 'ok'); } catch (e) { toast(e.message, 'error'); } finally { t.close(); }
  loadBin(); loadPlaces();
}
function setView(v) {
  S.view = v;
  $('#view-explore').hidden = v !== 'explore';
  $('#view-clean').hidden = v !== 'clean';
  for (const b of $$('.view-btn')) b.classList.toggle('on', b.dataset.view === v);
  if (v === 'clean') renderClean();
  closeMenu();
}

// ---------------------------------------------------------------- navigation
async function go(p, { push = true, focus = null, keepScroll = false } = {}) {
  let data;
  try { data = await api(`/api/list?path=${enc(p)}`); } catch (e) { toast(e.message, 'error'); return false; }
  const same = S.path && S.path.toLowerCase() === data.path.toLowerCase();
  if (push && S.path && !same) { S.hist.push(S.path); S.fut = []; }
  stopSearch(false);
  const scroll = keepScroll && same ? $('#list').scrollTop : 0;
  S.path = data.path;
  S.data = data;
  S.entries = data.entries;
  S.byPath = new Map(data.entries.map(e => [e.path, e]));
  S.total = data.cached;
  if (!same) { S.q = ''; $('#q').value = ''; S.kind = 'all'; }
  S.sel = new Set([...S.sel].filter(x => same && S.byPath.has(x)));
  S.focus = focus || (same && S.byPath.has(S.focus) ? S.focus : null);
  if (focus) S.sel = new Set([focus]);
  S.limit = Math.max(400, focus ? S.entries.length : 400);
  history.replaceState(null, '', `#${enc(S.path)}`);
  save('last', S.path);
  startSizing(); // avant le rendu : les dossiers en attente s'affichent « en calcul »
  renderCrumbs(); renderChips(); renderList(); renderPreview(); renderActions(); updateNav(); markPlace();
  $('#list').scrollTop = scroll;
  if (focus) scrollToFocus();
  return true;
}
const reload = (opts = {}) => (S.path ? go(S.path, { push: false, keepScroll: true, ...opts }) : null);
function updateNav() {
  $('#back').disabled = !S.hist.length;
  $('#fwd').disabled = !S.fut.length;
  $('#up').disabled = !S.data || !S.data.parent;
}
function goBack() { if (!S.hist.length) return; S.fut.push(S.path); go(S.hist.pop(), { push: false }); }
function goFwd() { if (!S.fut.length) return; S.hist.push(S.path); go(S.fut.pop(), { push: false }); }
function goUp() { if (S.data && S.data.parent) go(S.data.parent, { focus: S.path }); }
async function refresh() {
  if (!S.path) return;
  await api('/api/refresh', { path: S.path }).catch(() => {});
  for (const e of S.entries) if (e.type === 'dir') delete e.size;
  reload();
}

function renderCrumbs() {
  const c = $('#crumbs');
  const parts = [];
  const m = /^([A-Za-z]:\\)(.*)$/.exec(S.path);
  if (m) {
    parts.push({ label: `Disque ${m[1].slice(0, 2)}`, path: m[1] });
    let acc = m[1];
    for (const seg of m[2].split('\\').filter(Boolean)) { acc = acc.endsWith('\\') ? acc + seg : `${acc}\\${seg}`; parts.push({ label: seg, path: acc }); }
  } else parts.push({ label: S.path, path: S.path });
  c.replaceChildren(...parts.flatMap((p, i) => [
    i ? h('span', { class: 'crumb-sep' }, icon('chevron')) : null,
    h('button', { class: `crumb${i === parts.length - 1 ? ' last' : ''}`, type: 'button', text: p.label, title: p.path, onclick: e => { e.stopPropagation(); go(p.path); } }),
  ]).filter(Boolean));
  c.scrollLeft = c.scrollWidth;
}
function editPath() {
  const inp = $('#pathInput');
  $('#crumbs').hidden = true;
  inp.hidden = false;
  inp.value = S.path || '';
  inp.focus();
  inp.select();
}
function endEditPath() { $('#pathInput').hidden = true; $('#crumbs').hidden = false; }

// ---------------------------------------------------------------- calcul des tailles
function stopSizing() { if (S.sizing) { S.sizing.es.close(); S.sizing = null; } }
function startSizing() {
  stopSizing();
  const pending = S.entries.some(e => e.type === 'dir' && e.size == null);
  if (!pending && S.total) { renderStatus(); return; }
  const at = S.path;
  S.sizing = { files: 0, current: '' };
  S.sizing.es = sse(`/api/sizes?path=${enc(at)}`, {
    size: d => {
      if (S.path !== at) return;
      const e = S.entries.find(x => x.type === 'dir' && x.name === d.name);
      if (!e) return;
      Object.assign(e, { size: d.size, disk: d.disk, files: d.files, dirs: d.dirs, denied: d.denied });
      const row = rowFor(e.path);
      if (row) fillSize(row, e);
      scheduleBars();
    },
    progress: d => { if (S.sizing) { S.sizing.files = d.files; S.sizing.current = d.current; renderStatus(); } },
    done: d => {
      if (S.path !== at) return;
      S.total = d;
      S.sizing = null;
      if (S.sort.key === 'size' && !S.search) renderList(true);
      else scheduleBars();
      renderStatus(); renderActions();
      if (!S.focus || S.byPath.get(S.focus)?.type === 'dir') renderPreview();
    },
    fail: d => { S.sizing = null; renderStatus(); if (d.message !== 'Connexion interrompue') toast(d.message, 'error'); },
  });
  renderStatus();
}
function renderStatus() {
  const st = $('#status');
  if (S.search) {
    st.textContent = S.search.running ? `recherche… ${plural(S.search.dirs || 0, 'dossier', 'dossiers')} parcourus` : '';
    return;
  }
  const n = S.shown.length;
  const total = S.total ? fmtSize(S.total.size) : null;
  if (S.sizing) {
    st.replaceChildren(h('span', { class: 'spin sm' }), ` calcul des tailles… ${fmtNum(S.sizing.files)} fichiers`);
    st.title = S.sizing.current || '';
  } else {
    st.textContent = `${plural(n, 'élément', 'éléments')}${total ? ` · ${total} au total` : ''}`;
    st.title = S.total && S.total.denied ? `${fmtNum(S.total.denied)} élément(s) illisibles (accès refusé) non comptés` : '';
  }
}

// ---------------------------------------------------------------- liste
function visible() {
  let list = S.search ? S.search.results : S.entries;
  if (!S.showSystem) list = list.filter(e => !e.system && e.type !== 'link');
  if (S.kind !== 'all') list = list.filter(e => kindOf(e) === S.kind);
  if (S.q && !S.search) { const q = norm(S.q); list = list.filter(e => norm(e.name).includes(q)); }
  const { key, dir } = S.sort;
  return [...list].sort((a, b) => {
    if (key === 'name' || key === 'type') { const d = (a.type === 'dir' ? 0 : 1) - (b.type === 'dir' ? 0 : 1); if (d) return d; }
    let r = 0;
    if (key === 'name') r = COLL.compare(a.name, b.name);
    else if (key === 'size') r = (a.size ?? -1) - (b.size ?? -1);
    else if (key === 'mtime') r = (a.mtime || 0) - (b.mtime || 0);
    else if (key === 'type') r = COLL.compare(typeLabel(a), typeLabel(b));
    else if (key === 'loc') r = COLL.compare(a.parent || '', b.parent || '');
    return r * dir || COLL.compare(a.name, b.name);
  });
}
function renderHead() {
  const cols = [['', null], ['Nom', 'name'], ['Taille', 'size'], ['Modifié le', 'mtime'], S.search ? ['Emplacement', 'loc'] : ['Type', 'type']];
  $('#lhead').replaceChildren(...cols.map(([label, k]) => {
    if (!k) {
      const all = S.shown.length && S.shown.every(e => S.sel.has(e.path));
      const some = S.shown.some(e => S.sel.has(e.path));
      return h('div', { class: 'c-cb' }, h('span', { class: `cb${all ? ' on' : some ? ' mid' : ''}`, title: 'Tout sélectionner (Ctrl+A)', onclick: () => { if (all) S.sel.clear(); else S.shown.forEach(e => S.sel.add(e.path)); paintSel(); } }));
    }
    const on = S.sort.key === k;
    return h('button', {
      class: `hcol h-${k}${on ? ' on' : ''}`, type: 'button', title: 'Trier',
      onclick: () => { S.sort = { key: k, dir: on ? -S.sort.dir : (k === 'size' || k === 'mtime' ? -1 : 1) }; save('sort', S.sort); renderList(true); },
    }, h('span', { text: label }), on ? h('span', { class: 'arrow', text: S.sort.dir > 0 ? '▲' : '▼' }) : null);
  }));
}
function renderList(keepScroll = false) {
  const list = $('#list');
  const scroll = list.scrollTop;
  S.shown = visible();
  list.classList.toggle('searching', !!S.search);
  $('#lhead').classList.toggle('searching', !!S.search);
  renderHead();
  const rows = S.shown.slice(0, S.limit).map(rowEl);
  if (S.shown.length > S.limit) {
    rows.push(h('button', { class: 'more', type: 'button', onclick: () => { S.limit += 1000; renderList(true); } },
      `Afficher ${fmtNum(Math.min(1000, S.shown.length - S.limit))} éléments de plus (${fmtNum(S.shown.length - S.limit)} masqués)`));
  }
  if (!S.shown.length) rows.push(emptyState());
  list.replaceChildren(...rows);
  if (keepScroll) list.scrollTop = scroll;
  paintSel(false);
  updateBars();
  renderStatus();
}
function emptyState() {
  if (S.search && S.search.running) return h('div', { class: 'empty' }, h('span', { class: 'spin' }), h('p', { text: 'Recherche en cours…' }));
  const hidden = S.entries.length && !S.search;
  return h('div', { class: 'empty' }, icon(S.search ? 'search' : 'empty', 'ic big'),
    h('p', { text: S.search ? 'Aucun résultat.' : S.q || S.kind !== 'all' ? 'Rien ne correspond au filtre.' : hidden ? 'Seulement des éléments système (bouton « Système » pour les voir).' : 'Ce dossier est vide.' }));
}
function rowEl(e) {
  const badges = [];
  if (e.cloudOnly) badges.push(h('span', { class: 'badge b-cloud', title: 'En ligne uniquement (OneDrive) : ne prend pas de place sur ce PC' }, icon('cloud'), 'en ligne'));
  if (e.level === 'block') badges.push(h('span', { class: 'badge b-lock', title: 'Protégé : ne peut pas être supprimé ici' }, icon('lock')));
  else if (e.level === 'warn') badges.push(h('span', { class: 'badge b-warn', title: 'Dossier système ou application : suppression avec confirmation renforcée' }, icon('warn')));
  if (e.denied && e.type === 'dir' && !e.files) badges.push(h('span', { class: 'badge b-lock', title: 'Accès refusé : taille inconnue' }, 'accès refusé'));
  const r = h('div', { class: `row${e.system ? ' dim' : ''}`, dataset: { path: e.path }, draggable: 'false' },
    h('div', { class: 'c-cb' }, h('span', { class: 'cb' })),
    h('div', { class: 'c-name' }, fileIcon(e), h('span', { class: 'nm', text: e.name }), ...badges),
    h('div', { class: 'c-size' }, h('div', { class: 'sz-line' }, h('span', { class: 'pct' }), h('span', { class: 'sz' })), h('div', { class: 'bar' }, h('i'))),
    h('div', { class: 'c-mtime', text: fmtDate(e.mtime) }),
    S.search
      ? h('div', { class: 'c-loc', title: e.parent, text: relLoc(e.parent) })
      : h('div', { class: 'c-type', text: e.type === 'link' && e.target ? `→ ${e.target}` : typeLabel(e) }));
  fillSize(r, e);
  return r;
}
function relLoc(p) {
  if (!S.search || !p) return p || '';
  const root = S.search.root.replace(/\\$/, '');
  return p.toLowerCase().startsWith(root.toLowerCase()) ? `…${p.slice(root.length) || '\\'}` : p;
}
function fillSize(r, e) {
  const sz = r.querySelector('.sz');
  if (e.size == null) {
    sz.textContent = e.type === 'dir' && S.sizing ? '' : '—';
    sz.classList.toggle('pending', e.type === 'dir' && !!S.sizing);
    r.querySelector('.c-size').title = '';
    return;
  }
  sz.classList.remove('pending');
  sz.textContent = fmtSize(e.size);
  const lines = [`${fmtSize(e.size)} (${fmtNum(e.size)} octets)`];
  if (e.disk != null && Math.abs(e.disk - e.size) > Math.max(1048576, e.size * 0.05)) lines.push(`Sur le disque : ${fmtSize(e.disk)}`);
  if (e.type === 'dir') lines.push(`${plural(e.files || 0, 'fichier', 'fichiers')}, ${plural(e.dirs || 0, 'sous-dossier', 'sous-dossiers')}`);
  if (e.denied) lines.push(`${fmtNum(e.denied)} élément(s) illisibles non comptés`);
  r.querySelector('.c-size').title = lines.join('\n');
}
const rowFor = p => $(`#list .row[data-path="${CSS.escape(p)}"]`);
let barsQueued = false;
function scheduleBars() { if (!barsQueued) { barsQueued = true; requestAnimationFrame(() => { barsQueued = false; updateBars(); renderStatus(); }); } }
function updateBars() {
  const sizes = S.shown.map(e => e.size || 0);
  const max = Math.max(1, ...sizes);
  const total = S.search ? 0 : (S.total && S.total.size) || sizes.reduce((a, b) => a + b, 0);
  for (const r of $$('#list .row')) {
    const e = S.byPath.get(r.dataset.path) || (S.search && S.search.byPath.get(r.dataset.path));
    if (!e) continue;
    const bar = r.querySelector('.bar i');
    const w = e.size ? Math.max(0.6, (e.size / max) * 100) : 0;
    bar.style.width = `${w}%`;
    const share = total && e.size ? e.size / total : 0;
    bar.className = share > 0.3 ? 'hot' : share > 0.1 ? 'warm' : '';
    r.querySelector('.pct').textContent = share >= 0.01 ? `${Math.round(share * 100)} %` : '';
  }
}

// ---------------------------------------------------------------- sélection
const entryOf = p => S.byPath.get(p) || (S.search && S.search.byPath.get(p)) || null;
const selected = () => [...S.sel].map(entryOf).filter(Boolean);
function paintSel(withPreview = true) {
  for (const r of $$('#list .row')) {
    const on = S.sel.has(r.dataset.path);
    r.classList.toggle('sel', on);
    r.classList.toggle('focus', r.dataset.path === S.focus);
    r.querySelector('.cb').classList.toggle('on', on);
  }
  const all = S.shown.length && S.shown.every(e => S.sel.has(e.path));
  const some = S.shown.some(e => S.sel.has(e.path));
  const hcb = $('#lhead .cb');
  if (hcb) hcb.className = `cb${all ? ' on' : some ? ' mid' : ''}`;
  renderActions();
  if (withPreview) renderPreview();
}
function onRowClick(ev, row) {
  const p = row.dataset.path;
  if (ev.target.closest('.c-cb')) {
    if (S.sel.has(p)) S.sel.delete(p); else S.sel.add(p);
    S.anchor = p;
  } else if (ev.shiftKey && S.anchor) {
    const idx = S.shown.findIndex(e => e.path === S.anchor);
    const j = S.shown.findIndex(e => e.path === p);
    if (!ev.ctrlKey) S.sel.clear();
    for (let i = Math.min(idx, j); i <= Math.max(idx, j); i++) S.sel.add(S.shown[i].path);
  } else if (ev.ctrlKey || ev.metaKey) {
    if (S.sel.has(p)) S.sel.delete(p); else S.sel.add(p);
    S.anchor = p;
  } else {
    S.sel = new Set([p]);
    S.anchor = p;
  }
  S.focus = p;
  paintSel();
}
function moveFocus(delta, extend) {
  if (!S.shown.length) return;
  let i = S.shown.findIndex(e => e.path === S.focus);
  i = i < 0 ? (delta > 0 ? 0 : S.shown.length - 1) : Math.max(0, Math.min(S.shown.length - 1, i + delta));
  if (i >= S.limit) { S.limit = i + 200; renderList(true); }
  const p = S.shown[i].path;
  S.focus = p;
  if (extend && S.anchor) {
    const a = S.shown.findIndex(e => e.path === S.anchor);
    S.sel = new Set(S.shown.slice(Math.min(a, i), Math.max(a, i) + 1).map(e => e.path));
  } else { S.sel = new Set([p]); S.anchor = p; }
  paintSel();
  scrollToFocus();
}
function scrollToFocus() { const r = S.focus && rowFor(S.focus); if (r) r.scrollIntoView({ block: 'nearest' }); }

// ---------------------------------------------------------------- barre d'actions
function renderActions() {
  const bar = $('#actionbar');
  const sel = selected();
  bar.hidden = !sel.length;
  if (!sel.length) return;
  const unknown = sel.some(e => e.size == null);
  const size = sel.reduce((a, e) => a + (e.size || 0), 0);
  const one = sel.length === 1 ? sel[0] : null;
  bar.replaceChildren(
    h('div', { class: 'ab-info' },
      h('b', { text: plural(sel.length, 'élément sélectionné', 'éléments sélectionnés') }),
      h('span', { text: ` · ${fmtSize(size)}${unknown ? ' +' : ''}` })),
    h('div', { class: 'ab-acts' },
      one ? btn('Ouvrir', 'open', () => openEntry(one)) : null,
      btn(sel.length > 1 ? 'Afficher' : "Dans l'Explorateur", 'external', () => api('/api/reveal', { path: sel[0].path }).catch(e => toast(e.message, 'error'))),
      one ? btn('Renommer', 'pencil', () => askRename(one)) : null,
      btn('Copier le chemin', 'copy', () => copyPaths(sel)),
      btn('Désélectionner', 'x', () => { S.sel.clear(); paintSel(); }, 'btn ghost'),
      btn('Mettre à la corbeille', 'trash', () => deleteEntries(sel), 'btn danger')));
}
async function copyPaths(list) {
  const text = list.map(e => e.path).join('\r\n');
  try { await navigator.clipboard.writeText(text); toast(list.length > 1 ? `${list.length} chemins copiés` : 'Chemin copié', 'ok', 2000); } catch { toast('Copie impossible', 'error'); }
}
function openEntry(e) {
  if (!e) return;
  if (e.type === 'dir') return go(e.path);
  if (e.type === 'link') return e.target ? go(e.target) : toast('Lien illisible', 'warn');
  if (e.cloudOnly) toast('Fichier en ligne : OneDrive va le télécharger pour l’ouvrir', 'info');
  return api('/api/open', { path: e.path }).then(() => toast(`Ouverture de « ${e.name} »`, 'info', 2000)).catch(err => toast(err.message, 'error'));
}

// ---------------------------------------------------------------- suppression
async function deleteEntries(items, { permanent = false, after = null } = {}) {
  const blocked = items.filter(i => i.level === 'block');
  items = items.filter(i => i.level !== 'block');
  if (blocked.length) toast(`${plural(blocked.length, 'élément protégé ignoré', 'éléments protégés ignorés')} : ${blocked.slice(0, 3).map(b => b.label || b.name).join(', ')}`, 'warn', 6000);
  if (!items.length) return null;
  const choice = await askDelete(items, permanent);
  if (!choice) return null;
  const busy = toast(choice.permanent ? 'Suppression…' : 'Envoi à la corbeille…', 'busy');
  let out;
  try {
    out = await api('/api/delete', { paths: items.map(i => i.path), permanent: choice.permanent, acceptWarn: choice.acceptWarn });
  } catch (e) { toast(e.message, 'error'); return null; } finally { busy.close(); }
  const okPaths = new Set(out.results.filter(r => r.ok).map(r => r.path.toLowerCase()));
  const okItems = items.filter(i => okPaths.has(i.path.toLowerCase()));
  const freed = okItems.reduce((a, i) => a + (i.size || 0), 0);
  const fails = out.results.filter(r => !r.ok);
  if (okItems.length) {
    toast(`${plural(okItems.length, 'élément', 'éléments')} ${choice.permanent ? 'supprimé' : 'mis à la corbeille'}${okItems.length > 1 ? 's' : ''} · ${fmtSize(freed)}`, 'ok', 6000,
      choice.permanent ? null : { label: 'Vider la corbeille', fn: emptyBin });
  }
  if (fails.length) showFailures(fails);
  if (after) after(okPaths, out);
  else {
    if (S.search) {
      S.search.results = S.search.results.filter(r => !okPaths.has(r.path.toLowerCase()));
      for (const p of [...S.search.byPath.keys()]) if (okPaths.has(p.toLowerCase())) S.search.byPath.delete(p);
    }
    for (const p of [...S.sel]) if (okPaths.has(p.toLowerCase())) S.sel.delete(p);
    if (S.search) renderList(true); else await reload();
  }
  loadBin(); loadPlaces();
  return out;
}
function showFailures(fails) {
  modal({
    title: `${plural(fails.length, 'élément non supprimé', 'éléments non supprimés')}`,
    body: h('div', {},
      h('p', { class: 'muted', text: "Souvent : un programme utilise encore le fichier (ferme-le et réessaie), ou il faut les droits administrateur." }),
      h('ul', { class: 'fail-list' }, fails.slice(0, 40).map(f => h('li', {}, h('b', { text: baseName(f.path) }), h('small', { text: f.path }), h('span', { text: f.error })))),
      fails.length > 40 ? h('p', { class: 'muted', text: `… et ${fails.length - 40} autres.` }) : null),
    actions: [{ label: 'OK', value: () => true, default: true }],
  });
}
function askDelete(items, permanentDefault) {
  const size = items.reduce((a, i) => a + (i.size || 0), 0);
  const unknown = items.some(i => i.size == null);
  const cloud = items.filter(i => i.cloud && !i.cloudOnly).length + items.filter(i => i.cloudOnly).length;
  const warn = items.filter(i => i.level === 'warn');
  const files = items.reduce((a, i) => a + (i.type === 'dir' ? i.files || 0 : 1), 0);
  let permanent = permanentDefault;
  let accept = false;
  const list = h('ul', { class: 'del-list' },
    items.slice(0, 8).map(i => h('li', {}, fileIcon(i), h('span', { class: 'nm', text: i.label || i.name, title: i.path }), h('span', { class: 'sz', text: i.size == null ? '' : fmtSize(i.size) }))),
    items.length > 8 ? h('li', { class: 'more-li', text: `… et ${fmtNum(items.length - 8)} autres` }) : null);
  const warnBox = warn.length ? h('label', { class: 'callout c-warn check' },
    h('input', { type: 'checkbox', onchange: e => { accept = e.target.checked; sync(); } }),
    h('span', {}, h('b', { text: `${plural(warn.length, 'élément est', 'éléments sont')} dans un dossier système ou d'application` }), ' (Program Files, ProgramData, AppData…). Les supprimer peut casser un logiciel. Pour enlever un programme, passe plutôt par « Désinstaller des applications ». ', h('b', { text: 'Je sais ce que je fais.' }))) : null;
  const cloudBox = cloud ? h('div', { class: 'callout c-info' }, icon('cloud'),
    h('span', {}, h('b', { text: `${plural(cloud, 'élément est synchronisé', 'éléments sont synchronisés')} avec OneDrive` }), ' : ils disparaîtront aussi du cloud et de tes autres appareils (récupérables 30 jours dans la corbeille OneDrive en ligne).')) : null;
  const opt = (val, title, sub) => h('label', { class: 'opt' },
    h('input', { type: 'radio', name: 'delmode', checked: permanent === val ? true : null, onchange: () => { permanent = val; sync(); } }),
    h('span', {}, h('b', { text: title }), h('small', { text: sub })));
  const modeBox = h('div', { class: 'opts' },
    opt(false, 'Mettre à la corbeille', 'Recommandé : restaurable en cas d’erreur. La place se libère quand tu vides la corbeille.'),
    opt(true, 'Supprimer définitivement', 'Libère la place tout de suite. Irréversible.'));
  let confirmBtn;
  const sync = () => {
    if (!confirmBtn) return;
    confirmBtn.disabled = warn.length > 0 && !accept;
    confirmBtn.querySelector('span').textContent = permanent ? 'Supprimer définitivement' : 'Mettre à la corbeille';
    confirmBtn.closest('.modal').classList.toggle('danger', permanent);
  };
  return modal({
    title: permanent ? `Supprimer ${plural(items.length, 'élément', 'éléments')} ?` : `Mettre ${plural(items.length, 'élément', 'éléments')} à la corbeille ?`,
    danger: permanent,
    body: h('div', {},
      h('p', { class: 'del-sum' }, h('b', { text: `${fmtSize(size)}${unknown ? ' +' : ''}` }), ` · ${plural(files, 'fichier', 'fichiers')}`),
      list, warnBox, cloudBox, modeBox),
    actions: [
      { label: 'Annuler', value: () => null, default: !!permanentDefault },
      { label: 'Mettre à la corbeille', cls: 'danger', icon: 'trash', default: !permanentDefault, value: () => ({ permanent, acceptWarn: accept }) },
    ],
    onOpen: box => {
      confirmBtn = box.querySelector('footer .btn.danger');
      sync();
      (box.querySelector('[data-default]') || confirmBtn).focus();
    },
  });
}

// ---------------------------------------------------------------- renommer, nouveau dossier
async function askName({ title, value, okLabel, selectBase }) {
  let inp;
  const res = await modal({
    title,
    body: h('div', {}, inp = h('input', { class: 'text-in', value, spellcheck: 'false' }), h('p', { class: 'muted small', text: 'Caractères interdits : \\ / : * ? " < > |' })),
    actions: [{ label: 'Annuler', value: () => null }, { label: okLabel, cls: 'primary', value: () => inp.value.trim() || undefined }],
    onOpen: (box, done) => {
      inp.focus();
      const dot = value.lastIndexOf('.');
      if (selectBase && dot > 0) inp.setSelectionRange(0, dot); else inp.select();
      inp.addEventListener('keydown', e => { if (e.key === 'Enter' && inp.value.trim()) done(inp.value.trim()); });
    },
  });
  return res;
}
async function askRename(e) {
  if (e.level === 'block') return toast('Élément protégé : renommage impossible', 'warn');
  const name = await askName({ title: 'Renommer', value: e.name, okLabel: 'Renommer', selectBase: e.type !== 'dir' });
  if (!name || name === e.name) return;
  try {
    const r = await api('/api/rename', { path: e.path, name });
    if (S.search) { stopSearch(); }
    await go(S.path, { push: false, focus: r.path, keepScroll: true });
  } catch (err) { toast(err.message, 'error'); }
}
async function askMkdir() {
  if (!S.path) return;
  const name = await askName({ title: 'Nouveau dossier', value: 'Nouveau dossier', okLabel: 'Créer' });
  if (!name) return;
  try { const r = await api('/api/mkdir', { path: S.path, name }); await go(S.path, { push: false, focus: r.path, keepScroll: true }); } catch (err) { toast(err.message, 'error'); }
}

// ---------------------------------------------------------------- aperçu
let previewFor = null;
function renderPreview() {
  const pane = $('#preview');
  pane.hidden = !S.showPreview;
  $('#togglePreview').classList.toggle('on', S.showPreview);
  if (!S.showPreview) return;
  const sel = selected();
  const key = sel.length > 1 ? `multi:${sel.length}:${sel.reduce((a, e) => a + (e.size || 0), 0)}` : S.focus ? `one:${S.focus}:${entryOf(S.focus)?.size}` : `dir:${S.path}:${S.total?.size}:${S.sizing ? 1 : 0}`;
  if (key === previewFor) return;
  previewFor = key;
  if (sel.length > 1) return pane.replaceChildren(multiPreview(sel));
  const e = entryOf(S.focus);
  pane.replaceChildren(e ? onePreview(e) : folderPreview());
}
function multiPreview(sel) {
  const size = sel.reduce((a, e) => a + (e.size || 0), 0);
  const byKind = {};
  for (const e of sel) { const k = kindOf(e); byKind[k] = (byKind[k] || 0) + (e.size || 0); }
  return h('div', { class: 'pv' },
    h('div', { class: 'pv-hero' }, icon('dups', 'ic huge')),
    h('h3', { text: plural(sel.length, 'élément sélectionné', 'éléments sélectionnés') }),
    h('p', { class: 'pv-big', text: fmtSize(size) }),
    h('ul', { class: 'mini-bars' }, Object.entries(byKind).sort((a, b) => b[1] - a[1]).map(([k, s]) =>
      h('li', {}, h('span', { text: KIND_LABEL[k] }), h('div', { class: 'bar' }, h('i', { style: `width:${size ? (s / size) * 100 : 0}%` })), h('b', { text: fmtSize(s) })))),
    h('div', { class: 'pv-acts' }, btn('Mettre à la corbeille', 'trash', () => deleteEntries(sel), 'btn danger wide')));
}
function folderPreview() {
  if (!S.data) return h('div');
  const t = S.total;
  const top = S.entries.filter(e => e.size != null && (S.showSystem || (!e.system && e.type !== 'link'))).sort((a, b) => b.size - a.size).slice(0, 7);
  const max = top.length ? top[0].size : 1;
  return h('div', { class: 'pv' },
    h('div', { class: 'pv-hero' }, icon('folder', 'fi k-dir huge')),
    h('h3', { text: baseName(S.path) || S.path }),
    h('p', { class: 'pv-big', text: t ? fmtSize(t.size) : S.sizing ? 'calcul…' : '—' }),
    t ? h('p', { class: 'muted', text: `${plural(t.files, 'fichier', 'fichiers')} · ${plural(t.dirs, 'sous-dossier', 'sous-dossiers')}` }) : null,
    top.length ? h('div', { class: 'pv-sec' }, h('h4', { text: 'Ce qui prend le plus de place ici' }),
      h('ul', { class: 'mini-bars clickable' }, top.map(e => h('li', { onclick: () => { S.focus = e.path; S.sel = new Set([e.path]); S.anchor = e.path; paintSel(); scrollToFocus(); }, title: e.path },
        h('span', { text: e.name }), h('div', { class: 'bar' }, h('i', { style: `width:${(e.size / max) * 100}%` })), h('b', { text: fmtSize(e.size) }))))) : null,
    S.data.cloud ? h('div', { class: 'callout c-info' }, icon('cloud'), h('span', { text: 'Dossier synchronisé avec OneDrive : ce que tu supprimes ici disparaît aussi du cloud.' })) : null,
    h('div', { class: 'tips' },
      h('h4', { text: 'Raccourcis' }),
      h('p', {}, h('kbd', { text: 'Suppr' }), ' corbeille · ', h('kbd', { text: 'F2' }), ' renommer · ', h('kbd', { text: 'Retour' }), ' remonter · ', h('kbd', { text: 'Ctrl+F' }), ' filtrer · clic droit pour le menu')));
}
function onePreview(e) {
  const k = kindOf(e);
  const x = extOf(e.name);
  const media = h('div', { class: 'pv-media' });
  if (e.type === 'file' && !e.cloudOnly && PREVIEWABLE.has(x)) {
    if (k === 'image') media.append(h('img', { src: fileUrl(e.path), alt: '', loading: 'lazy', onerror: ev => ev.target.replaceWith(fileIcon(e)) }));
    else if (k === 'video') media.append(h('video', { src: fileUrl(e.path), controls: true, preload: 'metadata' }));
    else if (k === 'audio') media.append(fileIcon(e), h('audio', { src: fileUrl(e.path), controls: true, preload: 'metadata' }));
    else if (x === 'pdf') media.append(h('iframe', { src: fileUrl(e.path), title: e.name }));
  } else if (e.type === 'file' && !e.cloudOnly && TEXTUAL.has(x) && e.size < 20 * 1048576) {
    const pre = h('pre', { class: 'pv-text', text: 'Chargement…' });
    media.append(pre);
    api(`/api/text?path=${enc(e.path)}`).then(r => { pre.textContent = r.binary ? '(fichier binaire)' : r.text + (r.truncated ? '\n\n… (aperçu limité aux 64 premiers Ko)' : ''); }).catch(err => { pre.textContent = err.message; });
  } else media.append(icon(k === 'dir' ? 'folder' : k === 'link' ? 'link' : 'file', `fi k-${k} huge`));
  media.classList.toggle('icon-only', !media.querySelector('img,video,iframe,pre'));

  const rows = [['Type', typeLabel(e)]];
  rows.push(['Taille', e.size == null ? (e.type === 'dir' && S.sizing ? 'calcul…' : '—') : `${fmtSize(e.size)}  (${fmtNum(e.size)} octets)`]);
  if (e.disk != null && e.size != null && Math.abs(e.disk - e.size) > Math.max(1048576, e.size * 0.05)) rows.push(['Sur le disque', fmtSize(e.disk)]);
  if (e.type === 'dir' && e.files != null) rows.push(['Contenu', `${plural(e.files, 'fichier', 'fichiers')}, ${plural(e.dirs || 0, 'dossier', 'dossiers')}`]);
  if (e.mtime) rows.push(['Modifié', `${fmtDate(e.mtime)} (${ago(e.mtime)})`]);
  if (e.target) rows.push(['Pointe vers', e.target]);
  const loc = parentOf(e.path) || '';
  return h('div', { class: 'pv' }, media,
    h('h3', { class: 'pv-name', text: e.name, title: e.name }),
    e.level === 'block' ? h('div', { class: 'callout c-lock' }, icon('lock'), h('span', { text: 'Protégé : élément système ou dossier indispensable, suppression impossible ici.' })) : null,
    e.level === 'warn' ? h('div', { class: 'callout c-warn' }, icon('warn'), h('span', { text: "Dans un dossier de programmes ou d'applications : ne supprime que si tu sais à quoi ça sert." })) : null,
    e.cloudOnly ? h('div', { class: 'callout c-info' }, icon('cloud'), h('span', { text: 'En ligne uniquement : ce fichier ne prend pas de place sur ce PC. Le supprimer le supprime du cloud.' })) : null,
    h('dl', { class: 'pv-dl' }, rows.flatMap(([a, b]) => [h('dt', { text: a }), h('dd', { text: b })]),
      h('dt', { text: 'Emplacement' }), h('dd', {}, h('button', { class: 'linkish', type: 'button', text: loc, title: 'Ouvrir ce dossier', onclick: () => go(loc, { focus: e.path }) }))),
    h('div', { class: 'pv-acts' },
      btn(e.type === 'dir' ? 'Ouvrir le dossier' : 'Ouvrir', 'open', () => openEntry(e), 'btn'),
      btn("Explorateur Windows", 'external', () => api('/api/reveal', { path: e.path }).catch(err => toast(err.message, 'error')), 'btn'),
      e.level !== 'block' ? btn('Mettre à la corbeille', 'trash', () => deleteEntries([e]), 'btn danger wide') : null));
}

// ---------------------------------------------------------------- recherche
function startSearch(q) {
  if (!S.path || !q.trim()) return;
  stopSearch(false);
  const root = S.path;
  S.search = { q, root, results: [], byPath: new Map(), running: true, dirs: 0 };
  S.sel.clear(); S.focus = null;
  let queued = false;
  S.search.es = sse(`/api/search?path=${enc(root)}&q=${enc(q)}`, {
    hits: d => {
      if (!S.search || S.search.root !== root) return;
      for (const it of d.items) { S.search.results.push(it); S.search.byPath.set(it.path, it); }
      if (!queued) { queued = true; setTimeout(() => { queued = false; if (S.search) { renderList(true); renderBanner(); } }, 300); }
    },
    progress: d => { if (S.search) { S.search.dirs = d.dirs; renderStatus(); } },
    done: d => { if (!S.search) return; S.search.running = false; S.search.truncated = d.truncated; renderList(true); renderBanner(); renderStatus(); },
    fail: d => { if (!S.search) return; S.search.running = false; renderBanner(); renderStatus(); if (d.message !== 'Connexion interrompue') toast(d.message, 'error'); },
  });
  renderBanner(); renderList(); renderPreview();
}
function stopSearch(render = true) {
  if (!S.search) return;
  S.search.es.close();
  S.search = null;
  $('#searchBanner').hidden = true;
  if (render) { S.sel.clear(); S.focus = null; renderList(); renderPreview(); }
}
function renderBanner() {
  const b = $('#searchBanner');
  const s = S.search;
  if (!s) { b.hidden = true; return; }
  b.hidden = false;
  const total = s.results.reduce((a, e) => a + (e.size || 0), 0);
  b.replaceChildren(
    s.running ? h('span', { class: 'spin sm' }) : icon('search'),
    h('span', {}, h('b', { text: `« ${s.q} »` }), ` dans ${baseName(s.root) || s.root} et ses sous-dossiers : `,
      h('b', { text: plural(s.results.length, 'résultat', 'résultats') }), s.results.length ? ` · ${fmtSize(total)}` : '',
      s.truncated ? ' (limité aux 2 000 premiers)' : '', s.running ? ' — recherche en cours…' : ''),
    h('span', { class: 'grow' }),
    s.running ? btn('Arrêter', null, () => { s.es.close(); s.running = false; renderBanner(); renderStatus(); }, 'btn sm') : null,
    btn('Fermer la recherche', 'x', () => { $('#q').value = ''; S.q = ''; stopSearch(); }, 'btn sm ghost'));
}

// ---------------------------------------------------------------- menu contextuel
function rowMenu(ev, row) {
  ev.preventDefault();
  const p = row.dataset.path;
  if (!S.sel.has(p)) { S.sel = new Set([p]); S.anchor = p; }
  S.focus = p;
  paintSel();
  const sel = selected();
  const one = sel.length === 1 ? sel[0] : null;
  const locked = sel.every(e => e.level === 'block');
  openMenu(ev.clientX, ev.clientY, [
    one ? { label: one.type === 'dir' ? 'Ouvrir' : 'Ouvrir avec l’appli par défaut', icon: 'open', fn: () => openEntry(one), kbd: 'Entrée' } : null,
    { label: "Afficher dans l'Explorateur Windows", icon: 'external', fn: () => api('/api/reveal', { path: sel[0].path }) },
    S.search && one ? { label: 'Aller au dossier qui le contient', icon: 'folder-line', fn: () => go(one.parent, { focus: one.path }) } : null,
    { label: sel.length > 1 ? 'Copier les chemins' : 'Copier le chemin', icon: 'copy', fn: () => copyPaths(sel) },
    one ? { label: 'Renommer', icon: 'pencil', fn: () => askRename(one), kbd: 'F2', disabled: one.level === 'block' } : null,
    '-',
    { label: 'Mettre à la corbeille', icon: 'trash', danger: true, fn: () => deleteEntries(sel), kbd: 'Suppr', disabled: locked },
    { label: 'Supprimer définitivement…', icon: 'trash', danger: true, fn: () => deleteEntries(sel, { permanent: true }), kbd: 'Maj+Suppr', disabled: locked },
  ].filter(Boolean));
}
function bgMenu(ev) {
  ev.preventDefault();
  openMenu(ev.clientX, ev.clientY, [
    { label: 'Nouveau dossier', icon: 'folder-plus', fn: askMkdir },
    { label: 'Actualiser les tailles', icon: 'refresh', fn: refresh, kbd: 'F5' },
    { label: "Ouvrir dans l'Explorateur Windows", icon: 'external', fn: () => api('/api/open', { path: S.path }) },
    { label: 'Copier le chemin du dossier', icon: 'copy', fn: () => copyPaths([{ path: S.path }]) },
  ]);
}

// ---------------------------------------------------------------- nettoyage
function cleanItems(cat) { return cat.groups ? cat.groups.flatMap(g => g.items) : cat.items; }
// Ce que « tout cocher » coche : pour les doublons, les copies seulement, jamais l'exemplaire à garder.
const cleanTargets = cat => (cat.groups ? cat.groups.flatMap(g => g.items.slice(1)) : cat.items).filter(i => i.level !== 'block');
function catTotal(cat) {
  if (cat.groups) return cat.groups.reduce((a, g) => a + g.size * (g.items.length - 1), 0);
  return cat.items.reduce((a, i) => a + (i.cloudOnly ? 0 : i.size || 0), 0);
}
const CAT_ICON = { temp: 'temp', caches: 'cache', downloads: 'download', dev: 'code', big: 'big', dups: 'dups', empty: 'empty' };

function startCleanup() {
  if (S.clean) return;
  S.clean = { phase: 'Démarrage', files: 0, current: '' };
  S.clean.es = sse('/api/cleanup', {
    progress: d => { if (!S.clean) return; Object.assign(S.clean, d); paintCleanProgress(); },
    done: rep => {
      S.clean = null;
      S.report = rep;
      S.csel = new Set();
      S.cleanMore.clear();
      for (const c of rep.categories) for (const i of cleanItems(c)) if (i.checked && i.level !== 'block') S.csel.add(i.path);
      renderClean();
      toast('Analyse terminée', 'ok', 2500);
    },
    fail: d => { S.clean = null; renderClean(); toast(d.message === 'Connexion interrompue' ? 'Analyse interrompue' : d.message, 'error'); },
  });
  renderClean();
}
function stopCleanup() { if (S.clean) { S.clean.es.close(); S.clean = null; renderClean(); } }
function paintCleanProgress() {
  const box = $('#cleanProgress');
  if (!box || !S.clean) return;
  box.querySelector('.cp-phase').textContent = S.clean.phase;
  box.querySelector('.cp-count').textContent = `${fmtNum(S.clean.files)} fichiers parcourus`;
  box.querySelector('.cp-cur').textContent = S.clean.current || '';
}
function renderClean() {
  const root = $('#clean');
  const parts = [];
  if (S.clean) {
    parts.push(h('div', { class: 'hero' },
      h('div', { class: 'hero-text' }, h('h1', { text: 'Analyse en cours…' }), h('p', { class: 'muted', text: 'Ça prend en général une à trois minutes. Tu peux continuer à explorer pendant ce temps.' })),
      h('div', { class: 'progress-card', id: 'cleanProgress' },
        h('span', { class: 'spin' }), h('div', {}, h('b', { class: 'cp-phase' }), h('small', { class: 'cp-count' }), h('small', { class: 'cp-cur' })),
        btn('Arrêter', null, stopCleanup, 'btn sm'))));
  } else if (!S.report) {
    parts.push(h('div', { class: 'hero' },
      h('div', { class: 'hero-text' },
        h('h1', { text: 'Fais le ménage sans risque' }),
        h('p', { text: "L'analyse passe ton dossier personnel au peigne fin et range ce qui peut partir en catégories. Rien n'est supprimé sans ton accord, et tout passe par la corbeille." }),
        h('ul', { class: 'hero-list' },
          [['temp', 'Fichiers temporaires'], ['cache', "Caches de navigateurs, jeux et applis"], ['download', 'Vieux installateurs et téléchargements'], ['code', 'node_modules et builds de projets'], ['big', 'Gros fichiers oubliés'], ['dups', 'Fichiers en double'], ['empty', 'Dossiers vides']]
            .map(([i, t]) => h('li', {}, icon(i), t))),
        btn("Lancer l'analyse", 'sparkle', startCleanup, 'btn primary big'))));
  } else {
    const rep = S.report;
    const sum = safe => rep.categories.filter(c => !!c.safe === safe).reduce((a, c) => a + catTotal(c), 0);
    parts.push(h('div', { class: 'clean-head' },
      h('div', {}, h('h1', { text: 'Nettoyage' }),
        h('p', { class: 'muted', text: `Analyse du ${fmtDate(rep.at)} · ${fmtNum(rep.scanned.files)} fichiers parcourus` })),
      h('div', { class: 'kpis' },
        h('div', { class: 'kpi', title: 'Fichiers temporaires + caches d’applications' }, h('small', { text: 'Sans risque' }), h('b', { text: fmtSize(sum(true)) })),
        h('div', { class: 'kpi', title: 'Gros fichiers, doublons, téléchargements… à juger au cas par cas' }, h('small', { text: 'À examiner' }), h('b', { text: fmtSize(sum(false)) })),
        h('div', { class: 'kpi accent' }, h('small', { text: 'Coché' }), h('b', { id: 'kpiSel', text: '—' }))),
      btn("Relancer l'analyse", 'refresh', startCleanup, 'btn')));
    for (const c of rep.categories) parts.push(catCard(c));
  }
  parts.push(h('div', { class: 'wintools' },
    h('h4', { text: 'Les outils de Windows, pour ce que Ménage PC ne peut pas faire sans droits administrateur' }),
    h('div', { class: 'wt-row' },
      btn('Nettoyage de disque (fichiers système, mises à jour)', 'broom', () => api('/api/special', { what: 'cleanmgr' }), 'btn'),
      btn('Assistant de stockage', 'drive', () => api('/api/special', { what: 'storage' }), 'btn'),
      btn('Désinstaller des applications', 'gear', () => api('/api/special', { what: 'apps' }), 'btn'))));
  root.replaceChildren(...parts);
  paintClean();
  paintCleanProgress();
}
function catCard(cat) {
  const items = cleanItems(cat);
  const total = catTotal(cat);
  const closed = S.cleanClosed.has(cat.id);
  const card = h('section', { class: `ccard${closed ? ' closed' : ''}${items.length ? '' : ' none'}`, dataset: { cat: cat.id } });
  const head = h('header', { class: 'cc-head', onclick: e => { if (e.target.closest('.cb')) return; if (S.cleanClosed.has(cat.id)) S.cleanClosed.delete(cat.id); else S.cleanClosed.add(cat.id); card.classList.toggle('closed'); } },
    items.length ? h('span', { class: 'cb', dataset: { catcb: cat.id }, title: 'Tout cocher / décocher', onclick: () => {
      const targets = cleanTargets(cat);
      if (targets.every(i => S.csel.has(i.path))) for (const i of items) S.csel.delete(i.path);
      else {
        for (const i of targets) S.csel.add(i.path);
        if (cat.groups) for (const g of cat.groups) S.csel.delete(g.items[0].path);
      }
      paintClean();
    } }) : h('span', { class: 'cb-space' }),
    h('span', { class: `cc-ic ${cat.safe ? 'safe' : ''}` }, icon(CAT_ICON[cat.id] || 'info')),
    h('div', { class: 'cc-title' }, h('h3', {}, cat.title, cat.safe ? h('span', { class: 'tag safe', text: 'sans risque' }) : null), h('p', { text: cat.desc })),
    h('div', { class: 'cc-total' }, h('b', { text: items.length ? fmtSize(total) : '—' }), h('small', { text: cat.groups ? plural(cat.groups.length, 'groupe', 'groupes') : plural(items.length, 'élément', 'éléments') })),
    h('span', { class: 'cc-chev' }, icon('chevron')));
  const body = h('div', { class: 'cc-body' });
  for (const n of cat.notes || []) body.append(h('div', { class: 'callout c-info' }, icon('info'), h('span', { text: n })));
  if (!items.length) body.append(h('p', { class: 'nothing', text: 'Rien à signaler ici.' }));
  const LIMIT = 8;
  const more = S.cleanMore.has(cat.id);
  if (cat.groups) {
    const groups = more ? cat.groups : cat.groups.slice(0, 5);
    for (const g of groups) {
      body.append(h('div', { class: 'dgroup' },
        h('div', { class: 'dg-head' }, h('span', {}, h('b', { text: `${g.items.length} exemplaires` }), ` de ${fmtSize(g.size)} · ${fmtSize(g.size * (g.items.length - 1))} récupérables${g.exact ? '' : ' · (très gros : comparés par échantillons)'}`),
          btn('Garder le 1er, cocher les copies', null, () => { g.items.forEach((i, k) => { if (k === 0) S.csel.delete(i.path); else S.csel.add(i.path); }); paintClean(); }, 'btn sm')),
        g.items.map(cleanRow)));
    }
    if (cat.groups.length > 5) body.append(h('button', { class: 'more', type: 'button', text: more ? 'Réduire' : `Afficher les ${cat.groups.length - 5} autres groupes`, onclick: () => { toggleMore(cat.id); } }));
  } else {
    const list = more ? items : items.slice(0, LIMIT);
    body.append(...list.map(cleanRow));
    if (items.length > LIMIT) body.append(h('button', { class: 'more', type: 'button', text: more ? 'Réduire' : `Afficher les ${fmtNum(items.length - LIMIT)} autres`, onclick: () => toggleMore(cat.id) }));
  }
  card.append(head, body);
  return card;
}
function toggleMore(id) { if (S.cleanMore.has(id)) S.cleanMore.delete(id); else S.cleanMore.add(id); renderClean(); }
function cleanRow(it) {
  const locked = it.level === 'block';
  const parent = parentOf(it.path) || '';
  return h('div', { class: `citem${locked ? ' locked' : ''}`, dataset: { cpath: it.path }, onclick: e => {
    if (e.target.closest('button') || locked) return;
    if (S.csel.has(it.path)) S.csel.delete(it.path); else S.csel.add(it.path);
    paintClean();
  } },
  h('span', { class: 'cb' }),
  fileIcon(it),
  h('div', { class: 'ci-main' },
    h('div', { class: 'ci-name', text: it.label || it.name, title: it.path }),
    h('div', { class: 'ci-sub' }, it.note ? h('span', { text: it.note }) : null, h('span', { class: 'ci-path', text: parent, title: it.path }))),
  h('div', { class: 'ci-size', text: it.type === 'dir' && !it.size ? 'vide' : fmtSize(it.size) }),
  h('div', { class: 'ci-acts' },
    h('button', { class: 'ib sm', type: 'button', title: 'Voir dans Ménage PC', onclick: () => { setView('explore'); go(parent, { focus: it.path }); } }, icon('folder-line')),
    h('button', { class: 'ib sm', type: 'button', title: "Afficher dans l'Explorateur Windows", onclick: () => api('/api/reveal', { path: it.path }).catch(e => toast(e.message, 'error')) }, icon('external'))));
}
function paintClean() {
  for (const r of $$('#clean .citem')) r.querySelector('.cb').classList.toggle('on', S.csel.has(r.dataset.cpath));
  if (!S.report) { $('#cleanbar').hidden = true; return; }
  for (const c of S.report.categories) {
    const cb = $(`#clean [data-catcb="${c.id}"]`);
    if (!cb) continue;
    const targets = cleanTargets(c);
    const n = cleanItems(c).filter(i => S.csel.has(i.path)).length;
    const all = targets.length && n === targets.length && targets.every(i => S.csel.has(i.path));
    cb.className = `cb${all ? ' on' : n ? ' mid' : ''}`;
  }
  const chosen = cleanChosen();
  const size = chosen.reduce((a, i) => a + (i.cloudOnly ? 0 : i.size || 0), 0);
  const k = $('#kpiSel');
  if (k) k.textContent = fmtSize(size);
  const bar = $('#cleanbar');
  bar.hidden = !chosen.length;
  if (!chosen.length) return;
  bar.replaceChildren(
    h('div', { class: 'ab-info' }, h('b', { text: plural(chosen.length, 'élément coché', 'éléments cochés') }), h('span', { text: ` · ${fmtSize(size)}` })),
    h('div', { class: 'ab-acts' },
      btn('Tout décocher', 'x', () => { S.csel.clear(); paintClean(); }, 'btn ghost'),
      btn('Mettre à la corbeille', 'trash', () => deleteClean(chosen), 'btn danger')));
}
function cleanChosen() {
  if (!S.report) return [];
  const seen = new Set();
  const out = [];
  for (const c of S.report.categories) for (const i of cleanItems(c)) if (S.csel.has(i.path) && !seen.has(i.path)) { seen.add(i.path); out.push(i); }
  // Un élément contenu dans un autre élément coché partirait deux fois : on ne garde que le parent.
  const dirs = out.filter(i => i.type === 'dir').map(i => i.path.toLowerCase() + '\\');
  return out.filter(i => !dirs.some(d => i.path.toLowerCase().startsWith(d)));
}
async function deleteClean(items) {
  // Jamais tous les exemplaires d'un même fichier : il faut en garder au moins un.
  const dupCat = S.report.categories.find(c => c.groups);
  const whole = dupCat ? dupCat.groups.filter(g => g.items.every(i => S.csel.has(i.path))) : [];
  if (whole.length) {
    toast(`${whole.length > 1 ? `${whole.length} groupes de doublons ont tous leurs exemplaires cochés` : 'Un groupe de doublons a tous ses exemplaires cochés'} (ex. « ${whole[0].items[0].name} ») : décoche celui à garder.`, 'warn', 9000);
    return;
  }
  await deleteEntries(items, {
    after: okPaths => {
      for (const c of S.report.categories) {
        if (c.groups) {
          for (const g of c.groups) g.items = g.items.filter(i => !okPaths.has(i.path.toLowerCase()));
          c.groups = c.groups.filter(g => g.items.length > 1);
        } else c.items = c.items.filter(i => !okPaths.has(i.path.toLowerCase()));
      }
      for (const p of [...S.csel]) if (okPaths.has(p.toLowerCase())) S.csel.delete(p);
      renderClean();
      if (S.path) reload();
    },
  });
}

// ---------------------------------------------------------------- filtres
function renderChips() {
  $('#chips').replaceChildren(...CHIPS.map(([k, label]) => h('button', {
    class: `chip${S.kind === k ? ' on' : ''}`, type: 'button', text: label,
    onclick: () => { S.kind = k; renderChips(); renderList(); },
  })));
  $('#toggleSystem').classList.toggle('on', S.showSystem);
}

// ---------------------------------------------------------------- clavier & événements
function bind() {
  for (const el of $$('[data-icon]')) el.prepend(icon(el.dataset.icon));
  $('#back').onclick = goBack;
  $('#fwd').onclick = goFwd;
  $('#up').onclick = goUp;
  $('#refresh').onclick = refresh;
  $('#newdir').onclick = askMkdir;
  $('#toggleSystem').onclick = () => { S.showSystem = !S.showSystem; save('showSystem', S.showSystem); renderChips(); renderList(true); previewFor = null; renderPreview(); };
  $('#togglePreview').onclick = () => { S.showPreview = !S.showPreview; save('showPreview', S.showPreview); previewFor = null; renderPreview(); };
  $('#quit').onclick = async () => {
    const ok = await modal({ title: 'Quitter Ménage PC ?', body: h('p', { text: 'Le programme s’arrête. Tu pourras le relancer avec « Lancer Ménage PC ».' }), actions: [{ label: 'Annuler', value: () => null }, { label: 'Quitter', cls: 'primary', default: true, value: () => true }] });
    if (!ok) return;
    await api('/api/quit', {}).catch(() => {});
    const d = $('#dead');
    d.querySelector('h2').textContent = 'Ménage PC est fermé';
    d.querySelector('p').textContent = 'Tu peux fermer cette fenêtre.';
    d.hidden = false;
  };
  for (const b of $$('.view-btn')) b.onclick = () => setView(b.dataset.view);

  $('#pathbox').onclick = e => { if (e.target === $('#pathbox') || e.target === $('#crumbs')) editPath(); };
  $('#pathInput').onkeydown = async e => {
    if (e.key === 'Enter') { const v = e.target.value.trim(); if (v && await go(v)) endEditPath(); }
    if (e.key === 'Escape') endEditPath();
  };
  $('#pathInput').onblur = endEditPath;

  const q = $('#q');
  q.oninput = () => { S.q = q.value; $('#qhint').hidden = !q.value; if (S.search) stopSearch(false); renderList(); };
  q.onkeydown = e => {
    if (e.key === 'Enter' && q.value.trim()) { startSearch(q.value.trim()); $('#qhint').hidden = true; }
    if (e.key === 'Escape') { q.value = ''; S.q = ''; $('#qhint').hidden = true; if (S.search) stopSearch(); else renderList(); $('#list').focus(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); $('#list').focus(); moveFocus(1, false); }
  };
  q.onblur = () => { $('#qhint').hidden = true; };

  const list = $('#list');
  list.addEventListener('click', e => { const r = e.target.closest('.row'); if (r) onRowClick(e, r); else if (e.target === list) { S.sel.clear(); S.focus = null; paintSel(); } });
  list.addEventListener('dblclick', e => { const r = e.target.closest('.row'); if (r && !e.target.closest('.c-cb')) openEntry(entryOf(r.dataset.path)); });
  list.addEventListener('contextmenu', e => { const r = e.target.closest('.row'); if (r) rowMenu(e, r); else if (!S.search) bgMenu(e); });
  list.addEventListener('mousedown', e => { if (e.detail > 1) e.preventDefault(); }); // pas de sélection de texte au double-clic

  document.addEventListener('mousedown', e => { if (!e.target.closest('#menu')) closeMenu(); });
  window.addEventListener('blur', closeMenu);
  window.addEventListener('resize', closeMenu);
  list.addEventListener('scroll', closeMenu, { passive: true });

  document.addEventListener('keydown', e => {
    if (!$('#modal').hidden) { if (e.key === 'Escape' && modalResolve) modalResolve(null); return; }
    if (!$('#menu').hidden && e.key === 'Escape') { closeMenu(); return; }
    const typing = e.target.matches('input, textarea');
    if (e.key === 'F5') { e.preventDefault(); if (S.view === 'explore') refresh(); return; }
    if (S.view !== 'explore') return;
    if ((e.ctrlKey && e.key.toLowerCase() === 'f') || (e.key === '/' && !typing)) { e.preventDefault(); q.focus(); q.select(); return; }
    if (e.ctrlKey && e.key.toLowerCase() === 'l') { e.preventDefault(); editPath(); return; }
    if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); goBack(); return; }
    if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); goFwd(); return; }
    if (e.altKey && e.key === 'ArrowUp') { e.preventDefault(); goUp(); return; }
    if (typing) return;
    const sel = selected();
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); moveFocus(1, e.shiftKey); break;
      case 'ArrowUp': e.preventDefault(); moveFocus(-1, e.shiftKey); break;
      case 'PageDown': e.preventDefault(); moveFocus(15, e.shiftKey); break;
      case 'PageUp': e.preventDefault(); moveFocus(-15, e.shiftKey); break;
      case 'Home': e.preventDefault(); moveFocus(-1e9, e.shiftKey); break;
      case 'End': e.preventDefault(); moveFocus(1e9, e.shiftKey); break;
      case 'Enter': if (S.focus) openEntry(entryOf(S.focus)); break;
      case 'Backspace': e.preventDefault(); if (S.search) stopSearch(); else goUp(); break;
      case 'Delete': if (sel.length) deleteEntries(sel, { permanent: e.shiftKey }); break;
      case 'F2': e.preventDefault(); if (sel.length === 1) askRename(sel[0]); break;
      case ' ': if (S.focus) { e.preventDefault(); if (S.sel.has(S.focus)) S.sel.delete(S.focus); else S.sel.add(S.focus); paintSel(); } break;
      case 'Escape': if (S.search) stopSearch(); else { S.sel.clear(); S.focus = null; paintSel(); } break;
      default:
        if (e.ctrlKey && e.key.toLowerCase() === 'a') { e.preventDefault(); S.shown.forEach(x => S.sel.add(x.path)); paintSel(); }
        else if (e.ctrlKey && e.key.toLowerCase() === 'c' && sel.length) { copyPaths(sel); }
    }
  });

  // Signe de vie : sans lui le serveur s'arrête tout seul au bout de 5 minutes.
  setInterval(() => { api('/api/ping', {}).catch(() => {}); }, 60000);
  window.addEventListener('hashchange', () => { const p = decodeURIComponent(location.hash.slice(1)); if (p && p !== S.path) go(p); });
}

async function init() {
  bind();
  renderChips();
  $('#togglePreview').classList.toggle('on', S.showPreview);
  await loadPlaces();
  loadBin();
  try {
    const r = await api('/api/cleanup/last');
    if (r.report) {
      S.report = r.report;
      for (const c of r.report.categories) for (const i of cleanItems(c)) if (i.checked && i.level !== 'block') S.csel.add(i.path);
    }
  } catch { /* pas encore d'analyse */ }
  const hash = decodeURIComponent(location.hash.slice(1));
  const wantClean = hash === 'nettoyage';
  const start = (!wantClean && hash) || load('last', null) || (S.places && S.places.home);
  if (!(start && await go(start, { push: false })) && S.places) await go(S.places.home, { push: false });
  if (wantClean) setView('clean');
  $('#list').focus();
}
init();
