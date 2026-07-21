/* おなまえ れんしゅうちょう — 名前をなぞって練習するアプリ */

const NAME = "いさじつむぎ";
const CHARS = [...NAME];
// 発音のときの 抑揚の つけかた
// 「いさじ」…ひくく かるく／間をあけて／「つむぎ」…たかく あがるように
const NAME_PARTS = [
  { text: "いさじ", pitch: 0.8, volume: 0.85 },
  { text: "つむぎ", pitch: 1.4, volume: 1.0 },
];
const NAME_PAUSE_MS = 450; // 名字と名前の あいだの ま
const CELL = 109; // KanjiVG の 1文字ぶんの viewBox

const STROKE_COLORS = ["#ff5d8f", "#4d96ff", "#38b000", "#ff9f1c", "#9d4edd", "#00b4d8"];
const SVG_NS = "http://www.w3.org/2000/svg";

let orientation = "horizontal"; // or "vertical"
let animToken = 0;

const sheet = document.getElementById("sheet");

/* ---------- 音声 ---------- */

let jaVoice = null;

function pickVoice() {
  const voices = speechSynthesis.getVoices();
  jaVoice = voices.find((v) => v.lang.startsWith("ja")) || null;
}

if ("speechSynthesis" in window) {
  pickVoice();
  speechSynthesis.addEventListener("voiceschanged", pickVoice);
}

function utterance(text) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ja-JP";
  if (jaVoice) u.voice = jaVoice;
  u.rate = 0.8;
  u.pitch = 1.1;
  return u;
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance(text));
}

// おなまえは 名字と名前を くぎって、それぞれ たかさ・おおきさ・間を つけて よむ
let nameSpeakToken = 0;

function speakName() {
  if (!("speechSynthesis" in window)) return;
  const token = ++nameSpeakToken;
  speechSynthesis.cancel();
  speakNamePart(0, token);
}

function speakNamePart(i, token) {
  if (token !== nameSpeakToken || i >= NAME_PARTS.length) return;
  const part = NAME_PARTS[i];
  const u = utterance(part.text);
  if (part.pitch != null) u.pitch = part.pitch;
  if (part.volume != null) u.volume = part.volume;
  u.onend = () => {
    if (token === nameSpeakToken && i + 1 < NAME_PARTS.length) {
      setTimeout(() => speakNamePart(i + 1, token), NAME_PAUSE_MS);
    }
  };
  speechSynthesis.speak(u);
}

/* ---------- れんしゅうシートの組み立て ---------- */

function cellOffset(index) {
  return orientation === "horizontal"
    ? { x: index * CELL, y: 0 }
    : { x: 0, y: index * CELL };
}

function buildSheet() {
  sheet.textContent = "";

  const total = CHARS.length * CELL;
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute(
    "viewBox",
    orientation === "horizontal" ? `0 0 ${total} ${CELL}` : `0 0 ${CELL} ${total}`
  );

  const guides = document.createElementNS(SVG_NS, "g");
  const ghosts = document.createElementNS(SVG_NS, "g");
  const colorLayer = document.createElementNS(SVG_NS, "g");
  const numberLayer = document.createElementNS(SVG_NS, "g");

  const flat = []; // アニメーション用に全ストロークを書き順で並べる

  CHARS.forEach((kana, ci) => {
    const data = STROKE_DATA[kana];
    const { x: ox, y: oy } = cellOffset(ci);

    // 原稿用紙ふうのマス（枠＋うすい十字）
    const box = document.createElementNS(SVG_NS, "rect");
    box.setAttribute("x", ox + 2);
    box.setAttribute("y", oy + 2);
    box.setAttribute("width", CELL - 4);
    box.setAttribute("height", CELL - 4);
    box.setAttribute("rx", 8);
    box.setAttribute("fill", "none");
    box.setAttribute("stroke", "#e7ddc8");
    box.setAttribute("stroke-width", 2);
    guides.appendChild(box);
    for (const [x1, y1, x2, y2] of [
      [ox + CELL / 2, oy + 8, ox + CELL / 2, oy + CELL - 8],
      [ox + 8, oy + CELL / 2, ox + CELL - 8, oy + CELL / 2],
    ]) {
      const line = document.createElementNS(SVG_NS, "line");
      line.setAttribute("x1", x1);
      line.setAttribute("y1", y1);
      line.setAttribute("x2", x2);
      line.setAttribute("y2", y2);
      line.setAttribute("stroke", "#efe7d6");
      line.setAttribute("stroke-width", 1.5);
      line.setAttribute("stroke-dasharray", "4 5");
      guides.appendChild(line);
    }

    const gGhost = groupAt(ox, oy);
    const gColor = groupAt(ox, oy);
    const gNum = groupAt(ox, oy);
    ghosts.appendChild(gGhost);
    colorLayer.appendChild(gColor);
    numberLayer.appendChild(gNum);

    data.strokes.forEach((d, si) => {
      // うすい下書き
      const ghost = document.createElementNS(SVG_NS, "path");
      ghost.setAttribute("d", d);
      ghost.setAttribute(
        "style",
        "fill:none;stroke:#e0d8c8;stroke-width:7;stroke-linecap:round;stroke-linejoin:round"
      );
      gGhost.appendChild(ghost);

      // 色つき（アニメーション対象）
      const color = STROKE_COLORS[si % STROKE_COLORS.length];
      const p = document.createElementNS(SVG_NS, "path");
      p.setAttribute("d", d);
      p.setAttribute(
        "style",
        `fill:none;stroke:${color};stroke-width:6;stroke-linecap:round;stroke-linejoin:round`
      );
      gColor.appendChild(p);

      // 画数バッジ（各文字ごとに 1 から）
      const [nx, ny] = data.numbers[si];
      const badge = document.createElementNS(SVG_NS, "g");
      badge.setAttribute("visibility", "hidden");
      const circle = document.createElementNS(SVG_NS, "circle");
      circle.setAttribute("cx", nx);
      circle.setAttribute("cy", ny - 3);
      circle.setAttribute("r", 7);
      circle.setAttribute("fill", color);
      const t = document.createElementNS(SVG_NS, "text");
      t.setAttribute("x", nx);
      t.setAttribute("y", ny);
      t.setAttribute("text-anchor", "middle");
      t.setAttribute("font-size", "9");
      t.setAttribute("font-weight", "bold");
      t.setAttribute("fill", "#fff");
      t.textContent = String(si + 1);
      badge.append(circle, t);
      gNum.appendChild(badge);

      flat.push({ path: p, badge, first: si === 0 });
    });
  });

  svg.append(guides, ghosts, colorLayer, numberLayer);
  sheet.appendChild(svg);
  sheet._flat = flat;

  const canvas = document.createElement("canvas");
  sheet.appendChild(canvas);
  sheet._clearTrace = setupTraceCanvas(canvas, sheet);
}

