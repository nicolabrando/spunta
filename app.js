/* Spunta — segna ogni giorno le piccole azioni di cura.
   Tutto resta sul dispositivo (IndexedDB). Nessun server, nessun tracciamento. */
'use strict';
(() => {

const APP_VERSION = '1.0.0';

/* =========================================================
   Icone: SVG a linee, griglia 24×24, colore = currentColor
   ========================================================= */
const svg = (inner, extra = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"${extra}>${inner}</svg>`;

const P = {
  // berretta da notte (pigiama)
  nightcap: '<path d="M4.4 16.6C4.6 10.4 7.3 5.2 11.4 3.9c3.9-1.2 7.6 1.6 8.6 7.4"/><path d="M14.7 16.6c.2-3.9 1.4-6.9 3.2-7.6 1.1-.4 1.9.6 2.1 2.3"/><circle cx="20" cy="13.3" r="2"/><rect x="2.9" y="16.6" width="13.4" height="3.8" rx="1.9"/>',
  brush: '<rect x="2.5" y="15.3" width="11.1" height="2.4" rx="1.2"/><rect x="13.6" y="14.3" width="7.9" height="3.6" rx="1.2"/><path d="M15.4 14.3v-3.1M17.55 14.3v-3.1M19.7 14.3v-3.1"/>',
  sun: '<circle cx="6.5" cy="7" r="2.2"/><path d="M6.5 2.1v1.3M6.5 10.6v1.3M1.6 7h1.3M10.1 7h1.3M3.04 3.54l.91.91M9.05 9.55l.91.91M3.04 10.46l.91-.91M9.05 4.45l.91-.91"/>',
  moon: '<path d="M10.05 6.66A4.05 4.05 0 1 1 5.64 2.25a3.15 3.15 0 0 0 4.41 4.41z"/>',
  shower: '<path d="M4 21V8a4 4 0 0 1 4-4h3a4 4 0 0 1 4 4"/><path d="M10.5 12.5a4.5 4.5 0 0 1 9 0z"/><path d="M12 15.6v.9M15 15.6v.9M18 15.6v.9M13.5 18.9v.9M16.5 18.9v.9"/>',
  briefs: '<path d="M3 6.5h18v3.2c-3.4.5-5.9 3.3-6.6 6.9l-.4 1.9h-4l-.4-1.9C8.9 13 6.4 10.2 3 9.7z"/><path d="M3 8.6h18"/>',
  door: '<path d="M13.5 6.5V4.2A1.2 1.2 0 0 0 12.3 3H5.2A1.2 1.2 0 0 0 4 4.2v15.6A1.2 1.2 0 0 0 5.2 21h7.1a1.2 1.2 0 0 0 1.2-1.2v-2.3"/><path d="M4.4 3.5l5.4 1.9v14.8l-5.4.6"/><path d="M12.5 12H21M18 9l3 3-3 3"/>',
  check: '<path d="M5 12.5l4.3 4.3L19 7.2" stroke-width="2.6"/>',
  note: '<path d="M6 3.5h8.5L19 8v12.5H6z"/><path d="M14.5 3.5V8H19M9 12.5h7M9 16h5"/>',
  close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  chevL: '<path d="M14.5 5.5L8 12l6.5 6.5"/>',
  chevR: '<path d="M9.5 5.5L16 12l-6.5 6.5"/>',
  flag: '<path d="M5.5 21V3.8M5.5 4h11.5l-2.3 4.2 2.3 4.2H5.5"/>',
  share: '<path d="M12 14.5V3.5M8 7.5l4-4 4 4M5.5 12.5v6a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-6"/>',
  import: '<path d="M12 3.5v11M8 10.5l4 4 4-4M5.5 12.5v6a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-6"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.2"/><path d="M8.2 10.5V7.8a3.8 3.8 0 0 1 7.6 0v2.7"/>',
  alert: '<path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.5M12 17.4v.1"/>',
  trash: '<path d="M4.5 7h15M10 11v6M14 11v6M6.5 7l.9 12.1A2 2 0 0 0 9.4 21h5.2a2 2 0 0 0 2-1.9L17.5 7M9.5 7V4.5h5V7"/>',
  tabToday: '<circle cx="12" cy="12" r="9"/><path d="M8 12.4l2.8 2.8 5.4-5.6"/>',
  tabHistory: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.6"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  tabStats: '<path d="M3.5 3.5v17h17M8 17v-4M12.5 17V6.5M17 17v-7"/>',
  tabData: '<ellipse cx="12" cy="6" rx="7.5" ry="3"/><path d="M4.5 6v12c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3V6M4.5 12c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3"/>',
};

/* =========================================================
   Indicatori — l'ordine qui è l'ordine dei pulsanti.
   La chiave (key) è quella usata nei file esportati.
   ========================================================= */
const INDICATORS = [
  { key: 'pigiama',       name: 'Pigiama stanotte',        short: 'Pigiama',       icon: P.nightcap },
  { key: 'denti_mattina', name: 'Denti al mattino',        short: 'Denti mattina', icon: P.brush + P.sun },
  { key: 'doccia',        name: 'Doccia',                  short: 'Doccia',        icon: P.shower },
  { key: 'intimo',        name: 'Cambio intimo',           short: 'Intimo',        icon: P.briefs },
  { key: 'uscito',        name: 'Uscito di casa (10 min)', short: 'Uscito',        icon: P.door },
  { key: 'denti_sera',    name: 'Denti alla sera',         short: 'Denti sera',    icon: P.brush + P.moon },
];
const IND = Object.fromEntries(INDICATORS.map(i => [i.key, i]));
const KEYS = INDICATORS.map(i => i.key);
const NIND = INDICATORS.length;

/* =========================================================
   Utilità
   ========================================================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cap = s => (s ? s[0].toUpperCase() + s.slice(1) : s);
const pad = n => String(n).padStart(2, '0');
const pct = x => (x == null ? '—' : Math.round(x * 100) + '%');
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const fmtBytes = b => (b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} kB` : `${(b / 1048576).toFixed(1)} MB`);

/* Date: sempre stringhe locali 'AAAA-MM-GG'; l'aritmetica passa da UTC per evitare l'ora legale */
const DAY = 86400000;
const toStr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayStr = () => toStr(new Date());
const utcMs = s => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
const fromUtcMs = ms => { const d = new Date(ms); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; };
const addDays = (s, n) => fromUtcMs(utcMs(s) + n * DAY);
const diffDays = (a, b) => Math.round((utcMs(b) - utcMs(a)) / DAY);
const weekday = s => (new Date(utcMs(s)).getUTCDay() + 6) % 7; // 0 = lunedì
const isDateStr = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && fromUtcMs(utcMs(s)) === s;
const minD = (a, b) => (a < b ? a : b);
const maxD = (a, b) => (a > b ? a : b);
const hhmm = t => { const d = new Date(t); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const minOfDay = t => { const d = new Date(t); return d.getHours() * 60 + d.getMinutes(); };
const fmtMin = m => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const epochAt = (date, hm) => {
  const [H, M] = hm.split(':').map(Number);
  return new Date(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10), H, M, 0, 0).getTime();
};
const WD = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];
const WD_LONG = ['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica'];
const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const dNum = s => +s.slice(8, 10);
const mIdx = s => +s.slice(5, 7) - 1;
const fmtLong = s => cap(`${WD_LONG[weekday(s)]} ${dNum(s)} ${MONTHS[mIdx(s)]}`);
const fmtLongY = s => `${fmtLong(s)} ${s.slice(0, 4)}`;
const fmtShort = s => `${dNum(s)}/${mIdx(s) + 1}`;
const fmtFull = s => `${pad(dNum(s))}/${pad(mIdx(s) + 1)}/${s.slice(0, 4)}`;

/* =========================================================
   Archivio (IndexedDB)
   ========================================================= */
let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) { reject(new Error('IndexedDB non disponibile')); return; }
    const req = indexedDB.open('spunta', 1);
    req.onupgradeneeded = () => {
      const d = req.result;
      if (!d.objectStoreNames.contains('days')) d.createObjectStore('days', { keyPath: 'date' });
      if (!d.objectStoreNames.contains('events')) d.createObjectStore('events', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('meta')) d.createObjectStore('meta', { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('archivio bloccato da un\'altra finestra'));
  });
}

function txDone(t) {
  return new Promise((resolve, reject) => {
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error || new Error('transazione annullata'));
  });
}
function dbGetAll(store) {
  return new Promise((resolve, reject) => {
    const r = db.transaction(store, 'readonly').objectStore(store).getAll();
    r.onsuccess = () => resolve(r.result || []);
    r.onerror = () => reject(r.error);
  });
}
function dbPut(store, val) { const t = db.transaction(store, 'readwrite'); t.objectStore(store).put(val); return txDone(t); }
function dbDelete(store, key) { const t = db.transaction(store, 'readwrite'); t.objectStore(store).delete(key); return txDone(t); }
function dbBulk(ops) {
  if (!ops.length) return Promise.resolve();
  const t = db.transaction([...new Set(ops.map(o => o.store))], 'readwrite');
  for (const o of ops) {
    const s = t.objectStore(o.store);
    if (o.type === 'put') s.put(o.val); else s.delete(o.key);
  }
  return txDone(t);
}

