import { describe, it, expect } from "vitest";
import { FISH } from "../src/data/fishCatalog.js";
import { pickRarity, pickSpecies, allowedRarities, tierForMinutes } from "../src/lib/rng.js";

const RARITIES = ["common", "rare", "epic", "legendary"];

describe("稀有度分档", () => {
  it("各时长档位只允许对应稀有度集合", () => {
    expect(allowedRarities(5)).toEqual(["common"]);
    expect(allowedRarities(24)).toEqual(["common"]);
    expect(allowedRarities(25)).toEqual(["common", "rare"]);
    expect(allowedRarities(44)).toEqual(["common", "rare"]);
    expect(allowedRarities(45)).toEqual(["rare", "epic"]);
    expect(allowedRarities(59)).toEqual(["rare", "epic"]);
    expect(allowedRarities(60)).toEqual(["epic", "legendary"]);
    expect(allowedRarities(180)).toEqual(["epic", "legendary"]);
    expect(allowedRarities(999)).toEqual(["epic", "legendary"]);
  });

  it("分档边界：25/45/60 分钟切换档位", () => {
    expect(tierForMinutes(24).min).toBe(0);
    expect(tierForMinutes(25).min).toBe(25);
    expect(tierForMinutes(45).min).toBe(45);
    expect(tierForMinutes(60).min).toBe(60);
  });

  it("抽样结果始终落在允许集合内", () => {
    for (const minutes of [5, 24, 25, 44, 45, 59, 60, 180]) {
      const allowed = allowedRarities(minutes);
      for (let i = 0; i < 200; i++) {
        expect(allowed).toContain(pickRarity(minutes));
      }
    }
  });

  it("概率分布符合预期（各档高频稀有度出现率）", () => {
    // 5–24 分钟应 100% 常见
    for (let i = 0; i < 100; i++) expect(pickRarity(15)).toBe("common");
    // 60+ 分钟 80% 史诗 / 20% 传说：抽样 2000 次，传说应在 10%-35% 之间
    let legendary = 0;
    const N = 2000;
    for (let i = 0; i < N; i++) {
      if (pickRarity(90) === "legendary") legendary++;
    }
    expect(legendary / N).toBeGreaterThan(0.1);
    expect(legendary / N).toBeLessThan(0.35);
  });
});

describe("pickSpecies", () => {
  it("返回的鱼属于抽样出的稀有度", () => {
    for (const minutes of [15, 30, 50, 90]) {
      for (let i = 0; i < 50; i++) {
        const s = pickSpecies(minutes, FISH);
        expect(s).not.toBeNull();
        expect(RARITIES).toContain(s.rarity);
        expect(allowedRarities(minutes)).toContain(s.rarity);
        expect(FISH.some((f) => f.id === s.id)).toBe(true);
      }
    }
  });

  it("图鉴数据完整：24 种鱼，4 档齐全", () => {
    expect(FISH).toHaveLength(24);
    const byRarity = { common: 0, rare: 0, epic: 0, legendary: 0 };
    const ids = new Set();
    for (const f of FISH) {
      byRarity[f.rarity] += 1;
      ids.add(f.id);
      expect(f.name).toBeTruthy();
    }
    expect(ids.size).toBe(24);
    expect(byRarity).toEqual({ common: 12, rare: 8, epic: 3, legendary: 1 });
  });
});
