// FishDive 全局状态：localStorage 持久化（key: fishdive:v1）
// 数据模型：
//   pond:     [{ id, speciesId, caughtAt, x, y }]           鱼塘中的鱼实例（x/y 为百分比位置）
//   tasks:    [{ id, name, count, totalMinutes }]           常用任务
//   sessions: [{ id, date, taskName, minutes, speciesId }]  每次完成的专注记录（date: YYYY-MM-DD）
//   settings: { soundOn }

const KEY = "fishdive:v1";

export function defaultState() {
  return {
    pond: [],
    tasks: [],
    sessions: [],
    settings: { soundOn: true },
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const base = defaultState();
    return {
      pond: Array.isArray(parsed.pond) ? parsed.pond : base.pond,
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : base.tasks,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : base.sessions,
      settings: { ...base.settings, ...(parsed.settings ?? {}) },
    };
  } catch (e) {
    console.warn("FishDive: 读取本地数据失败，已重置", e);
    return defaultState();
  }
}

function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("FishDive: 保存本地数据失败", e);
  }
}

const listeners = new Set();
let state = load();

export const store = {
  getState() {
    return state;
  },
  // update(fn)：fn 接收当前状态的浅拷贝（结构化克隆），返回新状态；未返回则放弃。
  update(fn) {
    const next = fn(structuredClone(state));
    if (!next) return;
    state = next;
    save(state);
    listeners.forEach((l) => l(state));
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  exportJSON() {
    return JSON.stringify(state, null, 2);
  },
  // 导入校验：必须是对象且包含 pond/tasks/sessions/settings 数组或对象。
  importJSON(text) {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object") throw new Error("数据格式不正确");
    const base = defaultState();
    const next = {
      pond: Array.isArray(parsed.pond) ? parsed.pond : base.pond,
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : base.tasks,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : base.sessions,
      settings: { ...base.settings, ...(parsed.settings ?? {}) },
    };
    state = next;
    save(state);
    listeners.forEach((l) => l(state));
    return true;
  },
};

export function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