/* =========================================================
   Stato
   ========================================================= */
const state = {
  days: new Map(),   // 'AAAA-MM-GG' -> { date, items: { key: { t, edited } }, note }
  events: [],        // { id, date, label } in ordine di data
  meta: {},          // startDate, lastExport
  today: todayStr(),
  view: 'oggi',
  histMode: 'elenco',
  histLimit: 60,
  calMonth: null,
  statsInd: 'all',
  inclToday: true,
  baEvent: null,
  baWin: '14',
};
const PREF_KEYS = ['histMode', 'statsInd', 'inclToday', 'baWin'];

function loadPrefs() {
  try {
    const p = JSON.parse(localStorage.getItem('spunta-prefs') || '{}');
    for (const k of PREF_KEYS) if (k in p) state[k] = p[k];
  } catch (e) { /* preferenze non disponibili: si usano quelle predefinite */ }
  if (!['elenco', 'calendario'].includes(state.histMode)) state.histMode = 'elenco';
  if (state.statsInd !== 'all' && !IND[state.statsInd]) state.statsInd = 'all';
  if (!['14', '30', 'all'].includes(String(state.baWin))) state.baWin = '14';
  state.baWin = String(state.baWin);
  state.inclToday = state.inclToday !== false;
}
function savePrefs() {
  try { localStorage.setItem('spunta-prefs', JSON.stringify(Object.fromEntries(PREF_KEYS.map(k => [k, state[k]])))); } catch (e) { /* ignora */ }
}

async function loadAll() {
  const [days, events, meta] = await Promise.all([dbGetAll('days'), dbGetAll('events'), dbGetAll('meta')]);
  state.days = new Map();
  for (const d of days) if (d && isDateStr(d.date)) state.days.set(d.date, { date: d.date, items: d.items || {}, note: d.note || '' });
  state.events = events.filter(e => e && isDateStr(e.date)).map(e => ({ id: e.id, date: e.date, label: String(e.label || '') }));
  sortEvents();
  state.meta = {};
  for (const m of meta) if (m && m.key) state.meta[m.key] = m.value;
}

const startDate = () => state.meta.startDate;
const itemOf = (date, key) => { const r = state.days.get(date); return r && r.items[key] ? r.items[key] : null; };
const isDone = (date, key) => !!itemOf(date, key);
const doneCount = date => { const r = state.days.get(date); if (!r) return 0; let n = 0; for (const k of KEYS) if (r.items[k]) n++; return n; };
const hasNote = date => { const r = state.days.get(date); return !!(r && r.note && r.note.trim()); };
const eventsOn = date => state.events.filter(e => e.date === date);
const earliestData = () => { let m = null; for (const d of state.days.keys()) if (!m || d < m) m = d; return m; };
const sortEvents = () => state.events.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.label.localeCompare(b.label)));
const newId = () => 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const copyDay = date => { const r = state.days.get(date); return { date, items: r ? { ...r.items } : {}, note: r ? r.note || '' : '' }; };
const isEmptyDay = r => Object.keys(r.items).length === 0 && !(r.note && r.note.trim());

async function onSaveError(err) {
  console.error(err);
  toast('Errore: dati non salvati');
  try { await loadAll(); } catch (e) { console.error(e); }
  renderAll();
}

/* Lo stato in memoria si aggiorna subito (tocchi veloci restano coerenti), poi si scrive su disco. */
async function saveDay(rec) {
  const empty = isEmptyDay(rec);
  if (empty) state.days.delete(rec.date); else state.days.set(rec.date, rec);
  const lower = !empty && rec.date < startDate();
  if (lower) state.meta.startDate = rec.date;
  try {
    if (empty) await dbDelete('days', rec.date); else await dbPut('days', rec);
    if (lower) await dbPut('meta', { key: 'startDate', value: rec.date });
    return true;
  } catch (err) { await onSaveError(err); return false; }
}
async function setMeta(key, value) {
  state.meta[key] = value;
  try { await dbPut('meta', { key, value }); return true; } catch (err) { await onSaveError(err); return false; }
}
/* Ritorna true (fatto), false (tolto) o null (errore). */
async function toggleItem(date, key) {
  const rec = copyDay(date);
  if (rec.items[key]) delete rec.items[key];
  else rec.items[key] = date === todayStr() ? { t: Date.now(), edited: false } : { t: null, edited: true };
  const ok = await saveDay(rec);
  return ok ? !!rec.items[key] : null;
}
async function setItemTime(date, key, hm) {
  const rec = copyDay(date);
  if (!rec.items[key]) return false;
  rec.items[key] = { t: hm ? epochAt(date, hm) : null, edited: true };
  return saveDay(rec);
}
async function setNote(date, text) { const rec = copyDay(date); rec.note = text; return saveDay(rec); }
async function addEvent(date, label) {
  const ev = { id: newId(), date, label };
  state.events.push(ev); sortEvents();
  try { await dbPut('events', ev); return true; } catch (err) { await onSaveError(err); return false; }
}
async function deleteEvent(id) {
  state.events = state.events.filter(e => e.id !== id);
  try { await dbDelete('events', id); return true; } catch (err) { await onSaveError(err); return false; }
}

/* =========================================================
   Avvisi
   ========================================================= */
let toastTimer = 0;
function toast(msg, ms = 2000) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}
const haptic = () => { try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) { /* niente */ } };

/* =========================================================
   Navigazione tra le sezioni
   ========================================================= */
const VIEWS = { oggi: renderOggi, storico: renderStorico, statistiche: renderStats, dati: renderDati };

function show(view) {
  hideTip();
  state.view = view;
  for (const s of $$('.view')) s.hidden = s.dataset.view !== view;
  for (const b of $$('.tab')) {
    if (b.dataset.tab === view) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  }
  VIEWS[view]();
  window.scrollTo(0, 0);
  if (location.hash !== '#' + view) history.replaceState(null, '', '#' + view);
}
function renderAll() {
  const y = window.scrollY;
  VIEWS[state.view]();
  window.scrollTo(0, y);
}
function checkToday() {
  const t = todayStr();
  if (t !== state.today) { state.today = t; renderAll(); }
}

/* =========================================================
   OGGI
   ========================================================= */
function renderOggi() {
  const d = state.today;
  const rec = state.days.get(d);
  const y = addDays(d, -1);
  $('#view-oggi').innerHTML = `
    <header class="v-head">
      <div class="v-kicker">Oggi</div>
      <h1 class="v-title">${esc(fmtLong(d))}</h1>
    </header>
    <div class="actions" role="group" aria-label="Azioni di oggi">
      ${INDICATORS.map(i => `<button type="button" class="act" data-key="${i.key}" aria-pressed="${!!(rec && rec.items[i.key])}" aria-label="${esc(i.name)}">${svg(i.icon)}<span class="badge">${svg(P.check)}</span></button>`).join('')}
    </div>
    <button type="button" class="note-card" data-open-day="${d}">${svg(P.note)}${hasNote(d)
      ? `<span class="note-prev">${esc(rec.note)}</span>`
      : '<span class="muted">Aggiungi una nota per oggi</span>'}</button>
    <button type="button" class="link-row" data-open-day="${y}"><span>Ieri <span class="muted">· ${doneCount(y)} su ${NIND}</span></span>${svg(P.chevR)}</button>`;
}

function actInfo(key) {
  const it = itemOf(state.today, key);
  toast(`${IND[key].name} · ${it ? (it.t != null ? 'fatto alle ' + hhmm(it.t) : 'fatto') : 'non ancora'}`);
}

async function tapAct(key, btn) {
  const t = todayStr();
  if (t !== state.today) { state.today = t; renderOggi(); btn = null; }
  const willBeDone = !isDone(state.today, key);
  const b = btn && btn.isConnected ? btn : $(`#view-oggi .act[data-key="${key}"]`);
  if (b) b.setAttribute('aria-pressed', String(willBeDone));
  const done = await toggleItem(state.today, key);
  if (done === null) return;
  if (done) {
    haptic();
    const it = itemOf(state.today, key);
    toast(`${IND[key].name} · ${it && it.t != null ? hhmm(it.t) : 'fatto'}`);
  } else {
    toast(`${IND[key].name} · annullato`);
  }
}

/* =========================================================
   STORICO
   ========================================================= */
function renderStorico() {
  const m = state.histMode;
  $('#view-storico').innerHTML = `
    <header class="v-head"><h1 class="v-title">Storico</h1></header>
    <div class="seg" role="group" aria-label="Tipo di vista">
      <button type="button" data-hmode="elenco" aria-pressed="${m === 'elenco'}">Elenco</button>
      <button type="button" data-hmode="calendario" aria-pressed="${m === 'calendario'}">Calendario</button>
    </div>
    ${m === 'elenco' ? histList() : histCal()}`;
}

