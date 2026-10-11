(function () { // พื้นหลังดาว/วงจร
  const c = document.getElementById("bg"); if (!c) return; const g = c.getContext("2d"); let W, H, P = [];
  function rs() { W = c.width = innerWidth; H = c.height = innerHeight; P = Array.from({ length: Math.min(90, W / 14) }, () => ({ x: Math.random() * W, y: Math.random() * H, v: .15 + Math.random() * .5, r: Math.random() * 1.8 + .4, red: Math.random() < .12 })); }
  addEventListener("resize", rs); rs();
  (function loop() {
    g.clearRect(0, 0, W, H);
    P.forEach(p => { p.y += p.v; if (p.y > H) { p.y = 0; p.x = Math.random() * W; } g.fillStyle = p.red ? "rgba(255,46,85,.7)" : "rgba(25,227,255,.6)"; g.fillRect(p.x, p.y, p.r, p.r * 5); });
    requestAnimationFrame(loop);
  })();
})();
function confetti(n = 140) {
  const c = document.createElement("canvas"); c.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:99"; document.body.appendChild(c);
  const g = c.getContext("2d"); c.width = innerWidth; c.height = innerHeight; const col = ["#19e3ff", "#2f7bff", "#ff2e55", "#fff"];
  const P = Array.from({ length: n }, () => ({ x: Math.random() * c.width, y: -20 - Math.random() * 200, vx: Math.random() * 4 - 2, vy: 2 + Math.random() * 4, s: 4 + Math.random() * 6, c: col[Math.random() * 4 | 0], r: Math.random() * 6 }));
  let f = 0; (function loop() { g.clearRect(0, 0, c.width, c.height); P.forEach(p => { p.x += p.vx; p.y += p.vy; p.r += .1; g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); g.restore(); }); if (++f < 260) requestAnimationFrame(loop); else c.remove(); })();
}
function toast(msg, ms = 2600) {
  let t = document.getElementById("toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("show"); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("show"), ms);
}
