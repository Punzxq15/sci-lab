const API = {
  async call(action, payload = {}) {
    if (!CONFIG.API_URL) throw new Error("ยังไม่ได้ตั้งค่า API_URL ในไฟล์ js/config.js");
    // ใช้ text/plain เพื่อเลี่ยง CORS preflight ของ Apps Script
    const r = await fetch(CONFIG.API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, ...payload })
    });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || "เกิดข้อผิดพลาด");
    return j.data;
  }
};
const PREFIX_RE = /^(เด็กชาย|เด็กหญิง|ด\.?\s*ช\.?|ด\.?\s*ญ\.?|นางสาว|น\.?\s*ส\.?|นาง|นาย)[\s.]*/;
function cleanName(s) {               // ลบคำนำหน้า + จุด + ช่องว่าง "เฉพาะด้านหน้า"
  s = String(s || "").trim().replace(/\s+/g, " ");
  let p; do { p = s; s = s.replace(PREFIX_RE, ""); } while (s !== p);
  return s.trim();
}
function esc(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
