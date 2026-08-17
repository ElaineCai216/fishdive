import { describe, it, expect } from "vitest";
import {
  totalMinutes,
  todayStats,
  weekStats,
  streak,
  byTask,
  monthData,
  lastNDays,
  speciesCounts,
  toDateStr,
} from "../src/lib/stats.js";

const sessions = [
  { id: "1", date: "2026-08-15", taskName: "背单词", minutes: 25, speciesId: "clownfish" },
  { id: "2", date: "2026-08-16", taskName: "背单词", minutes: 45, speciesId: "guppy" },
  { id: "3", date: "2026-08-17", taskName: "阅读", minutes: 60, speciesId: "arowana" },
  { id: "4", date: "2026-08-17", taskName: "背单词", minutes: 25, speciesId: "clownfish" },
  { id: "5", date: "2026-08-12", taskName: "写作", minutes: 90, speciesId: "goldfish" },
];

describe("基础聚合", () => {
  it("totalMinutes 求和", () => {
    expect(totalMinutes(sessions)).toBe(245);
  });

  it("todayStats 按当天过滤", () => {
    const now = new Date("2026-08-17T12:00:00");
    const t = todayStats(sessions, now);
    expect(t.count).toBe(2);
    expect(t.minutes).toBe(85);
  });

  it("weekStats 从周一起算", () => {
    // 2026-08-17 是周一
    const now = new Date("2026-08-17T12:00:00");
    const w = weekStats(sessions, now);
    expect(w.count).toBe(2);
    expect(w.minutes).toBe(85);
  });

  it("speciesCounts 统计每种鱼数量", () => {
    const c = speciesCounts(sessions);
    expect(c.get("clownfish")).toBe(2);
    expect(c.get("guppy")).toBe(1);
    expect(c.get("arowana")).toBe(1);
  });
});

describe("连续天数", () => {
  it("今天有记录，从今天起算", () => {
    const now = new Date("2026-08-17T12:00:00");
    expect(streak(sessions, now)).toBe(3); // 15, 16, 17
  });

  it("今天没有但昨天有，从昨天起算（连续未断）", () => {
    const now = new Date("2026-08-18T12:00:00");
    expect(streak(sessions, now)).toBe(3);
  });

  it("中间断档则从最近连续段算", () => {
    const now = new Date("2026-08-20T12:00:00");
    expect(streak(sessions, now)).toBe(0);
  });

  it("空数据为 0", () => {
    expect(streak([], new Date())).toBe(0);
  });
});

describe("按任务聚合", () => {
  it("按分钟降序，含次数", () => {
    const rows = byTask(sessions);
    expect(rows[0]).toEqual({ name: "背单词", minutes: 95, count: 3 });
    expect(rows[1]).toEqual({ name: "写作", minutes: 90, count: 1 });
    expect(rows[2]).toEqual({ name: "阅读", minutes: 60, count: 1 });
  });
});

describe("日历与趋势", () => {
  it("monthData 生成当月每日，未打卡日为 0", () => {
    const data = monthData(sessions, 2026, 8);
    expect(data).toHaveLength(31);
    expect(data[14].date).toBe("2026-08-15");
    expect(data[14].minutes).toBe(25);
    expect(data[16].minutes).toBe(85);
    expect(data[0].minutes).toBe(0);
  });

  it("lastNDays 生成近 N 天含今天", () => {
    const now = new Date("2026-08-17T12:00:00");
    const data = lastNDays(sessions, 5, now);
    expect(data).toHaveLength(5);
    expect(data[4].date).toBe("2026-08-17");
    expect(data[4].minutes).toBe(85);
    expect(data[3].date).toBe("2026-08-16");
  });

  it("toDateStr 输出 YYYY-MM-DD", () => {
    expect(toDateStr(new Date(2026, 7, 5))).toBe("2026-08-05");
  });
});