function groupAt(ox, oy) {
  const g = document.createElementNS(SVG_NS, "g");
  g.setAttribute("transform", `translate(${ox} ${oy})`);
  return g;
}

/* ---------- 筆順アニメーション（名前ぜんぶ） ---------- */

function playAnimation() {
  const token = ++animToken;
  const flat = sheet._flat;

  flat.forEach(({ path, badge }) => {
    const len = path.getTotalLength();
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    badge.setAttribute("visibility", "hidden");
  });

  let i = 0;

  function drawNext() {
    if (token !== animToken || i >= flat.length) return;
    const { path, badge, first } = flat[i];
    badge.setAttribute("visibility", "visible");
    const len = path.getTotalLength();
    const duration = Math.max(350, len * 12);
    const start = performance.now();

    function frame(now) {
      if (token !== animToken) return;
      const t = Math.min(1, (now - start) / duration);
      path.style.strokeDashoffset = len * (1 - t);
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        i += 1;
        // 次が新しい文字なら少し長めに休む
        const gap = i < flat.length && flat[i].first ? 500 : 260;
        setTimeout(() => requestAnimationFrame(drawNext), gap);
      }
    }
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(drawNext);
}

/* ---------- なぞりがきキャンバス ---------- */

function setupTraceCanvas(canvas, container) {
  const dpr = window.devicePixelRatio || 1;
  const w = container.clientWidth;
  const h = container.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(8, Math.min(w, h) * 0.05);
  ctx.strokeStyle = "rgba(255, 120, 40, 0.85)";

  let drawing = false;

  function pos(e) {
    const rect = canvas.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  }

  canvas.addEventListener("pointerdown", (e) => {
    drawing = true;
    canvas.setPointerCapture(e.pointerId);
    const [x, y] = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    const [x, y] = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  });

  ["pointerup", "pointercancel"].forEach((ev) =>
    canvas.addEventListener(ev, () => {
      drawing = false;
    })
  );

  return () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
  };
}

/* ---------- １もじを おおきく れんしゅう ---------- */

const bigStage = document.getElementById("big-stage");
const charScreen = document.getElementById("char-screen");
let bigAnimToken = 0;
let currentIndex = 0;

function buildBigStage(kana) {
  bigStage.textContent = "";
  const data = STROKE_DATA[kana];

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 109 109");

  // うすい下書き
  const ghost = document.createElementNS(SVG_NS, "g");
  ghost.setAttribute(
    "style",
    "fill:none;stroke:#e0d8c8;stroke-width:8;stroke-linecap:round;stroke-linejoin:round"
  );
  data.strokes.forEach((d) => {
    const p = document.createElementNS(SVG_NS, "path");
    p.setAttribute("d", d);
    ghost.appendChild(p);
  });
  svg.appendChild(ghost);

  // 色つき（アニメーション対象）
  const animPaths = data.strokes.map((d, i) => {
    const p = document.createElementNS(SVG_NS, "path");
    p.setAttribute("d", d);
    p.setAttribute(
      "style",
      `fill:none;stroke:${STROKE_COLORS[i % STROKE_COLORS.length]};` +
        "stroke-width:7;stroke-linecap:round;stroke-linejoin:round"
    );
    svg.appendChild(p);
    return p;
  });

  // 画数バッジ
  const badges = data.numbers.map(([x, y], i) => {
    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("visibility", "hidden");
    const c = document.createElementNS(SVG_NS, "circle");
    c.setAttribute("cx", x);
    c.setAttribute("cy", y - 3);
    c.setAttribute("r", 8);
    c.setAttribute("fill", STROKE_COLORS[i % STROKE_COLORS.length]);
    const t = document.createElementNS(SVG_NS, "text");
    t.setAttribute("x", x);
    t.setAttribute("y", y);
    t.setAttribute("text-anchor", "middle");
    t.setAttribute("font-size", "10");
    t.setAttribute("font-weight", "bold");
    t.setAttribute("fill", "#fff");
    t.textContent = String(i + 1);
    g.append(c, t);
    svg.appendChild(g);
    return g;
  });

  bigStage.appendChild(svg);
  bigStage._parts = { animPaths, badges };

  const canvas = document.createElement("canvas");
  bigStage.appendChild(canvas);
  bigStage._clearTrace = setupTraceCanvas(canvas, bigStage);
}

