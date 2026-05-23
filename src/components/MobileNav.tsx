import { Bell, Compass, Home, Plus, UserRound } from "lucide-react";

type Props = {
  activeView: "canvas" | "explore" | "search" | "activity";
  onHome: () => void;
  onExplore: () => void;
  onCreate: () => void;
  onActivity: () => void;
  onProfile: () => void;
};

export function MobileNav({ activeView, onHome, onExplore, onCreate, onActivity, onProfile }: Props) {
  return (
    <nav className="liquid-dock fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-3xl border border-white/45 bg-white/72 px-3 py-2 shadow-glass backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/72 lg:hidden">
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