function dayAria(d) {
  return `${fmtLongY(d)}: ${doneCount(d)} su ${NIND}${hasNote(d) ? ', con nota' : ''}${eventsOn(d).length ? ', con evento' : ''}`;
}

function histList() {
  const today = state.today;
  const first = minD(startDate(), earliestData() || today);
  const total = diffDays(first, today) + 1;
  const n = Math.min(total, state.histLimit);
  let html = '';
  let lastMonth = '';
  for (let i = 0; i < n; i++) {
    const d = addDays(today, -i);
    if (d.slice(0, 7) !== lastMonth) {
      lastMonth = d.slice(0, 7);
      html += `<li class="sep">${cap(MONTHS[mIdx(d)])} ${d.slice(0, 4)}</li>`;
    }
    const rec = state.days.get(d);
    const ev = eventsOn(d).length > 0;
    html += `<li><button type="button" class="day-row${d === today ? ' is-today' : ''}" data-open-day="${d}" aria-label="${esc(dayAria(d))}">
      <span class="d">${dNum(d)}<small>${d === today ? 'oggi' : WD[weekday(d)]}</small></span>
      <span class="minis">${INDICATORS.map(ind => `<span class="mini${rec && rec.items[ind.key] ? ' on' : ''}">${svg(ind.icon)}</span>`).join('')}</span>
      <span class="cnt">${ev ? svg(P.flag) : ''}${hasNote(d) ? svg(P.note) : ''}${doneCount(d)}/${NIND}</span>
    </button></li>`;
  }
  return `<ul class="days">${html}</ul>
    ${n < total ? '<button type="button" class="btn more" data-more>Mostra altri giorni</button>' : ''}
    <p class="hint">Tocca un giorno per modificarlo.</p>`;
}

function histCal() {
  const today = state.today;
  const ym = state.calMonth || today.slice(0, 7);
  const y = +ym.slice(0, 4);
  const m = +ym.slice(5, 7);
  const first = `${ym}-01`;
  const dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
  let cells = WD.map(w => `<div class="wd">${w}</div>`).join('');
  for (let i = 0; i < weekday(first); i++) cells += '<div class="cell pad" aria-hidden="true"></div>';
  for (let dd = 1; dd <= dim; dd++) {
    const d = `${ym}-${pad(dd)}`;
    const future = d > today;
    const note = hasNote(d);
    const ev = eventsOn(d).length > 0;
    const cls = 'cell' + (d === today ? ' today' : '') + (!future && d < startDate() ? ' before' : '');
    cells += `<button type="button" class="${cls}" data-open-day="${d}"${future ? ' disabled' : ''} aria-label="${esc(future ? fmtLongY(d) : dayAria(d))}">`
      + `<span class="ring" style="--p:${(doneCount(d) / NIND).toFixed(4)}"><span>${dd}</span></span>`
      + (note || ev ? `<span class="marks">${note ? '<i class="m-note"></i>' : ''}${ev ? '<i class="m-ev"></i>' : ''}</span>` : '')
      + '</button>';
  }
  const isCurrent = ym >= today.slice(0, 7);
  return `
    <div class="cal-head">
      <button type="button" class="icon-btn" data-cal="-1" aria-label="Mese precedente">${svg(P.chevL)}</button>
      <h2>${cap(MONTHS[m - 1])} ${y}</h2>
      <button type="button" class="icon-btn" data-cal="1" aria-label="Mese successivo"${isCurrent ? ' disabled' : ''}>${svg(P.chevR)}</button>
    </div>
    <div class="cal">${cells}</div>
    <div class="legend"><span><i class="m-ring"></i>azioni fatte</span><span><i></i>nota</span><span><i class="m-ev"></i>evento</span></div>
    ${monthSummary(ym)}`;
}

function monthSummary(ym) {
  const last = fromUtcMs(Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7), 0));
  const from = maxD(`${ym}-01`, startDate());
  const to = minD(last, state.today);
  if (to < from) return '';
  const n = diffDays(from, to) + 1;
  return `<section class="card">
    <h2>${cap(MONTHS[+ym.slice(5, 7) - 1])} in breve</h2>
    <p class="sub">Giorni fatti su ${plural(n, 'giorno', 'giorni')} (dal ${fmtShort(from)} al ${fmtShort(to)}).</p>
    <div class="msum">${INDICATORS.map(i => {
      const r = rate([i.key], from, to);
      return `<div title="${esc(i.name)}" aria-label="${esc(i.name)}: ${pct(r.pct)}">${svg(i.icon)}<span>${pct(r.pct)} <small>${r.done}/${r.days}</small></span></div>`;
    }).join('')}</div>
  </section>`;
}

/* ---------- foglio: modifica di un giorno ---------- */
let sheetKind = null;
let sheetDate = null;
let confirmResolve = null;

function openSheet(kind, html) {
  const w = $('#sheet');
  const s = $('.sheet', w);
  sheetKind = kind;
  s.innerHTML = html;
  s.scrollTop = 0;
  w.hidden = false;
  document.body.classList.add('noscroll');
  void s.offsetHeight; // fa partire l'animazione
  w.classList.add('open');
}
function closeSheet() {
  if (!sheetKind) return;
  flushNote();
  const kind = sheetKind;
  sheetKind = null;
  sheetDate = null;
  const w = $('#sheet');
  w.classList.remove('open');
  document.body.classList.remove('noscroll');
  setTimeout(() => { if (!sheetKind) { w.hidden = true; $('.sheet', w).innerHTML = ''; } }, 280);
  if (confirmResolve) { const r = confirmResolve; confirmResolve = null; r(false); }
  if (kind === 'day') renderAll();
}
function confirmSheet({ title, body, ok = 'Conferma', danger = false }) {
  return new Promise(resolve => {
    if (sheetKind) closeSheet();
    confirmResolve = resolve;
    openSheet('confirm', `
      <div class="grabber" aria-hidden="true"></div>
      <div class="sheet-head"><h2 id="sheet-title">${esc(title)}</h2></div>
      <div class="confirm-body">${body}</div>
      <div class="btn-row end">
        <button type="button" class="btn" data-confirm="0">Annulla</button>
        <button type="button" class="btn ${danger ? 'danger' : 'primary'}" data-confirm="1">${esc(ok)}</button>
      </div>`);
  });
}

function openDay(date) {
  if (!isDateStr(date) || date > state.today) return;
  openSheet('day', daySheetHtml(date));
  sheetDate = date;
}
function daySheetHtml(date) {
  const rec = state.days.get(date);
  const kicker = date === state.today ? 'Oggi' : date < startDate() ? 'Prima della data di inizio' : 'Modifica giorno';
  return `
    <div class="grabber" aria-hidden="true"></div>
    <div class="sheet-head">
      <div><div class="v-kicker">${kicker}</div><h2 id="sheet-title">${esc(fmtLongY(date))}</h2></div>
      <button type="button" class="icon-btn" data-close aria-label="Chiudi">${svg(P.close)}</button>
    </div>
    <div class="items">${INDICATORS.map(i => itemRowHtml(date, i)).join('')}</div>
    <label class="field-label" for="day-note">Nota</label>
    <textarea id="day-note" rows="4" placeholder="Com'è andata, cosa è successo…">${esc(rec ? rec.note : '')}</textarea>
    <div class="save-state" id="note-state" aria-live="polite"></div>
    <div class="field-label">Eventi</div>
    <div class="ev-chips" id="day-events">${dayEventsHtml(date)}</div>
    <form class="ev-add" data-evform autocomplete="off">
      <input type="text" name="label" maxlength="80" placeholder="Segna un evento (es. cambio terapia)" aria-label="Nuovo evento">
      <button type="submit" class="btn">Aggiungi</button>
    </form>
    <p class="hint">Gli eventi servono per il confronto prima/dopo nelle statistiche.</p>`;
}
function itemRowHtml(date, ind) {
  const it = itemOf(date, ind.key);
  const meta = it
    ? `<input type="time" class="time" value="${it.t != null ? hhmm(it.t) : ''}" aria-label="Ora: ${esc(ind.name)}">${it.edited ? '<span class="tag">modificato</span>' : ''}`
    : '<span>non fatto</span>';
  return `<div class="item-row${it ? ' on' : ''}" data-key="${ind.key}">
    <span class="ic">${svg(ind.icon)}</span>
    <div><div class="nm">${esc(ind.name)}</div><div class="meta">${meta}</div></div>
    <input type="checkbox" class="switch" aria-label="${esc(ind.name)}"${it ? ' checked' : ''}>
  </div>`;
}
function dayEventsHtml(date) {
  const evs = eventsOn(date);
  if (!evs.length) return '<span class="muted small">Nessun evento in questo giorno.</span>';
  return evs.map(e => `<span class="ev-chip">${svg(P.flag)}${esc(e.label)}<button type="button" data-del-ev="${esc(e.id)}" aria-label="Elimina evento: ${esc(e.label)}">${svg(P.close)}</button></span>`).join('');
}
function refreshDayEvents() {
  const el = $('#day-events');
  if (el && sheetDate) el.innerHTML = dayEventsHtml(sheetDate);
}

