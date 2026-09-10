'use strict';
/*
 * Egret Tuning - Web Bluetooth. Implements the BLE protocol proven from de.walberg.egret 2.0.60.
 * Proven: characteristic UUIDs, command opcodes, EY packet format, CRC16, scramble, per-model
 * capabilities (drive modes, X-mode, automatic headlights). Inferred: the service UUIDs of the
 * modern family (characteristic base with a 0 in the last nibble), matching the proven identifier
 * service 70D1B670 whose characteristics are ...672/673/674.
 */

// Bump VER on every release and set the matching ?v=VER on the script/style tags in index.html.
const VER = '9';
const BUILD = 'v' + VER;

// --------------------------- UUIDs (Web Bluetooth wants lowercase) ---------------------------
const U = {
  OP_SVC:  '7d971cd0-8ebd-4684-b771-b2362b7e922a',
  OP_CMD:  '7d971cd1-8ebd-4684-b771-b2362b7e922a',
  OP_STAT: '7d971cd2-8ebd-4684-b771-b2362b7e922a',
  OP_ODO:  '7d971cd3-8ebd-4684-b771-b2362b7e922a',
  SET_SVC: 'bccae7e0-458d-4554-8d8a-ddadd926efe3',
  SET_CMD: 'bccae7e1-458d-4554-8d8a-ddadd926efe3',
  SET_STAT:'bccae7e2-458d-4554-8d8a-ddadd926efe3',
  CUST:    'bccae7e3-458d-4554-8d8a-ddadd926efe3',
  DIA_SVC: '2b419d90-adef-4ca3-8652-c02093b6c84e',
  DIA_STAT:'2b419d92-adef-4ca3-8652-c02093b6c84e',
  BAT_SVC: 'f4b68c10-9e9e-4b97-a9c9-272e32453252',
  BAT_LVL: 'f4b68c11-9e9e-4b97-a9c9-272e32453252',
  BAT_DIAG:'f4b68c14-9e9e-4b97-a9c9-272e32453252',
  ID_SVC:  '70d1b670-eba5-4d76-868f-6d1b66108fdc',
  BAT_STD_SVC: '0000180f-0000-1000-8000-00805f9b34fb',
  BAT_STD: '00002a19-0000-1000-8000-00805f9b34fb',
  DEV_SVC: '0000180a-0000-1000-8000-00805f9b34fb',
  DEV_SERIAL: '00002a25-0000-1000-8000-00805f9b34fb',
  DEV_FW:  '00002a26-0000-1000-8000-00805f9b34fb',
  EY_SVC:  '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
  EY_WR:   '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
  EY_NO:   '6e400003-b5a3-f393-e0a9-e50e24dcca9e'
};
const MODERN_OPT_SVCS = [U.OP_SVC, U.SET_SVC, U.DIA_SVC, U.BAT_SVC, U.ID_SVC, U.BAT_STD_SVC, U.DEV_SVC];

// --------------------------- per-model capabilities (proven from the app code) ---------------------------
// fam: 'modern' uses SETTINGS SetSpeedLimit (km/h); 'ey' uses the Nordic UART gear/X-mode.
// names: advertised-name prefixes used for auto detect. speed: has a BT speed lever (kept for tuning).
// xmode: EY X-mode present (proven only for EY1/EY2/EY2p). headlight: automatic headlights (GT only).
// modes: modern ride modes offered (wire enum 0..3). tunable=false only marks "no proven speed lever".
const MODELS = {
  X:       { fam: 'modern', label: 'Egret X',        names: ['EGRET X'],      speed: true,  modes: [0,1,2,3], bright: true, reset: true },
  X_CORE:  { fam: 'modern', label: 'Egret X Core',   names: ['EGRET X CORE'], speed: true,  modes: [0,1,2,3], bright: true, reset: true },
  X_PRIME: { fam: 'modern', label: 'Egret X Prime',  names: ['EGRET X PRIME'],speed: true,  modes: [0,1,2,3], bright: true, reset: true },
  X_ULTRA: { fam: 'modern', label: 'Egret X Ultra',  names: ['EGRET X ULTRA'],speed: true,  modes: [0,1,2,3], bright: true, reset: true },
  PRO:     { fam: 'modern', label: 'Egret Pro',      names: ['EGRET PRO'],    speed: true,  modes: [0,1,2,3], bright: true, reset: true },
  PRO_FX:  { fam: 'modern', label: 'Egret Pro FX',   names: ['EGRET PRO FX'], speed: true,  modes: [0,1,2,3], bright: true, reset: true },
  ONE:     { fam: 'modern', label: 'Egret One',      names: ['EGRET ONE'],    speed: true,  modes: [0,1,2,3], bright: true, reset: true },
  GT:      { fam: 'modern', label: 'Egret GT',       names: ['EGRET GT'],     speed: true,  modes: [0,1,2,3], bright: true, reset: true, headlight: true },
  GTS:     { fam: 'modern', label: 'Egret GTs',      names: ['EGRET GTS'],    speed: true,  modes: [0,1,2,3], bright: true, reset: true },
  GTC:     { fam: 'modern', label: 'Egret GTc',      names: ['EGRET GTC'],    speed: true,  modes: [0,1,2,3], bright: true, reset: true },
  UNIT:    { fam: 'modern', label: 'Egret Unit',     names: ['EGRET UNIT'],   speed: true,  modes: [0,1,2,3], bright: true, reset: true, note: 'unit' },
  EY1:     { fam: 'ey', label: 'EY1', names: ['EY', 'YD'], speed: true,  xmode: true },
  EY2:     { fam: 'ey', label: 'EY2', names: ['EY', 'YD'], speed: true,  xmode: true },
  EY2P:    { fam: 'ey', label: 'EY2p',names: ['EY', 'YD'], speed: true,  xmode: true },
  EY3:     { fam: 'ey', label: 'EY3', names: ['EY', 'YD'], speed: false, xmode: false },
  EY6:     { fam: 'ey', label: 'EY6', names: ['EY', 'YD'], speed: false, xmode: false },
  EY6P:    { fam: 'ey', label: 'EY6p',names: ['EY', 'YD'], speed: false, xmode: false },
  EY7:     { fam: 'ey', label: 'EY7', names: ['EY', 'YD'], speed: false, xmode: false },
  EYS:     { fam: 'ey', label: 'EYS', names: ['EY', 'YD'], speed: false, xmode: false }
};
const MODERN_KEYS = Object.keys(MODELS).filter(k => MODELS[k].fam === 'modern');

