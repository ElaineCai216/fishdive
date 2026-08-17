import { store } from "../store.js";
import { FISH_BY_ID } from "../data/fishCatalog.js";
import { renderFishSVG } from "../render/fish.js";

const RARITY_INDEX = { common: 0, rare: 1, epic: 2, legendary: 3 };
const rand = (a, b) => a + Math.random() * (b - a);

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function pondView() {
  let water = null;
  let fishLayer = null;
  let emptyEl = null;
  let rafId = 0;
  let last = 0;
  let disposed = false;
  let unsub = null;
  const fishes = new Map(); // id -> 动画状态

  return {
    mount(root, ctx) {
      root.innerHTML = `
        <section class="view-pond">
          <div class="pond" id="pond-water">
            <div class="seaweed weed-left">${weedSVG("#2f9e77")}</div>
            <div class="seaweed weed-right">${weedSVG("#3fb68b")}</div>
            <div class="sand" aria-hidden="true">${pebbles()}</div>
            <div class="bubbles" aria-hidden="true">${bubbles()}</div>
            <div class="fish-layer" id="fish-layer"></div>
            <div class="pond-empty" id="pond-empty">
              <div class="empty-card card">
                <div class="empty-fish">🐟</div>
                <h3>鱼塘还空空的</h3>
                <p>完成一次专注，就能收获你的第一条鱼</p>
                <button type="button" class="btn-primary" id="empty-go">去专注 🐠</button>
              </div>
            </div>
          </div>
        </section>`;

      water = root.querySelector("#pond-water");
      fishLayer = root.querySelector("#fish-layer");
      emptyEl = root.querySelector("#pond-empty");
      root.querySelector("#empty-go").addEventListener("click", () => ctx.go("focus"));

      store.getState().pond.forEach((f) => addFish(f));
      updateEmpty();
      unsub = store.subscribe(() => {
        const state = store.getState();
        state.pond.forEach((f) => {
          if (!fishes.has(f.id)) addFish(f);
        });
        updateEmpty();
      });

      disposed = false;
      last = performance.now();
      rafId = requestAnimationFrame(loop);
    },
    unmount() {
      disposed = true;
      cancelAnimationFrame(rafId);
      if (unsub) unsub();
      unsub = null;
      fishes.clear();
      water = null;
      fishLayer = null;
      emptyEl = null;
    },
  };

  function addFish(f) {
    const species = FISH_BY_ID[f.speciesId];
    if (!species) return;
    const size = baseSize(species, f.id);
    const el = document.createElement("div");
    el.className = "pond-fish spawn";
    el.innerHTML = renderFishSVG(species, { size });
    el.style.width = `${size}px`;
    el.style.touchAction = "none";
    el.title = species.name;

    const id = f.id;
    const fx = {
      id,
      el,
      x: f.x ?? rand(15, 85),
      y: f.y ?? rand(25, 75),
      px: 0,
      py: 0,
      size,
      tx: rand(15, 85),
      ty: rand(25, 75),
      speed: 0.9 + Math.random() * 0.9,
      dir: Math.random() < 0.5 ? -1 : 1,
      phase: Math.random() * Math.PI * 2,
      dragging: false,
      dragOffX: 0,
      dragOffY: 0,
    };
    fishes.set(id, fx);
    fishLayer.appendChild(el);

    el.addEventListener("pointerdown", (e) => {
      const cur = fishes.get(id);
      if (!cur) return;
      cur.dragging = true;
      el.setPointerCapture(e.pointerId);
      el.classList.add("dragging");
      const rect = water.getBoundingClientRect();
      cur.dragOffX = e.clientX - rect.left - cur.px;
      cur.dragOffY = e.clientY - rect.top - cur.py;
      e.preventDefault();
    });
    el.addEventListener("pointermove", (e) => {
      const cur = fishes.get(id);
      if (!cur || !cur.dragging) return;
      const rect = water.getBoundingClientRect();
      const w = rect.width || 1;
      const h = rect.height || 1;
      const nx = clamp(((e.clientX - rect.left - cur.dragOffX) / w) * 100, 6, 94);
      const ny = clamp(((e.clientY - rect.top - cur.dragOffY) / h) * 100, 14, 86);
      cur.x = nx;
      cur.y = ny;
      cur.px = (nx / 100) * w;
      cur.py = (ny / 100) * h;
      applyTransform(cur);
    });
    const endDrag = (e) => {
      const cur = fishes.get(id);
      if (!cur || !cur.dragging) return;
      cur.dragging = false;
      el.classList.remove("dragging");
      store.update((s) => ({
        ...s,
        pond: s.pond.map((p) =>
          p.id === id ? { ...p, x: Math.round(cur.x * 10) / 10, y: Math.round(cur.y * 10) / 10 } : p
        ),
      }));
    };
    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);
  }

  function baseSize(species, id) {
    const r = RARITY_INDEX[species.rarity] ?? 0;
    return 50 + r * 12 + (hash(id) % 15);
  }

  function loop(ts) {
    if (disposed) return;
    const dt = Math.min((ts - last) / 1000, 0.05);
    last = ts;
    const w = water.clientWidth || 1;
    const h = water.clientHeight || 1;
    fishes.forEach((f) => {
      f.px = (f.x / 100) * w;
      f.py = (f.y / 100) * h;
      if (!f.dragging) wander(f, dt, w, h, ts);
      applyTransform(f);
    });
    rafId = requestAnimationFrame(loop);
  }

  function wander(f, dt, w, h, ts) {
    const tx = (f.tx / 100) * w;
    const ty = (f.ty / 100) * h;
    const dx = tx - f.px;
    const dy = ty - f.py;
    const dist = Math.hypot(dx, dy);
    if (dist < 3) {
      f.tx = rand(14, 86);
      f.ty = rand(24, 76);
      return;
    }
    const step = f.speed * 30 * dt;
    f.x += ((dx / dist) * step) / w * 100;
    f.y += ((dy / dist) * step) / h * 100;
    f.y += Math.sin(ts / 650 + f.phase) * 0.008; // 轻微上下摆动
    const ndir = dx >= 0 ? 1 : -1;
    if (ndir !== f.dir) f.dir = ndir;
  }

  function applyTransform(f) {
    f.el.style.transform = `translate(${f.px}px, ${f.py}px) translate(-50%, -50%) scaleX(${f.dir})`;
  }

  function updateEmpty() {
    if (!emptyEl) return;
    emptyEl.classList.toggle("hidden", store.getState().pond.length > 0);
  }
}