/* Nota: salvataggio automatico mentre scrivi */
let noteTimer = 0;
let notePending = null;
function scheduleNote(date, text) {
  notePending = { date, text };
  clearTimeout(noteTimer);
  noteTimer = setTimeout(flushNote, 500);
  setNoteState('');
}
async function flushNote() {
  clearTimeout(noteTimer);
  const p = notePending;
  notePending = null;
  if (!p) return;
  const ok = await setNote(p.date, p.text);
  setNoteState(ok ? 'Nota salvata' : 'Errore: nota non salvata');
}
function setNoteState(s) { const el = $('#note-state'); if (el) el.textContent = s; }

/* =========================================================
   STATISTICHE
   ========================================================= */
const statsEnd = () => (state.inclToday ? state.today : addDays(state.today, -1));

function rate(keys, from, to) {
  if (!from || !to || to < from) return { done: 0, total: 0, days: 0, pct: null };
  let done = 0;
  let days = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) {
    days++;
    const r = state.days.get(d);
    if (r) for (const k of keys) if (r.items[k]) done++;
  }
  const total = days * keys.length;
  return { done, total, days, pct: total ? done / total : null };
}
function windowRate(keys, n) {
  const end = statsEnd();
  return rate(keys, maxD(startDate(), addDays(end, -(n - 1))), end);
}
function streak(key) {
  const s = startDate();
  const end = statsEnd();
  let best = 0;
  let run = 0;
  for (let d = s; d <= end; d = addDays(d, 1)) {
    if (isDone(d, key)) { run++; if (run > best) best = run; } else run = 0;
  }
  let cur = 0;
  let d = state.inclToday && isDone(state.today, key) ? state.today : addDays(state.today, -1);
  while (d >= s && isDone(d, key)) { cur++; d = addDays(d, -1); }
  return { cur, best };
}
function weeklySeries(keys) {
  const s = startDate();
  const end = statsEnd();
  const out = [];
  if (end < s) return out;
  for (let ws = addDays(s, -weekday(s)); ws <= end; ws = addDays(ws, 7)) {
    out.push({ ws, ...rate(keys, maxD(ws, s), minD(addDays(ws, 6), end)) });
  }
  return out;
}
function weekdaySeries(keys) {
  const acc = WD.map(() => ({ done: 0, total: 0, days: 0 }));
  const end = statsEnd();
  for (let d = startDate(); d <= end; d = addDays(d, 1)) {
    const a = acc[weekday(d)];
    a.days++;
    a.total += keys.length;
    const r = state.days.get(d);
    if (r) for (const k of keys) if (r.items[k]) a.done++;
  }
  return acc.map(a => ({ ...a, pct: a.total ? a.done / a.total : null }));
}
function timesOf(keys) {
  const s = startDate();
  const end = statsEnd();
  const out = [];
  for (const [d, r] of state.days) {
    if (d < s || d > end) continue;
    for (const k of keys) { const it = r.items[k]; if (it && it.t != null) out.push(it.t); }
  }
  return out;
}
function hourSeries(keys) {
  const counts = new Array(24).fill(0);
  const ts = timesOf(keys);
  for (const t of ts) counts[new Date(t).getHours()]++;
  return { counts, n: ts.length };
}
function medianTime(key) {
  const arr = timesOf([key]).map(minOfDay).sort((a, b) => a - b);
  if (!arr.length) return null;
  const mid = arr.length >> 1;
  return { m: arr.length % 2 ? arr[mid] : Math.round((arr[mid - 1] + arr[mid]) / 2), n: arr.length };
}
function beforeAfter(ev, win, keys) {
  const s = startDate();
  const end = statsEnd();
  const E = ev.date;
  const bFrom = win === 'all' ? s : maxD(s, addDays(E, -Number(win)));
  const bTo = addDays(E, -1);
  const aFrom = maxD(E, s);
  const aTo = win === 'all' ? end : minD(end, addDays(E, Number(win) - 1));
  return { b: rate(keys, bFrom, bTo), a: rate(keys, aFrom, aTo), bFrom, bTo, aFrom, aTo };
}
const niceMax = m => {
  for (const s of [2, 4, 6, 8, 10, 12, 16, 20, 30, 40, 50, 60, 80, 100]) if (m <= s) return s;
  return Math.ceil(m / 50) * 50;
};
const indCell = i => `<span class="ind">${svg(i.icon)}<span>${esc(i.short)}</span></span>`;
const ALL_CELL = '<span class="ind">Tutte insieme</span>';
const deltaTxt = (b, a) => {
  if (a.pct == null || b.pct == null) return '<span class="na">—</span>';
  const v = Math.round(a.pct * 100) - Math.round(b.pct * 100);
  return v > 0 ? `+${v}` : v < 0 ? `−${-v}` : '0';
};
const valuesTable = (head, rows) => `<details class="values"><summary>Valori</summary><table class="tbl"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></details>`;

let chartData = {};

