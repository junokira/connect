import { Bookmark, Heart, MessageCircle, Repeat2, Video } from "lucide-react";
import { Post, User } from "../types";
import { formatCount } from "../utils/posts";

type Props = {
  post: Post;
  author: User;
  emphasized?: boolean;
  onOpen: () => void;
  onProfile: () => void;
};

export function PostCard({ post, author, emphasized, onOpen, onProfile }: Props) {
  const text = post.type === "text" ? post.content : post.caption;

  return (
    <article
      className={`w-[320px] overflow-hidden rounded-2xl border bg-white/88 text-slate-950 shadow-glass backdrop-blur transition duration-200 hover:-translate-y-1 hover:shadow-2xl dark:border-white/10 dark:bg-slate-950/86 dark:text-slate-50 ${
        emphasized ? "ring-2 ring-teal-400" : "border-slate-200"
      }`}
      onClick={onOpen}
    >
      <div className="flex items-center gap-3 border-b border-slate-200/70 px-4 py-3 dark:border-white/10">
        <button
          className="shrink-0"
          onClick={(event) => {
            event.stopPropagation();
            onProfile();
          }}
          aria-label={`Open ${author.displayName}'s profile`}
        >
          <img className="h-10 w-10 rounded-full object-cover" src={author.avatarUrl} alt="" />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{author.displayName}</p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">@{author.username}</p>
        </div>
        <span className="ml-auto rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium uppercase text-slate-600 dark:bg-white/10 dark:text-slate-300">
          {post.type}
        </span>
      </div>

      {post.type === "photo" && post.imageUrl ? <img className="h-44 w-full object-cover" src={post.imageUrl} alt="" loading="lazy" /> : null}
      {post.type === "video" && post.thumbnailUrl ? (
        <div className="relative h-44">
          <img className="h-full w-full object-cover" src={post.thumbnailUrl} alt="" loading="lazy" />
          <div className="absolute inset-0 grid place-items-center bg-black/20">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-white/90 text-slate-950">
              <Video size={22} />
            </span>
          </div>
        </div>
      ) : null}

      <div className="space-y-3 p-4">
        <p className="line-clamp-5 text-sm leading-6 text-slate-700 dark:text-slate-200">{text}</p>
        <div className="flex flex-wrap gap-1">
          {post.hashtags.map((tag) => (
            <span key={tag} className="text-xs font-medium text-teal-700 dark:text-teal-300">
              #{tag}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <Heart size={14} /> {formatCount(post.likesCount)}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle size={14} /> {formatCount(post.commentsCount)}
          </span>
          <span className="flex items-center gap-1">
            <Repeat2 size={14} /> {formatCount(post.repostsCount)}
          </span>
          <span className="flex items-center gap-1">
            <Bookmark size={14} /> {formatCount(post.bookmarksCount)}
          </span>
        </div>
      </div>
    </article>
  );
}
