// 稀有度分档抽样：按专注时长落入对应档位，档内按概率抽稀有度，再等概率抽该稀有度中的一种鱼。

// 分档概率表（与产品方案一致）：
//   5–24 分钟：常见 100%
//   25–44 分钟：常见 70% / 稀有 30%
//   45–59 分钟：稀有 65% / 史诗 35%
//   60+ 分钟：史诗 80% / 传说 20%
const TIERS = [
  { min: 0, table: [["common", 1.0]] },
  { min: 25, table: [["common", 0.7], ["rare", 0.3]] },
  { min: 45, table: [["rare", 0.65], ["epic", 0.35]] },
  { min: 60, table: [["epic", 0.8], ["legendary", 0.2]] },
];

export function tierForMinutes(minutes) {
  let tier = TIERS[0];
  for (const t of TIERS) {
    if (minutes >= t.min) tier = t;
  }
  return tier;
}

// 允许的稀有度集合（用于测试：各时长只落入对应稀有度集合）
export function allowedRarities(minutes) {
  return tierForMinutes(minutes).table.map(([r]) => r);
}

export function pickRarity(minutes, rand = Math.random) {
  const { table } = tierForMinutes(minutes);
  let r = rand();
  for (const [rarity, weight] of table) {
    if (r < weight) return rarity;
    r -= weight;
  }
  return table[table.length - 1][0];
}

export function pickSpecies(minutes, catalog, rand = Math.random) {
  const rarity = pickRarity(minutes, rand);
  const pool = catalog.filter((f) => f.rarity === rarity);
  if (pool.length === 0) return null;
  return pool[Math.floor(rand() * pool.length)];
}
