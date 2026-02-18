import { useCallback, useEffect, useRef, useState } from "react";

const GRID = 20;
const CELL = 20;
const SIZE = GRID * CELL;
const TICK = 120;

type Point = { x: number; y: number };
type Dir = "UP" | "DOWN" | "LEFT" | "RIGHT";

function randomFood(snake: Point[]): Point {
  let p: Point;
  do {
    p = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
  } while (snake.some((s) => s.x === p.x && s.y === p.y));
  return p;
}

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const stateRef = useRef({
    snake: [{ x: 10, y: 10 }] as Point[],
    dir: "RIGHT" as Dir,
    nextDir: "RIGHT" as Dir,
    food: { x: 5, y: 5 } as Point,
    running: true,
  });

  const reset = useCallback(() => {
    const s = stateRef.current;
    s.snake = [{ x: 10, y: 10 }];
    s.dir = "RIGHT";
    s.nextDir = "RIGHT";
    s.food = randomFood(s.snake);
    s.running = true;
    setScore(0);
    setGameOver(false);
  }, []);

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

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const tick = () => {
      const s = stateRef.current;
      if (!s.running) return;

      s.dir = s.nextDir;
      const head = { ...s.snake[0] };
      if (s.dir === "UP") head.y--;
      if (s.dir === "DOWN") head.y++;
      if (s.dir === "LEFT") head.x--;
      if (s.dir === "RIGHT") head.x++;

      if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID ||
          s.snake.some((p) => p.x === head.x && p.y === head.y)) {
        s.running = false;
        setGameOver(true);
        return;
      }

      s.snake.unshift(head);
      if (head.x === s.food.x && head.y === s.food.y) {
        s.food = randomFood(s.snake);
        setScore((sc) => sc + 10);
      } else {
        s.snake.pop();
      }

      // draw
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, SIZE, SIZE);

      ctx.fillStyle = "#2d2";
      for (const p of s.snake) {
        ctx.fillRect(p.x * CELL + 1, p.y * CELL + 1, CELL - 2, CELL - 2);
      }

      ctx.fillStyle = "#e33";
      ctx.fillRect(s.food.x * CELL + 1, s.food.y * CELL + 1, CELL - 2, CELL - 2);
    };

    const id = setInterval(tick, TICK);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="mb-4 flex gap-6 items-center">
        <span className="text-lg">Score: {score}</span>
        {gameOver && (
          <button
            onClick={reset}
            className="px-4 py-2 bg-green-500 text-black border-none rounded-md cursor-pointer font-semibold hover:bg-green-400 transition-colors"
          >
            Restart
          </button>
        )}
      </div>
      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        className="border border-[#333] rounded"
      />
      <p className="mt-3 text-gray-500 text-sm">
        Arrow keys or WASD to move
      </p>
    </div>
  );
}
