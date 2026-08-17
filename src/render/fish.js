// 参数化 SVG 鱼渲染：用一份模板 + 每个物种的配色/花纹参数生成 SVG，无需逐条手绘素材。
// 支持形状：fish（标准）/ angel（高身）/ betta（斗鱼）/ seahorse（海马）/ long（长身）
// 支持花纹：none / stripes / bands / spots / line / rainbow / mandarin

export function shade(hex, amt) {
  // amt: -1..1，负数为变暗，正数为变亮
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return hex;
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;
  if (amt >= 0) {
    r = r + (255 - r) * amt;
    g = g + (255 - g) * amt;
    b = b + (255 - b) * amt;
  } else {
    r = r * (1 + amt);
    g = g * (1 + amt);
    b = b * (1 + amt);
  }
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

const SIL = {
  body: "#94a3b8",
  accent: "#b6c2ce",
  dark: "#64748b",
};

function colors(species, silhouette) {
  if (silhouette) return { body: SIL.body, accent: SIL.accent, dark: SIL.dark, belly: "#e2e8f0" };
  return {
    body: species.body,
    accent: species.accent || shade(species.body, -0.15),
    dark: species.patternColor || "#1e293b",
    belly: species.belly || "#ffffff",
  };
}

function defs(id, c) {
  const light = shade(c.body, 0.28);
  const dark = shade(c.body, -0.28);
  return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${light}"/>
    <stop offset="0.55" stop-color="${c.body}"/>
    <stop offset="1" stop-color="${dark}"/>
  </linearGradient>`;
}

function pattern(id, species, c, bodyEl) {
  if (species.shape === "seahorse" || species.shape === "long" || species.shape === "betta") return "";
  const clip = `<clipPath id="${id}-clip"><ellipse cx="64" cy="40" rx="34" ry="22"/></clipPath>`;
  let inner = "";
  const pc = species.patternColor || c.dark;
  switch (species.pattern) {
    case "stripes":
      inner = [46, 62, 78].map((x) => `<rect x="${x}" y="8" width="9" height="64" fill="${pc}" opacity="0.9"/>`).join("");
      break;
    case "bands": {
      const band = (x) => `<rect x="${x}" y="8" width="11" height="64" fill="${pc}" opacity="0.9" transform="rotate(34 64 40)"/>`;
      inner = band(42) + band(66);
      break;
    }
    case "spots":
      inner = [
        [54, 32, 4], [70, 48, 3.6], [60, 50, 2.6], [74, 30, 3], [50, 44, 2.6], [64, 28, 2.2],
      ].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${pc}" opacity="0.85"/>`).join("");
      break;
    case "line":
      inner = `<rect x="30" y="35" width="68" height="9" fill="${pc}" opacity="0.92"/>`;
      break;
    case "rainbow": {
      const cols = ["#f43f5e", "#f59e0b", "#22c55e", "#3b82f6"];
      inner = cols.map((col, i) => `<rect x="30" y="${28 + i * 6}" width="68" height="6" fill="${col}" opacity="0.85"/>`).join("");
      break;
    }
    case "mandarin": {
      const cols = ["#3b82f6", "#f97316", "#facc15", "#22d55e", "#f43f5e"];
      const pts = [[50, 30, 3], [62, 44, 3.5], [72, 32, 3], [58, 52, 2.6], [78, 44, 2.8], [52, 44, 2.4], [68, 50, 2.4]];
      inner = pts.map(([x, y, r], i) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${cols[i % cols.length]}" opacity="0.95"/>`).join("");
      break;
    }
    default:
      return "";
  }
  return `<defs>${clip}</defs><g clip-path="url(#${id}-clip)">${inner}</g>`;
}

function tailPath(tail, sword) {
  switch (tail) {
    case "fan":
      return { d: "M36 40 C18 16 5 18 3 40 C5 62 18 64 36 40 Z", extra: "" };
    case "forked":
      return {
        d: "M36 40 L12 24 L18 40 L12 56 Z",
        extra: sword
          ? `<path d="M14 46 L4 72 L16 50 Z" fill="currentColor" opacity="0.9"/>`
          : "",
      };
    case "flow":
      return {
        d: "M36 40 C22 18 6 22 4 34 C12 36 10 42 6 46 C14 50 24 60 36 40 Z",
        extra: `<path d="M36 40 C24 28 12 30 8 40 C14 46 26 50 36 40 Z" fill="currentColor" opacity="0.55"/>`,
      };
    default:
      return { d: "M36 40 Q14 26 10 40 Q14 54 36 40 Z", extra: "" };
  }
}

