import { Compass, Home, PlusSquare, Search, UserRound } from "lucide-react";
import { User } from "../types";

const nav = [
  ["Home", Home],
  ["Explore", Compass],
  ["Search", Search],
  ["Create", PlusSquare],
  ["Profile", UserRound]
] as const;

type Props = {
  currentUser: User;
  activeView: "canvas" | "explore" | "search";
  onHome: () => void;
  onExplore: () => void;
  onSearch: () => void;
  onCreate: () => void;
  onProfile: () => void;
  onSignOut: () => void;
};

export function Sidebar({ currentUser, activeView, onHome, onExplore, onSearch, onCreate, onProfile, onSignOut }: Props) {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white/82 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/82 lg:block">
      <div className="mb-8">
        <p className="text-xl font-black tracking-tight text-slate-950 dark:text-white">CONNECT</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">Spatial social canvas</p>
      </div>
      <nav className="space-y-1">
        {nav.map(([label, Icon]) => (
          <button
            key={label}
            onClick={label === "Create" ? onCreate : label === "Profile" ? onProfile : label === "Home" ? onHome : label === "Explore" ? onExplore : label === "Search" ? onSearch : undefined}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium hover:bg-slate-100 dark:hover:bg-white/10 ${
              (label === "Home" && activeView === "canvas") || (label === "Explore" && activeView === "explore") || (label === "Search" && activeView === "search") ? "bg-slate-100 text-slate-950 dark:bg-white/10 dark:text-white" : "text-slate-700 dark:text-slate-200"
            }`}
          >
            <Icon size={20} />
            {label}
          </button>
        ))}
      </nav>
      <button
        onClick={onCreate}
        className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-slate-800 dark:bg-white dark:text-slate-950"
      >
        <PlusSquare size={18} />
        New Post
      </button>
      <button onClick={onProfile} className="mt-auto flex w-full items-center gap-3 rounded-2xl p-3 text-left hover:bg-slate-100 dark:hover:bg-white/10">
        <img className="h-11 w-11 rounded-full object-cover" src={currentUser.avatarUrl} alt="" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-slate-950 dark:text-white">{currentUser.displayName}</span>
          <span className="block truncate text-xs text-slate-500">@{currentUser.username}</span>
        </span>
      </button>
      <button onClick={onSignOut} className="mt-3 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10">
        Sign out
      </button>
    </aside>
  );
}
