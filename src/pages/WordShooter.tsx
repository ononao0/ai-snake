import { useRef, useEffect, useState, useCallback } from "react";
import questions, { Question } from "./wordShooterQuestions";

// --- Constants ---
const CANVAS_W = 600;
const CANVAS_H = 500;
const PLAYER_W = 36;
const PLAYER_H = 28;
const PLAYER_SPEED = 5;
const BULLET_W = 4;
const BULLET_H = 12;
const BULLET_SPEED = 7;
const LETTER_SIZE = 28;
const LETTER_FALL_SPEED = 1.2;
const SHOOT_INTERVAL = 12; // frames between shots while holding space
const SPAWN_INTERVAL = 45; // frames between letter spawns
const CORRECT_RATIO = 0.35;
const DUMMY_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const MAX_LIVES = 3;
const SCORE_CORRECT = 100;
const SCORE_WRONG = -50;
const CLEAR_DELAY = 90; // frames (1.5s at 60fps)
const ITEM_SIZE = 24;
const ITEM_FALL_SPEED = 1.0;
const ITEM_SPAWN_CHANCE = 0.004;
const HINT_DURATION = 180; // frames (3s at 60fps)
const SCORE_ITEM = 50;
const INVINCIBLE_DURATION = 90; // frames (1.5s at 60fps)
const LETTER_COLORS = ["#3fb950", "#fbbf24", "#f97583", "#58a6ff", "#a855f7", "#ff7b72", "#79c0ff", "#d2a8ff"];

// --- Types ---
interface Letter {
  x: number;
  y: number;
  char: string;
  color: string;
  alive: boolean;
}

interface Bullet {
  x: number;
  y: number;
  alive: boolean;
}

interface Item {
  x: number;
  y: number;
  type: "hint" | "life";
  alive: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface GameState {
  phase: "playing" | "cleared" | "gameover" | "allclear";
  playerX: number;
  bullets: Bullet[];
  letters: Letter[];
  questionIdx: number;
  collected: boolean[];
  lives: number;
  score: number;
  correctQueue: string[];
  spawnTimer: number;
  shootTimer: number;
  clearTimer: number;
  items: Item[];
  particles: Particle[];
  hintText: string;
  hintTimer: number;
  invTimer: number;
}

// --- Helpers ---
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function initState(questionIdx: number, shuffled: Question[]): GameState {
  const answer = shuffled[questionIdx].answer;
  return {
    phase: "playing",
    playerX: CANVAS_W / 2,
    bullets: [],
    letters: [],
    questionIdx,
    collected: answer.split("").map(() => false),
    lives: MAX_LIVES,
    score: 0,
    correctQueue: shuffleArray(answer.split("")),
    spawnTimer: 0,
    shootTimer: 0,
    clearTimer: 0,
    items: [],
    particles: [],
    hintText: "",
    hintTimer: 0,
    invTimer: 0,
  };
}

function spawnParticles(s: GameState, x: number, y: number, color: string, count: number) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    s.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 20 + Math.random() * 15,
      maxLife: 35,
      color,
      size: 2 + Math.random() * 3,
    });
  }
}