function fishBody(id, species, opts) {
  const c = colors(species, opts.silhouette);
  const angel = species.shape === "angel";
  const s = angel ? 1.45 : 1;
  const rx = angel ? 30 : 34;
  const ry = 22 * s;
  const eyeY = 40 - ry * 0.28;
  const eyeX = 64 + rx * 0.6;
  const t = tailPath(species.tail, species.sword);
  const tail = `<path d="${t.d}" fill="${c.accent}"/>${t.extra}`;
  const dorsal = angel
    ? `<path d="M46 24 Q58 2 78 18 Z" fill="${c.accent}"/>`
    : `<path d="M50 20 Q60 6 74 16 Z" fill="${c.accent}"/>`;
  const pectoral = `<path d="M60 52 Q54 64 64 64 Q70 58 60 52 Z" fill="${shade(c.accent, -0.1)}"/>`;
  const belly = `<ellipse cx="${64 + rx * 0.08}" cy="${40 + ry * 0.42}" rx="${rx * 0.7}" ry="${ry * 0.5}" fill="${c.belly}" opacity="0.3"/>`;
  const eye = `<circle cx="${eyeX}" cy="${eyeY}" r="5.4" fill="#ffffff"/><circle cx="${eyeX + 0.8}" cy="${eyeY}" r="2.8" fill="#111827"/><circle cx="${eyeX + 1.6}" cy="${eyeY - 1.1}" r="0.9" fill="#ffffff"/>`;
  const mouth = `<path d="M${64 + rx + 4} ${40 + 2} q5 2 2 6" stroke="#111827" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.55"/>`;
  const gill = `<path d="M${64 + rx * 0.35} ${40 - ry * 0.45} q5 ${ry * 0.42} 0 ${ry * 0.9}" stroke="#111827" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.22"/>`;
  const pat = pattern(`${id}-p`, species, c);
  return `<g>
    <defs><linearGradient id="${id}-g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${shade(c.body, 0.25)}"/>
      <stop offset="0.5" stop-color="${c.body}"/>
      <stop offset="1" stop-color="${shade(c.body, -0.3)}"/>
    </linearGradient></defs>
    ${tail}
    ${dorsal}
    <ellipse cx="64" cy="40" rx="${rx}" ry="${ry}" fill="url(#${id}-g)"/>
    ${pat}
    ${belly}
    ${pectoral}
    ${gill}
    ${eye}
    ${mouth}
  </g>`;
}

function bettaBody(id, species, opts) {
  const c = colors(species, opts.silhouette);
  const tailBack = `<path d="M58 40 C40 8 12 6 6 28 C14 30 16 38 10 46 C14 62 34 72 58 40 Z" fill="${c.accent}"/>`;
  const tailFront = `<path d="M58 40 C42 22 20 18 12 32 C20 34 20 42 14 50 C24 60 44 62 58 40 Z" fill="${shade(c.body, 0.15)}" opacity="0.9"/>`;
  const dorsal = `<path d="M68 26 Q80 6 96 20 Z" fill="${c.accent}"/>`;
  const ventral = `<path d="M68 54 Q76 72 60 74 Q54 62 68 54 Z" fill="${c.accent}"/>`;
  const body = `<ellipse cx="82" cy="40" rx="24" ry="16" fill="url(#${id}-g)"/>`;
  const eye = `<circle cx="96" cy="36" r="5" fill="#ffffff"/><circle cx="96.8" cy="36" r="2.6" fill="#111827"/>`;
  const mouth = `<path d="M106 40 q4 1 2 4" stroke="#111827" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.5"/>`;
  return `<g>
    <defs><linearGradient id="${id}-g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${shade(c.body, 0.25)}"/>
      <stop offset="0.5" stop-color="${c.body}"/>
      <stop offset="1" stop-color="${shade(c.body, -0.3)}"/>
    </linearGradient></defs>
    ${tailBack}${tailFront}${dorsal}${ventral}${body}${eye}${mouth}
  </g>`;
}

