import { Bookmark, ChevronRight, ExternalLink, Heart, Link as LinkIcon, MessageCircle, MoreHorizontal, Pencil, Pin, Repeat2, Trash2, Video, Volume2, VolumeX } from "lucide-react";
import { MouseEvent, useEffect, useRef, useState } from "react";
import { Post, User } from "../types";
import { getPlatformLabel, getVideoEmbedUrl, getYoutubeThumbnail, isDirectVideoUrl } from "../utils/media";
import { formatCount, formatDate } from "../utils/posts";
import { VerifiedBadge } from "./VerifiedBadge";

type Props = {
  post: Post;
  author: User;
  emphasized?: boolean;
  liked?: boolean;
  reposted?: boolean;
  bookmarked?: boolean;
  density?: "compact" | "standard" | "expanded";
  currentUserId?: string;
  muted?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onMute?: () => void;
  onReport?: () => void;
  onHashtagClick?: (tag: string) => void;
  onPinPost?: () => void;
  onOpen: () => void;
  onProfile: () => void;
  onLike: () => void;
  onComment: () => void;
  onRepost: () => void;
  onBookmark: () => void;
};

export function PostCard({ post, author, emphasized, liked, reposted, bookmarked, density = "standard", currentUserId, muted, onEdit, onDelete, onMute, onReport, onHashtagClick, onPinPost, onOpen, onProfile, onLike, onComment, onRepost, onBookmark }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const text = post.type === "text" || post.type === "link" ? post.content : post.caption;
  const embedUrl = getVideoEmbedUrl(post.videoUrl || post.sourceUrl);
  const directVideo = isDirectVideoUrl(post.videoUrl);
  const youtubeThumb = getYoutubeThumbnail(post.videoUrl || post.sourceUrl || "");
  const score = post.likesCount + post.commentsCount * 2 + post.repostsCount * 3;
  const width = density === "compact" ? "w-[240px]" : density === "expanded" && post.type !== "text" ? "w-[380px]" : post.type === "text" ? "w-[292px]" : "w-[340px]";
  const heatClass = score >= 500
    ? "viral-glow ring-2 ring-rose-500/80 shadow-[0_0_28px_rgba(239,68,68,0.3)]"
    : score >= 50
      ? "ring-2 ring-orange-400/60 shadow-[0_0_18px_rgba(251,146,60,0.22)]"
      : score >= 10
        ? "ring-1 ring-amber-400/40"
        : "";
  const action = (handler: () => void) => (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    handler();
  };
  const menuAction = (handler?: () => void) => (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setMenuOpen(false);
    handler?.();
  };

  useEffect(() => {
    if (!menuOpen) return undefined;
    const close = (event: globalThis.MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", escape);
    };
  }, [menuOpen]);

  return (
    <article
      data-canvas-post-id={post.id}
      draggable={false}
      className={`group ${width} ${heatClass} overflow-hidden rounded-2xl border bg-white/92 text-slate-950 shadow-glass backdrop-blur transition duration-200 hover:-translate-y-1 hover:shadow-2xl dark:border-white/10 dark:bg-[#111113]/90 dark:text-slate-50 ${
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
        <span className="ml-auto rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium uppercase text-slate-600 dark:bg-white/10 dark:text-slate-300">{post.type}</span>
        <div ref={menuRef} className="relative">
          <button type="button" onClick={(event) => { event.stopPropagation(); setMenuOpen((open) => !open); }} className="grid h-8 w-8 place-items-center rounded-xl opacity-100 hover:bg-slate-100 dark:hover:bg-white/10 sm:opacity-0 sm:group-hover:opacity-100" aria-label="Post options">
            <MoreHorizontal size={17} />
          </button>
          {menuOpen ? (
            <div className="absolute right-0 top-9 z-30 w-44 rounded-2xl border border-slate-200 bg-white p-1 text-sm shadow-2xl dark:border-white/10 dark:bg-slate-950">
              {post.authorId === currentUserId ? (
                <>
                  <button onClick={menuAction(onEdit)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-white/10"><Pencil size={15} /> Edit</button>
                  <button onClick={menuAction(onPinPost)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-white/10"><Pin size={15} /> Pin to center</button>
                  <button onClick={menuAction(onDelete)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-400/10"><Trash2 size={15} /> Delete</button>
                </>
              ) : (
                <>
                  <button onClick={menuAction(onMute)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-white/10">{muted ? <Volume2 size={15} /> : <VolumeX size={15} />} {muted ? "Unmute" : `Mute @${author.username}`}</button>
                  <button onClick={menuAction(onReport)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-400/10"><ExternalLink size={15} /> Report</button>
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {post.type === "photo" && post.imageUrl ? <img className={`${density === "compact" ? "h-24 object-cover" : density === "expanded" ? "max-h-96 object-contain" : "max-h-72 object-contain"} w-full bg-slate-100 dark:bg-black`} src={post.imageUrl} alt="" loading="lazy" /> : null}
      {post.type === "video" && (post.thumbnailUrl || post.videoUrl) ? (
        <div className={`relative bg-black ${density === "compact" ? "h-24 overflow-hidden" : "max-h-72"}`}>
          {post.thumbnailUrl ? (
            <img className={`${density === "compact" ? "h-full object-cover" : "max-h-72 object-contain"} w-full`} src={post.thumbnailUrl} alt="" loading="lazy" />
          ) : youtubeThumb ? (
            <img className={`${density === "compact" ? "h-full object-cover" : "max-h-72 object-cover"} w-full`} src={youtubeThumb} alt="" loading="lazy" />
          ) : directVideo ? (
            <video className={`${density === "compact" ? "h-full object-cover" : "max-h-72 object-contain"} w-full`} src={post.videoUrl} muted preload="metadata" />
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
          <button type="button" onClick={action(() => onMute?.())} className="absolute bottom-3 left-3 grid h-8 w-8 place-items-center rounded-full bg-black/55 text-white backdrop-blur" aria-label="Mute video">
            {muted || post.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      ) : null}

      <div className="space-y-3 p-4">
        <p className={`${density === "compact" ? "line-clamp-1" : density === "expanded" ? "line-clamp-8" : "line-clamp-5"} text-sm leading-6 text-slate-700 dark:text-slate-200`}>{text}</p>
        {post.type === "link" && post.sourceUrl ? (
          <div className="rounded-xl bg-slate-100 p-3 dark:bg-white/10">
            {youtubeThumb ? <img className="mb-3 aspect-video w-full rounded-xl object-cover" src={post.sourceThumb || youtubeThumb} alt="" loading="lazy" /> : null}
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#007aff] dark:bg-slate-950"><LinkIcon size={17} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold uppercase text-slate-500">{getPlatformLabel(post.sourcePlatform)}</span>
                <span className="line-clamp-2 text-sm font-semibold">{post.sourceTitle || post.sourceUrl}</span>
              </span>
              {post.sourceThumb && !youtubeThumb ? <img className="h-14 w-14 rounded-xl object-cover" src={post.sourceThumb} alt="" loading="lazy" /> : <ChevronRight size={17} />}
            </div>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-1">
          {density !== "compact" && post.hashtags.map((tag) => (
            <button key={tag} onClick={(event) => { event.stopPropagation(); onHashtagClick?.(tag); }} className="cursor-pointer text-xs font-medium text-[#007aff] hover:underline dark:text-[#64d2ff]">
              #{tag}
            </button>
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
