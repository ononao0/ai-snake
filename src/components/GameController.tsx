import { useCallback, useRef } from "react";

type Variant = "dpad" | "shooter";

interface GameControllerProps {
  variant?: Variant;
}

/** Maps a button id to the keyboard key it simulates. */
const KEY_MAP: Record<string, string> = {
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
  shoot: " ", // Space
};

function fire(key: string, type: "keydown" | "keyup") {
  window.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true }));
}

export default function GameController({ variant = "dpad" }: GameControllerProps) {
  // Track which buttons are currently pressed to handle multi-touch
  const pressed = useRef<Set<string>>(new Set());

  const onStart = useCallback((id: string) => {
    if (pressed.current.has(id)) return;
    pressed.current.add(id);
    const key = KEY_MAP[id];
    if (key) fire(key, "keydown");
  }, []);

  const onEnd = useCallback((id: string) => {
    if (!pressed.current.has(id)) return;
    pressed.current.delete(id);
    const key = KEY_MAP[id];
    if (key) fire(key, "keyup");
  }, []);

  const bind = (id: string) => ({
    onTouchStart: (e: React.TouchEvent) => {
      e.preventDefault();
      onStart(id);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      e.preventDefault();
      onEnd(id);
    },
    onTouchCancel: () => onEnd(id),
    // Mouse fallback for desktop testing
    onMouseDown: () => onStart(id),
    onMouseUp: () => onEnd(id),
    onMouseLeave: () => onEnd(id),
  });

  if (variant === "shooter") {
    return (
      <div className="flex items-center justify-between w-full max-w-[400px] mx-auto mt-4 select-none touch-none px-4">
        {/* Left / Right */}
        <div className="flex gap-3">
          <Btn label="&#9664;" {...bind("left")} />
          <Btn label="&#9654;" {...bind("right")} />
        </div>
        {/* Shoot */}
        <Btn
          label="FIRE"
          {...bind("shoot")}
          className="w-18 h-18 rounded-full bg-red-600 active:bg-red-500 text-sm font-bold"
        />
      </div>
    );
  }

  // Default: dpad
  return (
    <div className="flex flex-col items-center mt-4 select-none touch-none">
      <div className="grid grid-cols-3 gap-1.5 w-[156px]">
        <div /> {/* spacer */}
        <Btn label="&#9650;" {...bind("up")} />
        <div /> {/* spacer */}
        <Btn label="&#9664;" {...bind("left")} />
        <div className="w-12 h-12" /> {/* center */}
        <Btn label="&#9654;" {...bind("right")} />
        <div /> {/* spacer */}
        <Btn label="&#9660;" {...bind("down")} />
        <div /> {/* spacer */}
      </div>
    </div>
  );
}

/* ── Button primitive ── */

interface BtnProps extends React.HTMLAttributes<HTMLButtonElement> {
  label: string;
}

function Btn({ label, className, ...rest }: BtnProps) {
  return (
    <button
      className={
        className ??
        "w-12 h-12 rounded-lg bg-[#222] active:bg-[#444] border border-[#444] text-gray-200 text-lg flex items-center justify-center"
      }
      {...rest}
    >
      <span dangerouslySetInnerHTML={{ __html: label }} />
    </button>
  );
}
