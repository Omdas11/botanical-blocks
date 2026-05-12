const GRID_SIZE = 8;
const SWIPE_THRESHOLD = 28;
const STAGES = [
  { name: "Seed", emoji: "🌱", image: "assets/characters/seed.png", score: 2 },
  { name: "Sprout", emoji: "🌿", image: "assets/characters/sprout.png", score: 4 },
  { name: "Bud", emoji: "🌷", image: "assets/characters/bud.png", score: 8 },
  { name: "Flower", emoji: "🌻", image: "assets/characters/flower.png", score: 16 },
  { name: "Tree", emoji: "🌳", image: "assets/characters/tree.png", score: 32 }
];

const boardEl = document.getElementById("board");
const scoreEl = document.getElementById("score");

let board = [];
let score = 0;
let imageAvailability = new Array(STAGES.length).fill(false);
let touchStart = null;

function createEmptyBoard() {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
}

function randomEmptyCell() {
  const empty = [];
  for (let r = 0; r < GRID_SIZE; r += 1) {
    for (let c = 0; c < GRID_SIZE; c += 1) {
      if (board[r][c] === null) empty.push([r, c]);
    }
  }
  if (!empty.length) return null;
  return empty[Math.floor(Math.random() * empty.length)];
}

function spawnSeed() {
  const target = randomEmptyCell();
  if (!target) return false;
  const [r, c] = target;
  board[r][c] = 0;
  return true;
}

function compressAndMerge(line) {
  const compact = line.filter((x) => x !== null);
  const merged = [];
  let gained = 0;
  let i = 0;

  while (i < compact.length) {
    if (i + 1 < compact.length && compact[i] === compact[i + 1]) {
      const nextStage = Math.min(compact[i] + 1, STAGES.length - 1);
      merged.push(nextStage);
      gained += STAGES[nextStage].score;
      i += 2;
    } else {
      merged.push(compact[i]);
      i += 1;
    }
  }

  while (merged.length < GRID_SIZE) merged.push(null);
  return { line: merged, gained };
}

function reverse(arr) {
  return [...arr].reverse();
}

function move(direction) {
  let moved = false;
  let gained = 0;
  const next = createEmptyBoard();

  if (direction === "left" || direction === "right") {
    for (let r = 0; r < GRID_SIZE; r += 1) {
      const source = direction === "right" ? reverse(board[r]) : [...board[r]];
      const { line, gained: add } = compressAndMerge(source);
      const finalLine = direction === "right" ? reverse(line) : line;
      next[r] = finalLine;
      gained += add;
      if (!moved && finalLine.some((val, i) => val !== board[r][i])) moved = true;
    }
  } else {
    for (let c = 0; c < GRID_SIZE; c += 1) {
      const column = [];
      for (let r = 0; r < GRID_SIZE; r += 1) column.push(board[r][c]);
      const source = direction === "down" ? reverse(column) : column;
      const { line, gained: add } = compressAndMerge(source);
      const finalCol = direction === "down" ? reverse(line) : line;
      gained += add;
      for (let r = 0; r < GRID_SIZE; r += 1) {
        next[r][c] = finalCol[r];
        if (!moved && finalCol[r] !== board[r][c]) moved = true;
      }
    }
  }

  if (!moved) return false;

  board = next;
  score += gained;
  spawnSeed();
  render();

  if (isGameOver()) {
    setTimeout(() => {
      alert(`Game Over! Final score: ${score}`);
    }, 50);
  }

  return true;
}

function canMove() {
  for (let r = 0; r < GRID_SIZE; r += 1) {
    for (let c = 0; c < GRID_SIZE; c += 1) {
      const cell = board[r][c];
      if (cell === null) return true;
      if (c + 1 < GRID_SIZE && board[r][c + 1] === cell) return true;
      if (r + 1 < GRID_SIZE && board[r + 1][c] === cell) return true;
    }
  }
  return false;
}

function isGameOver() {
  return !canMove();
}

function applyEmojiFallback(tile, stage) {
  tile.textContent = stage.emoji;
  tile.classList.add("emoji-fallback");
}

function render() {
  boardEl.innerHTML = "";

  for (let r = 0; r < GRID_SIZE; r += 1) {
    for (let c = 0; c < GRID_SIZE; c += 1) {
      const tile = document.createElement("div");
      tile.className = "tile";

      const value = board[r][c];
      if (value === null) {
        tile.classList.add("tile-empty");
      } else {
        tile.classList.add(`tile-stage-${value}`);
        const stage = STAGES[value];

        if (imageAvailability[value]) {
          const img = document.createElement("img");
          img.src = stage.image;
          img.alt = stage.name;
          img.onerror = () => {
            img.remove();
            applyEmojiFallback(tile, stage);
          };
          tile.appendChild(img);
        } else {
          applyEmojiFallback(tile, stage);
        }
      }

      boardEl.appendChild(tile);
    }
  }

  scoreEl.textContent = String(score);
}

function handleKey(event) {
  const map = {
    ArrowLeft: "left",
    ArrowRight: "right",
    ArrowUp: "up",
    ArrowDown: "down",
    a: "left",
    A: "left",
    d: "right",
    D: "right",
    w: "up",
    W: "up",
    s: "down",
    S: "down"
  };

  const direction = map[event.key];
  if (!direction) return;
  event.preventDefault();
  move(direction);
}

function handleTouchStart(event) {
  if (!event.changedTouches[0]) return;
  touchStart = {
    x: event.changedTouches[0].clientX,
    y: event.changedTouches[0].clientY
  };
}

function handleTouchEnd(event) {
  if (!touchStart || !event.changedTouches[0]) return;

  const dx = event.changedTouches[0].clientX - touchStart.x;
  const dy = event.changedTouches[0].clientY - touchStart.y;
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  const threshold = SWIPE_THRESHOLD;

  if (Math.max(ax, ay) < threshold) {
    touchStart = null;
    return;
  }

  if (ax > ay) {
    move(dx > 0 ? "right" : "left");
  } else {
    move(dy > 0 ? "down" : "up");
  }

  touchStart = null;
}

function preloadStageImages() {
  return Promise.all(
    STAGES.map(
      (stage, index) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            imageAvailability[index] = true;
            resolve();
          };
          img.onerror = () => {
            imageAvailability[index] = false;
            resolve();
          };
          img.src = stage.image;
        })
    )
  );
}

async function init() {
  board = createEmptyBoard();
  score = 0;

  await preloadStageImages();

  spawnSeed();
  spawnSeed();

  render();

  window.addEventListener("keydown", handleKey);
  boardEl.addEventListener("touchstart", handleTouchStart, { passive: true });
  boardEl.addEventListener("touchend", handleTouchEnd, { passive: true });
}

init();