// --------------------------- helpers ---------------------------
const $ = (id) => document.getElementById(id);
const hex = (arr) => Array.from(arr, b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
const short = (u) => String(u).slice(0, 8).toUpperCase();
const LS = { THEME: 'eg_theme', MODEL: 'eg_model', OPEN: 'eg_open', EKFV: 'eg_ekfv' };

let dev = null, server = null, chars = {}, model = 'auto', busy = false;
function cap() { return MODELS[model] || null; }
function fam() { const c = cap(); return c ? c.fam : 'auto'; }

// --------------------------- log ---------------------------
function logLine(cls, text) {
  const el = $('log'); if (!el) return;
  const span = document.createElement('span');
  span.className = cls; span.textContent = text + '\n';
  el.appendChild(span); el.scrollTop = el.scrollHeight;
}
const logTx = (u, b) => logLine('log-tx', '>>> ' + short(u) + ' | ' + hex(b));
const logRx = (u, b) => logLine('log-rx', '<<< ' + short(u) + ' | ' + hex(b));
const logSys = (t) => logLine('', '--- ' + t);
const logErr = (t) => logLine('log-err', '!!! ' + t);
function setTile(id, val) { const el = $(id); if (el) el.textContent = (val == null ? '-' : val); }
function resetTiles() { ['t-speed','t-batt','t-mode','t-lock','t-light','t-range','t-volt','t-current','t-power','t-throttle','t-odo','t-temp','t-charge','t-err','t-fw','t-serial'].forEach(id => setTile(id, null)); }
// Big-endian unsigned 24-bit read, used for the odometer fields.
function uInt24(b, i) { return (b[i] << 16) | (b[i + 1] << 8) | b[i + 2]; }
const asciiOf = (b) => b.filter(x => x >= 32 && x < 127).map(x => String.fromCharCode(x)).join('');
function transportDesc(c) {
  if (!c) return 'auto detect';
  if (c.fam === 'modern') return 'modern, vendor GATT services, no crypto, speed ' + (c.speed ? 'yes' : 'no') + (c.note === 'unit' ? ', serial class unconfirmed' : '');
  return 'EY, Nordic UART, CRC16+scramble, ' + (c.xmode ? 'x-mode yes' : 'gears only');
}
function logDiagnosticHeader() {
  logLine('', '=== eg-unlock diagnostic ===');
  logLine('', 'time: ' + new Date().toISOString());
  logLine('', 'build: ' + BUILD);
  logLine('', 'userAgent: ' + navigator.userAgent);
  logLine('', 'platform: ' + (navigator.platform || '?'));
  logLine('', 'webBluetooth: ' + (navigator.bluetooth ? 'yes' : 'no'));
  logLine('', '============================');
  const c = cap();
  logLine('', 'model: ' + (c ? c.label : 'auto detect') + ' [' + transportDesc(c) + ']');
}

// --------------------------- i18n ---------------------------
let lang = 'de';
function table() { return (window.I18N && window.I18N[lang]) || {}; }
function t(key) { const v = table()[key]; return (typeof v === 'string') ? v : ''; }
function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-t]').forEach(n => {
    const v = t(n.getAttribute('data-t'));
    if (/[<&]/.test(v)) n.innerHTML = v; else n.textContent = v;   // our own translation table
  });
  document.querySelectorAll('[data-t-ph]').forEach(n => { const v = t(n.getAttribute('data-t-ph')); if (v) n.setAttribute('placeholder', v); });
  { const el = $('link-guide'); if (el) el.href = docFile('GUIDE'); }
  { const el = $('link-readme'); if (el) el.href = docFile('README'); }
  { const el = $('link-license'); if (el) el.href = docFile('LICENSE'); }
  { const el = $('link-privacy'); if (el) el.href = docFile('PRIVACY'); }
  { const el = $('link-trademarks'); if (el) el.href = docFile('TRADEMARKS'); }
  { const el = $('langs'); if (el) el.setAttribute('aria-label', t('langGroup')); }
  { const el = $('build-ver'); if (el) el.textContent = t('buildLabel') + ' ' + BUILD; }
  document.querySelectorAll('#langs button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  buildModelDropdown();
  { const el = $('status'); setStatus(el ? el.dataset.state : 'disconnected'); }
  { const dark = document.documentElement.getAttribute('data-theme') !== 'light';
    const el = $('btn-theme'); if (el) { el.setAttribute('aria-label', t(dark ? 'themeToLight' : 'themeToDark')); el.title = el.getAttribute('aria-label'); } }
}
function initLangSwitch() {
  document.querySelectorAll('#langs button').forEach(b => b.addEventListener('click', () => { lang = b.dataset.lang; applyLang(); }));
}

