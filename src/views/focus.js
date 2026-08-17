import { store, uid } from "../store.js";
import { FISH } from "../data/fishCatalog.js";
import { pickSpecies } from "../lib/rng.js";
import { toDateStr } from "../lib/stats.js";
import { renderFishSVG } from "../render/fish.js";
import { ensureAudio, playStart, playAbandon, playCompletion } from "../lib/sound.js";

const DURATION_PRESETS = [15, 25, 45, 60, 90];
const RING_C = 2 * Math.PI * 100;

export function focusView() {
  // 专注会话为工厂级单例：切换视图（unmount/mount）不中断计时。
  let run = null; // { endAt, minutes, taskName, interval }
  let rootEl = null;
  let ctxRef = null;

  return {
    mount(root, ctx) {
      rootEl = root;
      ctxRef = ctx;
      if (run) {
        renderRunning(ctx);
        tick(ctx);
      } else {
        renderSetup(ctx);
      }
    },
    unmount() {
      // 不清理计时器，仅断开 DOM 引用；计时仍在后台继续。
      rootEl = null;
    },
  };

  function renderSetup(ctx) {
    const state = store.getState();
    rootEl.innerHTML = `
      <section class="view-focus setup">
        <div class="focus-card card">
          <h2 class="card-title">🐟 这次专注做什么？</h2>
          <label class="field">
            <span class="field-label">任务名称</span>
            <input id="task-input" class="text-input" list="fishdive-task-list" maxlength="30"
              placeholder="例如：背单词 / 写方案 / 阅读" autocomplete="off"/>
            <datalist id="fishdive-task-list">
              ${state.tasks.map((t) => `<option value="${escapeHtml(t.name)}"></option>`).join("")}
            </datalist>
          </label>
          <label class="checkbox-row">
            <input type="checkbox" id="save-task" checked/>
            <span>保存为常用任务，下次一键选择</span>
          </label>
          <div class="field">
            <span class="field-label">专注时长</span>
            <div class="chips" id="duration-chips">
              ${DURATION_PRESETS.map(
                (m) => `<button type="button" class="chip" data-min="${m}" ${m === 25 ? 'aria-pressed="true"' : ""}>${m} 分钟</button>`
              ).join("")}
            </div>
            <div class="slider-row">
              <input type="range" id="duration-slider" min="5" max="180" step="5" value="25" aria-label="自定义时长"/>
              <span class="slider-value" id="duration-label">25 分钟</span>
            </div>
          </div>
          <button type="button" id="start-btn" class="btn-primary btn-lg" data-no-sound>开始专注 🐟</button>
          <p class="hint">完成一次专注即可收获一条鱼，专注越久鱼越稀有✨</p>
        </div>
      </section>`;

    const slider = rootEl.querySelector("#duration-slider");
    const label = rootEl.querySelector("#duration-label");
    const chips = [...rootEl.querySelectorAll(".chip")];

    const syncChips = () => {
      const v = Number(slider.value);
      chips.forEach((c) => c.setAttribute("aria-pressed", String(Number(c.dataset.min) === v)));
    };
    slider.addEventListener("input", () => {
      label.textContent = `${slider.value} 分钟`;
      syncChips();
    });
    chips.forEach((c) =>
      c.addEventListener("click", () => {
        slider.value = c.dataset.min;
        label.textContent = `${slider.value} 分钟`;
        syncChips();
      })
    );

    rootEl.querySelector("#start-btn").addEventListener("click", () => start(ctx));
  }

  function start(ctx) {
    const state = store.getState();
    const taskName = (rootEl.querySelector("#task-input")?.value || "").trim() || "专注时光";
    const minutes = Number(rootEl.querySelector("#duration-slider")?.value || 25);
    const saveTask = rootEl.querySelector("#save-task")?.checked ?? false;

    if (saveTask && !state.tasks.some((t) => t.name === taskName)) {
      store.update((s) => ({ ...s, tasks: [...s.tasks, { id: uid(), name: taskName, count: 0, totalMinutes: 0 }] }));
    }
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    ensureAudio();
    playStart();

    run = { endAt: Date.now() + minutes * 60000, minutes, taskName, interval: setInterval(() => tick(ctx), 500) };
    renderRunning(ctx);
    tick(ctx);
  }

  function renderRunning(ctx) {
    rootEl.innerHTML = `
      <section class="view-focus running">
        <div class="ring-wrap">
          <svg class="ring" viewBox="0 0 220 220" aria-hidden="true">
            <circle class="ring-bg" cx="110" cy="110" r="100"/>
            <circle class="ring-fg" id="ring-fg" cx="110" cy="110" r="100"
              stroke-dasharray="${RING_C}" stroke-dashoffset="0"/>
          </svg>
          <div class="ring-center">
            <div class="timer-text" id="timer-text">--:--</div>
            <div class="timer-end" id="timer-end"></div>
          </div>
        </div>
        <div class="jar">
          <svg class="jar-svg" viewBox="0 0 120 150" aria-hidden="true">
            <rect x="22" y="24" width="76" height="116" rx="14" class="jar-glass"/>
            <path class="jar-water" d="M26 48 h68 v86 a14 14 0 0 1 -14 14 h-40 a14 14 0 0 1 -14 -14 Z"/>
            <g id="jar-egg" class="jar-egg">
              <ellipse cx="60" cy="78" rx="16" ry="20" class="egg-body"/>
              <ellipse cx="56" cy="72" rx="6" ry="8" class="egg-shine"/>
            </g>
            <g id="jar-fish" class="jar-fish" opacity="0">
              ${renderFishSVG(FISH.find((f) => f.id === "guppy"), { size: 64 })}
            </g>
          </svg>
        </div>
        <div class="focus-meta">
          <div class="task-badge">📌 ${escapeHtml(run.taskName)}</div>
        </div>
        <button type="button" id="abandon-btn" class="btn-ghost" data-no-sound>放弃本次专注</button>
      </section>`;

    rootEl.querySelector("#abandon-btn").addEventListener("click", () => {
      ctx.confirm("放弃本次专注？", "这次不会获得鱼，也不会有任何损失。", () => {
        playAbandon();
        clearInterval(run.interval);
        run = null;
        document.title = "FishDive · 专注养鱼";
        if (rootEl) renderSetup(ctx);
      });
    });
  }

  function tick(ctx) {
    if (!run) return;
    const remaining = run.endAt - Date.now();
    if (remaining <= 0) {
      complete(ctx);
      return;
    }
    const total = run.minutes * 60000;
    const progress = 1 - remaining / total;
    const mm = String(Math.floor(remaining / 60000)).padStart(2, "0");
    const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");
    const t = rootEl?.querySelector("#timer-text");
    if (t) t.textContent = `${mm}:${ss}`;
    const end = rootEl?.querySelector("#timer-end");
    if (end) {
      const d = new Date(run.endAt);
      end.textContent = `结束于 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }
    const fg = rootEl?.querySelector("#ring-fg");
    if (fg) fg.style.strokeDashoffset = String(RING_C * (1 - progress));

    const egg = rootEl?.querySelector("#jar-egg");
    const fish = rootEl?.querySelector("#jar-fish");
    if (egg) {
      const scale = 0.6 + 0.4 * progress;
      egg.style.transform = `scale(${scale}) rotate(${Math.sin(Date.now() / 400) * 6}deg)`;
    }
    if (fish) {
      fish.setAttribute("opacity", progress > 0.9 ? String((progress - 0.9) / 0.1) : "0");
    }
    document.title = `${mm}:${ss} · ${run.taskName}`;
  }

  function complete(ctx) {
    clearInterval(run.interval);
    const { minutes, taskName } = run;
    const species = pickSpecies(minutes, FISH);
    run = null;
    document.title = "FishDive · 专注养鱼";

    if (species) {
      const now = new Date();
      const fishId = uid();
      store.update((s) => {
        const tasks = s.tasks.map((t) =>
          t.name === taskName ? { ...t, count: t.count + 1, totalMinutes: t.totalMinutes + minutes } : t
        );
        return {
          ...s,
          tasks,
          pond: [
            ...s.pond,
            {
              id: fishId,
              speciesId: species.id,
              caughtAt: now.toISOString(),
              x: 15 + Math.random() * 70,
              y: 20 + Math.random() * 55,
            },
          ],
          sessions: [
            ...s.sessions,
            { id: uid(), date: toDateStr(now), taskName, minutes, speciesId: species.id },
          ],
        };
      });

      const soundOn = store.getState().settings.soundOn;
      if (soundOn) playCompletion();
      ctx.notify("专注完成！🎉", `获得了一条${species.name}，已收进鱼塘`);

      showReveal(ctx, species);
    }
  }

  function showReveal(ctx, species) {
    const overlayRoot = document.getElementById("overlay-root");
    overlayRoot.innerHTML = `
      <div class="modal-mask reveal">
        <div class="modal-card reveal-card">
          <div class="splash" aria-hidden="true">
            <span class="drop d1">💧</span><span class="drop d2">💦</span><span class="drop d3">🐟</span>
            <span class="drop d4">💦</span><span class="drop d5">💧</span><span class="drop d6">✨</span>
          </div>
          <div class="reveal-fish">${renderFishSVG(species, { size: 180, fit: true })}</div>
          <h3 class="reveal-title">收获一条 <span class="rarity-badge r-${species.rarity}">${species.name}</span></h3>
          <p class="reveal-sub">已收进你的鱼塘</p>
          <div class="modal-actions">
            <button type="button" id="reveal-again" class="btn-ghost">再专注一次</button>
            <button type="button" id="reveal-pond" class="btn-primary">去鱼塘看看 🐠</button>
          </div>
        </div>
      </div>`;
    overlayRoot.querySelector("#reveal-again").addEventListener("click", () => {
      overlayRoot.innerHTML = "";
      if (rootEl) renderSetup(ctx);
      else ctx.go("focus");
    });
    overlayRoot.querySelector("#reveal-pond").addEventListener("click", () => {
      overlayRoot.innerHTML = "";
      ctx.go("pond");
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }
}
