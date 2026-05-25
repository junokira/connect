import { Bell, Compass, Home, Plus, UserRound } from "lucide-react";
import { PointerEvent, useRef, useState } from "react";

type Props = {
  activeView: "canvas" | "explore" | "search" | "activity";
  profileActive?: boolean;
  unreadCount: number;
  onHome: () => void;
  onExplore: () => void;
  onCreate: () => void;
  onActivity: () => void;
  onProfile: () => void;
};

const navActions = ["home", "explore", "create", "activity", "profile"] as const;
type NavAction = (typeof navActions)[number];

export function MobileNav({ activeView, profileActive = false, unreadCount, onHome, onExplore, onCreate, onActivity, onProfile }: Props) {
  const navRef = useRef<HTMLElement | null>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; index: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);
  const [dragIndex, setDragIndex] = useState<number | undefined>();
  const activeIndex = profileActive ? 4 : activeView === "canvas" ? 0 : activeView === "explore" ? 1 : activeView === "activity" ? 3 : 0;
  const visualIndex = dragIndex ?? activeIndex;
  const buttonClass = (active: boolean) => `dock-item relative z-10 grid h-11 w-11 place-items-center rounded-2xl ${active ? "text-white dark:text-slate-950" : "text-slate-700 dark:text-slate-200"}`;
  const runAction = (action: NavAction) => {
    if (action === "home") onHome();
    if (action === "explore") onExplore();
    if (action === "create") onCreate();
    if (action === "activity") onActivity();
    if (action === "profile") onProfile();
  };
  const indexFromPointer = (clientX: number) => {
    const rect = navRef.current?.getBoundingClientRect();
    if (!rect) return activeIndex;
    const unit = rect.width / navActions.length;
    return Math.max(0, Math.min(navActions.length - 1, Math.round((clientX - rect.left - unit / 2) / unit)));
  };
  const vibrate = () => {
    if ("vibrate" in navigator) navigator.vibrate?.(8);
  };
  const pointerDown = (event: PointerEvent<HTMLElement>) => {
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, index: activeIndex, moved: false };
    setDragIndex(activeIndex);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const pointerMove = (event: PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (Math.abs(deltaY) > Math.abs(deltaX) * 1.4 && !drag.moved) {
      setDragIndex(undefined);
      return;
    }
    if (Math.abs(deltaX) < 4 && !drag.moved) return;
    drag.moved = true;
    const nextIndex = indexFromPointer(event.clientX);
    if (nextIndex !== drag.index) {
      drag.index = nextIndex;
      vibrate();
    }
    setDragIndex(nextIndex);
  };
  const pointerUp = (event: PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    dragRef.current = null;
    setDragIndex(undefined);
    if (!drag || drag.pointerId !== event.pointerId || !drag.moved) return;
    const nextIndex = indexFromPointer(event.clientX);
    suppressClickRef.current = true;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
    runAction(navActions[nextIndex]);
  };
  const tap = (action: () => void) => () => {
    if (suppressClickRef.current) return;
    action();
  };

  return (
    <nav
      ref={navRef}
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onPointerCancel={() => {
        dragRef.current = null;
        setDragIndex(undefined);
      }}
      className="liquid-dock fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-40 flex touch-none select-none items-center justify-around rounded-3xl border border-white/45 bg-white/72 px-3 py-2 shadow-glass backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/72 lg:hidden"
    >
      <span
        className="pointer-events-none absolute top-2 h-11 w-11 rounded-2xl bg-slate-950 shadow-lg transition-all duration-300 ease-out dark:bg-white"
        style={{ left: `calc(${visualIndex * 20 + 10}% - 22px)`, opacity: activeView === "search" && !profileActive ? 0 : 1, transitionDuration: dragIndex === undefined ? "300ms" : "80ms" }}
      />
      <button onClick={tap(onHome)} className={buttonClass(activeView === "canvas" && !profileActive)} aria-label="Canvas">
        <Home size={21} />
      </button>
      <button onClick={tap(onExplore)} className={buttonClass(activeView === "explore" && !profileActive)} aria-label="Explore">
        <Compass size={21} />
      </button>
      <button onClick={tap(onCreate)} className={`dock-item relative z-10 grid h-12 w-12 place-items-center rounded-full shadow-lg ${dragIndex === 2 ? "bg-white text-slate-950 dark:bg-slate-950 dark:text-white" : "bg-slate-950 text-white dark:bg-white dark:text-slate-950"}`} aria-label="Create">
        <Plus size={22} />
      </button>
      <div className="relative z-10">
        <button onClick={tap(onActivity)} className={buttonClass(activeView === "activity" && !profileActive)} aria-label="Activity">
          <Bell size={21} />
        </button>
        {unreadCount > 0 ? (
          <span className="badge-pulse absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </div>
      <button onClick={tap(onProfile)} className={buttonClass(profileActive)} aria-label="Profile">
        <UserRound size={21} />
      </button>
    </nav>
  );
}