function renderStats() {
  const el = $('#view-statistiche');
  const s = startDate();
  const end = statsEnd();
  const n = end >= s ? diffDays(s, end) + 1 : 0;
  let html = `
    <header class="v-head"><h1 class="v-title">Statistiche</h1>
      <p class="v-sub">Dal ${fmtFull(s)} · ${plural(n, 'giorno', 'giorni')}</p></header>
    <section class="card">
      <label class="toggle-row"><span class="lbl">Includi oggi<small>Oggi non è ancora finito: se lo escludi, i conti si fermano a ieri.</small></span>
        <input type="checkbox" class="switch" data-incl${state.inclToday ? ' checked' : ''}></label>
    </section>`;
  chartData = {};
  if (!n) {
    el.innerHTML = html + '<section class="card"><p class="chart-empty">Ancora nessun giorno da contare. Includi oggi, oppure torna domani.</p></section>';
    return;
  }

  /* 1. percentuali */
  const pctRow = (label, keys, total) => {
    const cells = [windowRate(keys, 7), windowRate(keys, 30), rate(keys, s, end)]
      .map(r => `<td>${pct(r.pct)}<small>${r.done}/${keys.length === 1 ? r.days : r.total}</small></td>`).join('');
    return `<tr${total ? ' class="total"' : ''}><td>${label}</td>${cells}</tr>`;
  };
  html += `<section class="card"><h2>Giorni in cui l'hai fatto</h2>
    <p class="sub">I giorni senza dati contano come non fatti.</p>
    <table class="tbl"><thead><tr><th>Azione</th><th>7 gg</th><th>30 gg</th><th>Tutto</th></tr></thead><tbody>
      ${INDICATORS.map(i => pctRow(indCell(i), [i.key], false)).join('')}
      ${pctRow(ALL_CELL, KEYS, true)}
    </tbody></table></section>`;

  /* 2. serie */
  html += `<section class="card"><h2>Giorni di fila</h2>
    <p class="sub">La serie in corso conta da ieri finché oggi non l'hai ancora fatto.</p>
    <table class="tbl"><thead><tr><th>Azione</th><th>In corso</th><th>Record</th></tr></thead><tbody>
      ${INDICATORS.map(i => { const st = streak(i.key); return `<tr><td>${indCell(i)}</td><td>${st.cur}</td><td>${st.best}</td></tr>`; }).join('')}
    </tbody></table></section>`;

  /* 3. andamento */
  const sel = state.statsInd;
  const keys = sel === 'all' ? KEYS : [sel];
  const selName = sel === 'all' ? 'Tutte le azioni insieme' : IND[sel].name;
  const wk = weeklySeries(keys);
  const wd = weekdaySeries(keys);
  const hr = hourSeries(keys);
  const pctTicks = [{ v: 0, label: '0%' }, { v: 0.5, label: '50%' }, { v: 1, label: '100%' }];
  chartData.weekly = {
    aria: `Percentuale per settimana — ${selName}`, yMax: 1, yTicks: pctTicks, minBand: 22, labelW: 30, scrollEnd: true,
    bars: wk.map((w, i) => ({
      v: w.pct, axisLabel: fmtShort(w.ws),
      valueLabel: i === wk.length - 1 ? pct(w.pct) : '',
      tip: `Settimana dal ${fmtShort(w.ws)}: ${pct(w.pct)} · ${plural(w.days, 'giorno', 'giorni')}`,
    })),
  };
  chartData.weekday = {
    aria: `Percentuale per giorno della settimana — ${selName}`, yMax: 1, yTicks: pctTicks, minBand: 14, labelW: 20,
    bars: wd.map((w, i) => ({ v: w.pct, axisLabel: WD[i], tip: `${cap(WD_LONG[i])}: ${pct(w.pct)} · ${plural(w.days, 'giorno', 'giorni')}` })),
  };
  const maxC = Math.max(0, ...hr.counts);
  const yMaxH = niceMax(Math.max(1, maxC));
  const peak = hr.counts.indexOf(maxC);
  chartData.hours = hr.n ? {
    aria: `Pulsanti premuti per ora del giorno — ${selName}`, yMax: yMaxH,
    yTicks: [{ v: 0, label: '0' }, { v: yMaxH / 2, label: String(yMaxH / 2) }, { v: yMaxH, label: String(yMaxH) }],
    minBand: 10, labelEvery: 3,
    bars: hr.counts.map((c, h) => ({
      v: c, axisLabel: String(h), valueLabel: h === peak && c > 0 ? String(c) : '',
      tip: `${pad(h)}:00–${pad(h)}:59 · ${plural(c, 'volta', 'volte')}`,
    })),
  } : null;

  html += `<section class="card"><h2>Andamento</h2>
    <div class="chips" role="group" aria-label="Azione da mostrare">
      <button type="button" class="chip" data-ind="all" aria-pressed="${sel === 'all'}">Tutte</button>
      ${INDICATORS.map(i => `<button type="button" class="chip ico" data-ind="${i.key}" aria-pressed="${sel === i.key}" aria-label="${esc(i.name)}" title="${esc(i.name)}">${svg(i.icon)}</button>`).join('')}
    </div>
    <p class="sel-name">${esc(selName)}</p>
    <h3>Per settimana</h3>
    <div class="chart" data-chart="weekly"></div>
    ${valuesTable(['Settimana dal', '%', 'Giorni'], [...wk].reverse().map(w => [fmtFull(w.ws), pct(w.pct), w.days]))}
    <h3>Per giorno della settimana</h3>
    <div class="chart" data-chart="weekday"></div>
    ${valuesTable(['Giorno', '%', 'Giorni'], wd.map((w, i) => [cap(WD_LONG[i]), pct(w.pct), w.days]))}
    <h3>Per ora del giorno</h3>
    <p class="sub">Quando hai premuto i pulsanti (solo gli orari registrati).</p>
    ${hr.n ? `<div class="chart" data-chart="hours"></div>
      ${valuesTable(['Ora', 'Volte'], hr.counts.map((c, h) => [`${pad(h)}:00`, c]).filter(r => r[1] > 0))}`
      : '<p class="chart-empty">Nessun orario registrato.</p>'}
  </section>`;

  /* 4. orario tipico */
  html += `<section class="card"><h2>Orario tipico</h2>
    <p class="sub">Orario mediano in cui hai premuto il pulsante.</p>
    <table class="tbl"><thead><tr><th>Azione</th><th>Mediana</th><th>Volte</th></tr></thead><tbody>
      ${INDICATORS.map(i => { const mt = medianTime(i.key); return `<tr><td>${indCell(i)}</td><td>${mt ? fmtMin(mt.m) : '<span class="na">—</span>'}</td><td>${mt ? mt.n : 0}</td></tr>`; }).join('')}
    </tbody></table></section>`;

  /* 5. prima / dopo */
  html += '<section class="card"><h2>Prima e dopo un evento</h2>';
  if (!state.events.length) {
    html += `<p class="sub">Non hai ancora segnato eventi (per esempio un cambio di terapia). Puoi aggiungerli in Dati, oppure dal singolo giorno nello Storico.</p>
      <button type="button" class="btn" data-goto="dati">Vai a Dati</button>`;
  } else {
    let ev = state.events.find(e => e.id === state.baEvent);
    if (!ev) {
      const past = state.events.filter(e => e.date <= end);
      ev = past.length ? past[past.length - 1] : state.events[state.events.length - 1];
      state.baEvent = ev.id;
    }
    const win = state.baWin;
    const ba = keysBA => beforeAfter(ev, win, keysBA);
    const r0 = ba(KEYS);
    html += `<div class="ba-controls">
        <select data-ba-ev aria-label="Evento">${[...state.events].reverse().map(e => `<option value="${esc(e.id)}"${e.id === ev.id ? ' selected' : ''}>${fmtFull(e.date)} · ${esc(e.label)}</option>`).join('')}</select>
        <div class="seg" role="group" aria-label="Giorni da confrontare">
          ${[['14', '14 gg'], ['30', '30 gg'], ['all', 'Tutto']].map(([v, l]) => `<button type="button" data-ba-win="${v}" aria-pressed="${win === v}">${l}</button>`).join('')}
        </div>
      </div>
      <table class="tbl"><thead><tr><th>Azione</th><th>Prima</th><th>Dopo</th><th>Δ punti</th></tr></thead><tbody>
        ${INDICATORS.map(i => { const r = ba([i.key]); return `<tr><td>${indCell(i)}</td><td>${pct(r.b.pct)}</td><td>${pct(r.a.pct)}</td><td class="delta">${deltaTxt(r.b, r.a)}</td></tr>`; }).join('')}
        <tr class="total"><td>${ALL_CELL}</td><td>${pct(r0.b.pct)}</td><td>${pct(r0.a.pct)}</td><td class="delta">${deltaTxt(r0.b, r0.a)}</td></tr>
      </tbody></table>
      <p class="ba-range">Prima: ${r0.b.days ? `dal ${fmtShort(r0.bFrom)} al ${fmtShort(r0.bTo)} (${plural(r0.b.days, 'giorno', 'giorni')})` : 'nessun giorno'}
        · Dopo: ${r0.a.days ? `dal ${fmtShort(r0.aFrom)} al ${fmtShort(r0.aTo)} (${plural(r0.a.days, 'giorno', 'giorni')})` : (ev.date > end ? 'l\'evento non è ancora arrivato' : 'nessun giorno')}</p>`;
  }
  html += '</section>';

  el.innerHTML = html;
  drawCharts();
}

/* ---------- grafici a colonne (SVG, senza librerie) ---------- */
function colPath(x, y, w, h, r) {
  r = Math.min(r, w / 2, h);
  const f = v => v.toFixed(2);
  return `M${f(x)},${f(y + h)}V${f(y + r)}A${f(r)},${f(r)} 0 0 1 ${f(x + r)},${f(y)}H${f(x + w - r)}A${f(r)},${f(r)} 0 0 1 ${f(x + w)},${f(y + r)}V${f(y + h)}Z`;
}
function barChartSvg(W0, spec) {
  const H = 156;
  const mL = 36, mR = 6, mT = 18, mB = 22;
  const n = spec.bars.length;
  let W = Math.max(200, Math.floor(W0));
  if ((W - mL - mR) / n < spec.minBand) W = Math.ceil(n * spec.minBand + mL + mR);
  const pw = W - mL - mR;
  const ph = H - mT - mB;
  const band = pw / n;
  const bw = Math.max(3, Math.min(24, band * 0.62));
  const yOf = v => mT + ph - (v / spec.yMax) * ph;
  const step = spec.labelEvery ? 0 : Math.max(1, Math.ceil(spec.labelW / band));
  let grid = '';
  for (const t of spec.yTicks) {
    const yy = Math.round(yOf(t.v)) + 0.5;
    grid += `<line class="${t.v === 0 ? 'ch-base' : 'ch-grid'}" x1="${mL}" x2="${W - mR}" y1="${yy}" y2="${yy}"/>`
      + `<text class="ch-axis" x="${mL - 6}" y="${yy + 3.5}" text-anchor="end">${esc(t.label)}</text>`;
  }
  let bars = '';
  let labels = '';
  let hits = '';
  spec.bars.forEach((b, i) => {
    const cx = mL + band * (i + 0.5);
    if (b.v != null && b.v > 0) {
      const top = yOf(b.v);
      bars += `<path class="ch-bar" data-i="${i}" d="${colPath(cx - bw / 2, top, bw, mT + ph - top, 4)}"/>`;
    }
    const showLabel = spec.labelEvery ? i % spec.labelEvery === 0 : (n - 1 - i) % step === 0;
    if (showLabel && b.axisLabel) labels += `<text class="ch-axis" x="${cx.toFixed(2)}" y="${H - 6}" text-anchor="middle">${esc(b.axisLabel)}</text>`;
    if (b.valueLabel && b.v != null) labels += `<text class="ch-val" x="${cx.toFixed(2)}" y="${(yOf(b.v) - 6).toFixed(2)}" text-anchor="middle">${esc(b.valueLabel)}</text>`;
    hits += `<rect class="ch-hit" data-i="${i}" x="${(mL + band * i).toFixed(2)}" y="0" width="${band.toFixed(2)}" height="${H}"/>`;
  });
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(spec.aria)}">${grid}${bars}${labels}${hits}</svg>`;
}
function drawCharts() {
  for (const el of $$('#view-statistiche .chart')) {
    const spec = chartData[el.dataset.chart];
    if (!spec) continue;
    el.classList.remove('hovering');
    el.innerHTML = barChartSvg(el.clientWidth || 320, spec);
    if (spec.scrollEnd) el.scrollLeft = el.scrollWidth;
  }
}

