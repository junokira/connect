import { Bookmark, Heart, MessageCircle, Repeat2, Video } from "lucide-react";
import { MouseEvent } from "react";
import { Post, User } from "../types";
import { getVideoEmbedUrl, isDirectVideoUrl } from "../utils/media";
import { formatCount, formatDate } from "../utils/posts";
import { VerifiedBadge } from "./VerifiedBadge";

type Props = {
  post: Post;
  author: User;
  emphasized?: boolean;
  liked?: boolean;
  reposted?: boolean;
  bookmarked?: boolean;
  onOpen: () => void;
  onProfile: () => void;
  onLike: () => void;
  onComment: () => void;
  onRepost: () => void;
  onBookmark: () => void;
};

export function PostCard({ post, author, emphasized, liked, reposted, bookmarked, onOpen, onProfile, onLike, onComment, onRepost, onBookmark }: Props) {
  const text = post.type === "text" ? post.content : post.caption;
  const embedUrl = getVideoEmbedUrl(post.videoUrl);
  const directVideo = isDirectVideoUrl(post.videoUrl);
  const action = (handler: () => void) => (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    handler();
  };

  return (
    <article
      className={`w-[320px] overflow-hidden rounded-2xl border bg-white/92 text-slate-950 shadow-glass backdrop-blur transition duration-200 hover:-translate-y-1 hover:shadow-2xl dark:border-white/10 dark:bg-[#111113]/90 dark:text-slate-50 ${
        emphasized ? "ring-2 ring-[#0a84ff]" : "border-[#d2d2d7]"
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
          <p className="flex items-center gap-1 truncate text-sm font-semibold">
            <span className="truncate">{author.displayName}</span>
            <VerifiedBadge verified={author.verified} size={15} />
          </p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">@{author.username} · {formatDate(post.createdAt)}</p>
        </div>
        <span className="ml-auto rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium uppercase text-slate-600 dark:bg-white/10 dark:text-slate-300">
          {post.type}
        </span>
      </div>

      {post.type === "photo" && post.imageUrl ? <img className="max-h-72 w-full bg-slate-100 object-contain dark:bg-black" src={post.imageUrl} alt="" loading="lazy" /> : null}
      {post.type === "video" && (post.thumbnailUrl || post.videoUrl) ? (
        <div className="relative max-h-72 bg-black">
          {post.thumbnailUrl ? (
            <img className="max-h-72 w-full object-contain" src={post.thumbnailUrl} alt="" loading="lazy" />
          ) : directVideo ? (
            <video className="max-h-72 w-full object-contain" src={post.videoUrl} muted preload="metadata" />
          ) : embedUrl ? (
            <div className="grid h-48 place-items-center bg-black text-sm font-semibold text-white/80">External video</div>
          ) : (
            <div className="grid h-48 place-items-center bg-black px-6 text-center text-sm font-semibold text-white/80">Open video link</div>
          )}
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
                <span key={tag} className="text-xs font-medium text-[#007aff] dark:text-[#64d2ff]">
              #{tag}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <button onClick={action(onLike)} className={`flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-400/10 ${liked ? "text-rose-600" : ""}`} aria-label="Like post">
            <Heart size={14} fill={liked ? "currentColor" : "none"} /> {formatCount(post.likesCount)}
          </button>
          <button onClick={action(onComment)} className="flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-400/10" aria-label="Comment on post">
            <MessageCircle size={14} /> {formatCount(post.commentsCount)}
          </button>
          <button onClick={action(onRepost)} className={`flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-400/10 ${reposted ? "text-emerald-600" : ""}`} aria-label="Repost">
            <Repeat2 size={14} /> {formatCount(post.repostsCount)}
          </button>
          <button onClick={action(onBookmark)} className={`flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-400/10 ${bookmarked ? "text-amber-600" : ""}`} aria-label="Bookmark post">
            <Bookmark size={14} fill={bookmarked ? "currentColor" : "none"} /> {formatCount(post.bookmarksCount)}
          </button>
        </div>
      </div>
    </article>
  );
}
