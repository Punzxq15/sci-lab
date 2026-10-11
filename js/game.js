const $ = s => document.querySelector(s);
const S = { room: "", key: "", name: "", cls: "", no: "", nick: "", lv: 1, pz: 0, hearts: CONFIG.HEARTS, helpLeft: 1, sc: [0, 0, 0],
  done: false, finishedAt: 0, helpUsed: 0, restarts: 0, aidSeq: 0, aidH: 0, aidP: 0 };
let P = null, syncT = null, tickT = null, boardT = null, modalOpen = false;

function show(id) { document.querySelectorAll(".screen").forEach(e => e.classList.remove("on")); $("#" + id).classList.add("on"); scrollTo(0, 0); }
function modal(html) { $("#modalCard").innerHTML = html; $("#modal").classList.add("on"); modalOpen = true; }
function closeModal() { $("#modal").classList.remove("on"); modalOpen = false; }
document.addEventListener("pointerdown", () => SFX.start(), { once: true });
$("#musicBtn").onclick = () => { SFX.start(); $("#musicBtn").textContent = SFX.toggle() ? "🔊" : "🔇"; };
CONFIG.CLASSES.forEach(c => $("#fcls").insertAdjacentHTML("beforeend", `<option>${c}</option>`));

// ---------- Login ----------
$("#fname").oninput = () => { const c = cleanName($("#fname").value); $("#namePrev").textContent = c ? "ระบบจะบันทึกชื่อ: " + c : ""; };
$("#b1").onclick = () => {
  SFX.click(); const n = cleanName($("#fname").value), no = parseInt($("#fno").value);
  if (!n || !n.includes(" ")) return $("#e1").textContent = "กรอกชื่อและนามสกุล โดยเว้นวรรคระหว่างชื่อกับนามสกุล";
  if (!no || no < 1) return $("#e1").textContent = "กรอกเลขที่ให้ถูกต้อง";
  $("#e1").textContent = ""; S.name = n; S.cls = $("#fcls").value; S.no = no;
  $("#welcome").textContent = `สวัสดีนักวิทยาศาสตร์ ${n} (${S.cls} เลขที่ ${no})`; show("s-login2");
};
$("#b2back").onclick = () => show("s-login1");
$("#b2").onclick = async () => {
  const nick = $("#fnick").value.trim(), code = $("#fcode").value.trim();
  if (!nick) return $("#e2").textContent = "กรอกชื่อเล่น";
  if (!/^\d{4}$/.test(code)) return $("#e2").textContent = "รหัสห้องต้องเป็นตัวเลข 4 หลัก";
  $("#b2").disabled = true; $("#e2").textContent = "กำลังเชื่อมต่อ...";
  try {
    const r = await API.call("join", { code, name: S.name, cls: S.cls, no: S.no, nick });
    Object.assign(S, r.state, { room: code, nick }); S.key = r.state.key;
    localStorage.setItem("scilab", JSON.stringify({ code, name: S.name, cls: S.cls, no: S.no, nick }));
    SFX.boot(); startSync(); S.done ? showEnd() : intro();
  } catch (e) { $("#e2").textContent = e.message; } finally { $("#b2").disabled = false; }
};
(function resume() { try { const x = JSON.parse(localStorage.getItem("scilab")); if (x) { $("#fname").value = x.name; $("#fno").value = x.no; $("#fcls").value = x.cls; $("#fnick").value = x.nick; $("#fcode").value = x.code; } } catch (e) { } })();

