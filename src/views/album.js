import { store } from "../store.js";
import { FISH, RARITY_ORDER, RARITY_META } from "../data/fishCatalog.js";
import { speciesCounts } from "../lib/stats.js";
import { renderFishSVG } from "../render/fish.js";

export function albumView() {
  return {
    mount(root) {
      const counts = speciesCounts(store.getState().sessions);
      const total = FISH.length;
      const caught = FISH.filter((f) => (counts.get(f.id) ?? 0) > 0).length;

      root.innerHTML = `
        <section class="view-album">
          <div class="album-progress card">
            <div class="album-progress-text">
              <h2>🐟 鱼图鉴</h2>
              <span>已收集 <b>${caught}</b> / ${total} 种</span>
            </div>
            <div class="progress-bar"><div class="progress-fill" style="width:${(caught / total) * 100}%"></div></div>
            <div class="legend">
              ${RARITY_ORDER.map((r) => `<span class="legend-item"><i style="background:${RARITY_META[r].color}"></i>${RARITY_META[r].label}</span>`).join("")}
            </div>
          </div>
          ${RARITY_ORDER.map((r) => albumGroup(r, counts)).join("")}
        </section>`;
    },
    unmount() {},
  };
}

function albumGroup(rarity, counts) {
  const meta = RARITY_META[rarity];
  const fishes = FISH.filter((f) => f.rarity === rarity);
  const got = fishes.filter((f) => (counts.get(f.id) ?? 0) > 0).length;
  return `
    <div class="album-group">
      <div class="group-header">
        <span class="rarity-badge r-${rarity}">${meta.label}</span>
        <span class="group-count">${got}/${fishes.length}</span>
      </div>
      <div class="album-grid">
        ${fishes.map((f) => fishCard(f, counts.get(f.id) ?? 0)).join("")}
      </div>
    </div>`;
}

function fishCard(f, count) {
  const has = count > 0;
  return `
    <div class="album-card ${has ? "caught" : "locked"}">
      <div class="album-fish">${renderFishSVG(f, { size: 84, fit: true, silhouette: !has })}</div>
      <div class="album-name">${f.name}</div>
      <div class="album-count">${has ? `×${count}` : "未获得"}</div>
    </div>`;
}