/* suggerimento al tocco/passaggio su una colonna */
let tipTimer = 0;
function showTipFor(hit) {
  const chart = hit.closest('.chart');
  const spec = chart && chartData[chart.dataset.chart];
  if (!spec) return;
  const i = +hit.dataset.i;
  const b = spec.bars[i];
  chart.classList.add('hovering');
  for (const p of chart.querySelectorAll('.ch-bar')) p.classList.toggle('active', +p.dataset.i === i);
  const bar = chart.querySelector(`.ch-bar[data-i="${i}"]`);
  const base = chart.querySelector('.ch-base');
  const hr = hit.getBoundingClientRect();
  const top = bar ? bar.getBoundingClientRect().top : base ? base.getBoundingClientRect().top : hr.top + hr.height / 2;
  const tip = $('#tip');
  tip.textContent = b.tip;
  tip.hidden = false;
  const half = tip.offsetWidth / 2;
  const x = Math.max(8 + half, Math.min(window.innerWidth - 8 - half, hr.left + hr.width / 2));
  tip.style.left = `${x}px`;
  tip.style.top = `${Math.max(top, tip.offsetHeight + 16)}px`;
  clearTimeout(tipTimer);
  tipTimer = setTimeout(hideTip, 2600);
}
function hideTip() {
  clearTimeout(tipTimer);
  const tip = $('#tip');
  if (tip) tip.hidden = true;
  for (const c of $$('.chart.hovering')) c.classList.remove('hovering');
}

/* =========================================================
   DATI: archiviazione, export, import, eventi, data di inizio
   ========================================================= */
function fmtAgo(ms) {
  const d = diffDays(toStr(new Date(ms)), state.today);
  return d <= 0 ? 'oggi' : d === 1 ? 'ieri' : `${d} giorni fa`;
}

function renderDati() {
  const s = startDate();
  const last = state.meta.lastExport;
  const evs = [...state.events].reverse();
  $('#view-dati').innerHTML = `
    <header class="v-head"><h1 class="v-title">Dati</h1><p class="v-sub">Restano solo su questo dispositivo.</p></header>
    <section class="card">
      <h2>Archiviazione persistente</h2>
      <div class="status" id="persist-status">Controllo in corso…</div>
      <button type="button" class="btn" data-persist hidden>${svg(P.lock)}Richiedi di nuovo</button>
      <p class="hint" id="storage-usage"></p>
    </section>
    <section class="card">
      <h2>Esporta</h2>
      <p class="sub">Tutti i giorni dal ${fmtFull(minD(s, earliestData() || s))} a oggi, compresi quelli vuoti, con note ed eventi. ${last ? `Ultimo export: ${fmtAgo(last)}.` : 'Non hai ancora esportato.'}</p>
      <div class="btn-row">
        <button type="button" class="btn primary" data-export="csv">${svg(P.share)}CSV</button>
        <button type="button" class="btn" data-export="json">${svg(P.share)}JSON</button>
      </div>
    </section>
    <section class="card">
      <h2>Importa</h2>
      <p class="sub">Da un CSV o JSON di Spunta. I giorni con la stessa data vengono sostituiti da quelli del file; gli altri restano come sono. Gli eventi si aggiungono senza doppioni.</p>
      <label class="btn">${svg(P.import)}Scegli un file<input type="file" class="vh" data-import accept=".csv,.json,text/csv,application/json,text/plain"></label>
    </section>
    <section class="card">
      <h2>Eventi</h2>
      <p class="sub">Per esempio un cambio di terapia. Servono per il confronto prima/dopo nelle statistiche.</p>
      <form class="ev-form" data-evform2 autocomplete="off">
        <input type="date" name="date" value="${state.today}" required aria-label="Data dell'evento">
        <input type="text" name="label" maxlength="80" placeholder="Cosa è successo" required aria-label="Nome dell'evento">
        <button type="submit" class="btn primary">Aggiungi evento</button>
      </form>
      ${evs.length
        ? `<ul class="ev-ul">${evs.map(e => `<li><span class="ev-date">${fmtFull(e.date)}</span><span class="ev-name">${esc(e.label)}</span><button type="button" class="icon-btn sm" data-del-ev="${esc(e.id)}" aria-label="Elimina evento: ${esc(e.label)}">${svg(P.trash)}</button></li>`).join('')}</ul>`
        : '<p class="hint">Nessun evento.</p>'}
    </section>
    <section class="card">
      <h2>Data di inizio</h2>
      <p class="sub">Le statistiche partono da qui: da questa data in poi, un giorno senza dati conta come non fatto.</p>
      <input type="date" data-start value="${s}" max="${state.today}" aria-label="Data di inizio">
    </section>
    <p class="foot">Spunta ${APP_VERSION}</p>`;
  updatePersist();
}

async function updatePersist() {
  const el = $('#persist-status');
  if (!el) return;
  const sm = navigator.storage;
  if (!sm || !sm.persisted) {
    el.className = 'status warn';
    el.innerHTML = `${svg(P.alert)}<span>Questo browser non permette di chiederla. Tieni Spunta sulla schermata Home ed esporta i dati ogni tanto.</span>`;
    return;
  }
  let p = false;
  try { p = await sm.persisted(); } catch (e) { /* resta false */ }
  const el2 = $('#persist-status');
  if (!el2) return;
  el2.className = 'status ' + (p ? 'ok' : 'warn');
  el2.innerHTML = p
    ? `${svg(P.lock)}<span>Concessa: il browser non cancella questi dati da solo quando gli serve spazio.</span>`
    : `${svg(P.alert)}<span>Non concessa, per ora: se il telefono resta senza spazio il browser potrebbe cancellare i dati. Esporta ogni tanto.</span>`;
  const btn = $('[data-persist]');
  if (btn) btn.hidden = p || !sm.persist;
  if (sm.estimate) {
    try {
      const est = await sm.estimate();
      const u = $('#storage-usage');
      if (u && est && est.usage != null) u.textContent = `Spazio occupato: ${fmtBytes(est.usage)}.`;
    } catch (e) { /* niente */ }
  }
}
async function requestPersist(fromUser) {
  const sm = navigator.storage;
  if (!sm || !sm.persist) return false;
  let ok = false;
  try {
    ok = sm.persisted ? await sm.persisted() : false;
    if (!ok) ok = await sm.persist();
  } catch (e) { ok = false; }
  if (fromUser) toast(ok ? 'Archiviazione persistente concessa' : 'Il browser per ora non la concede');
  if (state.view === 'dati') updatePersist();
  return ok;
}

/* ---------- export ---------- */
const csvCell = v => { const s = String(v ?? ''); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

function buildCSV() {
  const header = ['data', ...KEYS.flatMap(k => [k, `${k}_ora`]), 'nota', 'evento'];
  const lines = [header.join(',')];
  const today = state.today;
  let from = startDate();
  let to = today;
  for (const d of state.days.keys()) { if (d < from) from = d; if (d > to) to = d; }
  const dates = [];
  for (let d = from; d <= to; d = addDays(d, 1)) dates.push(d);
  const extra = [...new Set(state.events.map(e => e.date).filter(d => d < from || d > to))];
  for (const d of [...dates, ...extra].sort()) {
    const rec = state.days.get(d);
    const future = d > today && !rec;
    const row = [d];
    for (const k of KEYS) {
      const it = rec && rec.items[k];
      row.push(future ? '' : it ? 1 : 0, it && it.t != null ? hhmm(it.t) : '');
    }
    row.push(rec ? rec.note : '', eventsOn(d).map(e => e.label).join(' | '));
    lines.push(row.map(csvCell).join(','));
  }
  return lines.join('\r\n') + '\r\n';
}
function buildJSON() {
  const giorni = [...state.days.values()].sort((a, b) => (a.date < b.date ? -1 : 1)).map(r => ({
    data: r.date,
    fatti: Object.fromEntries(Object.entries(r.items).map(([k, it]) => [k, { ora: it.t != null ? hhmm(it.t) : null, t: it.t ?? null, modificato: !!it.edited }])),
    nota: r.note || '',
  }));
  return {
    app: 'Spunta',
    formato: 1,
    versione: APP_VERSION,
    esportato: new Date().toISOString(),
    dataInizio: startDate(),
    indicatori: INDICATORS.map(i => ({ chiave: i.key, nome: i.name })),
    giorni,
    eventi: state.events.map(e => ({ id: e.id, data: e.date, nome: e.label })),
  };
}
function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}
/* Niente "await" prima di navigator.share: la condivisione deve partire dentro il tocco. */
function doExport(kind) {
  const isCsv = kind === 'csv';
  const name = `spunta-${state.today}.${isCsv ? 'csv' : 'json'}`;
  const type = isCsv ? 'text/csv' : 'application/json';
  const blob = new Blob([isCsv ? buildCSV() : JSON.stringify(buildJSON(), null, 2)], { type });
  const coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  let file = null;
  try { file = new File([blob], name, { type }); } catch (e) { file = null; }
  const done = () => { setMeta('lastExport', Date.now()).then(() => { if (state.view === 'dati') renderAll(); }); };
  if (coarse && file && navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({ files: [file], title: name })
      .then(() => { done(); toast('Esportato'); })
      .catch(err => { if (!err || err.name !== 'AbortError') { downloadBlob(blob, name); done(); } });
  } else {
    downloadBlob(blob, name);
    done();
    toast('File scaricato');
  }
}