// ---------- Sync ----------
function pub() { return { lv: S.lv, pz: S.pz, hearts: S.hearts, helpLeft: S.helpLeft, sc: S.sc, done: S.done, finishedAt: S.finishedAt, helpUsed: S.helpUsed, restarts: S.restarts }; }
async function push() {
  try {
    const r = await API.call("push", { code: S.room, key: S.key, state: pub() });
    if (r.roomStatus === "gone") return toast("ห้องนี้ถูกลบโดยครูแล้ว");
    const a = r.aid; if (a && a.seq > S.aidSeq) {
      const dh = a.h - S.aidH, dp = a.p - S.aidP; S.aidSeq = a.seq; S.aidH = a.h; S.aidP = a.p;
      if (!S.done) { S.hearts = Math.min(9, S.hearts + dh); S.helpLeft += dp; SFX.hint(); toast("📡 ครูส่งความช่วยเหลือ: " + (a.msg || "สู้ๆ!") + (dh ? ` (+${dh}❤️)` : "") + (dp ? ` (+${dp}💡)` : ""), 5000); hud(); }
    }
  } catch (e) { /* เงียบไว้ ลองใหม่รอบถัดไป */ }
}
function startSync() { clearInterval(syncT); syncT = setInterval(push, CONFIG.POLL_MS); }

// ---------- Intro ----------
function intro() {
  const L = LEVELS[S.lv - 1]; show("s-intro");
  $("#introCard").innerHTML = `<h2 style="color:${L.color}">LV.${L.id} ${L.name}</h2><h3>${L.th}</h3><p>${L.story}</p>
  <div class="term">${L.cheat.map(c => `<div class="o">${esc(c)}</div>`).join("")}</div>
  <p class="hint">❤️ ${CONFIG.HEARTS} ดวง • 💡 ขอความช่วยเหลือได้ 1 ครั้ง • หัวใจหมด = เริ่ม LV นี้ใหม่</p>
  <button class="btn red" style="width:100%" id="goBtn">เริ่มภารกิจ ▶</button>`;
  $("#goBtn").onclick = () => { SFX.ok(); startPuzzle(); }; SFX.alarm();
}