// --------------------------- theme ---------------------------
function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  const b = $('btn-theme');
  if (b) { b.innerHTML = dark ? '&#9728;' : '&#9790;'; b.setAttribute('aria-label', t(dark ? 'themeToLight' : 'themeToDark')); b.title = b.getAttribute('aria-label'); }
  try { localStorage.setItem(LS.THEME, dark ? 'dark' : 'light'); } catch (e) {}
}
function initTheme() {
  let saved = null; try { saved = localStorage.getItem(LS.THEME); } catch (e) {}
  applyTheme(saved !== 'light');
  const b = $('btn-theme');
  if (b) b.addEventListener('click', () => applyTheme(document.documentElement.getAttribute('data-theme') === 'light'));
}

// --------------------------- model dropdown and per-model gating ---------------------------
function buildModelDropdown() {
  const sel = $('model-in'); if (!sel) return;
  const prev = sel.value || model;
  sel.innerHTML = '';
  const auto = document.createElement('option');
  auto.value = 'auto'; auto.textContent = t('modelAuto'); sel.appendChild(auto);
  for (const key of Object.keys(MODELS)) {
    const o = document.createElement('option');
    o.value = key; o.textContent = MODELS[key].label; sel.appendChild(o);
  }
  sel.value = prev && (prev === 'auto' || MODELS[prev]) ? prev : 'auto';
}
function setModel(key, persist) {
  model = (key === 'auto' || MODELS[key]) ? key : 'auto';
  const sel = $('model-in'); if (sel) sel.value = model;
  if (persist !== false) { try { localStorage.setItem(LS.MODEL, model); } catch (e) {} }
  applyModelUI();
}
function show(id, on) { const el = $(id); if (el) el.hidden = !on; }
function applyModelUI() {
  const c = cap();
  const isModern = c && c.fam === 'modern';
  const isEy = c && c.fam === 'ey';
  // Family-specific speed cards
  show('card-speed', isModern && c.speed);
  show('card-ey', isEy);
  show('card-mode', isModern);
  // More-settings rows
  show('row-bright', isModern && !!c.bright);
  show('row-headlight', isModern && !!c.headlight);
  show('row-reset', isModern && !!c.reset);
  ['row-lang', 'row-alwayson', 'row-tempwarn', 'row-range', 'row-unlockreq', 'row-unlockcode', 'row-text', 'row-custname'].forEach(id => show(id, isModern));
  show('row-cruise', isEy);
  // EY gear list and X-mode note
  if (isEy) buildGearList(!!c.xmode);
  const nx = $('ey-noxmode'); if (nx) nx.hidden = !(isEy && !c.xmode);
}
function buildGearList(withX) {
  const sel = $('gear-in'); if (!sel) return;
  sel.innerHTML = '';
  if (withX) {
    for (const [v, k] of [['x', 'gearX'], ['x3', 'gearX3']]) {
      const o = document.createElement('option'); o.value = v; o.textContent = t(k); o.setAttribute('data-t', k); sel.appendChild(o);
    }
  }
  for (let g = 0; g <= 7; g++) { const o = document.createElement('option'); o.value = String(g); o.textContent = (lang === 'de' ? 'Stufe ' : 'Gear ') + g; sel.appendChild(o); }
}

// --------------------------- status ---------------------------
function statusLabel(s) {
  const map = { disconnected: 'stDisconnected', connecting: 'stConnecting', linking: 'stLinking', connected: 'stConnected', 'no-service': 'stNoService', 'no-char': 'stNoChar' };
  return t(map[s] || 'stDisconnected') || s;
}
function setStatus(s) {
  const el = $('status'); if (el) { el.dataset.state = s; el.textContent = statusLabel(s); }
  const cb = $('btn-conn');
  if (cb) { const on = (s === 'connecting' || s === 'linking' || s === 'connected'); cb.textContent = on ? t('btnDisconnect') : t('btnConnect'); cb.dataset.act = on ? 'disconnect' : 'connect'; }
}
function setControlsEnabled(on) {
  ['btn-unlock','btn-lock','btn-gear','gear-in','btn-mode','mode-in','btn-bright','bright-in','btn-headlight','headlight-in',
   'btn-light','light-in','btn-unit','unit-in','btn-reset-trip','btn-reset-total','btn-immob-lock','btn-immob-unlock',
   'btn-lang','lang-in','btn-alwayson','alwayson-in','btn-tempwarn','tempwarn-in','btn-range','range-in',
   'btn-unlockreq','unlockreq-in','btn-unlockcode','unlockcode-in','btn-text','text-in','btn-custname','custname-in','btn-cruise','cruise-in']
    .forEach(id => { const e = $(id); if (e) e.disabled = !on; });
}

