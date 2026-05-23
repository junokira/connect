import { Bookmark, Heart, Link, MessageCircle, Repeat2, Share2, X } from "lucide-react";
import { FormEvent, MouseEvent, TouchEvent, useEffect, useRef, useState } from "react";
import { Comment, Post, User } from "../types";
import { getVideoEmbedUrl, isDirectVideoUrl, normalizeExternalUrl } from "../utils/media";
import { formatCount, formatDate } from "../utils/posts";
import { VerifiedBadge } from "./VerifiedBadge";

type Props = {
  post?: Post;
  author?: User;
  currentUser: User;
  comments: Comment[];
  users: User[];
  onClose: () => void;
  liked?: boolean;
  reposted?: boolean;
  bookmarked?: boolean;
  onLike: () => void;
  onRepost: () => void;
  onBookmark: () => void;
  onComment: (content: string) => void;
  onOpenProfile: (id: string) => void;
};

export function PostModal({ post, author, currentUser, comments, users, onClose, liked, reposted, bookmarked, onLike, onRepost, onBookmark, onComment, onOpenProfile }: Props) {
  const [comment, setComment] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  if (!post || !author) return null;
  const text = post.type === "text" ? post.content : post.caption;
  const postUrl = `${window.location.origin}?post=${post.id}`;
  const videoUrl = post.videoUrl ? normalizeExternalUrl(post.videoUrl) : "";
  const embedUrl = getVideoEmbedUrl(videoUrl);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!comment.trim()) return;
    onComment(comment);
    setComment("");
  };

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: `CONNECT post by ${author.displayName}`, text, url: postUrl });
      return;
    }
    await navigator.clipboard.writeText(postUrl);
    setShareStatus("Link copied.");
  };

  const stop = (event: MouseEvent) => event.stopPropagation();
  const openProfile = (id: string) => {
    onOpenProfile(id);
    onClose();
  };
  const touchStart = (event: TouchEvent) => {
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };
  const touchEnd = (event: TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const touch = event.changedTouches[0];
    const deltaY = touch.clientY - start.y;
    const deltaX = Math.abs(touch.clientX - start.x);
    if (deltaY > 90 && deltaY > deltaX * 1.4) onClose();
  };

  return (
    <div onMouseDown={onClose} className="fixed inset-0 z-[65] grid place-items-end bg-slate-950/45 p-0 backdrop-blur-sm sm:place-items-center sm:p-4">
      <section onMouseDown={stop} onTouchStart={touchStart} onTouchEnd={touchEnd} className="thin-scrollbar flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-950 sm:rounded-3xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur dark:border-white/10 dark:bg-slate-950/90">
          <button type="button" onClick={() => openProfile(author.id)} className="flex min-w-0 items-center gap-3 rounded-2xl text-left">
            <img className="h-11 w-11 rounded-full object-cover" src={author.avatarUrl} alt="" />
            <span className="min-w-0">
              <span className="flex items-center gap-1 truncate font-semibold text-slate-950 dark:text-white">
                {author.displayName}
                <VerifiedBadge verified={author.verified} size={15} />
              </span>
              <span className="block truncate text-sm text-slate-500">@{author.username} · {formatDate(post.createdAt)}</span>
            </span>
          </button>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close post">
            <X size={20} />
          </button>
        </header>

        <div className="thin-scrollbar overflow-y-auto">
          {post.type === "photo" && post.imageUrl ? <img className="max-h-[62vh] w-full object-contain bg-slate-100 dark:bg-black" src={post.imageUrl} alt="" /> : null}
          {post.type === "video" && videoUrl && isDirectVideoUrl(videoUrl) ? <video className="max-h-[62vh] w-full bg-black object-contain" src={videoUrl} poster={post.thumbnailUrl} controls /> : null}
          {post.type === "video" && videoUrl && embedUrl ? <iframe className="aspect-video max-h-[62vh] w-full bg-black" src={embedUrl} title="Video post" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /> : null}
          {post.type === "video" && videoUrl && !embedUrl && !isDirectVideoUrl(videoUrl) ? (
            <div className="bg-slate-950 p-5 text-center">
              <a className="font-semibold text-white underline" href={videoUrl} target="_blank" rel="noreferrer">Open external video</a>
            </div>
          ) : null}

          <div className="grid gap-6 p-5 lg:grid-cols-[1fr_340px]">
            <div>
            <p className="whitespace-pre-wrap text-lg leading-8 text-slate-800 dark:text-slate-100">{text}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {post.hashtags.map((tag) => (
                <span key={tag} className="rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700 dark:bg-teal-400/10 dark:text-teal-200">
                  #{tag}
                </span>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-5 gap-2">
              <button type="button" onClick={onLike} className={`rounded-xl border border-slate-200 p-3 hover:bg-rose-50 dark:border-white/10 dark:hover:bg-rose-400/10 ${liked ? "text-rose-600" : ""}`}>
                <Heart className="mx-auto mb-1" size={18} fill={liked ? "currentColor" : "none"} /> <span className="text-xs">{formatCount(post.likesCount)}</span>
              </button>
              <button type="button" className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
                <MessageCircle className="mx-auto mb-1" size={18} /> <span className="text-xs">{formatCount(post.commentsCount)}</span>
              </button>
              <button type="button" onClick={onRepost} className={`rounded-xl border border-slate-200 p-3 hover:bg-emerald-50 dark:border-white/10 dark:hover:bg-emerald-400/10 ${reposted ? "text-emerald-600" : ""}`}>
                <Repeat2 className="mx-auto mb-1" size={18} /> <span className="text-xs">{formatCount(post.repostsCount)}</span>
              </button>
              <button type="button" onClick={onBookmark} className={`rounded-xl border border-slate-200 p-3 hover:bg-amber-50 dark:border-white/10 dark:hover:bg-amber-400/10 ${bookmarked ? "text-amber-600" : ""}`}>
                <Bookmark className="mx-auto mb-1" size={18} fill={bookmarked ? "currentColor" : "none"} /> <span className="text-xs">{formatCount(post.bookmarksCount)}</span>
              </button>
              <button type="button" onClick={() => void share()} className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
                <Share2 className="mx-auto mb-1" size={18} /> <span className="text-xs">Share</span>
              </button>
            </div>
            {shareStatus ? <p className="mt-3 text-sm font-semibold text-teal-600 dark:text-teal-300">{shareStatus}</p> : null}
            </div>
            <aside className="flex min-h-[320px] flex-col rounded-3xl border border-slate-200 bg-[#f5f5f7] dark:border-white/10 dark:bg-white/[0.04]">
              <div className="border-b border-slate-200 px-4 py-3 dark:border-white/10">
                <p className="text-sm font-black">Comments</p>
                <p className="text-xs text-slate-500">{formatCount(post.commentsCount)} replies</p>
              </div>
              <div className="thin-scrollbar max-h-[42vh] flex-1 space-y-1 overflow-y-auto p-3">
                {comments.map((item) => {
                  const user = users.find((candidate) => candidate.id === item.authorId);
                  return (
                    <div key={item.id} className="flex gap-3 rounded-2xl p-2 hover:bg-white dark:hover:bg-white/10">
                      <button type="button" disabled={!user} onClick={() => user && openProfile(user.id)} className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                        {user ? <img className="h-full w-full object-cover" src={user.avatarUrl} alt="" /> : null}
                      </button>
                      <div className="min-w-0 flex-1">
                        <button type="button" disabled={!user} onClick={() => user && openProfile(user.id)} className="flex max-w-full items-center gap-1 text-left text-sm font-bold">
                          <span className="truncate">{user?.displayName || "CONNECT user"}</span>
                          <VerifiedBadge verified={user?.verified} size={13} />
                          <span className="truncate font-medium text-slate-500">@{user?.username || "unknown"}</span>
                        </button>
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 dark:text-slate-200">{item.content}</p>
                        <p className="mt-1 text-xs text-slate-400">{formatDate(item.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
                {!comments.length ? <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-white/15">No comments yet. Start the conversation.</p> : null}
              </div>
              <form onSubmit={submit} className="sticky bottom-0 border-t border-slate-200 bg-white/95 p-3 backdrop-blur dark:border-white/10 dark:bg-slate-950/95">
                <div className="flex gap-3">
                  <button type="button" onClick={() => openProfile(currentUser.id)} className="h-9 w-9 shrink-0 overflow-hidden rounded-full">
                    <img className="h-full w-full object-cover" src={currentUser.avatarUrl} alt="" />
                  </button>
                  <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-950">
                    <textarea value={comment} onChange={(event) => setComment(event.target.value)} className="max-h-28 min-h-10 w-full resize-none bg-transparent text-sm outline-none" placeholder="Reply to this post..." />
                    <div className="mt-2 flex items-center justify-between">
                      <button type="button" onClick={() => void share()} className="flex items-center gap-1 text-xs font-bold text-slate-500">
                        <Link size={14} /> Copy link
                      </button>
                      <button className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:opacity-50 dark:bg-white dark:text-slate-950" disabled={!comment.trim()}>
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
