import { useCallback, useEffect, useRef, useState } from "react";

const GRID = 25;
const CELL = 24;
const SIZE = GRID * CELL;
const BASE_TICK = 150;
const TICK_DECREASE = 5;
const MIN_TICK = 80;
const FOOD_COUNT = 3;

type Point = { x: number; y: number };
type Dir = "UP" | "DOWN" | "LEFT" | "RIGHT";
type Phase = "playing" | "gameOver" | "victory";

interface Food {
  pos: Point;
  letter: string;
  correct: boolean;
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

const PUZZLES: { hint: string; answer: string }[] = [
  // 3-letter words (1-20)
  { hint: "Opposite of night", answer: "DAY" },
  { hint: "A pet that barks", answer: "DOG" },
  { hint: "Frozen water", answer: "ICE" },
  { hint: "Opposite of cold", answer: "HOT" },
  { hint: "Opposite of happy", answer: "SAD" },
  { hint: "You write with this", answer: "PEN" },
  { hint: "A pet that meows", answer: "CAT" },
  { hint: "Comes from a hen", answer: "EGG" },
  { hint: "Opposite of new", answer: "OLD" },
  { hint: "Color of the sky", answer: "RED" },
  { hint: "A male child", answer: "BOY" },
  { hint: "Insects make this", answer: "BUG" },
  { hint: "A floor covering", answer: "RUG" },
  { hint: "You sleep in this", answer: "BED" },
  { hint: "Opposite of wet", answer: "DRY" },
  { hint: "You use this to cut", answer: "SAW" },
  { hint: "A body of water", answer: "SEA" },
  { hint: "Not cold, not hot", answer: "MIX" },
  { hint: "Vehicle on rails", answer: "VAN" },
  { hint: "Sticky insect trap", answer: "WEB" },
  // 4-letter words (21-50)
  { hint: "A red fruit", answer: "APPLE" },
  { hint: "You see with these", answer: "EYES" },
  { hint: "King of the jungle", answer: "LION" },
  { hint: "You read this", answer: "BOOK" },
  { hint: "Opposite of slow", answer: "FAST" },
  { hint: "Water from the sky", answer: "RAIN" },
  { hint: "It shines at night", answer: "MOON" },
  { hint: "It tells time", answer: "CLOCK" },
  { hint: "A baby dog", answer: "PUPS" },
  { hint: "Twinkles in the sky", answer: "STAR" },
  { hint: "You kick this in soccer", answer: "BALL" },
  { hint: "It grows on your head", answer: "HAIR" },
  { hint: "Opposite of love", answer: "HATE" },
  { hint: "A sweet dessert", answer: "CAKE" },
  { hint: "You open it to enter", answer: "DOOR" },
  { hint: "A green amphibian", answer: "FROG" },
  { hint: "Carries your books", answer: "BAGS" },
  { hint: "A large gray animal", answer: "BEAR" },
  { hint: "It falls in winter", answer: "SNOW" },
  { hint: "You sit on this", answer: "SEAT" },
  { hint: "Opposite of tall", answer: "TINY" },
  { hint: "Worn on the foot", answer: "SHOE" },
  { hint: "You eat soup with this", answer: "BOWL" },
  { hint: "A flying toy", answer: "KITE" },
  { hint: "It protects from rain", answer: "COAT" },
  { hint: "Sound a bell makes", answer: "RING" },
  { hint: "Opposite of hard", answer: "SOFT" },
  { hint: "Land surrounded by water", answer: "ISLE" },
  { hint: "A farm animal that oinks", answer: "PIGS" },
  { hint: "You drink from this", answer: "CUPS" },
  // 5-letter words (51-75)
  { hint: "Planet we live on", answer: "EARTH" },
  { hint: "A large body of water", answer: "OCEAN" },
  { hint: "Opposite of dark", answer: "LIGHT" },
  { hint: "Season after winter", answer: "SPRING" },
  { hint: "You wear it on your wrist", answer: "WATCH" },
  { hint: "A place to swim", answer: "BEACH" },
  { hint: "Opposite of below", answer: "ABOVE" },
  { hint: "A musical instrument with keys", answer: "PIANO" },
  { hint: "You sleep here at night", answer: "DREAM" },
  { hint: "Round and red, a vegetable", answer: "ONION" },
  { hint: "A tall plant", answer: "PLANT" },
  { hint: "It powers electronics", answer: "POWER" },
  { hint: "A quick meal", answer: "SNACK" },
  { hint: "A piece of furniture for books", answer: "SHELF" },
  { hint: "It orbits the Earth", answer: "SPACE" },
  { hint: "Keeps your house warm", answer: "STOVE" },
  { hint: "A sound you hear in mountains", answer: "VOICE" },
  { hint: "It blows through trees", answer: "STORM" },
  { hint: "A game with a net", answer: "MATCH" },
  { hint: "Needed to unlock a door", answer: "LATCH" },
  { hint: "A precious stone", answer: "JEWEL" },
  { hint: "Your brain does this", answer: "THINK" },
  { hint: "A country in Europe with pizza", answer: "ITALY" },
  { hint: "You put food on this", answer: "PLATE" },
  { hint: "A baby horse", answer: "FILLY" },
  // 5-6 letter words (76-100)
  { hint: "A yellow fruit", answer: "BANANA" },
  { hint: "A baby cat", answer: "KITTEN" },
  { hint: "Where airplanes land", answer: "RUNWAY" },
  { hint: "A tropical bird", answer: "PARROT" },
  { hint: "A frozen treat on a stick", answer: "ICICLE" },
  { hint: "Color of grass", answer: "GREENS" },
  { hint: "Opposite of always", answer: "SELDOM" },
  { hint: "Worn on your finger", answer: "SILVER" },
  { hint: "Sound of laughter", answer: "GIGGLE" },
  { hint: "A striped wild horse", answer: "ZEBRAS" },
  { hint: "A hot drink from leaves", answer: "HERBAL" },
  { hint: "Where books are kept", answer: "SHELVE" },
  { hint: "You dig with this", answer: "SHOVEL" },
  { hint: "A type of monkey", answer: "BABOON" },
  { hint: "Tiny pieces of bread", answer: "CRUMBS" },
  { hint: "A winter sport on ice", answer: "HOCKEY" },
  { hint: "A colorful arc in the sky", answer: "PRISMS" },
  { hint: "A device for calling people", answer: "MOBILE" },
  { hint: "A place to see animals", answer: "SAFARI" },
  { hint: "Opposite of danger", answer: "SAFETY" },
  { hint: "Breakfast food from hens", answer: "OMELET" },
  { hint: "It carries passengers on water", answer: "VESSEL" },
  { hint: "A magic word", answer: "PLEASE" },
  { hint: "A large spotted cat", answer: "JAGUAR" },
  { hint: "Frozen rain", answer: "FREEZE" },
];

function randomLetter(exclude: string): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let ch: string;
  do {
    ch = letters[Math.floor(Math.random() * 26)];
  } while (ch === exclude);
  return ch;
}