// ---------- Puzzle ----------
const isStr = t => /^['"{]/.test(t);
function pyRepr(v, ind = 0) {
  if (v && typeof v === "object") { const pad = " ".repeat(ind + 2); return "{\n" + Object.keys(v).map(k => `${pad}<span class="k" data-k="${k}">'${k}'</span>: ${pyRepr(v[k], ind + 2)}`).join(",\n") + "\n" + " ".repeat(ind) + "}"; }
  return typeof v === "string" ? `<span class="s">'${esc(v)}'</span>` : `<span class="n">${v}</span>`;
}
function hud() {
  const L = LEVELS[S.lv - 1];
  $("#hLv").innerHTML = `<span style="color:${L.color}">LV.${S.lv}</span> ${L.name} • ด่าน ${S.pz + 1}/3`;
  $("#hHearts").innerHTML = Array.from({ length: Math.max(CONFIG.HEARTS, S.hearts) }, (_, i) => `<span class="${i < S.hearts ? "" : "lost"}">❤️</span>`).join("");
  $("#hScore").textContent = "⭐ " + S.sc.reduce((a, b) => a + b, 0);
  $("#helpBtn").textContent = `💡 ขอความช่วยเหลือ (${S.helpLeft})`;
}
function startPuzzle() {
  const z = LEVELS[S.lv - 1].puzzles[S.pz]; show("s-play");
  P = { z, tiles: z.tiles.map((t, i) => ({ id: "t" + i, txt: t })).sort(() => Math.random() - .5), slots: Array(z.sols[0].length).fill(null), locked: new Set(), wrong: 0, helped: false, busy: false, left: z.time || 0 };
  $("#scene").dataset.fx = z.fx; $("#scene").className = "card scene"; $("#sceneIcon").textContent = z.scene[0]; $("#sceneLabel").textContent = "";
  $("#pzTitle").textContent = `ด่าน ${S.lv}-${S.pz + 1}: ${z.title}`; $("#pzStory").textContent = z.story;
  $("#dict").innerHTML = pyRepr(z.data); $("#nextBtn").style.display = "none"; $("#runBtn").disabled = false;
  $("#term").innerHTML = `<span class="p">&gt;&gt;&gt; พร้อมรับคำสั่ง...</span>`;
  $("#tbar").style.display = z.time ? "block" : "none"; clearInterval(tickT);
  if (z.time) { $("#tfill").style.width = "100%"; tickT = setInterval(tick, 1000); }
  hud(); renderPz(); push();
}
function tick() {
  if (!P || P.busy || modalOpen) return; P.left--; $("#tfill").style.width = (P.left / P.z.time * 100) + "%"; if (P.left <= 10) { SFX.tick(); $("#scene").classList.add("alarm"); }
  if (P.left <= 0) { toast("⏰ หมดเวลา! แก๊สพิษลุกลาม"); fail("TimeoutError: หมดเวลา"); P.left = P.z.time; $("#tfill").style.width = "100%"; }
}
function renderPz() {
  const z = P.z; let html = "";
  z.lines.forEach((ln, li) => { html += `<div class="codeline"><span class="ln">${li + 1}</span>` + ln.split(/(\{\d+\})/).map(p => { const m = p.match(/^\{(\d+)\}$/); if (!m) return `<span class="${/^(del|print|int)/.test(p) ? "kw" : ""}">${esc(p)}</span>`; const i = +m[1], t = P.tiles.find(x => x.id === P.slots[i]); return `<span class="slot ${P.locked.has(i) ? "locked" : ""}" data-i="${i}">${t ? tileHtml(t) : ""}</span>`; }).join("") + "</div>"; });
  $("#code").innerHTML = html;
  $("#bank").innerHTML = P.tiles.filter(t => !P.slots.includes(t.id)).map(tileHtml).join("");
  document.querySelectorAll(".tile").forEach(bind);
}
const tileHtml = t => `<span class="tile ${isStr(t.txt) ? "str" : "kwd"}" data-id="${t.id}">${esc(t.txt)}</span>`;
function place(id, i) { if (P.busy || P.locked.has(i)) return; const o = P.slots.indexOf(id); if (o >= 0) { if (P.locked.has(o)) return; P.slots[o] = null; } P.slots[i] = id; SFX.drop(); renderPz(); }
function unplace(id) { const o = P.slots.indexOf(id); if (o >= 0 && !P.locked.has(o) && !P.busy) { P.slots[o] = null; SFX.click(); renderPz(); } }
function bind(el) {
  el.addEventListener("pointerdown", e => {
    if (P.busy) return; e.preventDefault(); SFX.pick(); const sx = e.clientX, sy = e.clientY; let g = null, mv = false; el.setPointerCapture(e.pointerId);
    const move = ev => { if (!mv && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 7) { mv = true; g = el.cloneNode(true); g.classList.add("ghost"); document.body.appendChild(g); el.classList.add("lifted"); }
      if (mv) { g.style.left = ev.clientX + "px"; g.style.top = ev.clientY + "px"; document.querySelectorAll(".slot").forEach(s => s.classList.remove("over")); const t = document.elementFromPoint(ev.clientX, ev.clientY); const s = t && t.closest(".slot"); if (s) s.classList.add("over"); } };
    const up = ev => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up); const id = el.dataset.id;
      if (mv) { g.remove(); const t = document.elementFromPoint(ev.clientX, ev.clientY), s = t && t.closest(".slot"); if (s) place(id, +s.dataset.i); else if (t && t.closest("#bank")) unplace(id); else renderPz(); }
      else if (P.slots.includes(id)) unplace(id); else { const i = P.slots.findIndex((x, k) => !x && !P.locked.has(k)); if (i >= 0) place(id, i); } };
    el.addEventListener("pointermove", move); el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
  });
}
$("#resetBtn").onclick = () => { if (P.busy) return; P.slots = P.slots.map((x, i) => P.locked.has(i) ? x : null); SFX.click(); renderPz(); };
$("#helpBtn").onclick = () => {
  if (!P || P.busy) return; if (S.helpLeft <= 0) return toast("ใช้สิทธิ์ขอความช่วยเหลือหมดแล้ว (ขอครูได้นะ!)");
  const sol = P.z.sols[0], i = sol.findIndex((s, k) => P.slots[k] ? P.tiles.find(t => t.id === P.slots[k]).txt !== s : true); if (i < 0) return toast("ตอบถูกแล้วนะ กด RUN ได้เลย");
  const tile = P.tiles.find(t => t.txt === sol[i]); P.slots = P.slots.map(x => x === tile.id ? null : x); P.slots[i] = tile.id; P.locked.add(i);
  S.helpLeft--; S.helpUsed++; P.helped = true; SFX.hint(); renderPz(); hud(); push();
  $("#term").innerHTML = `<span class="o">💡 คำใบ้: ${esc(P.z.hint)}</span>`;
};
function errFor(vals) {
  const z = P.z, M = ["get", "update", "pop", "keys", "values", "items", "clear", "copy"];
  for (const i of z.kwSlots || []) if (vals[i] !== "del") return "SyntaxError: invalid syntax";
  for (const i of z.methSlots || []) if (!M.includes(vals[i])) return `AttributeError: 'dict' object has no attribute '${vals[i]}'`;
  for (const i of z.keySlots || []) { const v = vals[i]; if (/^[A-Za-z_]\w*$/.test(v)) return `NameError: name '${v}' is not defined`;
    const k = v.replace(/^'|'$/g, ""), keys = z.keys || Object.keys(z.data); if (/^'/.test(v) && !keys.includes(k) && !(z.lines[0].includes("get"))) return `KeyError: '${k}'`; }
  return "❌ ผลลัพธ์ไม่ตรงกับเงื่อนไขภารกิจ ลองตรวจคำสั่งอีกครั้ง";
}
$("#runBtn").onclick = () => {
  if (P.busy || modalOpen) return; if (P.slots.some(x => !x)) return toast("ลากคำสั่งให้ครบทุกช่องก่อน");
  const vals = P.slots.map(id => P.tiles.find(t => t.id === id).txt);
  P.z.sols.some(s => s.every((v, i) => v === vals[i])) ? success() : fail(errFor(vals), vals);
};
function fail(msg) {
  P.wrong++; S.hearts--; SFX.bad(); hud(); $("#hHearts").classList.add("hit"); setTimeout(() => $("#hHearts").classList.remove("hit"), 500);
  document.querySelectorAll(".slot").forEach(s => s.classList.add("bad")); document.body.classList.add("shake"); setTimeout(() => document.body.classList.remove("shake"), 450);
  $("#term").innerHTML = `<div class="e">${esc(msg)}</div><div class="p">-1 ❤️</div>`; push();
  if (S.hearts <= 0) gameOver();
}
function success() {
  P.busy = true; clearInterval(tickT); $("#runBtn").disabled = true; const z = P.z, d = JSON.parse(JSON.stringify(z.data)), r = z.run(d);
  const base = PZ_BASE[S.pz], pts = Math.max(Math.round(base * .3), base - 4 * P.wrong - (P.helped ? 4 : 0)); S.sc[S.lv - 1] += pts;
  $("#dict").innerHTML = pyRepr(d); document.querySelectorAll("#dict .k").forEach(k => { if (JSON.stringify(z.data[k.dataset.k]) !== JSON.stringify(d[k.dataset.k])) k.classList.add("hl"); });
  $("#sceneIcon").textContent = z.scene[1]; $("#scene").classList.remove("alarm"); $("#scene").classList.add("done"); $("#sceneLabel").textContent = r.big || "";
  $("#term").innerHTML = r.out.map(o => `<div class="o">${esc(o)}</div>`).join("") + `<div class="p">+${pts} คะแนน</div>`;
  SFX.ok(); confetti(50); hud(); $("#nextBtn").style.display = "block"; push();
}
$("#nextBtn").onclick = () => { SFX.click(); S.pz++; if (S.pz < 3) return startPuzzle(); lvDone(); };
function lvDone() {
  const sc = S.sc[S.lv - 1], st = sc >= 90 ? 3 : sc >= 60 ? 2 : 1; SFX.win(); confetti(160); push();
  modal(`<h2 class="logo" style="font-size:30px">LV.${S.lv} CLEAR!</h2><div class="stars" style="text-align:center">${"⭐".repeat(st)}${"☆".repeat(3 - st)}</div><h3 style="text-align:center">คะแนน ${sc} / 100</h3><button class="btn red" style="width:100%" id="mNext">${S.lv < 3 ? "ภารกิจต่อไป ▶" : "ดูผลสรุป 🏆"}</button>`);
  $("#mNext").onclick = () => { closeModal(); if (S.lv < 3) { S.lv++; S.pz = 0; S.hearts = CONFIG.HEARTS; S.helpLeft = 1; push(); intro(); } else finish(); };
}
function gameOver() {
  clearInterval(tickT); SFX.lose(); P.busy = true;
  modal(`<h2 style="color:var(--red)">💥 SYSTEM FAILURE</h2><p>หัวใจหมด! ต้องเริ่ม LV.${S.lv} ใหม่ตั้งแต่ด่านแรก</p><button class="btn red" style="width:100%" id="mRe">เริ่มใหม่ ↺</button>`);
  $("#mRe").onclick = () => { closeModal(); S.sc[S.lv - 1] = 0; S.pz = 0; S.hearts = CONFIG.HEARTS; S.helpLeft = 1; S.restarts++; push(); intro(); };
}
async function finish() { S.done = true; S.finishedAt = Date.now(); await push(); showEnd(); }

// ---------- End / Leaderboard ----------
function rankList(ps) { return ps.slice().sort((a, b) => tot(b) - tot(a) || (a.done ? a.finishedAt : 9e15) - (b.done ? b.finishedAt : 9e15)); }
const tot = p => (p.sc || [0, 0, 0]).reduce((a, b) => a + b, 0);
function showEnd() {
  show("s-end"); clearInterval(tickT); SFX.win(); confetti(200); loadBoard(); clearInterval(boardT); boardT = setInterval(loadBoard, CONFIG.POLL_MS);
}
async function loadBoard() {
  try {
    const b = await API.call("board", { code: S.room }), L = rankList(b.players), me = L.findIndex(p => p.key === S.key);
    $("#endSub").textContent = `${S.nick} • คะแนนรวม ${tot(S)} • อันดับ ${me + 1}/${L.length}`;
    const icons = ["🥇", "🥈", "🥉"], pod = [1, 0, 2].filter(i => L[i]).map(i => `<div class="p${i + 1}"><div style="font-size:30px">${icons[i]}</div><b>${esc(L[i].nick)}</b><div>${tot(L[i])}</div></div>`).join("");
    $("#podium").innerHTML = pod;
    $("#lb").innerHTML = `<tr><th>#</th><th>ชื่อเล่น</th><th>LV1</th><th>LV2</th><th>LV3</th><th>รวม</th><th>สถานะ</th></tr>` + L.map((p, i) => `<tr class="${p.key === S.key ? "me" : ""} ${p.done ? "" : "play"}"><td>${i + 1}</td><td>${esc(p.nick)}</td><td>${p.sc[0]}</td><td>${p.sc[1]}</td><td>${p.sc[2]}</td><td><b>${tot(p)}</b></td><td>${p.done ? '<span class="tag ok">เสร็จแล้ว</span>' : `<span class="tag red">กำลังเล่น LV.${p.lv} ด่าน ${p.pz + 1}</span>`}</td></tr>`).join("");
  } catch (e) { }
}
