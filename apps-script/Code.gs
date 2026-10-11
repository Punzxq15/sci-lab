/**
 * Sci-Lab Backend (Google Apps Script)
 * ติดตั้ง: เปิด Google Sheet ใหม่ > Extensions > Apps Script > วางไฟล์นี้ > Deploy > Web app
 *   Execute as: Me | Who has access: Anyone
 * รหัสผ่านครู: Project Settings > Script properties > TEACHER_PASSWORD (ค่าเริ่มต้น 1234)
 */
const TZ = 'Asia/Bangkok';
const PFX = /^(เด็กชาย|เด็กหญิง|ด\.?\s*ช\.?|ด\.?\s*ญ\.?|นางสาว|น\.?\s*ส\.?|นาง|นาย)[\s.]*/;

function doGet() { return ContentService.createTextOutput('Sci-Lab API OK'); }
function doPost(e) {
  let out;
  const lock = LockService.getScriptLock();
  try {
    const b = JSON.parse(e.postData.contents), fn = ACTIONS[b.action];
    if (!fn) throw new Error('unknown action');
    lock.waitLock(25000);
    out = { ok: true, data: fn(b) };
  } catch (err) { out = { ok: false, error: String(err.message || err) }; }
  finally { try { lock.releaseLock(); } catch (x) { } }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

const ss_ = () => SpreadsheetApp.getActiveSpreadsheet();
function sh_(name, head) {
  let s = ss_().getSheetByName(name);
  if (!s) { s = ss_().insertSheet(name); s.appendRow(head); s.setFrozenRows(1); s.getRange(1, 1, 1, head.length).setFontWeight('bold').setBackground('#0b2a6b').setFontColor('#ffffff'); }
  return s;
}
const ROOMS = () => sh_('Rooms', ['code', 'class', 'status', 'createdAt']);
const LIVE = () => sh_('Live', ['room', 'key', 'json', 'updatedAt']);
const SAVED = () => sh_('Saved', ['id', 'room', 'class', 'title', 'url', 'ssId', 'savedAt']);
const now_ = () => Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy HH:mm');
function auth_(b) {
  const p = PropertiesService.getScriptProperties().getProperty('TEACHER_PASSWORD') || '1234';
  if (String(b.pass) !== p) throw new Error('รหัสผ่านครูไม่ถูกต้อง');
}
function cleanName_(s) { s = String(s || '').trim().replace(/\s+/g, ' '); let p; do { p = s; s = s.replace(PFX, ''); } while (s !== p); return s.trim(); }
const norm_ = s => cleanName_(s).replace(/\s+/g, '');

function rooms_() { return ROOMS().getDataRange().getValues().slice(1).map(r => ({ code: String(r[0]), class: r[1], status: r[2], createdAt: r[3] })); }
function room_(code) { return rooms_().filter(r => r.code === String(code))[0]; }
function liveRows_() { return LIVE().getDataRange().getValues(); }
function players_(code) { return liveRows_().slice(1).filter(r => String(r[0]) === String(code)).map(r => JSON.parse(r[2])); }
function saveLive_(code, key, st) {
  const s = LIVE(), v = s.getDataRange().getValues(); let row = 0;
  for (let i = 1; i < v.length; i++) if (String(v[i][0]) === String(code) && v[i][1] === key) { row = i + 1; break; }
  const data = [String(code), key, JSON.stringify(st), Date.now()];
  row ? s.getRange(row, 1, 1, 4).setValues([data]) : s.appendRow(data);
}
function getLive_(code, key) {
  const v = liveRows_();
  for (let i = 1; i < v.length; i++) if (String(v[i][0]) === String(code) && v[i][1] === key) return JSON.parse(v[i][2]);
  return null;
}
function readRoster_(cls) {
  const s = ss_().getSheetByName('Roster_' + cls); if (!s) return [];
  return s.getDataRange().getValues().slice(1).filter(r => r[2]).map(r => ({ no: r[0], prefix: r[1], name: String(r[2]) }));
}

const ACTIONS = {
  teacherLogin(b) { auth_(b); return true; },
  info(b) { auth_(b); return { masterUrl: ss_().getUrl() }; },

  createRoom(b) {
    auth_(b); const used = rooms_().map(r => r.code); let c;
    do { c = String(1000 + Math.floor(Math.random() * 9000)); } while (used.indexOf(c) >= 0);
    const s = ROOMS(); s.getRange(s.getLastRow() + 1, 1).setNumberFormat('@');
    s.appendRow([c, b.cls, 'open', now_()]); return { code: c };
  },
  listRooms(b) {
    auth_(b); const live = liveRows_().slice(1);
    return rooms_().map(r => { r.count = live.filter(x => String(x[0]) === r.code).length; return r; }).reverse();
  },
  setRoomStatus(b) {
    auth_(b); const s = ROOMS(), v = s.getDataRange().getValues();
    for (let i = 1; i < v.length; i++) if (String(v[i][0]) === String(b.code)) s.getRange(i + 1, 3).setValue(b.status);
    return true;
  },
  deleteRoom(b) {
    auth_(b);
    [[ROOMS(), 0], [LIVE(), 0]].forEach(p => { const s = p[0], v = s.getDataRange().getValues(); for (let i = v.length - 1; i >= 1; i--) if (String(v[i][0]) === String(b.code)) s.deleteRow(i + 1); });
    return true;
  },

  // ---------- นักเรียน ----------
  join(b) {
    const room = room_(b.code);
    if (!room) throw new Error('รหัสห้องไม่ถูกต้อง');
    if (room.status !== 'open') throw new Error('ห้องนี้ยังไม่เปิด หรือถูกปิดแล้ว');
    if (room.class !== b.cls) throw new Error('ห้องนี้สำหรับชั้น ' + room.class + ' เท่านั้น');
    const name = cleanName_(b.name), key = b.cls + '|' + b.no; let st = getLive_(b.code, key);
    if (st) { if (norm_(st.name) !== norm_(name)) throw new Error('เลขที่นี้มีผู้เล่นใช้ชื่ออื่นอยู่แล้ว ตรวจสอบชื่อ/เลขที่'); st.nick = b.nick; }
    else st = { key: key, name: name, cls: b.cls, no: b.no, nick: b.nick, lv: 1, pz: 0, hearts: 5, helpLeft: 1, sc: [0, 0, 0], done: false, finishedAt: 0, helpUsed: 0, restarts: 0, aidSeq: 0, aidMsg: '', aidH: 0, aidP: 0 };
    st.lastSeen = Date.now(); saveLive_(b.code, key, st); return { state: st };
  },
  push(b) {
    const room = room_(b.code); if (!room) return { roomStatus: 'gone' };
    const st = getLive_(b.code, b.key); if (!st) return { roomStatus: 'gone' };
    ['lv', 'pz', 'hearts', 'helpLeft', 'sc', 'done', 'finishedAt', 'helpUsed', 'restarts'].forEach(k => { if (b.state[k] !== undefined) st[k] = b.state[k]; });
    st.lastSeen = Date.now(); saveLive_(b.code, b.key, st);
    return { roomStatus: room.status, aid: { seq: st.aidSeq, msg: st.aidMsg, h: st.aidH, p: st.aidP } };
  },
  board(b) {
    const room = room_(b.code); if (!room) throw new Error('ไม่พบห้อง');
    return { room: room, players: players_(b.code).map(p => ({ key: p.key, name: p.name, cls: p.cls, no: p.no, nick: p.nick, lv: p.lv, pz: p.pz, hearts: p.hearts, helpLeft: p.helpLeft, sc: p.sc, done: p.done, finishedAt: p.finishedAt, helpUsed: p.helpUsed, restarts: p.restarts })) };
  },

  // ---------- ครูช่วยเหลือ ----------
  aid(b) {
    auth_(b); const st = getLive_(b.code, b.key); if (!st) throw new Error('ไม่พบผู้เล่น');
    st.aidSeq++; st.aidMsg = b.msg || ''; st.aidH += Number(b.h) || 0; st.aidP += Number(b.p) || 0;
    saveLive_(b.code, b.key, st); return true;
  },

  // ---------- รายชื่อ ----------
  getRoster(b) { auth_(b); return readRoster_(b.cls); },
  saveRoster(b) {
    auth_(b); const name = 'Roster_' + b.cls; let s = ss_().getSheetByName(name);
    if (!s) s = sh_(name, ['เลขที่', 'คำนำหน้า', 'ชื่อ-นามสกุล']);
    if (s.getLastRow() > 1) s.getRange(2, 1, s.getLastRow() - 1, 3).clearContent();
    if (b.rows.length) s.getRange(2, 1, b.rows.length, 3).setValues(b.rows.map(r => [Number(r[0]) || r[0], r[1], r[2]]));
    return true;
  },

  // ---------- บันทึกลงชีต ----------
  saveRoom(b) {
    auth_(b); const room = room_(b.code); if (!room) throw new Error('ไม่พบห้อง');
    const ps = players_(b.code), roster = readRoster_(room.class), used = {};
    const total = p => p.sc[0] + p.sc[1] + p.sc[2];
    const ranked = ps.slice().sort((a, c) => total(c) - total(a) || (a.done ? a.finishedAt : 9e15) - (c.done ? c.finishedAt : 9e15));
    const rank = {}; ranked.forEach((p, i) => rank[p.key] = i + 1);
    const rows = [];
    const rowOf = (pre, name, cls, no, p, note) => [pre, name, cls, no, p ? 'มา' : 'ขาด', p ? p.sc[0] : '', p ? p.sc[1] : '', p ? p.sc[2] : '', p ? total(p) : '', p ? rank[p.key] : '', p ? p.nick : '', p ? p.helpUsed : '', p ? (p.done ? 'เล่นจบ' : 'ยังไม่จบ (LV.' + p.lv + ')') : '', note || ''];
    roster.forEach(r => {
      const p = ps.filter(x => String(x.no) === String(r.no))[0] || ps.filter(x => norm_(x.name) === norm_(r.name))[0];
      if (p) used[p.key] = 1; rows.push(rowOf(r.prefix, r.name, room.class, r.no, p, ''));
    });
    ps.filter(p => !used[p.key]).forEach(p => rows.push(rowOf('', p.name, p.cls, p.no, p, 'ไม่พบในรายชื่อชั้นนี้')));
    rows.sort((a, c) => Number(a[3]) - Number(c[3]));
    const title = 'Sci-Lab ' + room.class + ' ' + Utilities.formatDate(new Date(), TZ, 'dd-MM-yyyy HH.mm') + ' (ห้อง ' + room.code + ')';
    const book = SpreadsheetApp.create(title), s = book.getSheets()[0]; s.setName('คะแนน');
    const head = ['คำนำหน้า', 'ชื่อ-นามสกุล', 'ชั้น', 'เลขที่', 'สถานะ', 'คะแนน LV.1', 'คะแนน LV.2', 'คะแนน LV.3', 'รวม', 'อันดับ', 'ชื่อเล่น', 'ใช้ความช่วยเหลือ (ครั้ง)', 'ความคืบหน้า', 'หมายเหตุ'];
    s.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold').setBackground('#0b2a6b').setFontColor('#ffffff');
    if (rows.length) {
      s.getRange(2, 1, rows.length, head.length).setValues(rows);
      s.getRange(2, 5, rows.length, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['มา', 'ขาด', 'ลา'], true).build());
    }
    s.setFrozenRows(1); s.autoResizeColumns(1, head.length);
    const id = Utilities.getUuid().slice(0, 8);
    SAVED().appendRow([id, room.code, room.class, title, book.getUrl(), book.getId(), now_()]);
    return { url: book.getUrl(), id: id };
  },
  listSaved(b) { auth_(b); return SAVED().getDataRange().getValues().slice(1).map(r => ({ id: r[0], room: r[1], class: r[2], title: r[3], url: r[4], savedAt: r[6] })).reverse(); },
  deleteSaved(b) {
    auth_(b); const s = SAVED(), v = s.getDataRange().getValues();
    for (let i = v.length - 1; i >= 1; i--) if (v[i][0] === b.id) { try { DriveApp.getFileById(v[i][5]).setTrashed(true); } catch (e) { } s.deleteRow(i + 1); }
    return true;
  }
};