// --------------------------- connect ---------------------------
async function connect() {
  if (!navigator.bluetooth) { logErr('This browser has no Web Bluetooth. Use Chrome, Edge or Bluefy.'); return; }
  try {
    setStatus('connecting');
    const wantEy = fam() === 'ey';
    let opts;
    if (wantEy) opts = { filters: [{ namePrefix: 'EY' }, { namePrefix: 'YD' }, { services: [U.EY_SVC] }], optionalServices: [U.EY_SVC] };
    else if (fam() === 'modern') opts = { filters: [{ namePrefix: 'EGRET' }, { namePrefix: 'Egret' }, { services: [U.ID_SVC] }, { services: [U.OP_SVC] }], optionalServices: MODERN_OPT_SVCS };
    else opts = { filters: [{ namePrefix: 'EGRET' }, { namePrefix: 'Egret' }, { namePrefix: 'EY' }, { namePrefix: 'YD' }, { services: [U.ID_SVC] }, { services: [U.EY_SVC] }], optionalServices: MODERN_OPT_SVCS.concat([U.EY_SVC]) };
    dev = await navigator.bluetooth.requestDevice(opts);
    dev.addEventListener('gattserverdisconnected', onDisconnected);
    logSys('device: ' + (dev.name || '(no name)'));
    if (model === 'auto') autoDetect(dev.name || '');
    setStatus('linking');
    server = await dev.gatt.connect();
    await discover();
    setStatus('connected');
    setControlsEnabled(true);
    { const el = $('devinfo'); if (el) el.textContent = t('devPrefix') + ' ' + (dev.name || 'Egret'); }
    logSys('connected, ' + Object.keys(chars).length + ' characteristics');
    if (fam() === 'ey') await startEy(); else await startModern();
  } catch (e) {
    logErr('connect failed: ' + (e && e.message ? e.message : e));
    setStatus('disconnected');
  }
}
function autoDetect(name) {
  const up = name.toUpperCase();
  if (up.startsWith('EY') || up.startsWith('YD')) { setModel('EY1', false); logSys('auto: EY family (exact EY type not in advertised name, using EY1 defaults)'); return; }
  let best = null;
  for (const key of MODERN_KEYS) { for (const n of MODELS[key].names) { if (up.startsWith(n.toUpperCase())) { if (!best || n.length > best.n) best = { key, n: n.length }; } } }
  if (best) { setModel(best.key, false); logSys('auto: ' + MODELS[best.key].label); }
  else logSys('auto: unknown name, keeping generic modern');
}
async function discover() {
  chars = {};
  const svcs = await server.getPrimaryServices();
  for (const s of svcs) { let cs; try { cs = await s.getCharacteristics(); } catch (_) { continue; } for (const c of cs) chars[c.uuid] = c; }
}
function onDisconnected() { setStatus('disconnected'); setControlsEnabled(false); resetTiles(); const el = $('devinfo'); if (el) el.textContent = ''; logSys('disconnected'); }
function disconnect() { if (dev && dev.gatt.connected) dev.gatt.disconnect(); }

