/* ひらがな あそび — 5歳児向けひらがな学習アプリ */

const GRID_ROWS = [
  ["あ", "い", "う", "え", "お"],
  ["か", "き", "く", "け", "こ"],
  ["さ", "し", "す", "せ", "そ"],
  ["た", "ち", "つ", "て", "と"],
  ["な", "に", "ぬ", "ね", "の"],
  ["は", "ひ", "ふ", "へ", "ほ"],
  ["ま", "み", "む", "め", "も"],
  ["や", "", "ゆ", "", "よ"],
  ["ら", "り", "る", "れ", "ろ"],
  ["わ", "", "を", "", ""],
  ["", "", "ん", "", ""],
];

// 濁音・半濁音（色は対応する清音の行に合わせる）
const DAKUTEN_ROWS = [
  ["が", "ぎ", "ぐ", "げ", "ご"],
  ["ざ", "じ", "ず", "ぜ", "ぞ"],
  ["だ", "ぢ", "づ", "で", "ど"],
  ["ば", "び", "ぶ", "べ", "ぼ"],
  ["ぱ", "ぴ", "ぷ", "ぺ", "ぽ"],
];
const DAKUTEN_ROW_CLASSES = [1, 2, 3, 5, 7];

const KANA_LIST = [...GRID_ROWS.flat(), ...DAKUTEN_ROWS.flat()].filter(Boolean);

// 使用例: [ことば, 絵文字, 読み上げテキスト]
const EXAMPLES = {
  "あ": ["あり", "🐜"],
  "い": ["いぬ", "🐶"],
  "う": ["うさぎ", "🐰"],
  "え": ["えんぴつ", "✏️"],
  "お": ["おにぎり", "🍙"],
  "か": ["かさ", "☂️"],
  "き": ["きりん", "🦒"],
  "く": ["くるま", "🚗"],
  "け": ["けいと", "🧶"],
  "こ": ["こおり", "🧊"],
  "さ": ["さかな", "🐟"],
  "し": ["しか", "🦌"],
  "す": ["すいか", "🍉"],
  "せ": ["せんべい", "🍘"],
  "そ": ["そら", "☁️"],
  "た": ["たこ", "🐙"],
  "ち": ["ちょうちょ", "🦋"],
  "つ": ["つき", "🌙"],
  "て": ["てんとうむし", "🐞"],
  "と": ["とけい", "⏰"],
  "な": ["なす", "🍆"],
  "に": ["にんじん", "🥕"],
  "ぬ": ["ぬいぐるみ", "🧸"],
  "ね": ["ねこ", "🐱"],
  "の": ["のこぎり", "🪚"],
  "は": ["はな", "🌸"],
  "ひ": ["ひよこ", "🐤"],
  "ふ": ["ふうせん", "🎈"],
  "へ": ["へび", "🐍"],
  "ほ": ["ほし", "⭐"],
  "ま": ["まる", "⭕"],
  "み": ["みかん", "🍊"],
  "む": ["むし", "🐛"],
  "め": ["めがね", "👓"],
  "も": ["もも", "🍑"],
  "や": ["やま", "⛰️"],
  "ゆ": ["ゆきだるま", "⛄"],
  "よ": ["よる", "🌃"],
  "ら": ["らっぱ", "🎺"],
  "り": ["りんご", "🍎"],
  "る": ["るびー", "💎"],
  "れ": ["れもん", "🍋"],
  "ろ": ["ろうそく", "🕯️"],
  "わ": ["わに", "🐊"],
  "を": ["ほんを よむ", "📖"],
  "ん": ["ぱん", "🍞"],
  "が": ["がっこう", "🏫"],
  "ぎ": ["ぎゅうにゅう", "🥛"],
  "ぐ": ["ぐー", "✊"],
  "げ": ["げんき", "💪"],
  "ご": ["ごはん", "🍚"],
  "ざ": ["ざりがに", "🦞"],
  "じ": ["じてんしゃ", "🚲"],
  "ず": ["ずぼん", "👖"],
  "ぜ": ["ぜりー", "🍨"],
  "ぞ": ["ぞう", "🐘"],
  "だ": ["だんご", "🍡"],
  "ぢ": ["はなぢ", "🩸"],
  "づ": ["こづつみ", "📦"],
  "で": ["でんしゃ", "🚃"],
  "ど": ["どんぐり", "🌰"],
  "ば": ["ばなな", "🍌"],
  "び": ["びっくり", "😲"],
  "ぶ": ["ぶた", "🐷"],
  "べ": ["べんとう", "🍱"],
  "ぼ": ["ぼうし", "👒"],
  "ぱ": ["ぱんだ", "🐼"],
  "ぴ": ["ぴかぴか", "✨"],
  "ぷ": ["ぷりん", "🍮"],
  "ぺ": ["ぺんぎん", "🐧"],
  "ぽ": ["ぽすと", "📮"],
};

