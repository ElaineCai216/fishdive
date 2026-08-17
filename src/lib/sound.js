// 用 Web Audio 合成轻量音效，无需音频素材文件。
// 完成音效：上行琶音（C5-E5-G5）+ 气泡上浮声。

let ctx = null;
let enabled = false;

export function setSoundEnabled(v) {
  enabled = !!v;
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

function tone(ac, { freq, start, dur, type = "sine", gain = 0.16 }) {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, ac.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain, ac.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + dur + 0.05);
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

export function playCompletion() {
  if (!enabled) return;
  const ac = ensureAudio();
  if (!ac) return;
  tone(ac, { freq: 523.25, start: 0, dur: 0.28, gain: 0.14 });
  tone(ac, { freq: 659.25, start: 0.12, dur: 0.3, gain: 0.14 });
  tone(ac, { freq: 783.99, start: 0.24, dur: 0.5, gain: 0.16 });
  bubble(ac, { start: 0.3, dur: 0.4, freq: 420 });
  bubble(ac, { start: 0.45, dur: 0.45, freq: 640 });
}