// --------------------------- modern telemetry + commands ---------------------------
const MODE_NAMES = ['Off/6', 'Eco', 'Tour', 'Sport', 'Pedestrian', 'DMode', 'SMode', 'XMode', 'Neutral'];
async function startModern() {
  await subscribe(U.OP_STAT, parseOpStatus);
  await subscribe(U.BAT_LVL, b => { if (b.length) setTile('t-batt', b[0] + ' %'); });
  await subscribe(U.BAT_STD, b => { if (b.length) setTile('t-batt', b[0] + ' %'); });
  await subscribe(U.DIA_STAT, parseDiag);
  await subscribe(U.OP_ODO, parseOdo);
  await tryRead(U.OP_STAT, parseOpStatus);
  await tryRead(U.BAT_LVL, b => { if (b.length) setTile('t-batt', b[0] + ' %'); });
  await tryRead(U.OP_ODO, parseOdo);
  await tryRead(U.BAT_DIAG, parseBatDiag);
  await tryRead(U.DEV_SERIAL, b => setTile('t-serial', asciiOf(b) || '-'));
  await tryRead(U.DEV_FW, b => setTile('t-fw', asciiOf(b) || '-'));
}
function parseOpStatus(b) {
  if (b.length < 14) return;
  const f = b[0];
  setTile('t-lock', (f & 2) ? t('valLocked') : t('valOpen'));
  setTile('t-light', (f & 4) ? t('valOn') : t('valOff'));
  setTile('t-charge', (f & 8) ? t('valOn') : t('valOff'));
  setTile('t-speed', (((b[1] << 8) | b[2]) / 10).toFixed(1));
  setTile('t-power', b[3] + ' %');
  setTile('t-throttle', b[11] + ' %');
  const eco = ((b[4] << 8) | b[5]) / 10, tour = ((b[6] << 8) | b[7]) / 10, sport = ((b[8] << 8) | b[9]) / 10;
  setTile('t-range', Math.max(eco, tour, sport).toFixed(0) + ' km');
  setTile('t-mode', MODE_NAMES[b[12]] || ('mode ' + b[12]));
  setTile('t-err', b[13] === 0 ? '-' : ('code ' + b[13]));
}
// Motor temperature from the diagnostics status (live).
function parseDiag(b) { if (b.length >= 2) setTile('t-temp', (((b[0] << 8) | b[1]) / 10).toFixed(1) + ' C'); }
// Odometer: total distance as big-endian 24-bit. The app divides by 10 only for the Unit (proven,
// decomp.js:844322-844336); other models pass the value through unchanged.
function parseOdo(b) {
  if (b.length < 5) return;
  const c = cap();
  const total = (c && c.note === 'unit') ? uInt24(b, 2) / 10 : uInt24(b, 2);
  setTile('t-odo', total.toFixed(total < 100 ? 1 : 0) + ' km');
}
// Battery diagnostics: voltage and current (temperature offset 2740 is used for the battery temp).
function parseBatDiag(b) {
  if (b.length < 6) return;
  setTile('t-volt', (((b[2] << 8) | b[3]) / 10).toFixed(1) + ' V');
  setTile('t-current', (((b[4] << 8) | b[5]) / 10).toFixed(1) + ' A');
}
async function sendSettings(op, payload) { await writeCmd(U.SET_CMD, [op].concat(payload || [])); }
async function sendOperation(op, payload) { await writeCmd(U.OP_CMD, [op].concat(payload || [])); }
async function setSpeedLimit(kmh) {
  // The official app sends only SetSpeedLimit (opcode 8) with the km/h byte. Opcode 7
  // (SetSpeedLimitEnabled) is a dead constant, never sent, so we do not send it either.
  await sendSettings(8, [kmh & 0xff]);
  logSys('speed limit ' + kmh + ' km/h (08 ' + (kmh & 0xff).toString(16).padStart(2, '0').toUpperCase() + ')');
}
// Free display text: clear (op 12), send one 18-byte ASCII frame (op 4, frame index 0), show (op 13).
async function setFreeText(s) {
  const bytes = Array.from(String(s)).slice(0, 18).map(c => c.charCodeAt(0) & 0x7f);
  await sendOperation(12, []);
  await sendOperation(4, [0].concat(bytes));
  await sendOperation(13, []);
}
async function setCustomerName(s) {
  const bytes = Array.from(String(s)).slice(0, 20).map(c => c.charCodeAt(0) & 0xff);
  await writeCmd(U.CUST, bytes);
}
// Display unlock code: 4 ASCII characters (settings opcode 4).
async function setUnlockCode(s) {
  const bytes = Array.from(String(s)).slice(0, 4).map(c => c.charCodeAt(0) & 0x7f);
  await sendSettings(4, bytes);
}

// --------------------------- EY telemetry + commands ---------------------------
let eyBuf = [];
async function startEy() {
  eyBuf = [];
  await subscribe(U.EY_NO, onEyNotify);
  await eySend(0x23, 0x02, [0x40, 0x40], 'queryBasicData');
}
function onEyNotify(bytes) {
  for (const x of bytes) eyBuf.push(x);
  while (eyBuf.length >= 7) {
    if (eyBuf[0] !== 0x5A) { eyBuf.shift(); continue; }
    const total = eyBuf[4] + 7;
    if (eyBuf.length < total) break;
    decodeEy(eyBuf.slice(0, total)); eyBuf = eyBuf.slice(total);
  }
}
function decodeEy(frame) {
  const func = frame[2], data = frame.slice(5, 5 + frame[4]);
  if (func === 0x01 && data.length >= 6) {
    setTile('t-batt', data[0] + ' %');
    setTile('t-speed', (((data[1] << 7) | data[2]) / 10).toFixed(1));
    setTile('t-mode', MODE_NAMES[data[3] & 7] || ('mode ' + (data[3] & 7)));
    setTile('t-lock', (data[5] & 0x20) ? t('valLocked') : t('valOpen'));
    setTile('t-light', (data[5] & 0x08) ? t('valOn') : t('valOff'));
  }
}
function eyCrc16(bytes) {
  let crc = 0;
  for (const bb of bytes) {
    let x = (((crc << 8) | (crc >>> 8)) ^ (bb & 0xff)) & 0xffff;
    x = (x ^ ((x & 0xff) >>> 4)) & 0xffff;
    x = (x ^ ((x << 12) & 0xffff)) & 0xffff;
    x = (x ^ ((x & 0xff) << 5)) & 0xffff;
    crc = x & 0xffff;
  }
  return crc;
}
const eyScramble = (bytes) => bytes.map((v, i) => (v ^ (i + 10)) & 0xff);
function eyFrame(addr, func, data) {
  const head = [0x5A, addr, func, func, data.length].concat(data);
  const crc = eyCrc16(head);
  return eyScramble(head.concat([(crc >>> 8) & 0xff, crc & 0xff]));
}
async function eySend(addr, func, data, label) {
  const c = chars[U.EY_WR]; if (!c) { logErr('EY write characteristic missing'); return; }
  await writeChar(c, Uint8Array.from(eyFrame(addr, func, data)));
  logSys('EY ' + label);
}
function eySelfTest() {
  const cases = [
    ['unlock',  eyFrame(0x23, 0x02, [0x00, 0x01]), [0x50,0x28,0x0E,0x0F,0x0C,0x0F,0x11,0x24,0x89]],
    ['gear0',   eyFrame(0x23, 0x05, [0xA0, 0x00]), [0x50,0x28,0x09,0x08,0x0C,0xAF,0x10,0x1F,0x2F]],
    ['xmode',   eyFrame(0x23, 0x05, [0x80, 0x00]), [0x50,0x28,0x09,0x08,0x0C,0x8F,0x10,0x19,0xC9]]
  ];
  let ok = true;
  for (const [n, got, exp] of cases) if (got.length !== exp.length || got.some((v, i) => v !== exp[i])) { ok = false; logErr('EY self-test ' + n + ' FAILED'); }
  logSys(ok ? 'EY self-test ok (CRC16 and scramble match)' : 'EY self-test failed');
  return ok;
}
let eyOk = true;
async function eyGear(sel) {
  if (!eyOk) { logErr('EY self-test failed, commands disabled'); return; }
  if (sel === 'x') return eySend(0x23, 0x05, [0x80, 0x00], 'X-mode');
  if (sel === 'x3') return eySend(0x23, 0x05, [0xA3, 0x00], 'X-mode gear 3');
  const g = parseInt(sel, 10) & 7; return eySend(0x23, 0x05, [(0xA0 | g) & 0xff, 0x00], 'gear ' + g);
}