const STROKE_COLORS = ["#ff5d8f", "#4d96ff", "#38b000", "#ff9f1c", "#9d4edd"];
const SVG_NS = "http://www.w3.org/2000/svg";
const SEEN_KEY = "hiragana-seen";

let currentKana = null;
let animToken = 0; // 進行中アニメーションの無効化用

const gridScreen = document.getElementById("grid-screen");
const detailScreen = document.getElementById("detail-screen");
const stage = document.getElementById("stage");

/* ---------- 50音表 ---------- */

function loadSeen() {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY)) || []);
  } catch {
    return new Set();
  }
}

function markSeen(kana) {
  const seen = loadSeen();
  seen.add(kana);
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
  } catch {
    /* プライベートモード等では保存しない */
  }
}

function buildGrid() {
  buildGridInto("kana-grid", GRID_ROWS, (rowIdx) => rowIdx);
  buildGridInto("dakuten-grid", DAKUTEN_ROWS, (rowIdx) => DAKUTEN_ROW_CLASSES[rowIdx]);
}

function buildGridInto(gridId, rows, rowClassOf) {
  const grid = document.getElementById(gridId);
  grid.textContent = "";
  const seen = loadSeen();
  rows.forEach((row, rowIdx) => {
    row.forEach((kana) => {
      const cell = document.createElement("button");
      cell.className = `kana-cell row-${rowClassOf(rowIdx)}`;
      if (!kana) {
        cell.classList.add("empty");
        cell.disabled = true;
      } else {
        cell.textContent = kana;
        if (seen.has(kana)) {
          const star = document.createElement("span");
          star.className = "seen-star";
          star.textContent = "⭐";
          cell.appendChild(star);
        }
        cell.addEventListener("click", () => openDetail(kana));
      }
      grid.appendChild(cell);
    });
  });
}

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

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ja-JP";
  if (jaVoice) u.voice = jaVoice;
  u.rate = 0.8;
  u.pitch = 1.1;
  speechSynthesis.speak(u);
}

/* ---------- 筆順アニメーション ---------- */

function buildStageSVG(kana) {
  const data = STROKE_DATA[kana];
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 109 109");

  // うすい下書き（なぞりがきのガイドにもなる）
  const ghost = document.createElementNS(SVG_NS, "g");
  ghost.setAttribute(
    "style",
    "fill:none;stroke:#e3dacc;stroke-width:7;stroke-linecap:round;stroke-linejoin:round"
  );
  data.strokes.forEach((d) => {
    const p = document.createElementNS(SVG_NS, "path");
    p.setAttribute("d", d);
    ghost.appendChild(p);
  });
  svg.appendChild(ghost);

  // 色つきの筆順ストローク（アニメーション対象）
  const animPaths = data.strokes.map((d, i) => {
    const p = document.createElementNS(SVG_NS, "path");
    p.setAttribute("d", d);
    p.setAttribute(
      "style",
      `fill:none;stroke:${STROKE_COLORS[i % STROKE_COLORS.length]};` +
        "stroke-width:6;stroke-linecap:round;stroke-linejoin:round"
    );
    svg.appendChild(p);
    return p;
  });

  // 画数の番号バッジ
  const numberGroups = data.numbers.map(([x, y], i) => {
    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("visibility", "hidden");
    const c = document.createElementNS(SVG_NS, "circle");
    c.setAttribute("cx", x);
    c.setAttribute("cy", y - 3);
    c.setAttribute("r", 7);
    c.setAttribute("fill", STROKE_COLORS[i % STROKE_COLORS.length]);
    const t = document.createElementNS(SVG_NS, "text");
    t.setAttribute("x", x);
    t.setAttribute("y", y);
    t.setAttribute("text-anchor", "middle");
    t.setAttribute("font-size", "9");
    t.setAttribute("font-weight", "bold");
    t.setAttribute("fill", "#fff");
    t.textContent = String(i + 1);
    g.append(c, t);
    svg.appendChild(g);
    return g;
  });

  return { svg, animPaths, numberGroups };
}

