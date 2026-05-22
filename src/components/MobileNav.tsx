import { Compass, Home, Plus, Search, UserRound } from "lucide-react";

type Props = {
  activeView: "canvas" | "explore";
  onHome: () => void;
  onExplore: () => void;
  onCreate: () => void;
  onFilters: () => void;
  onProfile: () => void;
};

export function MobileNav({ activeView, onHome, onExplore, onCreate, onFilters, onProfile }: Props) {
  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-2xl border border-slate-200 bg-white/92 px-3 py-2 shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/92 lg:hidden">
      <button onClick={onHome} className={`grid h-11 w-11 place-items-center rounded-xl ${activeView === "canvas" ? "bg-slate-100 text-slate-950 dark:bg-white/10 dark:text-white" : "text-slate-700 dark:text-slate-200"}`} aria-label="Canvas">
        <Home size={21} />
      </button>
      <button onClick={onExplore} className={`grid h-11 w-11 place-items-center rounded-xl ${activeView === "explore" ? "bg-slate-100 text-slate-950 dark:bg-white/10 dark:text-white" : "text-slate-700 dark:text-slate-200"}`} aria-label="Explore">
        <Compass size={21} />
      </button>
      <button onClick={onCreate} className="grid h-12 w-12 place-items-center rounded-full bg-slate-950 text-white dark:bg-white dark:text-slate-950" aria-label="Create">
        <Plus size={22} />
      </button>
      <button onClick={onFilters} className="grid h-11 w-11 place-items-center rounded-xl text-slate-700 dark:text-slate-200" aria-label="Search and filters">
        <Search size={21} />
      </button>
      <button onClick={onProfile} className="grid h-11 w-11 place-items-center rounded-xl text-slate-700 dark:text-slate-200" aria-label="Profile">
        <UserRound size={21} />
      </button>
    </nav>
  );
}
