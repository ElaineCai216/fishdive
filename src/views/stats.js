import { store } from "../store.js";
import { FISH, RARITY_ORDER } from "../data/fishCatalog.js";
import {
  todayStats,
  weekStats,
  streak,
  byTask,
  monthData,
  lastNDays,
  speciesCounts,
  totalMinutes,
} from "../lib/stats.js";

export function statsView() {
  let monthCursor = null; // { year, month }
  let rootEl = null;

  return {
    mount(root) {
      rootEl = root;
      const now = new Date();
      monthCursor = { year: now.getFullYear(), month: now.getMonth() + 1 };
      render();
    },
    unmount() {
      rootEl = null;
    },
  };

  function render() {
    const sessions = store.getState().sessions;
    const today = todayStats(sessions);
    const week = weekStats(sessions);
    const streakDays = streak(sessions);
    const species = speciesCounts(sessions);
    const fishTotal = sessions.length;
    const speciesCaught = [...species.keys()].length;
    const tasks = byTask(sessions);
    const month = monthCursor;
    const days30 = lastNDays(sessions, 30);

    rootEl.innerHTML = `
      <section class="view-stats">
        <h2 class="section-title">📊 专注统计</h2>
        <div class="stat-cards">
          ${statCard("今日时长", fmtMinutes(today.minutes), "⏱️")}
          ${statCard("今日次数", `${today.count} 次`, "✅")}
          ${statCard("本周时长", fmtMinutes(week.minutes), "🗓️")}
          ${statCard("连续专注", `${streakDays} 天`, "🔥")}
          ${statCard("累计鱼数", `${fishTotal} 条`, "🐠")}
          ${statCard("收集鱼种", `${speciesCaught}/${FISH.length} 种`, "📖")}
        </div>

        <div class="card stat-block">
          <h3 class="block-title">按任务排行</h3>
          ${tasks.length === 0
            ? `<p class="muted">还没有专注记录，先去专注一次吧～</p>`
            : `<div class="task-rank">
                ${tasks
                  .slice(0, 8)
                  .map((t, i) => taskRow(t, i, tasks[0].minutes))
                  .join("")}
              </div>`}
        </div>

        <div class="card stat-block">
          <div class="month-head">
            <button type="button" class="icon-btn sm" id="month-prev" aria-label="上个月">‹</button>
            <h3 class="block-title">${month.year} 年 ${month.month} 月</h3>
            <button type="button" class="icon-btn sm" id="month-next" aria-label="下个月">›</button>
          </div>
          ${calendar(monthData(sessions, month.year, month.month))}
          <div class="heat-legend">
            <span>少</span>
            ${["#eef4f9", "#bae6fd", "#7dd3fc", "#38bdf8", "#0ea5e9", "#0369a1"].map((c) => `<i style="background:${c}"></i>`).join("")}
            <span>多</span>
          </div>
        </div>

        <div class="card stat-block">
          <h3 class="block-title">近 30 天趋势</h3>
          ${trendChart(days30)}
        </div>
      </section>`;

    rootEl.querySelectorAll(".stat-value").forEach(countUp);

    rootEl.querySelector("#month-prev").addEventListener("click", () => {
      shiftMonth(-1);
      render();
    });
    rootEl.querySelector("#month-next").addEventListener("click", () => {
      shiftMonth(1);
      render();
    });
  }

  function shiftMonth(delta) {
    let { year, month } = monthCursor;
    month += delta;
    if (month < 1) {
      month = 12;
      year -= 1;
    } else if (month > 12) {
      month = 1;
      year += 1;
    }
    monthCursor = { year, month };
  }
}

function statCard(label, value, icon) {
  return `
    <div class="stat-card card">
      <div class="stat-icon">${icon}</div>
      <div class="stat-value">${value}</div>
      <div class="stat-label">${label}</div>
    </div>`;
}

function taskRow(t, i, maxMinutes) {
  const pct = maxMinutes > 0 ? (t.minutes / maxMinutes) * 100 : 0;
  return `
    <div class="task-row">
      <span class="task-rank-no">${i + 1}</span>
      <span class="task-row-name">${escapeHtml(t.name)}</span>
      <span class="task-row-bar"><i style="width:${pct}%"></i></span>
      <span class="task-row-min">${fmtMinutes(t.minutes)} · ${t.count}次</span>
    </div>`;
}

function calendar(days) {
  const first = new Date(days[0].date + "T00:00:00");
  const lead = (first.getDay() + 6) % 7; // 周一起始
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(`<div class="cal-cell empty"></div>`);
  for (const d of days) {
    const dayNum = Number(d.date.slice(8));
    const color = heatColor(d.minutes);
    cells.push(
      `<div class="cal-cell ${d.minutes > 0 ? "has" : ""}" style="background:${color}" title="${d.date} ${fmtMinutes(d.minutes)}">${dayNum}</div>`
    );
  }
  return `
    <div class="cal-weekday">
      ${["一", "二", "三", "四", "五", "六", "日"].map((w) => `<span>${w}</span>`).join("")}
    </div>
    <div class="cal-grid">${cells.join("")}</div>`;
}

function heatColor(minutes) {
  if (minutes <= 0) return "#eef4f9";
  if (minutes < 30) return "#bae6fd";
  if (minutes < 60) return "#7dd3fc";
  if (minutes < 120) return "#38bdf8";
  if (minutes < 180) return "#0ea5e9";
  return "#0369a1";
}

function trendChart(days) {
  const W = 340;
  const H = 130;
  const PAD = 4;
  const max = Math.max(...days.map((d) => d.minutes), 1);
  const bw = W / days.length;
  const bars = days
    .map((d, i) => {
      const h = (d.minutes / max) * (H - 18);
      const x = i * bw + bw * 0.15;
      const y = H - 6 - h;
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(bw * 0.7).toFixed(1)}" height="${Math.max(h, d.minutes > 0 ? 1.5 : 0).toFixed(1)}" rx="2" fill="${d.minutes > 0 ? "#38bdf8" : "#e2e8f0"}">
        <title>${d.date} ${fmtMinutes(d.minutes)}</title>
      </rect>`;
    })
    .join("");
  const labels = days
    .map((d, i) => {
      if (i % 5 !== 0) return "";
      const x = i * bw + bw * 0.2;
      return `<text x="${x.toFixed(1)}" y="${H - 1}" font-size="8" fill="#7c8b9a">${d.date.slice(5)}</text>`;
    })
    .join("");
  return `
    <svg class="trend-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="近30天专注趋势">
      <line x1="0" y1="${H - 8}" x2="${W}" y2="${H - 8}" stroke="#dbe7f0" stroke-width="1"/>
      <line x1="0" y1="4" x2="${W}" y2="4" stroke="#dbe7f0" stroke-width="1" stroke-dasharray="3 4"/>
      ${bars}
      ${labels}
    </svg>`;
}

function fmtMinutes(min) {
  if (min < 60) return `${min} 分钟`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} 小时 ${m} 分` : `${h} 小时`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

// 数字滚动动画：把 "123 分钟" 这类开头的数字从 0 滚动到目标值
function countUp(el) {
  const txt = el.textContent;
  const m = txt.match(/^(\d+)(.*)$/);
  if (!m) return;
  const target = Number(m[1]);
  const suffix = m[2];
  const dur = 700;
  const start = performance.now();
  function frame(now) {
    const t = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = `${Math.round(target * eased)}${suffix}`;
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