function playStrokeAnimation() {
  const token = ++animToken;
  const { animPaths, numberGroups } = stage._parts;

  // いったん全部消す
  animPaths.forEach((p) => {
    const len = p.getTotalLength();
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
  });
  numberGroups.forEach((g) => g.setAttribute("visibility", "hidden"));

  const PAUSE = 350; // 画と画の間
  let i = 0;

  function drawNext() {
    if (token !== animToken) return;
    if (i >= animPaths.length) return;
    const path = animPaths[i];
    numberGroups[i].setAttribute("visibility", "visible");
    const len = path.getTotalLength();
    const duration = Math.max(400, len * 14);
    const start = performance.now();

    function frame(now) {
      if (token !== animToken) return;
      const t = Math.min(1, (now - start) / duration);
      path.style.strokeDashoffset = len * (1 - t);
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        i += 1;
        setTimeout(() => requestAnimationFrame(drawNext), PAUSE);
      }
    }
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(drawNext);
}

/* ---------- なぞりがきキャンバス ---------- */

function setupTraceCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const size = stage.clientWidth;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(10, size * 0.045);
  ctx.strokeStyle = "rgba(255, 140, 60, 0.85)";

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
    // タップだけでも点が出るように
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

/* ---------- 画面遷移 ---------- */

function openDetail(kana) {
  currentKana = kana;
  markSeen(kana);

  gridScreen.hidden = true;
  detailScreen.hidden = false;
  window.scrollTo(0, 0);

  // ステージを組み立て直す
  stage.textContent = "";
  const parts = buildStageSVG(kana);
  stage._parts = parts;
  stage.appendChild(parts.svg);

  const canvas = document.createElement("canvas");
  stage.appendChild(canvas);
  stage._clearTrace = setupTraceCanvas(canvas);

  // ことばカード
  const [word, emoji] = EXAMPLES[kana];
  document.getElementById("example-emoji").textContent = emoji;
  const wordEl = document.getElementById("example-word");
  wordEl.textContent = "";
  let highlighted = false;
  for (const ch of word) {
    const span = document.createElement("span");
    span.textContent = ch;
    if (ch === kana && !highlighted) {
      span.className = "target-kana";
      highlighted = true;
    }
    wordEl.appendChild(span);
  }

  speak(kana);
  playStrokeAnimation();
}

function closeDetail() {
  animToken++;
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  detailScreen.hidden = true;
  gridScreen.hidden = false;
  buildGrid(); // ⭐を反映
}

/* ---------- ボタン ---------- */

document.getElementById("back-btn").addEventListener("click", closeDetail);

document.getElementById("sound-btn").addEventListener("click", () => {
  if (currentKana) speak(currentKana);
});

document.getElementById("replay-btn").addEventListener("click", () => {
  if (stage._clearTrace) stage._clearTrace();
  playStrokeAnimation();
});

document.getElementById("clear-btn").addEventListener("click", () => {
  if (stage._clearTrace) stage._clearTrace();
});

document.getElementById("example-card").addEventListener("click", () => {
  if (currentKana) speak(EXAMPLES[currentKana][0]);
});

document.getElementById("prev-btn").addEventListener("click", () => {
  const i = KANA_LIST.indexOf(currentKana);
  openDetail(KANA_LIST[(i - 1 + KANA_LIST.length) % KANA_LIST.length]);
});

document.getElementById("next-btn").addEventListener("click", () => {
  const i = KANA_LIST.indexOf(currentKana);
  openDetail(KANA_LIST[(i + 1) % KANA_LIST.length]);
});

/* ---------- 起動 ---------- */

buildGrid();
