// FishDive 鱼目录：24 种鱼 / 4 档稀有度
// 每种鱼用参数化配置描述，由 render/fish.js 统一渲染为 SVG，无需逐条手绘素材。

export const RARITY_ORDER = ["common", "rare", "epic", "legendary"];

export const RARITY_META = {
  common: { label: "常见", color: "#22c55e" },
  rare: { label: "稀有", color: "#3b82f6" },
  epic: { label: "史诗", color: "#a855f7" },
  legendary: { label: "传说", color: "#f59e0b" },
};

// shape: fish 标准 | angel 高身（神仙/七彩） | betta 斗鱼 | seahorse 海马 | long 长身（龙鱼/皇带鱼）
// pattern: none | stripes | bands | spots | line | rainbow | mandarin
// tail: round | fan | forked | flow
export const FISH = [
  // ---------- 常见 ----------
  { id: "clownfish",  name: "小丑鱼",   rarity: "common", shape: "fish",   body: "#ff7f50", pattern: "stripes",  patternColor: "#ffffff", tail: "round",  accent: "#ff9f1c" },
  { id: "goldfish",   name: "金鱼",     rarity: "common", shape: "fish",   body: "#ffa62b", pattern: "none",     tail: "fan",    accent: "#ffd166" },
  { id: "guppy",      name: "孔雀鱼",   rarity: "common", shape: "fish",   body: "#22d3ee", pattern: "none",     tail: "fan",    accent: "#f472b6" },
  { id: "zebrafish",  name: "斑马鱼",   rarity: "common", shape: "fish",   body: "#e0f2fe", pattern: "stripes",  patternColor: "#2563eb", tail: "round",  accent: "#93c5fd" },
  { id: "neontetra",  name: "霓虹灯鱼", rarity: "common", shape: "fish",   body: "#f1f5f9", pattern: "line",     patternColor: "#22d3ee", tail: "round",  accent: "#f43f5e" },
  { id: "angelfish",  name: "神仙鱼",   rarity: "common", shape: "angel",  body: "#e2e8f0", pattern: "stripes",  patternColor: "#64748b", tail: "fan",    accent: "#94a3b8" },
  { id: "betta",      name: "斗鱼",     rarity: "common", shape: "betta",  body: "#4f46e5", pattern: "none",     tail: "flow",   accent: "#818cf8" },
  { id: "molly",      name: "玛丽鱼",   rarity: "common", shape: "fish",   body: "#475569", pattern: "none",     belly: "#f8fafc", tail: "round", accent: "#1e293b" },
  { id: "swordtail",  name: "红剑鱼",   rarity: "common", shape: "fish",   body: "#f97316", pattern: "none",     tail: "forked", sword: true,  accent: "#ea580c" },
  { id: "bluegourami",name: "蓝曼龙",   rarity: "common", shape: "fish",   body: "#38bdf8", pattern: "spots",    patternColor: "#e0f2fe", tail: "round", accent: "#0ea5e9" },
  { id: "kissing",    name: "接吻鱼",   rarity: "common", shape: "fish",   body: "#fecdd3", pattern: "none",     tail: "round",  accent: "#fda4af" },
  { id: "pearlgourami",name: "珍珠马甲", rarity: "common", shape: "fish",  body: "#cbd5e1", pattern: "spots",    patternColor: "#ffffff", tail: "round", accent: "#94a3b8" },

  // ---------- 稀有 ----------
  { id: "bluetang",   name: "蓝倒吊",   rarity: "rare",   shape: "fish",   body: "#3b82f6", pattern: "bands",    patternColor: "#1e293b", tail: "fan",    accent: "#facc15" },
  { id: "butterfly",  name: "蝴蝶鱼",   rarity: "rare",   shape: "fish",   body: "#fde047", pattern: "bands",    patternColor: "#1e293b", tail: "fan",    accent: "#f59e0b" },
  { id: "seahorse",   name: "海马",     rarity: "rare",   shape: "seahorse", body: "#f59e0b", pattern: "none",  tail: "round",  accent: "#fbbf24" },
  { id: "lionfish",   name: "狮子鱼",   rarity: "rare",   shape: "fish",   body: "#f87171", pattern: "stripes",  patternColor: "#ffffff", tail: "flow",  accent: "#ef4444" },
  { id: "bloodparrot",name: "血鹦鹉",   rarity: "rare",   shape: "fish",   body: "#f43f5e", pattern: "none",     tail: "round",  accent: "#fb7185" },
  { id: "redtail",    name: "红尾黑鲨", rarity: "rare",   shape: "fish",   body: "#111827", pattern: "none",     tail: "forked", accent: "#ef4444" },
  { id: "rainbowfish",name: "彩虹鱼",   rarity: "rare",   shape: "fish",   body: "#8b5cf6", pattern: "rainbow",  tail: "fan",    accent: "#a78bfa" },
  { id: "moonfish",   name: "月光蝶",   rarity: "rare",   shape: "fish",   body: "#e2e8f0", pattern: "bands",    patternColor: "#0f172a", tail: "fan",    accent: "#94a3b8" },

  // ---------- 史诗 ----------
  { id: "oarfish",    name: "皇带鱼",   rarity: "epic",   shape: "long",   body: "#cbd5e1", pattern: "none",     crest: true,    tail: "round",  accent: "#ef4444" },
  { id: "mandarin",   name: "麒麟鱼",   rarity: "epic",   shape: "fish",   body: "#10b981", pattern: "mandarin", tail: "fan",    accent: "#0ea5e9" },
  { id: "discus",     name: "七彩神仙", rarity: "epic",   shape: "angel",  body: "#fb923c", pattern: "bands",    patternColor: "#3b82f6", tail: "fan",  accent: "#f97316" },

  // ---------- 传说 ----------
  { id: "arowana",    name: "金龙鱼",   rarity: "legendary", shape: "long", body: "#fbbf24", pattern: "none",  whiskers: true, tail: "fan", accent: "#d97706" },
];

export const FISH_BY_ID = Object.fromEntries(FISH.map((f) => [f.id, f]));
export const FISH_BY_RARITY = Object.fromEntries(
  RARITY_ORDER.map((r) => [r, FISH.filter((f) => f.rarity === r)])
);

export function rarityLabel(rarity) {
  return RARITY_META[rarity]?.label ?? rarity;
}
