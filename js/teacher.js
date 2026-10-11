const $ = s => document.querySelector(s);
let PW = sessionStorage.getItem("scilab_pw") || "", live = null, liveT = null, curPlayers = [];
const call = (a, p = {}) => API.call(a, { pass: PW, ...p });
const tot = p => p.sc.reduce((a, b) => a + b, 0);
const view = id => document.querySelectorAll(".screen").forEach(e => e.classList.toggle("on", e.id === id));
CONFIG.CLASSES.forEach(c => ["#newCls", "#rosCls"].forEach(s => $(s).insertAdjacentHTML("beforeend", `<option>${c}</option>`)));

async function login() {
  try { await call("teacherLogin"); sessionStorage.setItem("scilab_pw", PW); view("tMain"); loadRooms(); const i = await call("info"); $("#masterLink").href = i.masterUrl; loadRoster(); }
  catch (e) { $("#te").textContent = e.message; sessionStorage.removeItem("scilab_pw"); view("tLogin"); }
}
$("#pwBtn").onclick = () => { PW = $("#pw").value; login(); };
$("#pw").onkeydown = e => e.key === "Enter" && $("#pwBtn").click();
$("#logout").onclick = () => { sessionStorage.clear(); location.reload(); };
if (PW) login();

document.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => {
  document.querySelectorAll("[data-tab]").forEach(x => x.classList.toggle("ghost", x !== b)); document.querySelectorAll("[data-tab]").forEach(x => x.classList.toggle("on", x === b));
  ["rooms", "live", "saved", "roster"].forEach(t => $("#tab-" + t).style.display = t === b.dataset.tab ? "block" : "none");
  clearInterval(liveT); if (b.dataset.tab === "live") { loadBoard(); liveT = setInterval(loadBoard, 3000); } if (b.dataset.tab === "saved") loadSaved(); if (b.dataset.tab === "rooms") loadRooms();
});

// ----- Rooms -----
let rooms = [];
async function loadRooms() {
  rooms = await call("listRooms");
  $("#roomTbl").innerHTML = `<tr><th>รหัส</th><th>ชั้น</th><th>สถานะ</th><th>ผู้เล่น</th><th></th></tr>` + rooms.map(r => `<tr><td class="code4">${r.code}</td><td>${esc(r.class)}</td><td><span class="tag ${r.status === "open" ? "ok" : "red"}">${r.status === "open" ? "เปิด" : "ปิด"}</span></td><td>${r.count}</td>
  <td><button class="btn sm ghost" onclick="toggleRoom('${r.code}','${r.status}')">${r.status === "open" ? "ปิดห้อง" : "เปิดห้อง"}</button> <button class="btn sm" onclick="watch('${r.code}')">ดูกระดาน</button> <button class="btn sm red" onclick="delRoom('${r.code}')">ลบ</button></td></tr>`).join("");
  $("#liveRoom").innerHTML = rooms.map(r => `<option value="${r.code}" ${r.code === live ? "selected" : ""}>ห้อง ${r.code} (${esc(r.class)})</option>`).join("");
}
$("#mkRoom").onclick = async () => { try { const r = await call("createRoom", { cls: $("#newCls").value }); toast("สร้างห้องแล้ว รหัส " + r.code); loadRooms(); } catch (e) { toast(e.message); } };
window.toggleRoom = async (c, s) => { await call("setRoomStatus", { code: c, status: s === "open" ? "closed" : "open" }); loadRooms(); };
window.delRoom = async c => { if (confirm("ลบห้อง " + c + " และข้อมูลผู้เล่นที่ยังไม่บันทึก?")) { await call("deleteRoom", { code: c }); loadRooms(); } };
window.watch = c => { live = c; document.querySelector('[data-tab=live]').click(); $("#liveRoom").value = c; };
$("#liveRoom").onchange = () => { live = $("#liveRoom").value; loadBoard(); };

