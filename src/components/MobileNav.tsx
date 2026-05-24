import { Bell, Compass, Home, Plus, UserRound } from "lucide-react";

type Props = {
  activeView: "canvas" | "explore" | "search" | "activity";
  unreadCount: number;
  onHome: () => void;
  onExplore: () => void;
  onCreate: () => void;
  onActivity: () => void;
  onProfile: () => void;
};

export function MobileNav({ activeView, unreadCount, onHome, onExplore, onCreate, onActivity, onProfile }: Props) {
  const activeIndex = activeView === "canvas" ? 0 : activeView === "explore" ? 1 : activeView === "activity" ? 3 : 0;
  const buttonClass = (active: boolean) => `dock-item relative z-10 grid h-11 w-11 place-items-center rounded-2xl ${active ? "text-white dark:text-slate-950" : "text-slate-700 dark:text-slate-200"}`;

  return (
    <nav className="liquid-dock fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-40 flex items-center justify-around rounded-3xl border border-white/45 bg-white/72 px-3 py-2 shadow-glass backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/72 lg:hidden">
      <span
        className="pointer-events-none absolute top-2 h-11 w-11 rounded-2xl bg-slate-950 transition-all duration-300 ease-out dark:bg-white"
        style={{ left: `calc(${activeIndex * 20 + 10}% - 22px)`, opacity: activeView === "search" ? 0 : 1 }}
      />
      <button onClick={onHome} className={buttonClass(activeView === "canvas")} aria-label="Canvas">
        <Home size={21} />
      </button>
      <button onClick={onExplore} className={buttonClass(activeView === "explore")} aria-label="Explore">
        <Compass size={21} />
      </button>
      <button onClick={onCreate} className="dock-item relative z-10 grid h-12 w-12 place-items-center rounded-full bg-slate-950 text-white shadow-lg dark:bg-white dark:text-slate-950" aria-label="Create">
        <Plus size={22} />
      </button>
      <div className="relative z-10">
        <button onClick={onActivity} className={buttonClass(activeView === "activity")} aria-label="Activity">
          <Bell size={21} />
        </button>
        {unreadCount > 0 ? (
          <span className="badge-pulse absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </div>
      <button onClick={onProfile} className="dock-item relative z-10 grid h-11 w-11 place-items-center rounded-2xl text-slate-700 dark:text-slate-200" aria-label="Profile">
        <UserRound size={21} />
      </button>
    </nav>
  );
}