// --------------------------- GATT primitives ---------------------------
async function subscribe(uuid, handler) {
  const c = chars[uuid]; if (!c) return false;
  try {
    await c.startNotifications();
    c.addEventListener('characteristicvaluechanged', ev => { const b = new Uint8Array(ev.target.value.buffer); logRx(uuid, b); handler(Array.from(b)); });
    return true;
  } catch (e) { logErr('notify ' + short(uuid) + ' failed: ' + e.message); return false; }
}
async function tryRead(uuid, handler) {
  const c = chars[uuid]; if (!c || !c.properties.read) return;
  try { const v = await c.readValue(); const b = new Uint8Array(v.buffer); logRx(uuid, b); handler(Array.from(b)); } catch (_) {}
}
async function writeCmd(uuid, bytes) { const c = chars[uuid]; if (!c) { logErr('characteristic ' + short(uuid) + ' missing'); return; } await writeChar(c, Uint8Array.from(bytes)); }
async function writeChar(c, arr) { logTx(c.uuid, arr); if (c.properties.write) await c.writeValueWithResponse(arr); else await c.writeValueWithoutResponse(arr); }
async function guard(fn) { if (busy) return; busy = true; try { await fn(); } catch (e) { logErr(e && e.message ? e.message : String(e)); } finally { busy = false; } }

