// ข้อมูลด่านทั้งหมด: 3 ภารกิจ (LV) x 3 ด่านย่อย
// lines: โค้ด Python มีช่องว่าง {0} {1} ... | tiles: ชิ้นคำสั่งที่ลาก | sols: เฉลย (มีได้หลายแบบ)
const LEVELS = [
  {
    id: 1, name: "ACCESS", th: "เข้าถึงข้อมูล", color: "#19e3ff",
    story: "🚨 ระบบประตูล็อก! ต้องดึงค่า Gravity (แรงโน้มถ่วง) และ Oxygen_Level (ระดับออกซิเจน) จาก Dictionary เพื่อคำนวณรหัสปลดล็อกประตูห้องทดลอง",
    cheat: ["lab_data['key']  → ดึงค่าด้วยคีย์ (ถ้าไม่มีคีย์ = KeyError)", "lab_data.get('key') → ดึงค่า (ถ้าไม่มีคีย์ = None)", "ชื่อคีย์ต้องมีเครื่องหมาย ' ' และพิมพ์เล็ก-ใหญ่ให้ตรง"],
    puzzles: [
      { title: "ดึงค่าแรงโน้มถ่วง", scene: ["🔒", "🔓"], fx: "door",
        story: "แผงควบคุมต้องการค่า Gravity — ดึงค่ามาแสดงด้วย print()",
        data: { Gravity: 9.8, Oxygen_Level: 21, Temperature: 24, Door: "Locked" },
        lines: ["gravity = lab_data[{0}]", "print(gravity)"],
        tiles: ["'Gravity'", "'gravity'", "Gravity", "'Oxygen_Level'"], sols: [["'Gravity'"]],
        keySlots: [0], hint: "คีย์ต้องเป็นข้อความในเครื่องหมาย ' ' และตัวพิมพ์ใหญ่-เล็กต้องตรง คือ 'Gravity'",
        run: d => ({ out: [String(d.Gravity)] }) },
      { title: "ใช้ .get()", scene: ["🔒", "🔓"], fx: "door",
        story: "ดึงค่า Oxygen_Level ด้วยเมธอด .get() แล้วแสดงผล",
        data: { Gravity: 9.8, Oxygen_Level: 21, Temperature: 24, Door: "Locked" },
        lines: ["oxy = lab_data.{0}({1})", "print(oxy)"],
        tiles: ["get", "keys", "append", "'Oxygen_Level'", "'Oxygen'"], sols: [["get", "'Oxygen_Level'"]],
        methSlots: [0], keySlots: [1], hint: "เมธอดดึงค่าจากคีย์คือ get และใส่ชื่อคีย์ให้ถูกต้อง",
        run: d => ({ out: [String(d.Oxygen_Level)] }) },
      { title: "คำนวณรหัสปลดล็อก", scene: ["🔒", "🔓"], fx: "door",
        story: "รหัสปลดล็อก = (Gravity × 10) + Oxygen_Level  ลากคีย์ให้ถูกลำดับ",
        data: { Gravity: 9.8, Oxygen_Level: 21, Temperature: 24, Door: "Locked" },
        lines: ["code = int(lab_data[{0}] * 10) + lab_data[{1}]", "print(code)"],
        tiles: ["'Gravity'", "'Oxygen_Level'", "'Temperature'", "'Door'"], sols: [["'Gravity'", "'Oxygen_Level'"]],
        keySlots: [0, 1], hint: "ช่องแรกคือ Gravity (คูณ 10) ช่องที่สองคือ Oxygen_Level",
        run: d => { const c = Math.trunc(d.Gravity * 10) + d.Oxygen_Level; d.Door = "Unlocked"; return { out: [String(c)], big: "รหัส " + c }; } }
    ]
  },
  {
    id: 2, name: "MODIFY", th: "เพิ่ม / แก้ไขข้อมูล", color: "#2f7bff",
    story: "🔥 ไฟไหม้ในห้องแล็บ! ต้องผสมสารเคมีเพื่อดับไฟ — เพิ่มสาร H2O เข้าระบบ แล้วเปลี่ยนสถานะน้ำจาก Solid เป็น Liquid",
    cheat: ["lab_data['new'] = value → เพิ่มคีย์ใหม่ / แก้ค่าคีย์เดิม", "lab_data['A']['B'] = v → แก้ค่าใน Dictionary ซ้อน", "lab_data.update({'k': v}) → เพิ่ม/แก้หลายค่าพร้อมกัน"],
    puzzles: [
      { title: "เพิ่มสารเคมี H2O", scene: ["🧊", "🧊"], fx: "add",
        story: "ลงทะเบียนสาร 'H2O' ที่เป็น 'Solid' (น้ำแข็ง) เข้าสู่ระบบ",
        data: { NaCl: "Solid", CO2: "Gas", Fire: "On" },
        lines: ["lab_data[{0}] = {1}"],
        tiles: ["'H2O'", "'Solid'", "'Liquid'", "h2o"], sols: [["'H2O'", "'Solid'"]],
        hint: "ชื่อคีย์ใหม่คือ 'H2O' และตอนนี้น้ำเป็นของแข็ง 'Solid'",
        run: d => { d.H2O = "Solid"; return { out: ["เพิ่ม H2O สำเร็จ"] }; } },
      { title: "อัปเดตสถานะของน้ำ", scene: ["🧊", "💧"], fx: "add",
        story: "เปลี่ยน State ของ H2O จาก 'Solid' เป็น 'Liquid'",
        data: { NaCl: "Solid", H2O: { State: "Solid", Volume: 500 }, Fire: "On" },
        lines: ["lab_data[{0}][{1}] = {2}"],
        tiles: ["'H2O'", "'State'", "'Liquid'", "'Solid'", "'Volume'"], sols: [["'H2O'", "'State'", "'Liquid'"]],
        keySlots: [0], keys: ["NaCl", "H2O", "Fire"], hint: "เข้า 'H2O' ก่อน แล้วเข้า 'State' แล้วกำหนดเป็น 'Liquid'",
        run: d => { d.H2O.State = "Liquid"; return { out: ["H2O → Liquid"] }; } },
      { title: "ดับไฟด้วย .update()", scene: ["🔥", "✅"], fx: "fire",
        story: "ใช้ .update() เปลี่ยน Fire เป็น 'Out' เพื่อดับไฟ",
        data: { NaCl: "Solid", H2O: { State: "Liquid", Volume: 500 }, Fire: "On" },
        lines: ["lab_data.{0}({1})"],
        tiles: ["update", "append", "add", "{'Fire': 'Out'}", "{'Fire': 'On'}", "{'Water': 'Out'}"], sols: [["update", "{'Fire': 'Out'}"]],
        methSlots: [0], hint: "เมธอดคือ update และ Dictionary ต้องเป็น {'Fire': 'Out'}",
        run: d => { d.Fire = "Out"; return { out: ["🔥 ไฟดับแล้ว!"], big: "FIRE OUT" }; } }
    ]
  },
  {
    id: 3, name: "DELETE", th: "ลบข้อมูล", color: "#ff2e55",
    story: "☣️ สารเคมีอันตรายรั่วไหล! ใช้ del หรือ .pop() ลบ Toxic_Gas ออกจากระบบให้ทันก่อนห้องแล็บจะระเบิด (มีเวลาจำกัด!)",
    cheat: ["del lab_data['key'] → ลบคีย์นั้นทิ้ง", "lab_data.pop('key') → ลบและคืนค่าที่ลบ", "lab_data.clear() → ลบทุกอย่าง (ระวัง!)"],
    puzzles: [
      { title: "ลบด้วย del", time: 60, scene: ["☣️", "🫧"], fx: "gas",
        story: "ลบ 'Toxic_Gas' ด้วยคำสั่ง del ก่อนเวลาหมด",
        data: { Oxygen_Level: 21, Toxic_Gas: 80, Leak_Valve: "Open" },
        lines: ["del lab_data[{0}]"],
        tiles: ["'Toxic_Gas'", "'toxic_gas'", "'Leak_Valve'", "'Oxygen_Level'"], sols: [["'Toxic_Gas'"]],
        keySlots: [0], keys: ["Oxygen_Level", "Toxic_Gas", "Leak_Valve"], hint: "ลบคีย์ 'Toxic_Gas' (ตัวพิมพ์ใหญ่ตามระบบ)",
        run: d => { delete d.Toxic_Gas; return { out: ["ลบ Toxic_Gas แล้ว"] }; } },
      { title: "ลบด้วย .pop()", time: 50, scene: ["☣️", "🫧"], fx: "gas",
        story: "ใช้ .pop() ลบ 'Toxic_Gas' และดูค่าที่ถูกลบออกมา",
        data: { Oxygen_Level: 21, Toxic_Gas: 80, Leak_Valve: "Open" },
        lines: ["gas = lab_data.{0}({1})", "print(gas)"],
        tiles: ["pop", "remove", "clear", "'Toxic_Gas'", "'Leak_Valve'"], sols: [["pop", "'Toxic_Gas'"]],
        methSlots: [0], keySlots: [1], keys: ["Oxygen_Level", "Toxic_Gas", "Leak_Valve"],
        hint: "pop(คีย์) ลบคีย์และคืนค่า — .clear() จะลบทั้งหมดซึ่งไม่ใช่สิ่งที่ต้องการ",
        run: d => { const v = d.Toxic_Gas; delete d.Toxic_Gas; return { out: [String(v)] }; } },
      { title: "ภารกิจสุดท้าย!", time: 45, scene: ["💥", "🛡️"], fx: "gas",
        story: "ลบทั้ง 'Toxic_Gas' (ด้วย del) และ 'Radiation' (ด้วย .pop()) ให้หมด!",
        data: { Oxygen_Level: 21, Toxic_Gas: 80, Radiation: "High", Leak_Valve: "Open" },
        lines: ["{0} lab_data[{1}]", "lab_data.pop({2})"],
        tiles: ["del", "remove", "'Toxic_Gas'", "'Radiation'", "'Oxygen_Level'"],
        sols: [["del", "'Toxic_Gas'", "'Radiation'"], ["del", "'Radiation'", "'Toxic_Gas'"]],
        kwSlots: [0], keySlots: [1, 2], keys: ["Oxygen_Level", "Toxic_Gas", "Radiation", "Leak_Valve"],
        hint: "บรรทัดแรกขึ้นต้นด้วย del แล้วใส่คีย์ที่ต่างจากบรรทัดที่สอง",
        run: d => { delete d.Toxic_Gas; delete d.Radiation; return { out: ["ระบบปลอดภัย ✔"], big: "SAFE" }; } }
    ]
  }
];
const PZ_BASE = [30, 30, 40];   // คะแนนเต็มต่อด่านย่อย (รวม 100 ต่อ LV)