/* ---------- import ---------- */
const TRUE_VALUES = new Set(['1', 'x', 'si', 'sì', 's', 'y', 'yes', 'true', 'vero', 'v', '✓', '✔', 'fatto']);

function normDate(v) {
  if (v == null) return null;
  const s = String(v).trim();
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  let out = null;
  if (m) out = `${m[1]}-${pad(+m[2])}-${pad(+m[3])}`;
  else if ((m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/))) out = `${m[3]}-${pad(+m[2])}-${pad(+m[1])}`;
  return out && isDateStr(out) ? out : null;
}
function normTime(v) {
  if (v == null) return null;
  const m = String(v).trim().match(/^(\d{1,2})[:.](\d{2})/);
  if (!m) return null;
  const h = +m[1];
  const mi = +m[2];
  return h < 24 && mi < 60 ? `${pad(h)}:${pad(mi)}` : null;
}
function parseCSVText(text, sep) {
  const rows = [];
  let row = [];
  let cell = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c;
    } else if (c === '"') q = true;
    else if (c === sep) { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c !== '\r') cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim() !== ''));
}
function parseCsvImport(text) {
  text = text.replace(/^﻿/, '');
  const firstLine = text.split(/\r?\n/, 1)[0] || '';
  const sep = [',', ';', '\t'].map(s => [s, firstLine.split(s).length]).sort((a, b) => b[1] - a[1])[0][0];
  const rows = parseCSVText(text, sep);
  if (!rows.length) throw new Error('file vuoto');
  const head = rows[0].map(h => h.trim().toLowerCase());
  const iDate = head.findIndex(h => h === 'data' || h === 'date');
  if (iDate < 0) throw new Error('manca la colonna "data"');
  const iNote = head.findIndex(h => h === 'nota' || h === 'note');
  const iEv = head.findIndex(h => h === 'evento' || h === 'eventi');
  const col = {};
  for (const k of KEYS) { col[k] = head.indexOf(k); col[`${k}_ora`] = head.indexOf(`${k}_ora`); }
  if (!KEYS.some(k => col[k] >= 0) && iNote < 0 && iEv < 0) throw new Error('nessuna colonna riconosciuta');
  const days = new Map();
  const events = [];
  let firstDate = null;
  for (const r of rows.slice(1)) {
    const date = normDate(r[iDate]);
    if (!date) continue;
    const items = {};
    let known = false;
    for (const k of KEYS) {
      if (col[k] < 0) continue;
      const v = String(r[col[k]] ?? '').trim().toLowerCase();
      if (v === '') continue;
      known = true;
      if (TRUE_VALUES.has(v)) {
        const tm = col[`${k}_ora`] >= 0 ? normTime(r[col[`${k}_ora`]]) : null;
        items[k] = { t: tm ? epochAt(date, tm) : null, edited: !tm };
      }
    }
    const note = iNote >= 0 ? String(r[iNote] ?? '') : '';
    if (iEv >= 0 && r[iEv]) for (const lab of String(r[iEv]).split('|').map(x => x.trim()).filter(Boolean)) events.push({ date, label: lab });
    if (!known && !note.trim()) continue; // riga di soli eventi o giorno futuro
    days.set(date, { date, items, note, empty: !Object.keys(items).length && !note.trim() });
    if (date <= state.today && (!firstDate || date < firstDate)) firstDate = date;
  }
  return { days: [...days.values()].sort((a, b) => (a.date < b.date ? -1 : 1)), events, start: firstDate };
}
function parseJsonImport(text) {
  const j = JSON.parse(text.replace(/^﻿/, ''));
  const arr = Array.isArray(j) ? j : (j && (j.giorni || j.days));
  if (!Array.isArray(arr)) throw new Error('formato non riconosciuto');
  const days = new Map();
  for (const g of arr) {
    if (!g) continue;
    const date = normDate(g.data || g.date);
    if (!date) continue;
    const src = g.fatti || g.items || {};
    const items = {};
    for (const [k, v] of Object.entries(src)) {
      if (!v) continue;
      if (typeof v === 'object') {
        let t = null;
        if (Number.isFinite(v.t)) t = v.t;
        else if (normTime(v.ora)) t = epochAt(date, normTime(v.ora));
        items[k] = { t, edited: !!(v.modificato ?? v.edited ?? (t == null)) };
      } else {
        items[k] = { t: null, edited: true };
      }
    }
    const rawNote = g.nota ?? g.note;
    const note = typeof rawNote === 'string' ? rawNote : '';
    days.set(date, { date, items, note, empty: !Object.keys(items).length && !note.trim() });
  }
  const evArr = (!Array.isArray(j) && j && (j.eventi || j.events)) || [];
  const events = evArr.map(e => ({ date: normDate(e && (e.data || e.date)), label: String((e && (e.nome || e.label)) || '').trim() }))
    .filter(e => e.date && e.label);
  const start = !Array.isArray(j) ? normDate(j.dataInizio || j.startDate) : null;
  return { days: [...days.values()].sort((a, b) => (a.date < b.date ? -1 : 1)), events, start };
}

