// ===== ตั้งค่าเกม Sci-Lab =====
const CONFIG = {
  // วาง URL ของ Web App ที่ได้จาก Apps Script (ลงท้ายด้วย /exec)
  API_URL: "https://script.google.com/macros/s/AKfycbwlo6KkUaH80sMZQ5cpjnSLdPdrlsVMMyC_4zLMrlSz--ngidnT6vBR8fAEq5hdLuHb/exec",
  // รายชื่อชั้นเรียน (แก้ไข/เพิ่มได้ เช่น "ป.1/1", "ป.1/2")
  CLASSES: ["ป.1", "ป.2", "ป.3", "ป.4", "ป.5", "ป.6"],
  HEARTS: 5,            // หัวใจต่อ LV
  POLL_MS: 4000         // ความถี่ซิงค์ข้อมูลกับระบบ (มิลลิวินาที)
};
