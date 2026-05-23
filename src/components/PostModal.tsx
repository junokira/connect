import { Bookmark, Heart, Link, MessageCircle, Repeat2, Share2, X } from "lucide-react";
import { FormEvent, MouseEvent, useEffect, useState } from "react";
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
  onLike: () => void;
  onRepost: () => void;
  onBookmark: () => void;
  onComment: (content: string) => void;
};

export function PostModal({ post, author, currentUser, comments, users, onClose, onLike, onRepost, onBookmark, onComment }: Props) {
  const [comment, setComment] = useState("");
  const [shareStatus, setShareStatus] = useState("");
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

  return (
    <div onMouseDown={onClose} className="fixed inset-0 z-50 grid place-items-end bg-slate-950/45 p-0 backdrop-blur-sm sm:place-items-center sm:p-4">
      <section onMouseDown={stop} className="thin-scrollbar max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl dark:bg-slate-950 sm:rounded-3xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur dark:border-white/10 dark:bg-slate-950/90">
          <div className="flex items-center gap-3">
            <img className="h-11 w-11 rounded-full object-cover" src={author.avatarUrl} alt="" />
            <div>
              <p className="flex items-center gap-1 font-semibold text-slate-950 dark:text-white">
                {author.displayName}
                <VerifiedBadge verified={author.verified} size={15} />
              </p>
              <p className="text-sm text-slate-500">@{author.username} · {formatDate(post.createdAt)}</p>
            </div>
          </div>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close post">
            <X size={20} />
          </button>
        </header>

        {post.type === "photo" && post.imageUrl ? <img className="max-h-[62vh] w-full object-contain bg-slate-100 dark:bg-black" src={post.imageUrl} alt="" /> : null}
        {post.type === "video" && videoUrl && isDirectVideoUrl(videoUrl) ? <video className="max-h-[62vh] w-full bg-black object-contain" src={videoUrl} poster={post.thumbnailUrl} controls /> : null}
        {post.type === "video" && videoUrl && embedUrl ? <iframe className="aspect-video max-h-[62vh] w-full bg-black" src={embedUrl} title="Video post" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /> : null}
        {post.type === "video" && videoUrl && !embedUrl && !isDirectVideoUrl(videoUrl) ? (
          <div className="bg-slate-950 p-5 text-center">
            <a className="font-semibold text-white underline" href={videoUrl} target="_blank" rel="noreferrer">Open external video</a>
          </div>
        ) : null}

        <div className="grid gap-6 p-5 lg:grid-cols-[1fr_320px]">
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
              <button type="button" onClick={onLike} className="rounded-xl border border-slate-200 p-3 hover:bg-rose-50 dark:border-white/10 dark:hover:bg-rose-400/10">
                <Heart className="mx-auto mb-1" size={18} /> <span className="text-xs">{formatCount(post.likesCount)}</span>
              </button>
              <button type="button" className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
                <MessageCircle className="mx-auto mb-1" size={18} /> <span className="text-xs">{formatCount(post.commentsCount)}</span>
              </button>
              <button type="button" onClick={onRepost} className="rounded-xl border border-slate-200 p-3 hover:bg-emerald-50 dark:border-white/10 dark:hover:bg-emerald-400/10">
                <Repeat2 className="mx-auto mb-1" size={18} /> <span className="text-xs">{formatCount(post.repostsCount)}</span>
              </button>
              <button type="button" onClick={onBookmark} className="rounded-xl border border-slate-200 p-3 hover:bg-amber-50 dark:border-white/10 dark:hover:bg-amber-400/10">
                <Bookmark className="mx-auto mb-1" size={18} /> <span className="text-xs">{formatCount(post.bookmarksCount)}</span>
              </button>
              <button type="button" onClick={() => void share()} className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
                <Share2 className="mx-auto mb-1" size={18} /> <span className="text-xs">Share</span>
              </button>
            </div>
            {shareStatus ? <p className="mt-3 text-sm font-semibold text-teal-600 dark:text-teal-300">{shareStatus}</p> : null}
          </div>
          <aside>
            <form onSubmit={submit} className="mb-4 rounded-2xl border border-slate-200 p-3 dark:border-white/10">
              <div className="mb-3 flex items-center gap-2">
                <img className="h-8 w-8 rounded-full object-cover" src={currentUser.avatarUrl} alt="" />
                <span className="text-sm font-medium">@{currentUser.username}</span>
              </div>
              <textarea value={comment} onChange={(event) => setComment(event.target.value)} className="min-h-20 w-full resize-none bg-transparent text-sm outline-none" placeholder="Add a comment..." />
              <button className="mt-2 rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-slate-950" disabled={!comment.trim()}>
                Comment
              </button>
            </form>
            <div className="space-y-3">
              {comments.map((item) => {
                const user = users.find((candidate) => candidate.id === item.authorId);
                return (
                  <div key={item.id} className="rounded-2xl bg-slate-100 p-3 dark:bg-white/10">
                    <p className="text-xs font-semibold text-slate-500">@{user?.username}</p>
                    <p className="text-sm">{item.content}</p>
                  </div>
                );
              })}
              <button type="button" onClick={() => void share()} className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <Link size={15} /> Copy post link
              </button>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
