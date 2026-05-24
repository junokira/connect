import { Bell } from "lucide-react";
import { Notification, Post, User } from "../types";
import { formatDate } from "../utils/posts";
import { VerifiedBadge } from "./VerifiedBadge";

type Props = {
  notifications: Notification[];
  users: User[];
  posts: Post[];
  onMarkAllRead: () => void;
  onOpenPost: (id: string) => void;
  onOpenProfile: (id: string) => void;
};

export function ActivityView({ notifications, users, posts, onMarkAllRead, onOpenPost, onOpenProfile }: Props) {
  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const textFor = (notification: Notification, actor?: User) => {
    const handle = actor ? `@${actor.username}` : "Someone";
    if (notification.type === "like") return `${handle} liked your post`;
    if (notification.type === "comment") return `${handle} commented on your post`;
    if (notification.type === "follow") return `${handle} started following you`;
    if (notification.type === "repost") return `${handle} reposted your post`;
    if (notification.type === "mention") return `${handle} mentioned you`;
    if (notification.type === "reply") return `${handle} replied to your comment`;
    return `${handle} interacted with you`;
  };

  return (
    <main className="thin-scrollbar h-full overflow-y-auto px-4 pb-28 pt-20 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-black"><Bell size={26} /> Activity</h1>
            <p className="text-sm text-slate-500">Likes, follows, comments, replies, and mentions.</p>
          </div>
          {unreadCount ? <button onClick={onMarkAllRead} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold dark:border-white/10">Mark all read</button> : null}
        </header>
        <div className="space-y-3">
          {notifications.map((notification) => {
            const actor = users.find((user) => user.id === notification.actorId);
            const post = notification.postId ? posts.find((candidate) => candidate.id === notification.postId) : undefined;
            return (
              <button
                key={notification.id}
                onClick={() => notification.postId ? onOpenPost(notification.postId) : actor && onOpenProfile(actor.id)}
                className={`flex w-full items-center gap-3 rounded-3xl border border-slate-200 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-glass dark:border-white/10 ${notification.read ? "bg-white dark:bg-[#111113]" : "bg-blue-50/70 dark:bg-blue-400/[0.08]"}`}
              >
                <img className="h-12 w-12 rounded-full object-cover" src={actor?.avatarUrl} alt="" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 text-sm font-bold">
                    <span className="truncate">{actor?.displayName || "CONNECT user"}</span>
                    <VerifiedBadge verified={actor?.verified} size={14} />
                  </span>
                  <span className="mt-1 block text-sm text-slate-700 dark:text-slate-200">{textFor(notification, actor)}</span>
                  <span className="mt-1 block text-xs text-slate-400">{formatDate(notification.createdAt)}</span>
                </span>
                {post?.imageUrl || post?.thumbnailUrl || post?.sourceThumb ? <img className="h-14 w-14 rounded-2xl object-cover" src={post.imageUrl || post.thumbnailUrl || post.sourceThumb} alt="" /> : null}
              </button>
            );
          })}
          {!notifications.length ? <p className="rounded-3xl border border-dashed border-slate-300 p-8 text-sm text-slate-500 dark:border-white/15">No activity yet — when people like, follow, or reply to you, it appears here.</p> : null}
        </div>
      </div>
    </main>
  );
}
