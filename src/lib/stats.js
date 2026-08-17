// 统计计算：全部为纯函数，输入 sessions 数组，便于单元测试。
// session: { id, date: "YYYY-MM-DD", taskName, minutes, speciesId }

export function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function daysAgoDateStr(n, from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() - n);
  return toDateStr(d);
}

// 本周一零点（周一为一周起点）
export function startOfWeek(d = new Date()) {
  const x = new Date(d);
  const dow = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - dow);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function totalMinutes(sessions) {
  return sessions.reduce((s, x) => s + (x.minutes || 0), 0);
}

export function filterByDate(sessions, dateStr) {
  return sessions.filter((s) => s.date === dateStr);
}

export function inRange(sessions, fromStr, toStr) {
  return sessions.filter((s) => s.date >= fromStr && s.date <= toStr);
}

// 今日
export function todayStats(sessions, now = new Date()) {
  const day = filterByDate(sessions, toDateStr(now));
  return { count: day.length, minutes: totalMinutes(day) };
}

// 本周（周一至今）
export function weekStats(sessions, now = new Date()) {
  const from = toDateStr(startOfWeek(now));
  const to = toDateStr(now);
  const week = inRange(sessions, from, to);
  return { count: week.length, minutes: totalMinutes(week) };
}

// 连续专注天数：今天有记录则从今天起算；今天没有但昨天有则从昨天起算；否则为 0。
export function streak(sessions, now = new Date()) {
  const days = new Set(sessions.map((s) => s.date));
  let d = new Date(now);
  if (!days.has(toDateStr(d))) {
    d.setDate(d.getDate() - 1);
    if (!days.has(toDateStr(d))) return 0;
  }
  let n = 0;
  while (days.has(toDateStr(d))) {
    n += 1;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

// 按任务聚合，返回按分钟数降序的 [{ name, minutes, count }]
export function byTask(sessions) {
  const map = new Map();
  for (const s of sessions) {
    const key = s.taskName || "未命名";
    const item = map.get(key) ?? { name: key, minutes: 0, count: 0 };
    item.minutes += s.minutes || 0;
    item.count += 1;
    map.set(key, item);
  }
  return [...map.values()].sort((a, b) => b.minutes - a.minutes);
}

// 某年某月（1-12）的每日汇总，返回 [{ date, minutes, count }]，含未打卡日
export function monthData(sessions, year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const byDate = new Map();
  for (const s of sessions) {
    const [y, m] = s.date.split("-").map(Number);
    if (y === year && m === month) {
      const item = byDate.get(s.date) ?? { date: s.date, minutes: 0, count: 0 };
      item.minutes += s.minutes || 0;
      item.count += 1;
      byDate.set(s.date, item);
    }
  }
  const out = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    out.push(byDate.get(date) ?? { date, minutes: 0, count: 0 });
  }
  return out;
}

// 近 N 天（含今天）的每日汇总
export function lastNDays(sessions, n, now = new Date()) {
  const byDate = new Map();
  for (const s of sessions) byDate.set(s.date, (byDate.get(s.date) ?? 0) + (s.minutes || 0));
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = daysAgoDateStr(i, now);
    out.push({ date, minutes: byDate.get(date) ?? 0 });
  }
  return out;
}

// 每种鱼获得数量：{ speciesId: count }
export function speciesCounts(sessions) {
  const map = new Map();
  for (const s of sessions) {
    if (!s.speciesId) continue;
    map.set(s.speciesId, (map.get(s.speciesId) ?? 0) + 1);
  }
  return map;
}
