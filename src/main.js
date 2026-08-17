import "./style.css";
import { store } from "./store.js";
import { setSoundEnabled } from "./lib/sound.js";
import { focusView } from "./views/focus.js";
import { pondView } from "./views/pond.js";
import { albumView } from "./views/album.js";
import { statsView } from "./views/stats.js";
import { openSettings } from "./views/settings.js";

setSoundEnabled(store.getState().settings.soundOn);
store.subscribe((s) => setSoundEnabled(s.settings.soundOn));

const views = { focus: focusView(), pond: pondView(), album: albumView(), stats: statsView() };
let current = null;

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
  document.querySelectorAll(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
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
route();
