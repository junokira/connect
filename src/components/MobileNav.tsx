import { Bell, Compass, Home, Plus, UserRound } from "lucide-react";
import { PointerEvent, useRef, useState } from "react";

type Props = {
  activeView: "canvas" | "explore" | "search" | "activity";
  onHome: () => void;
  onExplore: () => void;
  onCreate: () => void;
  onActivity: () => void;
  onProfile: () => void;
};

export function MobileNav({ activeView, onHome, onExplore, onCreate, onActivity, onProfile }: Props) {
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const [dragX, setDragX] = useState(0);
  const items = [
    { id: "canvas", action: onHome },
    { id: "explore", action: onExplore },
    { id: "activity", action: onActivity },
    { id: "create", action: onCreate },
    { id: "profile", action: onProfile }
  ];
  const activeIndex = activeView === "canvas" ? 0 : activeView === "explore" ? 1 : activeView === "activity" ? 2 : 0;
  const vibrate = () => {
    if ("vibrate" in navigator) navigator.vibrate(8);
  };
  const pointerDown = (event: PointerEvent<HTMLElement>) => {
    dragRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const pointerMove = (event: PointerEvent<HTMLElement>) => {
    const start = dragRef.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    if (Math.abs(dx) > Math.abs(event.clientY - start.y)) setDragX(Math.max(-44, Math.min(44, dx)));
  };
  const pointerUp = (event: PointerEvent<HTMLElement>) => {
    const start = dragRef.current;
    dragRef.current = null;
    setDragX(0);
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = Math.abs(event.clientY - start.y);
    if (Math.abs(dx) < 42 || Math.abs(dx) < dy * 1.25) return;
    const nextIndex = Math.max(0, Math.min(items.length - 1, activeIndex + (dx < 0 ? 1 : -1)));
    vibrate();
    items[nextIndex].action();
  };

  return (
    <nav onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={() => { dragRef.current = null; setDragX(0); }} className="liquid-dock fixed inset-x-3 bottom-3 z-40 flex touch-pan-y items-center justify-around rounded-3xl border border-white/45 bg-white/72 px-3 py-2 shadow-glass backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/72 lg:hidden">
      <span
        className="pointer-events-none absolute top-2 h-11 w-11 rounded-2xl bg-slate-950 transition-transform duration-300 ease-out dark:bg-white"
        style={{ left: `calc(${activeIndex * 20 + 10}% - 22px)`, transform: `translateX(${dragX}px)`, opacity: activeView === "search" ? 0 : 1 }}
      />
      <button onClick={onHome} className={`dock-item grid h-11 w-11 place-items-center rounded-2xl ${activeView === "canvas" ? "active bg-slate-950 text-white dark:bg-white dark:text-slate-950" : "text-slate-700 dark:text-slate-200"}`} aria-label="Canvas">
        <Home size={21} />
      </button>
      <button onClick={onExplore} className={`dock-item grid h-11 w-11 place-items-center rounded-2xl ${activeView === "explore" ? "active bg-slate-950 text-white dark:bg-white dark:text-slate-950" : "text-slate-700 dark:text-slate-200"}`} aria-label="Explore">
        <Compass size={21} />
      </button>
      <button onClick={onCreate} className="dock-item grid h-12 w-12 place-items-center rounded-full bg-slate-950 text-white shadow-lg dark:bg-white dark:text-slate-950" aria-label="Create">
        <Plus size={22} />
      </button>
      <button onClick={onActivity} className={`dock-item grid h-11 w-11 place-items-center rounded-2xl ${activeView === "activity" ? "active bg-slate-950 text-white dark:bg-white dark:text-slate-950" : "text-slate-700 dark:text-slate-200"}`} aria-label="Activity">
        <Bell size={21} />
      </button>
      <button onClick={onProfile} className="dock-item grid h-11 w-11 place-items-center rounded-2xl text-slate-700 dark:text-slate-200" aria-label="Profile">
        <UserRound size={21} />
      </button>
    </nav>
  );
}