// --------------------------- document viewer (markdown of our own docs) ---------------------------
const DOC_TITLES = {
  'GUIDE.de.md': 'footGuide', 'GUIDE.en.md': 'footGuide',
  'PRIVACY.de.md': 'footPrivacy', 'PRIVACY.md': 'footPrivacy',
  'LICENSE.de.md': 'footLicense', 'LICENSE.md': 'footLicense',
  'TRADEMARKS.de.md': 'footTrademarks', 'TRADEMARKS.md': 'footTrademarks',
  'README.md': 'footReadme'
};
const escHtml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const slug = s => s.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/ /g, '-');
function mdToHtml(src) {
  const inline = s => escHtml(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (all, text, href) => {
      if (DOC_TITLES[href]) return '<a href="' + href + '" data-docfile="' + href + '">' + text + '</a>';
      return '<a href="' + href + '" target="_blank" rel="noopener">' + text + '</a>';
    });
  const lines = String(src).replace(/\r\n?/g, '\n').split('\n');
  const out = []; let para = [], inFence = false, listKind = null;
  const flushPara = () => { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } };
  const closeList = () => { if (listKind) { out.push('</' + listKind + '>'); listKind = null; } };
  const cells = l => l.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i], body = l.trim();
    if (inFence) { if (body.startsWith('```')) { out.push('</code></pre>'); inFence = false; } else out.push(escHtml(l)); continue; }
    if (body.startsWith('```')) { flushPara(); closeList(); out.push('<pre><code>'); inFence = true; continue; }
    if (body === '') { flushPara(); closeList(); continue; }
    if (/^(-{3,})\s*$/.test(body)) { flushPara(); closeList(); out.push('<hr>'); continue; }
    { const bq = body.match(/^>\s?(.*)$/); if (bq) { flushPara(); closeList(); out.push('<blockquote>' + inline(bq[1]) + '</blockquote>'); continue; } }
    if (body.startsWith('|') && /^\|[\s:|-]+\|?\s*$/.test((lines[i + 1] || '').trim())) {
      flushPara(); closeList();
      out.push('<div class="doc-table"><table><thead><tr>' + cells(body).map(c => '<th>' + inline(c) + '</th>').join('') + '</tr></thead><tbody>');
      i++;
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith('|')) out.push('<tr>' + cells(lines[++i].trim()).map(c => '<td>' + inline(c) + '</td>').join('') + '</tr>');
      out.push('</tbody></table></div>'); continue;
    }
    let m;
    if ((m = body.match(/^(#{1,4})\s+(.*)$/))) { flushPara(); closeList(); const n = m[1].length; out.push('<h' + n + ' id="' + slug(m[2]) + '">' + inline(m[2]) + '</h' + n + '>'); continue; }
    if ((m = body.match(/^[-*]\s+(.*)$/))) { flushPara(); if (listKind !== 'ul') { closeList(); out.push('<ul>'); listKind = 'ul'; } out.push('<li>' + inline(m[1]) + '</li>'); continue; }
    if ((m = body.match(/^\d+\.\s+(.*)$/))) { flushPara(); if (listKind !== 'ol') { closeList(); out.push('<ol>'); listKind = 'ol'; } out.push('<li>' + inline(m[1]) + '</li>'); continue; }
    closeList(); para.push(body);
  }
  if (inFence) out.push('</code></pre>');
  flushPara(); closeList();
  return out.join('\n').replace(/<pre><code>\n/g, '<pre><code>');
}
const docCache = {};
const docFile = name => { if (name === 'GUIDE') return 'GUIDE.' + lang + '.md'; if (name === 'README') return 'README.md'; return lang === 'de' ? name + '.de.md' : name + '.md'; };
function openDocFile(file, titleKey) {
  const dlg = $('doc'), body = $('doc-body'); if (!dlg || !body) return;
  const mark = (lang === 'de' && !file.includes('.de.') && file !== 'README.md') ? ' ' + t('docEnglish') : '';
  $('doc-title').textContent = (t(titleKey || DOC_TITLES[file] || '') || file) + mark;
  if (typeof dlg.showModal === 'function') dlg.showModal();
  const showDoc = html => { body.innerHTML = html; const h1 = body.querySelector('h1'); if (h1) { $('doc-title').textContent = h1.textContent.trim() + mark; h1.remove(); } body.scrollTop = 0; };
  if (docCache[file]) { showDoc(docCache[file]); return; }
  body.innerHTML = '<p>' + escHtml(t('docLoading')) + '</p>';
  fetch(file + '?v=' + VER).then(r => { if (!r.ok) throw new Error(r.status + ' ' + r.statusText); return r.text(); })
    .then(txt => { docCache[file] = mdToHtml(txt); showDoc(docCache[file]); })
    .catch(e => { body.innerHTML = '<p>' + escHtml(t('docFail')) + '</p><pre class="log-err">' + escHtml(file + ': ' + (e && e.message ? e.message : e)) + '</pre>'; });
}
function wireDocViewer() {
  document.addEventListener('click', e => {
    if (!e.target.closest) return;
    const disc = e.target.closest('[data-open-disclaimer]'); if (disc) { e.preventDefault(); openHelp('disclaimer'); return; }
    const a = e.target.closest('[data-doc], [data-docfile]'); if (!a) return;
    e.preventDefault();
    const file = a.getAttribute('data-docfile');
    if (file) openDocFile(file, a.getAttribute('data-t') || '');
    else openDocFile(docFile(a.getAttribute('data-doc')), a.getAttribute('data-t') || '');
  });
  ['doc-x', 'doc-close'].forEach(id => { const b = $(id); if (b) b.addEventListener('click', () => { const d = $('doc'); if (d) d.close(); }); });
}

// --------------------------- help ---------------------------
const HELP = { speed: ['s3Title', 'speedValuesHint'], ey: ['eyTitle', 'eyGearHint'], mode: ['modeTitle', 'modeHint'], more: ['moreTitle', 'moreHint'], immob: ['immobTitle', 'immobHint'], disclaimer: ['footDisclaimer', 'disclaimerText'] };
function openHelp(key) {
  const m = HELP[key]; if (!m) return; const dlg = $('help'); if (!dlg) return;
  $('help-title').textContent = t(m[0]);
  const bo = $('help-body'); if (bo) { const v = t(m[1]); if (/[<&]/.test(v)) bo.innerHTML = v; else bo.textContent = v; }
  if (dlg.showModal) { try { dlg.showModal(); } catch (e) { dlg.setAttribute('open', ''); } } else dlg.setAttribute('open', '');
}
function closeHelp() { const dlg = $('help'); if (dlg && dlg.close) dlg.close(); }

// --------------------------- init ---------------------------
window.addEventListener('DOMContentLoaded', () => {
  initLangSwitch();
  initTheme();
  wireDocViewer();
  buildModelDropdown();

  let savedModel = null; try { savedModel = localStorage.getItem(LS.MODEL); } catch (e) {}
  setModel((savedModel === 'auto' || MODELS[savedModel]) ? savedModel : 'auto', false);
  try { const o = localStorage.getItem(LS.OPEN); if (o && $('open-in')) $('open-in').value = o; } catch (e) {}
  try { const k = localStorage.getItem(LS.EKFV); if (k && $('ekfv-in')) $('ekfv-in').value = k; } catch (e) {}
  applyLang();
  setStatus('disconnected');
  logDiagnosticHeader();
  eyOk = eySelfTest();

  $('model-in').addEventListener('change', e => { setModel(e.target.value, true); const c = cap(); logLine('', 'model: ' + (c ? c.label : 'auto detect') + ' [' + transportDesc(c) + ']'); });
  $('btn-conn').addEventListener('click', () => { if ($('btn-conn').dataset.act === 'disconnect') disconnect(); else guard(connect); });
  { const o = $('open-in'); if (o) o.addEventListener('change', () => { try { localStorage.setItem(LS.OPEN, o.value); } catch (e) {} }); }
  { const k = $('ekfv-in'); if (k) k.addEventListener('change', () => { try { localStorage.setItem(LS.EKFV, k.value); } catch (e) {} }); }

  // Two send-only buttons, no remembered state: Unlock always writes the open value, Lock the eKFV value.
  const sendSpeedFrom = (id) => guard(async () => {
    const v = parseInt($(id).value, 10);
    if (!(v >= 1 && v <= 99)) { logErr('enter a value 1..99'); return; }
    await setSpeedLimit(v);
  });
  $('btn-unlock').addEventListener('click', () => sendSpeedFrom('open-in'));
  $('btn-lock').addEventListener('click', () => sendSpeedFrom('ekfv-in'));

  $('btn-gear').addEventListener('click', () => guard(() => eyGear($('gear-in').value)));
  $('btn-mode').addEventListener('click', () => guard(() => sendOperation(6, [parseInt($('mode-in').value, 10) & 0xff])));
  $('btn-bright').addEventListener('click', () => guard(() => sendSettings(2, [parseInt($('bright-in').value, 10) & 0xff])));
  $('btn-headlight').addEventListener('click', () => guard(() => sendSettings(13, [parseInt($('headlight-in').value, 10) & 0xff])));
  $('btn-light').addEventListener('click', () => guard(() => fam() === 'ey' ? eyLight($('light-in').value === '1') : sendOperation(3, [$('light-in').value === '1' ? 1 : 0])));
  $('btn-unit').addEventListener('click', () => guard(() => { const mph = $('unit-in').value === '1'; return fam() === 'ey' ? eyUnit(mph) : sendSettings(9, [mph ? 1 : 0]); }));
  $('btn-reset-trip').addEventListener('click', () => guard(() => sendOperation(9, [])));
  $('btn-reset-total').addEventListener('click', () => guard(() => sendOperation(11, [])));
  $('btn-immob-lock').addEventListener('click', () => guard(() => fam() === 'ey' ? eyLock(true) : sendOperation(2, [1])));
  $('btn-immob-unlock').addEventListener('click', () => guard(() => fam() === 'ey' ? eyLock(false) : sendOperation(2, [0])));
  $('btn-lang').addEventListener('click', () => guard(() => sendSettings(1, [parseInt($('lang-in').value, 10) & 0xff])));
  $('btn-alwayson').addEventListener('click', () => guard(() => sendSettings(10, [$('alwayson-in').value === '1' ? 1 : 0])));
  $('btn-tempwarn').addEventListener('click', () => guard(() => sendOperation(7, [parseInt($('tempwarn-in').value, 10) & 0xff])));
  $('btn-range').addEventListener('click', () => guard(() => sendOperation(8, [Math.max(0, Math.min(100, parseInt($('range-in').value, 10) || 0)) & 0xff])));
  $('btn-unlockreq').addEventListener('click', () => guard(() => sendSettings(3, [$('unlockreq-in').value === '1' ? 1 : 0])));
  $('btn-unlockcode').addEventListener('click', () => guard(() => setUnlockCode($('unlockcode-in').value)));
  $('btn-text').addEventListener('click', () => guard(() => setFreeText($('text-in').value)));
  $('btn-custname').addEventListener('click', () => guard(() => setCustomerName($('custname-in').value)));
  $('btn-cruise').addEventListener('click', () => guard(() => eyCruise($('cruise-in').value === '1')));

  document.querySelectorAll('.help-btn').forEach(btn => btn.addEventListener('click', () => openHelp(btn.getAttribute('data-help'))));
  ['help-x', 'help-close'].forEach(id => { const b = $(id); if (b) b.addEventListener('click', closeHelp); });
  { const b = $('link-disclaimer'); if (b) b.addEventListener('click', e => { e.preventDefault(); openHelp('disclaimer'); }); }

  $('btn-clear-log').addEventListener('click', () => { $('log').textContent = ''; logDiagnosticHeader(); eyOk = eySelfTest(); });
  $('btn-copy-log').addEventListener('click', () => navigator.clipboard.writeText($('log').innerText).then(() => logSys('log copied')).catch(() => {}));
});

// EY convenience commands used by the shared buttons.
async function eyLight(on) { if (!eyOk) return; return eySend(0x23, 0x04, on ? [0x20, 0x20] : [0x00, 0x20], on ? 'lights on' : 'lights off'); }
async function eyLock(on) { if (!eyOk) return; return eySend(0x23, 0x02, on ? [0x01, 0x01] : [0x00, 0x01], on ? 'lock' : 'unlock'); }
async function eyUnit(mph) { if (!eyOk) return; return eySend(0x23, 0x02, mph ? [0x80, 0x80] : [0x00, 0x80], mph ? 'unit mph' : 'unit km/h'); }
async function eyCruise(on) { if (!eyOk) return; return eySend(0x23, 0x02, on ? [0x00, 0x04] : [0x04, 0x04], on ? 'cruise on' : 'cruise off'); }
