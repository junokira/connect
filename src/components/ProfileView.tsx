import { CalendarDays, Link as LinkIcon, MapPin, X } from "lucide-react";
import { Post, PostReaction, User } from "../types";
import { formatCount, formatDate } from "../utils/posts";
import { PostCard } from "./PostCard";

type Props = {
  user?: User;
  users: User[];
  posts: Post[];
  reactions: PostReaction[];
  onClose: () => void;
  onOpenPost: (id: string) => void;
};

export function ProfileView({ user, users, posts, reactions, onClose, onOpenPost }: Props) {
  if (!user) return null;
  const repostedIds = new Set(reactions.filter((reaction) => reaction.userId === user.id && reaction.type === "repost").map((reaction) => reaction.postId));
  const userPosts = posts.filter((post) => post.authorId === user.id || repostedIds.has(post.id));
  const mediaPosts = userPosts.filter((post) => post.type !== "text");
  const pinned = userPosts.find((post) => post.pinned);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/88 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-slate-950/88">
        <div>
          <p className="font-bold">{user.displayName}</p>
          <p className="text-sm text-slate-500">{userPosts.length} posts</p>
        </div>
        <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close profile">
          <X size={20} />
        </button>
      </header>
      <div className="mx-auto max-w-6xl pb-24">
        <div className="relative z-0 h-48 overflow-hidden sm:h-64">
          <img className="h-full w-full object-cover" src={user.bannerUrl} alt="" />
        </div>
        <section className="relative z-10 px-4 pb-6">
          <div className="-mt-14 flex flex-wrap items-end justify-between gap-4">
            <img className="relative z-20 h-28 w-28 rounded-full border-4 border-white bg-white object-cover shadow-xl dark:border-slate-950 dark:bg-slate-950" src={user.avatarUrl} alt="" />
            <button className="rounded-full bg-slate-950 px-5 py-2 text-sm font-bold text-white dark:bg-white dark:text-slate-950">Follow</button>
          </div>
          <div className="mt-4">
            <h1 className="text-2xl font-black">{user.displayName}</h1>
            <p className="text-slate-500">@{user.username}</p>
            <p className="mt-3 max-w-2xl leading-7 text-slate-700 dark:text-slate-200">{user.bio}</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
              <span className="flex items-center gap-1"><MapPin size={16} /> {user.location}</span>
              <span className="flex items-center gap-1"><LinkIcon size={16} /> {user.website}</span>
              <span className="flex items-center gap-1"><CalendarDays size={16} /> Joined {formatDate(user.createdAt)}</span>
            </div>
            <div className="mt-3 flex gap-5 text-sm">
              <span><b>{formatCount(user.followingCount)}</b> Following</span>
              <span><b>{formatCount(user.followersCount)}</b> Followers</span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-4 border-y border-slate-200 text-center text-sm font-semibold dark:border-white/10">
          {["Posts", "Replies", "Media", "Likes"].map((tab) => (
            <button key={tab} className="px-3 py-4 hover:bg-slate-100 dark:hover:bg-white/10">{tab}</button>
          ))}
        </div>

        {pinned ? (
          <section className="px-4 py-6">
            <p className="mb-3 text-xs font-bold uppercase text-slate-400">Pinned post</p>
            <PostCard
              post={pinned}
              author={user}
              emphasized
              onOpen={() => onOpenPost(pinned.id)}
              onProfile={() => undefined}
              onLike={() => undefined}
              onComment={() => onOpenPost(pinned.id)}
              onRepost={() => undefined}
              onBookmark={() => undefined}
            />
          </section>
        ) : null}

        <section className="grid gap-6 px-4 py-6 lg:grid-cols-[1fr_360px]">
          <div>
            <h2 className="mb-3 text-sm font-bold uppercase text-slate-400">Status feed</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {userPosts.map((post) => (
                <div key={post.id} className="space-y-2">
                  {post.authorId !== user.id ? <p className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-300">Reposted by @{user.username}</p> : null}
                  <PostCard
                    post={post}
                    author={users.find((candidate) => candidate.id === post.authorId) || user}
                    onOpen={() => onOpenPost(post.id)}
                    onProfile={() => undefined}
                    onLike={() => undefined}
                    onComment={() => onOpenPost(post.id)}
                    onRepost={() => undefined}
                    onBookmark={() => undefined}
                  />
                </div>
              ))}
            </div>
          </div>
          <aside>
            <h2 className="mb-3 text-sm font-bold uppercase text-slate-400">Media grid</h2>
            <div className="grid grid-cols-2 gap-2">
              {mediaPosts.map((post) => (
                <button key={post.id} onClick={() => onOpenPost(post.id)} className="aspect-square overflow-hidden rounded-xl bg-slate-100 dark:bg-white/10">
                  <img className="h-full w-full object-cover" src={post.imageUrl || post.thumbnailUrl} alt="" />
                </button>
              ))}
            </div>
            <h2 className="mb-3 mt-6 text-sm font-bold uppercase text-slate-400">Following nearby</h2>
            <div className="space-y-3">
              {users.filter((candidate) => candidate.id !== user.id).map((candidate) => (
                <div key={candidate.id} className="flex items-center gap-3 rounded-2xl bg-slate-100 p-3 dark:bg-white/10">
                  <img className="h-10 w-10 rounded-full object-cover" src={candidate.avatarUrl} alt="" />
                  <div>
                    <p className="text-sm font-semibold">{candidate.displayName}</p>
                    <p className="text-xs text-slate-500">@{candidate.username}</p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
