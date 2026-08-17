// 用 Web Audio 合成轻量音效，无需音频素材文件。
// 音效分类：通用点击 / 导航切换 / 开始专注 / 放弃 / 完成琶音 + 气泡。
// 所有音效都受 settings.soundOn 控制（默认开启）。

let ctx = null;
let enabled = true;

export function setSoundEnabled(v) {
  enabled = !!v;
}

export function isSoundEnabled() {
  return enabled;
}

export function ensureAudio() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  } catch (e) {
    return null;
  }
}

function tone(ac, { freq, start = 0, dur, type = "sine", gain = 0.16, glideTo = null }) {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime + start);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, ac.currentTime + start + dur);
  g.gain.setValueAtTime(0.0001, ac.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain, ac.currentTime + start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + dur + 0.05);
}

// 通用点击：短促清脆的“啵”
export function playClick() {
  if (!enabled) return;
  const ac = ensureAudio();
  if (!ac) return;
  tone(ac, { freq: 1500, dur: 0.05, gain: 0.05, type: "sine" });
  tone(ac, { freq: 2100, start: 0.012, dur: 0.04, gain: 0.03, type: "sine" });
}

// 导航切换：轻快双音
export function playNav() {
  if (!enabled) return;
  const ac = ensureAudio();
  if (!ac) return;
  tone(ac, { freq: 660, dur: 0.07, gain: 0.06 });
  tone(ac, { freq: 990, start: 0.05, dur: 0.08, gain: 0.06 });
}

// 开始专注：上滑水花声
export function playStart() {
  if (!enabled) return;
  const ac = ensureAudio();
  if (!ac) return;
  tone(ac, { freq: 320, dur: 0.22, gain: 0.08, type: "sine", glideTo: 900 });
  tone(ac, { freq: 1240, start: 0.1, dur: 0.12, gain: 0.05 });
  bubble(ac, { start: 0.16, dur: 0.3, freq: 520 });
}

// 放弃：短促下坠音
export function playAbandon() {
  if (!enabled) return;
  const ac = ensureAudio();
  if (!ac) return;
  tone(ac, { freq: 520, dur: 0.2, gain: 0.07, type: "sine", glideTo: 240 });
}

// 完成：上行琶音 + 气泡上浮
export function playCompletion() {
  if (!enabled) return;
  const ac = ensureAudio();
  if (!ac) return;
  tone(ac, { freq: 523.25, dur: 0.28, gain: 0.13 });
  tone(ac, { freq: 659.25, start: 0.12, dur: 0.3, gain: 0.13 });
  tone(ac, { freq: 783.99, start: 0.24, dur: 0.5, gain: 0.15 });
  bubble(ac, { start: 0.3, dur: 0.4, freq: 420 });
  bubble(ac, { start: 0.45, dur: 0.45, freq: 640 });
}

function bubble(ac, { start, dur = 0.35, freq = 500 }) {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, ac.currentTime + start);
  osc.frequency.exponentialRampToValueAtTime(freq * 2.4, ac.currentTime + start + dur);
  g.gain.setValueAtTime(0.0001, ac.currentTime + start);
  g.gain.exponentialRampToValueAtTime(0.1, ac.currentTime + start + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + dur + 0.05);
}
