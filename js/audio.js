const SFX = (() => {
  let ctx, master, musicOn = true, timer, step = 0, started = false;
  const init = () => { if (ctx) return; ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = .5; master.connect(ctx.destination); };
  function tone(f, d = .15, type = "sine", v = .2, delay = 0, to) {
    if (!ctx) return; const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g); g.connect(master); o.start(t); o.stop(t + d + .02);
  }
  const seq = (arr, type, v, gap = .09) => arr.forEach((f, i) => tone(f, .18, type, v, i * gap));
  const notes = [220, 261.6, 329.6, 392, 329.6, 261.6, 392, 440];
  function music() {
    clearInterval(timer); if (!musicOn || !ctx) return;
    timer = setInterval(() => { const n = notes[step % 8]; tone(n, .25, "triangle", .05); if (step % 4 === 0) tone(n / 2, .5, "sine", .08); step++; }, 230);
  }
  return {
    start() { init(); if (ctx.state === "suspended") ctx.resume(); if (!started) { started = true; music(); } },
    toggle() { musicOn = !musicOn; musicOn ? music() : clearInterval(timer); return musicOn; },
    click() { tone(660, .06, "square", .06); },
    pick() { tone(440, .08, "triangle", .12); },
    drop() { tone(320, .1, "triangle", .15); tone(520, .08, "sine", .1, .05); },
    ok() { seq([523, 659, 784, 1047], "triangle", .18); },
    bad() { tone(180, .35, "sawtooth", .2, 0, 70); tone(120, .35, "square", .1, .05, 60); },
    heart() { tone(300, .25, "sawtooth", .15, 0, 100); },
    hint() { seq([880, 1100], "sine", .15, .12); },
    tick() { tone(900, .04, "square", .05); },
    alarm() { tone(880, .15, "square", .1); tone(660, .15, "square", .1, .18); },
    win() { seq([523, 659, 784, 1047, 784, 1047, 1319], "triangle", .2, .12); },
    lose() { seq([392, 330, 262, 196], "sawtooth", .15, .18); },
    boot() { tone(100, .6, "sawtooth", .1, 0, 800); }
  };
})();