function randomPos(occupied: Point[]): Point {
  let p: Point;
  do {
    p = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
  } while (occupied.some((o) => o.x === p.x && o.y === p.y));
  return p;
}

function spawnFoods(correctLetter: string, snake: Point[]): Food[] {
  const foods: Food[] = [];
  const occupied = [...snake];

  const correctPos = randomPos(occupied);
  foods.push({ pos: correctPos, letter: correctLetter, correct: true });
  occupied.push(correctPos);

  for (let i = 0; i < FOOD_COUNT - 1; i++) {
    const pos = randomPos(occupied);
    foods.push({ pos, letter: randomLetter(correctLetter), correct: false });
    occupied.push(pos);
  }

  return foods;
}

function spawnParticles(x: number, y: number, colors: string[], count: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 1 + Math.random() * 3;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 30 + Math.random() * 20,
      maxLife: 50,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 2 + Math.random() * 3,
    });
  }
  return particles;
}

export default function SnakeEnglish() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<Phase>("playing");
  const [eatenLetters, setEatenLetters] = useState<string[]>([]);

  const stateRef = useRef({
    snake: [{ x: 12, y: 12 }] as Point[],
    dir: "RIGHT" as Dir,
    nextDir: "RIGHT" as Dir,
    foods: [] as Food[],
    particles: [] as Particle[],
    running: true,
    puzzleIndex: 0,
    letterIndex: 0,
    phase: "playing" as Phase,
    score: 0,
    level: 1,
    eatenLetters: [] as string[],
    glowAlpha: 0,
    shakeFrames: 0,
    shakeOffsetX: 0,
    shakeOffsetY: 0,
    animFrame: 0,
  });

  const initPuzzle = useCallback((puzzleIdx: number, lvl: number, keepSnake = false) => {
    const s = stateRef.current;
    if (!keepSnake) {
      s.snake = [{ x: 12, y: 12 }];
      s.dir = "RIGHT";
      s.nextDir = "RIGHT";
      s.particles = [];
    }
    s.puzzleIndex = puzzleIdx;
    s.letterIndex = 0;
    s.eatenLetters = [];
    s.glowAlpha = 0;
    s.shakeFrames = 0;
    s.level = lvl;
    s.phase = "playing";
    s.running = true;

    const answer = PUZZLES[puzzleIdx].answer;
    s.foods = spawnFoods(answer[0], s.snake);

    setLevel(lvl);
    setEatenLetters([]);
    setPhase("playing");
  }, []);

  const reset = useCallback(() => {
    const s = stateRef.current;
    s.score = 0;
    setScore(0);
    initPuzzle(0, 1);
  }, [initPuzzle]);

  // Keyboard input
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      const map: Record<string, Dir> = {
        ArrowUp: "UP", ArrowDown: "DOWN", ArrowLeft: "LEFT", ArrowRight: "RIGHT",
        w: "UP", s: "DOWN", a: "LEFT", d: "RIGHT",
      };
      const nd = map[e.key];
      if (!nd) return;
      e.preventDefault();
      const opposite: Record<Dir, Dir> = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" };
      if (opposite[nd] !== s.dir) s.nextDir = nd;
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Initialize first puzzle
  useEffect(() => {
    initPuzzle(0, 1);
  }, [initPuzzle]);

  // Game loop
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    let timerId: ReturnType<typeof setTimeout>;

    const tick = () => {
      const s = stateRef.current;
      s.animFrame++;

      // Update particles
      s.particles = s.particles
        .map((p) => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.05, life: p.life - 1 }))
        .filter((p) => p.life > 0);

      // Glow fade
      if (s.glowAlpha > 0) s.glowAlpha = Math.max(0, s.glowAlpha - 0.05);

      // Shake update
      if (s.shakeFrames > 0) {
        s.shakeFrames--;
        s.shakeOffsetX = (Math.random() - 0.5) * 6;
        s.shakeOffsetY = (Math.random() - 0.5) * 6;
      } else {
        s.shakeOffsetX = 0;
        s.shakeOffsetY = 0;
      }

      if (!s.running) {
        render(ctx, s);
        if (s.particles.length > 0) {
          timerId = setTimeout(tick, currentTick());
        }
        return;
      }

      // Move snake
      s.dir = s.nextDir;
      const head = { ...s.snake[0] };
      if (s.dir === "UP") head.y--;
      if (s.dir === "DOWN") head.y++;
      if (s.dir === "LEFT") head.x--;
      if (s.dir === "RIGHT") head.x++;

      // Wall collision
      if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) {
        triggerGameOver(s);
        render(ctx, s);
        timerId = setTimeout(tick, currentTick());
        return;
      }

      // Self collision
      if (s.snake.some((p) => p.x === head.x && p.y === head.y)) {
        triggerGameOver(s);
        render(ctx, s);
        timerId = setTimeout(tick, currentTick());
        return;
      }

      s.snake.unshift(head);

      // Food collision
      const eatenFoodIdx = s.foods.findIndex((f) => f.pos.x === head.x && f.pos.y === head.y);
      if (eatenFoodIdx !== -1) {
        const food = s.foods[eatenFoodIdx];
        const puzzle = PUZZLES[s.puzzleIndex];

        if (food.letter === puzzle.answer[s.letterIndex]) {
          // Correct letter
          s.letterIndex++;
          s.eatenLetters = [...s.eatenLetters, food.letter];
          s.score += 10;
          s.glowAlpha = 0.8;
          setScore(s.score);
          setEatenLetters([...s.eatenLetters]);

          const px = head.x * CELL + CELL / 2;
          const py = head.y * CELL + CELL / 2;
          s.particles.push(...spawnParticles(px, py, ["#4f4", "#8f8", "#ff4", "#fd0"], 12));

          if (s.letterIndex >= puzzle.answer.length) {
            // Word complete - bonus score and confetti burst, then immediately next word
            s.score += 50;
            setScore(s.score);
            for (let i = 0; i < 3; i++) {
              const cx = Math.random() * SIZE;
              const cy = Math.random() * SIZE;
              s.particles.push(...spawnParticles(cx, cy, ["#f44", "#4f4", "#44f", "#ff4", "#f4f", "#4ff"], 8));
            }

            const nextIdx = s.puzzleIndex + 1;
            if (nextIdx >= PUZZLES.length) {
              s.phase = "victory";
              s.running = false;
              setPhase("victory");
            } else {
              // Keep snake, load next puzzle immediately
              initPuzzle(nextIdx, s.level + 1, true);
            }
          } else {
            // Spawn new foods for next letter
            s.foods = spawnFoods(puzzle.answer[s.letterIndex], s.snake);
          }
        } else {
          // Wrong letter - game over
          const px = head.x * CELL + CELL / 2;
          const py = head.y * CELL + CELL / 2;
          s.particles.push(...spawnParticles(px, py, ["#f44", "#f66", "#f00", "#c00"], 20));
          triggerGameOver(s);
        }
      } else {
        // No food eaten, remove tail
        s.snake.pop();
      }

      render(ctx, s);
      timerId = setTimeout(tick, currentTick());
    };

    function currentTick(): number {
      const s = stateRef.current;
      return Math.max(MIN_TICK, BASE_TICK - (s.level - 1) * TICK_DECREASE);
    }

    function triggerGameOver(s: typeof stateRef.current) {
      s.running = false;
      s.phase = "gameOver";
      s.shakeFrames = 10;
      setPhase("gameOver");
    }

    function render(ctx: CanvasRenderingContext2D, s: typeof stateRef.current) {
      ctx.save();
      ctx.translate(s.shakeOffsetX, s.shakeOffsetY);

      // Background
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, SIZE, SIZE);

      // Grid lines (subtle)
      ctx.strokeStyle = "#151515";
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= GRID; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL, 0);
        ctx.lineTo(i * CELL, SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * CELL);
        ctx.lineTo(SIZE, i * CELL);
        ctx.stroke();
      }

      // Snake body with gradient
      for (let i = s.snake.length - 1; i >= 0; i--) {
        const p = s.snake[i];
        const ratio = 1 - i / Math.max(s.snake.length, 1);
        const g = Math.floor(100 + ratio * 155);
        ctx.fillStyle = `rgb(30, ${g}, 30)`;
        ctx.fillRect(p.x * CELL + 1, p.y * CELL + 1, CELL - 2, CELL - 2);
      }

      // Glow effect on head
      if (s.glowAlpha > 0 && s.snake.length > 0) {
        const head = s.snake[0];
        const cx = head.x * CELL + CELL / 2;
        const cy = head.y * CELL + CELL / 2;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, CELL * 2);
        grad.addColorStop(0, `rgba(100, 255, 100, ${s.glowAlpha})`);
        grad.addColorStop(1, `rgba(100, 255, 100, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(cx - CELL * 2, cy - CELL * 2, CELL * 4, CELL * 4);
      }

      // Food letters (pulsing)
      if (s.phase === "playing") {
        const pulse = 0.6 + 0.4 * Math.sin(s.animFrame * 0.15);
        for (const food of s.foods) {
          const fx = food.pos.x * CELL;
          const fy = food.pos.y * CELL;

          // Food background
          ctx.globalAlpha = pulse;
          ctx.fillStyle = "#333";
          ctx.fillRect(fx + 2, fy + 2, CELL - 4, CELL - 4);

          // Letter
          ctx.globalAlpha = 0.7 + 0.3 * pulse;
          ctx.fillStyle = "#fff";
          ctx.font = `bold ${CELL - 6}px monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(food.letter, fx + CELL / 2, fy + CELL / 2 + 1);
          ctx.globalAlpha = 1;
        }
      }

      // Particles
      for (const p of s.particles) {
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
      ctx.globalAlpha = 1;

      // Victory overlay
      if (s.phase === "victory") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(0, 0, SIZE, SIZE);
        ctx.fillStyle = "#fd0";
        ctx.font = "bold 32px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Congratulations!", SIZE / 2, SIZE / 2 - 20);
        ctx.font = "20px sans-serif";
        ctx.fillStyle = "#fff";
        ctx.fillText(`All ${PUZZLES.length} words complete!`, SIZE / 2, SIZE / 2 + 15);
        ctx.fillText(`Final Score: ${s.score}`, SIZE / 2, SIZE / 2 + 45);
      }

      // Game over overlay
      if (s.phase === "gameOver") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, SIZE, SIZE);
        ctx.fillStyle = "#f44";
        ctx.font = "bold 36px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Game Over", SIZE / 2, SIZE / 2);
      }

      ctx.restore();
    }

    timerId = setTimeout(tick, currentTick());
    return () => clearTimeout(timerId);
  }, [initPuzzle]);

  const puzzle = PUZZLES[stateRef.current.puzzleIndex];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      {/* Hint */}
      <div className="mb-2 text-lg font-semibold text-yellow-400">
        Hint: {puzzle?.hint}
      </div>

      {/* Letter progress */}
      <div className="mb-3 flex gap-1.5">
        {puzzle?.answer.split("").map((_ch, i) => (
          <span
            key={i}
            className={`w-8 h-8 flex items-center justify-center rounded text-lg font-bold transition-all duration-200 ${
              i < eatenLetters.length
                ? "bg-green-600 text-white scale-110"
                : "bg-gray-700 text-gray-500"
            }`}
          >
            {i < eatenLetters.length ? eatenLetters[i] : "_"}
          </span>
        ))}
      </div>

      {/* Score / Level / Restart */}
      <div className="mb-3 flex gap-6 items-center">
        <span className="text-sm text-gray-400">Score: {score}</span>
        <span className="text-sm text-gray-400">Level: {level}</span>
        {(phase === "gameOver" || phase === "victory") && (
          <button
            onClick={reset}
            className="px-4 py-1.5 bg-green-500 text-black border-none rounded-md cursor-pointer font-semibold text-sm hover:bg-green-400 transition-colors"
          >
            Restart
          </button>
        )}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        className="border border-[#333] rounded"
      />

      <p className="mt-3 text-gray-500 text-sm">
        Arrow keys or WASD to move. Eat the correct letter to spell the word!
      </p>
    </div>
  );
}