// --- Component ---
export default function WordShooter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shuffledQuestionsRef = useRef<Question[]>(shuffleArray(questions));
  const stateRef = useRef<GameState>(initState(0, shuffledQuestionsRef.current));
  const keysRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number>(0);

  // React state for overlay UI
  const [uiPhase, setUiPhase] = useState<GameState["phase"]>("playing");
  const [uiScore, setUiScore] = useState(0);
  const [uiLives, setUiLives] = useState(MAX_LIVES);
  const [uiQuestionNum, setUiQuestionNum] = useState(1);

  const syncUI = useCallback(
    (s: GameState) => {
      setUiPhase(s.phase);
      setUiScore(s.score);
      setUiLives(s.lives);
      setUiQuestionNum(s.questionIdx + 1);
    },
    []
  );

  // --- Game loop ---
  const gameLoop = useCallback(() => {
    const s = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const keys = keysRef.current;
    const answer = shuffledQuestionsRef.current[s.questionIdx].answer;

    if (s.phase === "playing") {
      // --- Player movement ---
      if (keys.has("ArrowLeft") || keys.has("a")) {
        s.playerX = Math.max(PLAYER_W / 2, s.playerX - PLAYER_SPEED);
      }
      if (keys.has("ArrowRight") || keys.has("d")) {
        s.playerX = Math.min(CANVAS_W - PLAYER_W / 2, s.playerX + PLAYER_SPEED);
      }

      // --- Shooting ---
      if (s.shootTimer > 0) s.shootTimer--;
      if ((keys.has(" ") || keys.has("ArrowUp") || keys.has("w")) && s.shootTimer === 0) {
        s.bullets.push({
          x: s.playerX,
          y: CANVAS_H - PLAYER_H - 8,
          alive: true,
        });
        s.shootTimer = SHOOT_INTERVAL;
      }

      // --- Update bullets ---
      for (const b of s.bullets) {
        b.y -= BULLET_SPEED;
        if (b.y < -BULLET_H) b.alive = false;
      }
      s.bullets = s.bullets.filter((b) => b.alive);

      // --- Spawn letters ---
      s.spawnTimer++;
      if (s.spawnTimer >= SPAWN_INTERVAL) {
        s.spawnTimer = 0;
        const spawnCorrect =
          s.correctQueue.length > 0 && Math.random() < CORRECT_RATIO;
        let char: string;
        if (spawnCorrect) {
          char = s.correctQueue.shift()!;
        } else {
          // pick a dummy letter not matching any uncollected answer letter
          const needed = new Set(
            answer.split("").filter((_, i) => !s.collected[i])
          );
          let c: string;
          do {
            c = DUMMY_LETTERS[Math.floor(Math.random() * DUMMY_LETTERS.length)];
          } while (needed.has(c));
          char = c;
        }
        s.letters.push({
          x: Math.random() * (CANVAS_W - LETTER_SIZE * 2) + LETTER_SIZE,
          y: -LETTER_SIZE,
          char,
          color: LETTER_COLORS[Math.floor(Math.random() * LETTER_COLORS.length)],
          alive: true,
        });
      }

      // --- Spawn items ---
      if (Math.random() < ITEM_SPAWN_CHANCE) {
        let type: "hint" | "life";
        if (s.lives >= 5 && s.hintTimer > 0) {
          // both blocked, skip
        } else if (s.lives >= 5) {
          type = "hint";
          s.items.push({ x: Math.random() * (CANVAS_W - ITEM_SIZE * 2) + ITEM_SIZE, y: -ITEM_SIZE, type, alive: true });
        } else if (s.hintTimer > 0) {
          type = "life";
          s.items.push({ x: Math.random() * (CANVAS_W - ITEM_SIZE * 2) + ITEM_SIZE, y: -ITEM_SIZE, type, alive: true });
        } else {
          type = Math.random() < 0.5 ? "hint" : "life";
          s.items.push({ x: Math.random() * (CANVAS_W - ITEM_SIZE * 2) + ITEM_SIZE, y: -ITEM_SIZE, type, alive: true });
        }
      }

      // --- Update items ---
      for (const it of s.items) {
        it.y += ITEM_FALL_SPEED;
        if (it.y > CANVAS_H + ITEM_SIZE) it.alive = false;
      }
      s.items = s.items.filter((it) => it.alive);

      // --- Hint timer ---
      if (s.hintTimer > 0) s.hintTimer--;
      if (s.hintTimer <= 0) s.hintText = "";

      // --- Update particles ---
      for (const p of s.particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // gravity
        p.life--;
      }
      s.particles = s.particles.filter((p) => p.life > 0);

      // --- Update letters ---
      for (const l of s.letters) {
        l.y += LETTER_FALL_SPEED;
        // fell off screen
        if (l.y > CANVAS_H + LETTER_SIZE) {
          l.alive = false;
          // if this was a correct letter needed, re-queue it
          const stillNeeded = answer.split("").some(
            (ch, i) => ch === l.char && !s.collected[i]
          );
          if (stillNeeded) {
            s.correctQueue.push(l.char);
          }
        }
      }
      s.letters = s.letters.filter((l) => l.alive);

      // --- Invincibility timer ---
      if (s.invTimer > 0) s.invTimer--;

      // --- Collision: letter vs player ---
      if (s.invTimer === 0) {
        const playerTop = CANVAS_H - PLAYER_H - 4;
        const playerLeft = s.playerX - PLAYER_W / 2;
        const playerRight = s.playerX + PLAYER_W / 2;
        const playerBottom = CANVAS_H - 4;
        for (const l of s.letters) {
          if (!l.alive) continue;
          if (
            l.x + LETTER_SIZE / 2 > playerLeft &&
            l.x - LETTER_SIZE / 2 < playerRight &&
            l.y + LETTER_SIZE / 2 > playerTop &&
            l.y - LETTER_SIZE / 2 < playerBottom
          ) {
            l.alive = false;
            s.lives--;
            s.invTimer = INVINCIBLE_DURATION;
            spawnParticles(s, l.x, l.y, "#f85149", 10);
            // re-queue if correct letter still needed
            const stillNeeded = answer.split("").some(
              (ch, i) => ch === l.char && !s.collected[i]
            );
            if (stillNeeded) {
              s.correctQueue.push(l.char);
            }
            if (s.lives <= 0) {
              s.lives = 0;
              s.phase = "gameover";
            }
            break;
          }
        }
        s.letters = s.letters.filter((l) => l.alive);
      }

      // --- Collision: bullet vs items ---
      for (const b of s.bullets) {
        if (!b.alive) continue;
        for (const it of s.items) {
          if (!it.alive) continue;
          if (
            b.x - BULLET_W / 2 < it.x + ITEM_SIZE / 2 &&
            b.x + BULLET_W / 2 > it.x - ITEM_SIZE / 2 &&
            b.y - BULLET_H / 2 < it.y + ITEM_SIZE / 2 &&
            b.y + BULLET_H / 2 > it.y - ITEM_SIZE / 2
          ) {
            b.alive = false;
            it.alive = false;
            s.score += SCORE_ITEM;
            if (it.type === "hint") {
              s.hintText = shuffledQuestionsRef.current[s.questionIdx].hint;
              s.hintTimer = HINT_DURATION;
              spawnParticles(s, it.x, it.y, "#a855f7", 10);
            } else {
              s.lives = Math.min(s.lives + 1, 5);
              spawnParticles(s, it.x, it.y, "#ec4899", 10);
            }
            break;
          }
        }
      }
      s.bullets = s.bullets.filter((b) => b.alive);
      s.items = s.items.filter((it) => it.alive);

      // --- Collision: bullet vs letters (AABB) ---
      for (const b of s.bullets) {
        if (!b.alive) continue;
        for (const l of s.letters) {
          if (!l.alive) continue;
          // AABB
          if (
            b.x - BULLET_W / 2 < l.x + LETTER_SIZE / 2 &&
            b.x + BULLET_W / 2 > l.x - LETTER_SIZE / 2 &&
            b.y - BULLET_H / 2 < l.y + LETTER_SIZE / 2 &&
            b.y + BULLET_H / 2 > l.y - LETTER_SIZE / 2
          ) {
            b.alive = false;
            l.alive = false;
            // check if this letter fills any uncollected position
            const pos = answer.split("").findIndex(
              (ch, i) => ch === l.char && !s.collected[i]
            );
            if (pos !== -1) {
              s.collected[pos] = true;
              s.score += SCORE_CORRECT;
              spawnParticles(s, l.x, l.y, "#3fb950", 12);
              // check if word complete
              if (s.collected.every(Boolean)) {
                if (s.questionIdx >= shuffledQuestionsRef.current.length - 1) {
                  s.phase = "allclear";
                } else {
                  s.phase = "cleared";
                  s.clearTimer = CLEAR_DELAY;
                }
              }
            } else {
              // wrong letter
              s.lives--;
              s.score += SCORE_WRONG;
              spawnParticles(s, l.x, l.y, "#f85149", 8);
              if (s.lives <= 0) {
                s.lives = 0;
                s.phase = "gameover";
              }
            }
            break;
          }
        }
      }
      s.bullets = s.bullets.filter((b) => b.alive);
      s.letters = s.letters.filter((l) => l.alive);
    }

    // --- Update particles (always, even when not playing) ---
    if (s.phase !== "playing") {
      for (const p of s.particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.life--;
      }
      s.particles = s.particles.filter((p) => p.life > 0);
    }

    // --- Cleared phase: wait then advance ---
    if (s.phase === "cleared") {
      s.clearTimer--;
      if (s.clearTimer <= 0) {
        const nextQ = s.questionIdx + 1;
        const score = s.score;
        const lives = s.lives;
        Object.assign(s, initState(nextQ, shuffledQuestionsRef.current));
        s.score = score;
        s.lives = lives;
      }
    }

    // --- Sync React UI ---
    syncUI(s);

    // --- Draw ---
    draw(ctx, s, answer);

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [syncUI]);

  // --- Draw function ---
  function draw(ctx: CanvasRenderingContext2D, s: GameState, answer: string) {
    // background
    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // starfield-like dots
    ctx.fillStyle = "#1a1f2e";
    for (let i = 0; i < 40; i++) {
      // deterministic "stars" based on index
      const sx = ((i * 137 + 43) % CANVAS_W);
      const sy = ((i * 211 + 97) % CANVAS_H);
      ctx.fillRect(sx, sy, 1, 1);
    }

    // question area bg
    ctx.fillStyle = "#161b22";
    ctx.fillRect(0, 0, CANVAS_W, 60);
    ctx.strokeStyle = "#30363d";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 60);
    ctx.lineTo(CANVAS_W, 60);
    ctx.stroke();

    // question text
    ctx.fillStyle = "#e6edf3";
    ctx.font = "bold 15px monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      shuffledQuestionsRef.current[s.questionIdx].question,
      CANVAS_W / 2,
      28
    );

    // progress
    ctx.fillStyle = "#58a6ff";
    ctx.font = "bold 20px monospace";
    const progress = answer
      .split("")
      .map((ch, i) => (s.collected[i] ? ch : "_"))
      .join(" ");
    ctx.fillText(progress, CANVAS_W / 2, 50);

    // letters
    ctx.font = "bold 22px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const l of s.letters) {
      // glow effect
      ctx.fillStyle = "#1a1d23";
      ctx.beginPath();
      ctx.arc(l.x, l.y, LETTER_SIZE / 2 + 2, 0, Math.PI * 2);
      ctx.fill();
      // letter bg circle
      ctx.fillStyle = "#21262d";
      ctx.beginPath();
      ctx.arc(l.x, l.y, LETTER_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = l.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // letter
      ctx.fillStyle = l.color;
      ctx.fillText(l.char, l.x, l.y + 1);
    }

    // items
    for (const it of s.items) {
      if (it.type === "hint") {
        // purple diamond with "?"
        ctx.save();
        ctx.translate(it.x, it.y);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = "#2d1b4e";
        ctx.fillRect(-ITEM_SIZE / 2, -ITEM_SIZE / 2, ITEM_SIZE, ITEM_SIZE);
        ctx.strokeStyle = "#a855f7";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-ITEM_SIZE / 2, -ITEM_SIZE / 2, ITEM_SIZE, ITEM_SIZE);
        ctx.restore();
        ctx.fillStyle = "#a855f7";
        ctx.font = "bold 16px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("?", it.x, it.y);
      } else {
        // pink heart
        ctx.fillStyle = "#ec4899";
        ctx.font = "22px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("♥", it.x, it.y);
      }
    }

    // hint text display
    if (s.hintText) {
      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "center";
      ctx.fillText(s.hintText, CANVAS_W / 2, 76);
    }

    // particles
    for (const p of s.particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // bullets
    for (const b of s.bullets) {
      ctx.fillStyle = "#ffa657";
      ctx.shadowColor = "#ffa657";
      ctx.shadowBlur = 6;
      ctx.fillRect(b.x - BULLET_W / 2, b.y - BULLET_H / 2, BULLET_W, BULLET_H);
      ctx.shadowBlur = 0;
    }

    // player (triangle ship) — blink when invincible
    const playerVisible = s.invTimer === 0 || Math.floor(s.invTimer / 4) % 2 === 0;
    if (playerVisible) {
      ctx.fillStyle = "#58a6ff";
      ctx.shadowColor = "#58a6ff";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(s.playerX, CANVAS_H - PLAYER_H - 4);
      ctx.lineTo(s.playerX - PLAYER_W / 2, CANVAS_H - 4);
      ctx.lineTo(s.playerX + PLAYER_W / 2, CANVAS_H - 4);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // engine glow
      ctx.fillStyle = "#ffa657";
      ctx.beginPath();
      ctx.moveTo(s.playerX - 6, CANVAS_H - 4);
      ctx.lineTo(s.playerX, CANVAS_H + 4);
      ctx.lineTo(s.playerX + 6, CANVAS_H - 4);
      ctx.closePath();
      ctx.fill();
    }

    // overlay for cleared / gameover / allclear
    if (s.phase === "cleared") {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = "#3fb950";
      ctx.font = "bold 32px monospace";
      ctx.textAlign = "center";
      ctx.fillText("CLEAR!", CANVAS_W / 2, CANVAS_H / 2 - 10);
      ctx.fillStyle = "#8b949e";
      ctx.font = "16px monospace";
      ctx.fillText(`"${answer}"`, CANVAS_W / 2, CANVAS_H / 2 + 25);
    }

    if (s.phase === "gameover") {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = "#f85149";
      ctx.font = "bold 36px monospace";
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", CANVAS_W / 2, CANVAS_H / 2 - 20);
      ctx.fillStyle = "#8b949e";
      ctx.font = "16px monospace";
      ctx.fillText(`Score: ${s.score}`, CANVAS_W / 2, CANVAS_H / 2 + 20);
    }

    if (s.phase === "allclear") {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = "#ffa657";
      ctx.font = "bold 32px monospace";
      ctx.textAlign = "center";
      ctx.fillText("ALL CLEAR!", CANVAS_W / 2, CANVAS_H / 2 - 20);
      ctx.fillStyle = "#8b949e";
      ctx.font = "16px monospace";
      ctx.fillText(`Final Score: ${s.score}`, CANVAS_W / 2, CANVAS_H / 2 + 20);
    }
  }

  // --- Restart ---
  const handleRestart = useCallback(() => {
    shuffledQuestionsRef.current = shuffleArray(questions);
    stateRef.current = initState(0, shuffledQuestionsRef.current);
    syncUI(stateRef.current);
  }, [syncUI]);

  // --- Setup ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", " ", "a", "d", "w"].includes(e.key)) {
        e.preventDefault();
      }
      keysRef.current.add(e.key);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    rafRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(rafRef.current);
    };
  }, [gameLoop]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="mb-4 flex gap-6 items-center">
        <span className="text-sm text-gray-500">
          Q{uiQuestionNum}/{shuffledQuestionsRef.current.length}
        </span>
        <span className="text-sm text-gray-500">
          Score: <span className="text-white font-semibold">{uiScore}</span>
        </span>
        <span className="text-sm text-gray-500">
          Lives:{" "}
          <span className="text-red-400 font-semibold">
            {"♥".repeat(uiLives)}
          </span>
        </span>
        {(uiPhase === "gameover" || uiPhase === "allclear") && (
          <button
            onClick={handleRestart}
            className="px-4 py-2 bg-green-500 text-black border-none rounded-md cursor-pointer font-semibold hover:bg-green-400 transition-colors"
          >
            Play Again
          </button>
        )}
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="border border-[#333] rounded"
      />
      <p className="mt-3 text-gray-500 text-sm">
        ← → to move, Space to shoot. Shoot the correct letters to spell the answer!
      </p>
    </div>
  );
}