// ----- Live board -----
async function loadBoard() {
  live = live || $("#liveRoom").value; if (!live) return;
  try {
    const b = await call("board", { code: live }), L = b.players.slice().sort((a, c) => tot(c) - tot(a) || (a.done ? a.finishedAt : 9e15) - (c.done ? c.finishedAt : 9e15)); curPlayers = L;
    const fin = L.filter(p => p.done).length; $("#liveInfo").textContent = `ห้อง ${live} • ชั้น ${b.room.class} • เล่นอยู่ ${L.length} คน • เสร็จแล้ว ${fin} คน`;
    $("#pgrid").innerHTML = L.map((p, i) => `<div class="pc ${p.done ? "done" : ""}" onclick="detail('${p.key}')"><b>#${i + 1} ${esc(p.nick)}</b><div class="hint">${esc(p.name)} (เลขที่ ${p.no})</div><div class="sc">${tot(p)}</div>
      <div>${p.done ? '<span class="tag ok">เสร็จแล้ว</span>' : `<span class="tag red">LV.${p.lv} ด่าน ${p.pz + 1}</span>`} ❤️${p.hearts} 💡${p.helpLeft}</div></div>`).join("") || '<div class="hint">ยังไม่มีนักเรียนเข้าห้อง ให้นักเรียนกรอกรหัสห้อง</div>';
  } catch (e) { toast(e.message); }
}
window.detail = key => {
  const p = curPlayers.find(x => x.key === key); if (!p) return; clearInterval(liveT);
  const m = $("#modal"); $("#modalCard").innerHTML = `<h3>${esc(p.name)} (${esc(p.nick)})</h3><div class="hint">${esc(p.cls)} เลขที่ ${p.no}</div>
  <table class="t"><tr><td>ตำแหน่ง</td><td>${p.done ? "เสร็จแล้ว" : `LV.${p.lv} ด่าน ${p.pz + 1}`}</td></tr><tr><td>หัวใจ</td><td>❤️ ${p.hearts}</td></tr><tr><td>LV1 / LV2 / LV3</td><td>${p.sc.join(" / ")} (รวม ${tot(p)})</td></tr>
  <tr><td>ใช้ความช่วยเหลือ</td><td>${p.helpUsed} ครั้ง (เหลือ ${p.helpLeft})</td></tr><tr><td>เริ่ม LV ใหม่</td><td>${p.restarts} ครั้ง</td></tr></table>
  <label>ข้อความถึงนักเรียน</label><input id="aidMsg" placeholder="เช่น ลองอ่านคำใบ้อีกครั้งนะ"><div class="row"><label><input type="checkbox" id="aidH" style="width:auto"> +1 ❤️</label><label><input type="checkbox" id="aidP" style="width:auto"> +1 💡</label></div>
  <div class="row" style="margin-top:12px"><button class="btn" id="aidGo">ส่งความช่วยเหลือ</button><button class="btn ghost" id="aidX">ปิด</button></div>`;
  m.classList.add("on");
  const close = () => { m.classList.remove("on"); liveT = setInterval(loadBoard, 3000); }; $("#aidX").onclick = close;
  $("#aidGo").onclick = async () => { await call("aid", { code: live, key, msg: $("#aidMsg").value, h: $("#aidH").checked ? 1 : 0, p: $("#aidP").checked ? 1 : 0 }); toast("ส่งแล้ว"); close(); };
};
$("#saveBtn").onclick = async () => {
  if (!confirm("บันทึกคะแนนทุกคนลง Google Sheets (เทียบกับรายชื่อชั้น " + (curPlayers[0]?.cls || "") + ")?")) return;
  $("#saveBtn").disabled = true; toast("กำลังสร้างชีต...", 8000);
  try { const r = await call("saveRoom", { code: live }); toast("บันทึกสำเร็จ"); window.open(r.url, "_blank"); } catch (e) { toast(e.message); } $("#saveBtn").disabled = false;
};

// ----- Saved -----
async function loadSaved() {
  const s = await call("listSaved");
  $("#savedTbl").innerHTML = `<tr><th>ชื่อชีต</th><th>ชั้น</th><th>บันทึกเมื่อ</th><th></th></tr>` + s.map(x => `<tr><td>${esc(x.title)}</td><td>${esc(x.class)}</td><td>${esc(x.savedAt)}</td><td><a class="btn sm" target="_blank" href="${esc(x.url)}">เปิด</a> <button class="btn sm red" onclick="delSaved('${x.id}')">ลบ</button></td></tr>`).join("");
}
window.delSaved = async id => { if (confirm("ลบชีตนี้ (ย้ายไปถังขยะ Drive)?")) { await call("deleteSaved", { id }); loadSaved(); } };

// ----- Roster -----
async function loadRoster() {
  const r = await call("getRoster", { cls: $("#rosCls").value }); $("#rosTxt").value = r.map(x => [x.no, x.prefix, x.name].join(",")).join("\n");
}
$("#rosCls").onchange = loadRoster;
$("#rosSave").onclick = async () => {
  const rows = $("#rosTxt").value.split("\n").map(l => l.trim()).filter(Boolean).map(l => {
    const c = l.split(/\t|,/).map(x => x.trim());
    if (c.length >= 3) return [c[0], c[1], c.slice(2).join(" ")];
    const full = (c[1] || "").trim(), nm = cleanName(full); return [c[0], full.slice(0, full.length - nm.length).replace(/[\s.]+$/, ""), nm];
  });
  await call("saveRoster", { cls: $("#rosCls").value, rows }); toast("บันทึกรายชื่อ " + rows.length + " คนแล้ว");
};