async function importFile(file) {
  let text;
  try { text = await file.text(); } catch (e) { toast('Non riesco a leggere il file'); return; }
  let data;
  try {
    const isJson = /\.json$/i.test(file.name) || /^\s*[[{]/.test(text.replace(/^﻿/, ''));
    data = isJson ? parseJsonImport(text) : parseCsvImport(text);
  } catch (err) {
    toast(`File non riconosciuto: ${err.message || err}`, 3200);
    return;
  }
  const { days, start } = data;
  const seen = new Set(state.events.map(e => `${e.date}|${e.label}`));
  const newEvents = [];
  for (const e of data.events) {
    const k = `${e.date}|${e.label}`;
    if (!seen.has(k)) { seen.add(k); newEvents.push(e); }
  }
  if (!days.length && !newEvents.length) { toast(data.events.length ? 'Niente di nuovo nel file' : 'Nel file non ci sono dati'); return; }
  const withData = days.filter(d => !d.empty);
  const replaced = days.filter(d => state.days.has(d.date)).length;
  const range = days.length ? ` (dal ${fmtFull(days[0].date)} al ${fmtFull(days[days.length - 1].date)})` : '';
  const ok = await confirmSheet({
    title: 'Importare questo file?',
    body: `<p><b>${esc(file.name)}</b></p>
      <p>${plural(days.length, 'giorno', 'giorni')}${range}, di cui ${withData.length} con dati; ${plural(newEvents.length, 'evento nuovo', 'eventi nuovi')}.</p>
      <p>${replaced ? `${replaced === 1 ? 'Un giorno già presente verrà sostituito' : `${replaced} giorni già presenti verranno sostituiti`} da quelli del file.` : 'Nessun giorno già presente verrà toccato.'}</p>`,
    ok: 'Importa',
  });
  if (!ok) return;
  const ops = [];
  for (const d of days) {
    ops.push(d.empty ? { store: 'days', type: 'del', key: d.date } : { store: 'days', type: 'put', val: { date: d.date, items: d.items, note: d.note } });
  }
  const evAdd = newEvents.map(e => ({ id: newId(), date: e.date, label: e.label }));
  for (const ev of evAdd) ops.push({ store: 'events', type: 'put', val: ev });
  let ns = startDate();
  if (start && start < ns && start <= state.today) ns = start;
  if (withData.length && withData[0].date < ns) ns = withData[0].date;
  if (ns !== startDate()) ops.push({ store: 'meta', type: 'put', val: { key: 'startDate', value: ns } });
  try { await dbBulk(ops); } catch (err) { console.error(err); toast('Errore: import non riuscito'); return; }
  for (const d of days) {
    if (d.empty) state.days.delete(d.date);
    else state.days.set(d.date, { date: d.date, items: d.items, note: d.note });
  }
  state.events.push(...evAdd);
  sortEvents();
  state.meta.startDate = ns;
  toast(`Importati ${plural(withData.length, 'giorno', 'giorni')} e ${plural(evAdd.length, 'evento', 'eventi')}`, 2600);
  renderAll();
}

/* =========================================================
   Eventi dell'interfaccia
   ========================================================= */
function bindEvents() {
  /* sezioni */
  $('.tabbar').addEventListener('click', e => {
    const b = e.target.closest('.tab');
    if (!b) return;
    if (b.dataset.tab === state.view) {
      if (state.view === 'storico' && state.calMonth) { state.calMonth = null; renderAll(); }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else show(b.dataset.tab);
  });
  window.addEventListener('hashchange', () => {
    const v = location.hash.slice(1);
    if (VIEWS[v] && v !== state.view) show(v);
  });

  /* oggi: tocco = fatto/annulla; pressione lunga = mostra il nome senza cambiare nulla */
  const vo = $('#view-oggi');
  let lp = null;
  vo.addEventListener('pointerdown', e => {
    const b = e.target.closest('.act');
    if (!b) return;
    if (lp) clearTimeout(lp.timer);
    const st = { b, x: e.clientX, y: e.clientY, fired: false };
    st.timer = setTimeout(() => { st.fired = true; actInfo(b.dataset.key); }, 550);
    lp = st;
  });
  vo.addEventListener('pointermove', e => {
    if (lp && !lp.fired && Math.hypot(e.clientX - lp.x, e.clientY - lp.y) > 12) { clearTimeout(lp.timer); lp = null; }
  });
  vo.addEventListener('pointerup', () => { if (lp) clearTimeout(lp.timer); });
  vo.addEventListener('pointercancel', () => { if (lp) { clearTimeout(lp.timer); lp = null; } });
  vo.addEventListener('contextmenu', e => { if (e.target.closest('.act')) e.preventDefault(); });
  vo.addEventListener('click', e => {
    const b = e.target.closest('.act');
    if (b) {
      const st = lp;
      lp = null;
      if (st && st.fired && st.b === b) return;
      tapAct(b.dataset.key, b);
      return;
    }
    const o = e.target.closest('[data-open-day]');
    if (o) openDay(o.dataset.openDay);
  });

  /* storico */
  $('#view-storico').addEventListener('click', e => {
    const t = e.target;
    const hm = t.closest('[data-hmode]');
    if (hm) { state.histMode = hm.dataset.hmode; savePrefs(); renderStorico(); return; }
    if (t.closest('[data-more]')) { state.histLimit += 60; renderAll(); return; }
    const c = t.closest('[data-cal]');
    if (c) {
      const ym = state.calMonth || state.today.slice(0, 7);
      let y = +ym.slice(0, 4);
      let m = +ym.slice(5, 7) + Number(c.dataset.cal);
      if (m < 1) { m = 12; y--; }
      if (m > 12) { m = 1; y++; }
      const next = `${y}-${pad(m)}`;
      state.calMonth = next >= state.today.slice(0, 7) ? null : next;
      renderStorico();
      return;
    }
    const o = t.closest('[data-open-day]');
    if (o) openDay(o.dataset.openDay);
  });

  /* foglio */
  const sw = $('#sheet');
  sw.addEventListener('click', async e => {
    const t = e.target;
    if (t.closest('[data-close]')) { closeSheet(); return; }
    const cf = t.closest('[data-confirm]');
    if (cf) {
      const r = confirmResolve;
      confirmResolve = null;
      closeSheet();
      if (r) r(cf.dataset.confirm === '1');
      return;
    }
    const de = t.closest('[data-del-ev]');
    if (de && sheetKind === 'day') {
      if (await deleteEvent(de.dataset.delEv)) { refreshDayEvents(); toast('Evento eliminato'); }
    }
  });
  sw.addEventListener('change', async e => {
    if (sheetKind !== 'day') return;
    const row = e.target.closest('.item-row');
    if (!row) return;
    const key = row.dataset.key;
    const date = sheetDate;
    if (e.target.classList.contains('switch')) {
      await flushNote();
      const done = await toggleItem(date, key);
      if (done !== null && sheetDate === date && row.isConnected) row.outerHTML = itemRowHtml(date, IND[key]);
    } else if (e.target.classList.contains('time')) {
      const ok = await setItemTime(date, key, e.target.value);
      if (ok && row.isConnected && !row.querySelector('.tag')) row.querySelector('.meta').insertAdjacentHTML('beforeend', '<span class="tag">modificato</span>');
    }
  });
  sw.addEventListener('input', e => {
    if (e.target.id === 'day-note' && sheetKind === 'day') scheduleNote(sheetDate, e.target.value);
  });
  sw.addEventListener('submit', async e => {
    const f = e.target.closest('[data-evform]');
    if (!f) return;
    e.preventDefault();
    const label = f.elements.label.value.trim();
    if (!label || sheetKind !== 'day') return;
    if (await addEvent(sheetDate, label)) { f.elements.label.value = ''; refreshDayEvents(); toast('Evento aggiunto'); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && sheetKind) closeSheet(); });

  /* statistiche */
  const vst = $('#view-statistiche');
  vst.addEventListener('change', e => {
    if (e.target.matches('[data-incl]')) { state.inclToday = e.target.checked; savePrefs(); renderAll(); }
    else if (e.target.matches('[data-ba-ev]')) { state.baEvent = e.target.value; renderAll(); }
  });
  vst.addEventListener('click', e => {
    const t = e.target;
    const h = t.closest('.ch-hit');
    if (h) { showTipFor(h); return; }
    const c = t.closest('[data-ind]');
    if (c) { state.statsInd = c.dataset.ind; savePrefs(); renderAll(); return; }
    const w = t.closest('[data-ba-win]');
    if (w) { state.baWin = w.dataset.baWin; savePrefs(); renderAll(); return; }
    const g = t.closest('[data-goto]');
    if (g) show(g.dataset.goto);
  });
  vst.addEventListener('pointerover', e => { const h = e.target.closest('.ch-hit'); if (h) showTipFor(h); });
  vst.addEventListener('pointerout', e => { if (e.pointerType === 'mouse' && e.target.closest('.ch-hit')) hideTip(); });
  document.addEventListener('pointerdown', e => { if (!e.target.closest('.ch-hit')) hideTip(); });
  document.addEventListener('scroll', hideTip, { capture: true, passive: true });

  /* dati */
  const vd = $('#view-dati');
  vd.addEventListener('click', async e => {
    const t = e.target;
    if (t.closest('[data-persist]')) { requestPersist(true); return; }
    const ex = t.closest('[data-export]');
    if (ex) { doExport(ex.dataset.export); return; }
    const de = t.closest('[data-del-ev]');
    if (de && await deleteEvent(de.dataset.delEv)) { toast('Evento eliminato'); renderAll(); }
  });
  vd.addEventListener('change', async e => {
    const t = e.target;
    if (t.matches('[data-import]')) {
      const f = t.files && t.files[0];
      t.value = '';
      if (f) await importFile(f);
      return;
    }
    if (t.matches('[data-start]')) {
      const v = t.value;
      if (!isDateStr(v) || v > state.today) { toast('Data non valida'); t.value = startDate(); return; }
      if (await setMeta('startDate', v)) {
        const ed = earliestData();
        toast(ed && ed < v ? 'Fatto. I giorni prima restano salvati, ma fuori dalle statistiche.' : 'Data di inizio aggiornata', 3000);
      }
    }
  });
  vd.addEventListener('submit', async e => {
    const f = e.target.closest('[data-evform2]');
    if (!f) return;
    e.preventDefault();
    const date = f.elements.date.value;
    const label = f.elements.label.value.trim();
    if (!isDateStr(date) || !label) { toast('Servono una data e un nome'); return; }
    if (await addEvent(date, label)) { toast('Evento aggiunto'); renderAll(); }
  });

  /* generali */
  document.addEventListener('visibilitychange', () => { if (document.hidden) flushNote(); else checkToday(); });
  window.addEventListener('pagehide', () => { flushNote(); });
  window.addEventListener('focus', checkToday);
  window.addEventListener('pageshow', checkToday);
  window.addEventListener('resize', debounce(() => { hideTip(); if (state.view === 'statistiche') drawCharts(); }, 150));
  $('#update').addEventListener('click', e => { if (e.target.closest('[data-reload]')) location.reload(); });
}

/* =========================================================
   Service worker (funziona anche offline) e avvio
   ========================================================= */
function registerSW() {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  let hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController) $('#update').hidden = false;
    hadController = true;
  });
  navigator.serviceWorker.register('sw.js').then(reg => {
    document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
  }).catch(err => console.warn('Service worker non registrato:', err));
}

function fatal(msg) {
  const el = $('#view-oggi');
  el.hidden = false;
  el.innerHTML = `<div class="fatal"><h1 class="v-title">Spunta</h1><p>${esc(msg)}</p></div>`;
}

async function boot() {
  for (const el of $$('[data-icon]')) el.innerHTML = svg(P[el.dataset.icon]);
  loadPrefs();
  try {
    db = await openDB();
    db.onversionchange = () => db.close();
    await loadAll();
  } catch (err) {
    console.error(err);
    fatal('Non riesco ad aprire l\'archivio dati di questo browser. Se sei in navigazione privata, aprila in una finestra normale.');
    return;
  }
  if (!isDateStr(startDate())) {
    const ed = earliestData();
    await setMeta('startDate', ed && ed < state.today ? ed : state.today);
  }
  bindEvents();
  const v = location.hash.slice(1);
  show(VIEWS[v] ? v : 'oggi');
  setInterval(checkToday, 30000);
  requestPersist(false);
  registerSW();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

})();