function playBigAnimation() {
  const token = ++bigAnimToken;
  const { animPaths, badges } = bigStage._parts;

  animPaths.forEach((p) => {
    const len = p.getTotalLength();
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
  });
  badges.forEach((g) => g.setAttribute("visibility", "hidden"));

  let i = 0;

  function drawNext() {
    if (token !== bigAnimToken || i >= animPaths.length) return;
    const path = animPaths[i];
    badges[i].setAttribute("visibility", "visible");
    const len = path.getTotalLength();
    const duration = Math.max(450, len * 14);
    const start = performance.now();

    function frame(now) {
      if (token !== bigAnimToken) return;
      const t = Math.min(1, (now - start) / duration);
      path.style.strokeDashoffset = len * (1 - t);
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        i += 1;
        setTimeout(() => requestAnimationFrame(drawNext), 380);
      }
    }
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(drawNext);
}

function openChar(index) {
  currentIndex = (index + CHARS.length) % CHARS.length;
  const kana = CHARS[currentIndex];
  document.getElementById("detail-pos").textContent = kana;
  charScreen.hidden = false;
  document.getElementById("app").hidden = true;
  window.scrollTo(0, 0);
  requestAnimationFrame(() => {
    buildBigStage(kana);
    playBigAnimation();
  });
  speak(kana);
}

function closeChar() {
  bigAnimToken++;
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  charScreen.hidden = true;
  document.getElementById("app").hidden = false;
  // 名前シートを組み直す（キャンバス実寸を取り直すため）
  requestAnimationFrame(buildSheet);
}

document.getElementById("detail-back").addEventListener("click", closeChar);
document.getElementById("detail-sound").addEventListener("click", () =>
  speak(CHARS[currentIndex])
);
document.getElementById("detail-replay").addEventListener("click", () => {
  if (bigStage._clearTrace) bigStage._clearTrace();
  playBigAnimation();
});
document.getElementById("detail-clear").addEventListener("click", () => {
  if (bigStage._clearTrace) bigStage._clearTrace();
});
document.getElementById("detail-prev").addEventListener("click", () =>
  openChar(currentIndex - 1)
);
document.getElementById("detail-next").addEventListener("click", () =>
  openChar(currentIndex + 1)
);

/* ---------- モードきりかえ ---------- */

function setOrientation(next) {
  if (orientation === next) return;
  orientation = next;
  sheet.className = orientation;
  document.getElementById("mode-yoko").classList.toggle("is-on", next === "horizontal");
  document.getElementById("mode-tate").classList.toggle("is-on", next === "vertical");
  animToken++;
  // レイアウト確定後にキャンバス実寸が取れるよう次フレームで組み立て
  requestAnimationFrame(() => {
    buildSheet();
    playAnimation();
  });
}

/* ---------- 画面の初期化 ---------- */

document.getElementById("name-big").textContent = NAME;

const chipRow = document.getElementById("char-chips");
CHARS.forEach((kana, i) => {
  const chip = document.createElement("button");
  chip.className = "char-chip";
  chip.textContent = kana;
  chip.addEventListener("click", () => openChar(i));
  chipRow.appendChild(chip);
});

document.getElementById("mode-yoko").addEventListener("click", () =>
  setOrientation("horizontal")
);
document.getElementById("mode-tate").addEventListener("click", () =>
  setOrientation("vertical")
);
document.getElementById("replay-btn").addEventListener("click", () => {
  if (sheet._clearTrace) sheet._clearTrace();
  playAnimation();
});
document.getElementById("name-sound-btn").addEventListener("click", speakName);
document.getElementById("clear-btn").addEventListener("click", () => {
  if (sheet._clearTrace) sheet._clearTrace();
});

// 画面回転や幅の変化でキャンバス解像度がずれるので組み立て直す
let resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (!charScreen.hidden) {
      bigAnimToken++;
      buildBigStage(CHARS[currentIndex]);
    } else {
      animToken++;
      buildSheet();
    }
  }, 200);
});

requestAnimationFrame(() => {
  buildSheet();
  playAnimation();
});
