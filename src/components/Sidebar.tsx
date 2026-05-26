import { Bell, Compass, Home, PlusSquare, UserRound } from "lucide-react";
import { User } from "../types";
import { VerifiedBadge } from "./VerifiedBadge";

const nav = [
  ["Home", Home],
  ["Explore", Compass],
  ["Activity", Bell],
  ["Create", PlusSquare],
  ["Profile", UserRound]
] as const;

type Props = {
  currentUser: User;
  activeView: "canvas" | "explore" | "search" | "activity";
  unreadCount: number;
  onHome: () => void;
  onExplore: () => void;
  onActivity: () => void;
  onCreate: () => void;
  onProfile: () => void;
  onSignOut: () => void;
};

export function Sidebar({ currentUser, activeView, unreadCount, onHome, onExplore, onActivity, onCreate, onProfile, onSignOut }: Props) {
  const streakLabel = currentUser.postStreak >= 30 ? "Legendary" : currentUser.postStreak >= 7 ? "Blazing" : "On Fire";
  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-200 bg-white/82 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/82 lg:flex">
      <div className="mb-8">
        <p className="text-xl font-black tracking-tight text-slate-950 dark:text-white">CONNECT</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">Spatial social canvas</p>
      </div>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {nav.map(([label, Icon]) => (
          <button
            key={label}
            onClick={label === "Create" ? onCreate : label === "Profile" ? onProfile : label === "Home" ? onHome : label === "Explore" ? onExplore : label === "Activity" ? onActivity : undefined}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium hover:bg-slate-100 dark:hover:bg-white/10 ${
              (label === "Home" && activeView === "canvas") || (label === "Explore" && activeView === "explore") || (label === "Activity" && activeView === "activity") ? "bg-slate-100 text-slate-950 dark:bg-white/10 dark:text-white" : "text-slate-700 dark:text-slate-200"
            }`}
          >
            <span className="relative">
              <Icon size={20} />
              {label === "Activity" && unreadCount > 0 ? (
                <span className="badge-pulse absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </span>
            <span>{label}</span>
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
          <span className="flex items-center gap-1 truncate text-sm font-semibold text-slate-950 dark:text-white">
            <span className="truncate">{currentUser.displayName}</span>
            <VerifiedBadge verified={currentUser.verified} size={14} />
          </span>
          <span className="block truncate text-xs text-slate-500">@{currentUser.username}</span>
        </span>
      </button>
      {currentUser.postStreak >= 3 ? (
        <button onClick={onProfile} className={`mt-2 flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm font-black text-white streak-badge ${currentUser.postStreak >= 7 ? "streak-badge-hot" : ""}`}>
          <span>{currentUser.postStreak >= 30 ? "⚡" : currentUser.postStreak >= 7 ? "🔥🔥" : "🔥"} {streakLabel}</span>
          <span>{currentUser.postStreak} days</span>
        </button>
      ) : null}
      <button onClick={onSignOut} className="mt-3 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10">
        Sign out
      </button>
    </aside>
  );
}
