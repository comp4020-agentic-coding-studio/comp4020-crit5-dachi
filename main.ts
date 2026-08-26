import {
  LANE_COUNT,
  type Lane,
  type Row,
  generateRow,
  isCollision,
  clampLane,
  speedForScore,
  difficultyForScore,
} from "./game-logic.ts";

const WORLD_W = 300;
const WORLD_H = 500;
const LANE_W = WORLD_W / LANE_COUNT;
const ROW_H = 56;
const PLAYER_Y = WORLD_H - 70;
const ROW_SPACING_PX = 170;
const SPEED_SCALE = 50;

const canvas = document.querySelector<HTMLCanvasElement>("#game")!;
const ctx = canvas.getContext("2d")!;
const live = document.querySelector<HTMLElement>("#live")!;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function laneCenter(lane: Lane): number {
  return lane * LANE_W + LANE_W / 2;
}

let playerLane: Lane = 1;
let playerX = laneCenter(playerLane);
let score = 0;
let best = 0;
let rows: { row: Row; y: number; scored: boolean }[] = [];
let spawnAccumulator = 0;
let lastTime = 0;
let gameOver = false;

function resetGame(): void {
  playerLane = 1;
  playerX = laneCenter(playerLane);
  score = 0;
  rows = [];
  spawnAccumulator = 0;
  gameOver = false;
  live.textContent = "";
}

function endGame(): void {
  gameOver = true;
  best = Math.max(best, score);
  live.textContent = `Game over. Score ${score}.`;
}

function move(delta: -1 | 1): void {
  if (gameOver) {
    resetGame();
    return;
  }
  playerLane = clampLane(playerLane + delta);
}

function update(dt: number): void {
  const speed = speedForScore(score) * SPEED_SCALE;
  spawnAccumulator += dt * speed;
  if (spawnAccumulator >= ROW_SPACING_PX) {
    spawnAccumulator -= ROW_SPACING_PX;
    rows.push({ row: generateRow(Math.random, difficultyForScore(score)), y: -ROW_H, scored: false });
  }
  for (const r of rows) {
    r.y += speed * dt;
    if (!r.scored && r.y >= PLAYER_Y - ROW_H / 2) {
      r.scored = true;
      if (isCollision(playerLane, r.row)) {
        endGame();
      } else {
        score += 1;
      }
    }
  }
  rows = rows.filter((r) => r.y < WORLD_H + ROW_H);
  playerX += (laneCenter(playerLane) - playerX) * Math.min(1, dt * 14);
}

function render(): void {
  ctx.clearRect(0, 0, WORLD_W, WORLD_H);
  ctx.fillStyle = "#0b1021";
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  for (let i = 1; i < LANE_COUNT; i++) {
    ctx.beginPath();
    ctx.moveTo(i * LANE_W, 0);
    ctx.lineTo(i * LANE_W, WORLD_H);
    ctx.stroke();
  }

  ctx.fillStyle = "#ff5d5d";
  for (const r of rows) {
    for (const lane of r.row.blocked) {
      ctx.fillRect(lane * LANE_W + 6, r.y, LANE_W - 12, ROW_H - 10);
    }
  }

  const pulse = !reducedMotion && !gameOver ? 1 + 0.04 * Math.sin(performance.now() / 220) : 1;
  ctx.fillStyle = "#57e389";
  ctx.beginPath();
  ctx.arc(playerX, PLAYER_Y, 20 * pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e8e8f0";
  ctx.font = "20px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`${score}`, 14, 32);

  if (gameOver) {
    ctx.fillStyle = "rgba(4,6,16,0.75)";
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    ctx.textAlign = "center";
    ctx.fillStyle = "#f5f5fa";
    ctx.font = "16px system-ui, sans-serif";
    ctx.fillText("GAME OVER", WORLD_W / 2, WORLD_H / 2 - 30);
    ctx.font = "32px system-ui, sans-serif";
    ctx.fillText(`${score}`, WORLD_W / 2, WORLD_H / 2 + 8);
    ctx.font = "13px system-ui, sans-serif";
    ctx.fillStyle = "rgba(245,245,250,0.7)";
    ctx.fillText(`best ${best}`, WORLD_W / 2, WORLD_H / 2 + 32);
    ctx.textAlign = "left";
  }
}

function frame(t: number): void {
  if (!lastTime) lastTime = t;
  const dt = Math.min(0.05, (t - lastTime) / 1000);
  lastTime = t;
  if (!gameOver) update(dt);
  render();
  requestAnimationFrame(frame);
}

function resize(): void {
  const dpr = window.devicePixelRatio || 1;
  const availW = Math.min(window.innerWidth - 32, 480);
  const availH = window.innerHeight - canvas.getBoundingClientRect().top - 24;
  const scale = Math.max(0.5, Math.min(availW / WORLD_W, availH / WORLD_H));
  canvas.style.width = `${WORLD_W * scale}px`;
  canvas.style.height = `${WORLD_H * scale}px`;
  canvas.width = WORLD_W * dpr;
  canvas.height = WORLD_H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resize);
resize();

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
    e.preventDefault();
    move(-1);
  } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
    e.preventDefault();
    move(1);
  } else if (gameOver && (e.key === " " || e.key === "Enter")) {
    e.preventDefault();
    resetGame();
  }
});

canvas.addEventListener("pointerdown", (e) => {
  if (gameOver) {
    resetGame();
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const relX = (e.clientX - rect.left) / rect.width;
  move(relX < 0.5 ? -1 : 1);
});

requestAnimationFrame(frame);
