import "./style.css";
import { store } from "./store.js";
import { setSoundEnabled, playClick, playNav } from "./lib/sound.js";
import { renderFishSVG } from "./render/fish.js";
import { FISH_BY_ID } from "./data/fishCatalog.js";
import { focusView } from "./views/focus.js";
import { pondView } from "./views/pond.js";
import { albumView } from "./views/album.js";
import { statsView } from "./views/stats.js";
import { openSettings } from "./views/settings.js";

setSoundEnabled(store.getState().settings.soundOn);
store.subscribe((s) => setSoundEnabled(s.settings.soundOn));

const views = { focus: focusView(), pond: pondView(), album: albumView(), stats: statsView() };
let current = null;
let firstRoute = true;

/* ---------------- 全局动态背景 ---------------- */
const BG_FISH = ["clownfish", "neontetra", "bluetang", "rainbowfish", "betta", "guppy"];

function renderBackground() {
  const bg = document.createElement("div");
  bg.id = "bg-decor";
  bg.setAttribute("aria-hidden", "true");
  bg.innerHTML = `
    <div class="bg-blob blob-1"></div>
    <div class="bg-blob blob-2"></div>
    <div class="bg-blob blob-3"></div>
    <div class="bg-rays"></div>
    <div class="bg-fish-layer" id="bg-fish-layer"></div>
    <div class="bg-bubbles">${bgBubbles()}</div>`;
  document.body.prepend(bg);
  const layer = bg.querySelector("#bg-fish-layer");
  const count = 7;
  for (let i = 0; i < count; i++) {
    const fish = FISH_BY_ID[BG_FISH[i % BG_FISH.length]];
    const size = 16 + ((i * 7) % 14);
    const el = document.createElement("div");
    el.className = "bg-fish";
    el.innerHTML = renderFishSVG(fish, { size, silhouette: true });
    const reverse = i % 2 === 1;
    const duration = 38 + (i % 5) * 9;
    el.style.top = `${8 + ((i * 13) % 82)}%`;
    el.style.animationDuration = `${duration}s`;
    el.style.animationDelay = `-${(i * 11) % duration}s`;
    el.style.opacity = (0.22 + (i % 3) * 0.08).toFixed(2);
    if (reverse) {
      el.style.animationDirection = "reverse";
      el.style.transform = "scaleX(-1)";
    }
    layer.appendChild(el);
  }
}

function bgBubbles() {
  let out = "";
  for (let i = 0; i < 14; i++) {
    const left = 2 + Math.random() * 96;
    const size = 4 + Math.random() * 9;
    const dur = 16 + Math.random() * 18;
    const delay = Math.random() * 20;
    out += `<span class="bg-bubble" style="left:${left.toFixed(1)}%;width:${size.toFixed(1)}px;height:${size.toFixed(1)}px;animation-duration:${dur.toFixed(1)}s;animation-delay:${delay.toFixed(1)}s"></span>`;
  }
  return out;
}

/* ---------------- 全局点击反馈：音效 + 波纹 ---------------- */
const CLICKABLE = "button, .chip, .nav-item, .icon-btn, .switch-track, input[type=range]";

document.addEventListener(
  "pointerdown",
  (e) => {
    const el = e.target.closest(CLICKABLE);
    if (!el) return;
    spawnRipple(e.clientX, e.clientY);
    if (el.dataset.noSound) return;
    playClick();
  },
  true
);

function spawnRipple(x, y) {
  const el = document.createElement("span");
  el.className = "ripple";
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 700);
}

/* ---------------- 通用 UI ---------------- */
function toast(msg) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2200);
}

function notify(title, body) {
  try {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
  } catch (e) {
    /* 忽略通知失败 */
  }
}

function confirmModal(title, text, onOk) {
  const overlayRoot = document.getElementById("overlay-root");
  overlayRoot.innerHTML = `
    <div class="modal-mask confirm">
      <div class="modal-card confirm-card">
        <h3 class="modal-title">${title}</h3>
        <p class="muted">${text}</p>
        <div class="modal-actions">
          <button type="button" class="btn-ghost" id="confirm-no">取消</button>
          <button type="button" class="btn-danger" id="confirm-yes">确定</button>
        </div>
      </div>
    </div>`;
  const close = () => {
    overlayRoot.innerHTML = "";
  };
  overlayRoot.querySelector("#confirm-no").addEventListener("click", close);
  overlayRoot.querySelector("#confirm-yes").addEventListener("click", () => {
    close();
    onOk();
  });
  overlayRoot.querySelector(".modal-mask").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) close();
  });
}

function currentTab() {
  return [...document.querySelectorAll(".nav-item")].find((b) => b.classList.contains("active"))?.dataset.tab || "focus";
}

function go(tab) {
  if (current) current.unmount();
  current = views[tab];
  const navBtns = [...document.querySelectorAll(".nav-item")];
  const changed = !navBtns.find((b) => b.dataset.tab === tab)?.classList.contains("active");
  navBtns.forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  if (changed && !firstRoute && store.getState().settings.soundOn) playNav();
  firstRoute = false;
  const root = document.getElementById("view");
  root.innerHTML = "";
  current.mount(root, { go, notify, toast, confirm: confirmModal });
  window.scrollTo(0, 0);
}

document.querySelectorAll(".nav-item").forEach((btn) =>
  btn.addEventListener("click", () => go(btn.dataset.tab))
);
document.getElementById("btn-settings").addEventListener("click", () =>
  openSettings({ toast, refresh: () => go(currentTab()) })
);

function route() {
  const tab = (location.hash || "#focus").replace("#", "");
  go(["focus", "pond", "album", "stats"].includes(tab) ? tab : "focus");
}
window.addEventListener("hashchange", route);

renderBackground();
route();