function bubbles() {
  let out = "";
  for (let i = 0; i < 16; i++) {
    const left = rand(4, 96);
    const size = 4 + Math.random() * 8;
    const dur = 9 + Math.random() * 11;
    const delay = Math.random() * 14;
    out += `<span class="bubble" style="left:${left.toFixed(1)}%;width:${size.toFixed(1)}px;height:${size.toFixed(1)}px;animation-duration:${dur.toFixed(1)}s;animation-delay:${delay.toFixed(1)}s"></span>`;
  }
  return out;
}

function pebbles() {
  const cols = ["#e8d8b8", "#d9c59a", "#f0e6cd", "#cdb98c"];
  let out = "";
  for (let i = 0; i < 10; i++) {
    const left = rand(2, 96);
    const w = 14 + Math.random() * 26;
    const h = 7 + Math.random() * 12;
    out += `<span class="pebble" style="left:${left.toFixed(1)}%;width:${w.toFixed(1)}px;height:${h.toFixed(1)}px;background:${cols[i % cols.length]}"></span>`;
  }
  return out;
}

function weedSVG(color) {
  return `<svg viewBox="0 0 90 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M45 220 C 34 180 58 158 45 116 C 34 82 56 60 45 18"
      fill="none" stroke="${color}" stroke-width="9" stroke-linecap="round"/>
    <path d="M45 168 C 30 160 22 150 24 138 C 38 144 46 152 47 162 Z" fill="${color}" opacity="0.9"/>
    <path d="M45 104 C 60 96 68 84 66 72 C 52 80 46 88 45 98 Z" fill="${color}" opacity="0.9"/>
    <path d="M45 60 C 32 52 26 42 28 30 C 40 38 46 48 46 56 Z" fill="${color}" opacity="0.9"/>
  </svg>`;
}