function seahorseBody(id, species, opts) {
  const c = colors(species, opts.silhouette);
  const outline = `M42 16
    C52 16 58 24 56 34
    C60 36 64 42 62 46
    C67 49 68 55 65 59
    C61 57 59 54 59 52
    C58 60 53 68 50 78
    C48 88 46 98 38 104
    C29 111 18 107 17 99
    C16 91 24 92 28 96
    C32 100 37 95 34 89
    C31 82 34 72 36 64
    C38 54 36 44 34 34
    C34 26 36 18 42 16 Z`;
  const crest = `<path d="M42 16 L43 7 L48 13 L52 6 L55 14 L60 12 L58 20" fill="none" stroke="${c.accent}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`;
  const dorsal = `<path d="M36 44 Q26 36 30 50 Q38 48 36 44 Z" fill="${c.accent}"/>`;
  const eye = `<circle cx="51" cy="26" r="4.2" fill="#ffffff"/><circle cx="52" cy="26" r="2.2" fill="#111827"/>`;
  const ridges = `<path d="M36 66 q9 5 2 11 M37 74 q7 4 1 9 M36 84 q6 4 1 7" fill="none" stroke="${shade(c.body, -0.25)}" stroke-width="1.8" stroke-linecap="round" opacity="0.7"/>`;
  return `<g>
    <defs><linearGradient id="${id}-g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${shade(c.body, -0.2)}"/>
      <stop offset="1" stop-color="${shade(c.body, 0.2)}"/>
    </linearGradient></defs>
    <path d="${outline}" fill="url(#${id}-g)" stroke="${shade(c.body, -0.3)}" stroke-width="2"/>
    ${crest}${dorsal}${ridges}${eye}
  </g>`;
}

function longBody(id, species, opts) {
  const c = colors(species, opts.silhouette);
  const tail = `<path d="M38 40 C24 28 12 32 8 40 C12 48 24 52 38 40 Z" fill="${c.accent}"/>`;
  const dorsal = `<path d="M46 27 Q70 15 96 22 Q122 12 150 22 Q168 17 180 26 Q162 30 142 25 Q120 34 98 25 Q76 30 60 29 Z" fill="${c.accent}" opacity="0.85"/>`;
  const body = `<ellipse cx="112" cy="40" rx="78" ry="15" fill="url(#${id}-g)"/>`;
  const headExtra = species.crest
    ? `<path d="M168 28 q3 -14 -1 -19 M176 27 q2 -9 -1 -13" stroke="${c.accent}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
    : species.whiskers
      ? `<path d="M184 38 q10 -7 16 -4 M184 42 q10 5 16 3" stroke="${shade(c.accent, -0.2)}" stroke-width="2" fill="none" stroke-linecap="round"/>`
      : "";
  const eye = `<circle cx="166" cy="34" r="5" fill="#ffffff"/><circle cx="166.8" cy="34" r="2.6" fill="#111827"/>`;
  const mouth = `<path d="M184 40 l5 2 -5 2" stroke="#111827" stroke-width="1.8" fill="none" opacity="0.55"/>`;
  const pat = species.pattern === "none" ? "" : `<ellipse cx="112" cy="40" rx="70" ry="11" fill="${c.dark}" opacity="0.18"/>`;
  return `<g>
    <defs><linearGradient id="${id}-g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${shade(c.body, 0.2)}"/>
      <stop offset="0.5" stop-color="${c.body}"/>
      <stop offset="1" stop-color="${shade(c.body, -0.25)}"/>
    </linearGradient></defs>
    ${tail}${dorsal}${body}${pat}${headExtra}${eye}${mouth}
  </g>`;
}

const VIEWBOX = { fish: "0 0 120 80", angel: "0 0 120 100", betta: "0 0 130 80", seahorse: "0 0 90 130", long: "0 0 200 80" };

export function renderFishSVG(species, opts = {}) {
  const { size = 120, fit = false, silhouette = false } = opts;
  const id = `${species.id}${silhouette ? "-sil" : ""}`;
  let inner = "";
  switch (species.shape) {
    case "betta":
      inner = bettaBody(id, species, { silhouette });
      break;
    case "seahorse":
      inner = seahorseBody(id, species, { silhouette });
      break;
    case "long":
      inner = longBody(id, species, { silhouette });
      break;
    default:
      inner = fishBody(id, species, { silhouette });
  }
  const vb = VIEWBOX[species.shape] || VIEWBOX.fish;
  const [vbx, vby, vbw, vbh] = vb.split(" ").map(Number);
  const w = fit ? Math.round(size * (vbw / Math.max(vbw, vbh))) : size;
  const h = fit ? Math.round(size * (vbh / Math.max(vbw, vbh))) : Math.round((size * vbh) / vbw);
  return `<svg class="fish-svg" viewBox="${vb}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${species.name}">${inner}</svg>`;
}
