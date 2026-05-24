import { Bookmark, Heart, Link, MessageCircle, Repeat2, Share2, Sticker, Trash2, X } from "lucide-react";
import { FormEvent, MouseEvent, TouchEvent, useEffect, useMemo, useRef, useState } from "react";
import { Comment, CommentReaction, Post, User } from "../types";
import { getPlatformLabel, getVideoEmbedUrl, isDirectVideoUrl, normalizeExternalUrl } from "../utils/media";
import { formatCount, formatDate } from "../utils/posts";
import { VerifiedBadge } from "./VerifiedBadge";

type Props = {
  post?: Post;
  author?: User;
  currentUser: User;
  currentUserId: string;
  comments: Comment[];
  commentReactions: CommentReaction[];
  users: User[];
  editMode?: boolean;
  onClose: () => void;
  liked?: boolean;
  reposted?: boolean;
  bookmarked?: boolean;
  onLike: () => void;
  onRepost: () => void;
  onBookmark: () => void;
  onDeletePost?: () => void;
  onEditPost?: () => void;
  onSaveEdit?: (content: string) => void;
  onLikeComment: (commentId: string) => void;
  onDeleteComment: (commentId: string) => void;
  onAddCommentExtended: (content: string, options?: { gifUrl?: string; parentId?: string }) => void;
  onOpenProfile: (id: string) => void;
  onHashtagClick?: (tag: string) => void;
};

const giphyKey = "dc6zaTOxFJmzC";

export function PostModal({ post, author, currentUserId, comments, commentReactions, users, editMode, onClose, liked, reposted, bookmarked, onLike, onRepost, onBookmark, onDeletePost, onEditPost, onSaveEdit, onLikeComment, onDeleteComment, onAddCommentExtended, onOpenProfile, onHashtagClick }: Props) {
  const [comment, setComment] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const [editing, setEditing] = useState(Boolean(editMode));
  const [editText, setEditText] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; authorUsername: string } | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [gifSearch, setGifSearch] = useState("");
  const [gifResults, setGifResults] = useState<string[]>([]);
  const [pendingGif, setPendingGif] = useState("");
  const [gifError, setGifError] = useState("");
  const touchStartRef = useRef<{ x: number; y: number; canClose: boolean } | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setEditing(Boolean(editMode)), [editMode]);
  useEffect(() => {
    if (!post) return;
    setEditText(post.type === "text" || post.type === "link" ? post.content : post.caption);
  }, [post]);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const threads = useMemo(() => {
    const top = comments.filter((item) => !item.parentId).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    const replies = comments.filter((item) => item.parentId).sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
    return top.map((item) => ({ item, replies: replies.filter((reply) => reply.parentId === item.id) }));
  }, [comments]);

  if (!post || !author) return null;
  const text = post.type === "text" || post.type === "link" ? post.content : post.caption;
  const postUrl = `${window.location.origin}?post=${post.id}`;
  const videoUrl = post.videoUrl ? normalizeExternalUrl(post.videoUrl) : "";
  const embedUrl = getVideoEmbedUrl(videoUrl);
  const sourceEmbedUrl = post.sourceUrl ? getVideoEmbedUrl(post.sourceUrl) : "";

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const body = replyingTo && !comment.startsWith("@") ? `@${replyingTo.authorUsername} ${comment}` : comment;
    if (!body.trim() && !pendingGif) return;
    onAddCommentExtended(body, { gifUrl: pendingGif || undefined, parentId: replyingTo?.commentId });
    setComment("");
    setReplyingTo(undefined);
    setPendingGif("");
  };
  const searchGifs = async () => {
    if (!gifSearch.trim()) return;
    try {
      setGifError("");
      const response = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${giphyKey}&q=${encodeURIComponent(gifSearch)}&limit=12&rating=g`);
      if (!response.ok) throw new Error("GIF search unavailable.");
      const data = await response.json();
      setGifResults(((data.data || []) as Array<{ images?: { fixed_height_small?: { url?: string } } }>).map((gif) => gif.images?.fixed_height_small?.url).filter((url): url is string => Boolean(url)));
    } catch {
      setGifError("GIF search unavailable.");
    }
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
    const target = event.target as HTMLElement;
    const interactive = target.closest("textarea,input,button,a,video,iframe");
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, canClose: !interactive && (scrollerRef.current?.scrollTop || 0) <= 2 };
  };
  const touchEnd = (event: TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start?.canClose) return;
    const touch = event.changedTouches[0];
    const deltaY = touch.clientY - start.y;
    const deltaX = Math.abs(touch.clientX - start.x);
    if (deltaY > 132 && deltaY > deltaX * 1.6 && (scrollerRef.current?.scrollTop || 0) <= 8) onClose();
  };
  const renderComment = (item: Comment, nested = false) => {
    const user = users.find((candidate) => candidate.id === item.authorId);
    const active = commentReactions.some((reaction) => reaction.commentId === item.id && reaction.userId === currentUserId);
    return (
      <div key={item.id} className={`${nested ? "comment-reply bg-slate-50 dark:bg-white/[0.03]" : ""} group rounded-2xl p-2 hover:bg-white dark:hover:bg-white/10`}>
        <div className="flex gap-3">
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
            {item.gifUrl ? <img src={item.gifUrl} className="mt-2 max-h-40 rounded-xl" alt="GIF" /> : null}
            <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
              <span>{formatDate(item.createdAt)}</span>
              <button type="button" onClick={() => setReplyingTo({ commentId: item.id, authorUsername: user?.username || "unknown" })} className="font-bold hover:text-slate-700 dark:hover:text-white">Reply</button>
              {item.authorId === currentUserId ? (
                deleteConfirm === item.id ? (
                  <span className="flex gap-2"><button onClick={() => onDeleteComment(item.id)} className="font-bold text-rose-600">Yes</button><button onClick={() => setDeleteConfirm("")}>No</button></span>
                ) : <button onClick={() => setDeleteConfirm(item.id)} className="opacity-100 group-hover:opacity-100 sm:opacity-0"><Trash2 size={13} /></button>
              ) : null}
            </div>
          </div>
          <button type="button" onClick={() => onLikeComment(item.id)} className={`flex shrink-0 items-center gap-1 self-start rounded-full px-2 py-1 text-xs ${active ? "text-rose-600" : "text-slate-400"}`}>
            <Heart size={14} fill={active ? "currentColor" : "none"} /> {formatCount(item.likesCount)}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div onMouseDown={onClose} className="fixed inset-0 z-[65] grid place-items-end bg-slate-950/45 p-0 backdrop-blur-sm sm:place-items-center sm:p-4">
      <section onMouseDown={stop} onTouchStart={touchStart} onTouchEnd={touchEnd} className="modal-enter thin-scrollbar flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-950 sm:rounded-3xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur dark:border-white/10 dark:bg-slate-950/90">
          <button type="button" onClick={() => openProfile(author.id)} className="flex min-w-0 items-center gap-3 rounded-2xl text-left">
            <img className="h-11 w-11 rounded-full object-cover" src={author.avatarUrl} alt="" />
            <span className="min-w-0"><span className="flex items-center gap-1 truncate font-semibold">{author.displayName}<VerifiedBadge verified={author.verified} size={15} /></span><span className="block truncate text-sm text-slate-500">@{author.username} · {formatDate(post.createdAt)}</span></span>
          </button>
          <div className="flex items-center gap-1">
            {post.authorId === currentUserId ? <button onClick={() => { setEditing(true); onEditPost?.(); }} className="rounded-xl px-3 py-2 text-sm font-bold hover:bg-slate-100 dark:hover:bg-white/10">Edit</button> : null}
            {post.authorId === currentUserId ? <button onClick={onDeletePost} className="rounded-xl px-3 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-400/10">Delete</button> : null}
            <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close post"><X size={20} /></button>
          </div>
        </header>

        <div ref={scrollerRef} className="thin-scrollbar overflow-y-auto">
          {post.type === "photo" && post.imageUrl ? <img className="max-h-[62vh] w-full object-contain bg-slate-100 dark:bg-black" src={post.imageUrl} alt="" /> : null}
          {post.type === "video" && videoUrl && isDirectVideoUrl(videoUrl) ? <video className="max-h-[62vh] w-full bg-black object-contain" src={videoUrl} poster={post.thumbnailUrl} controls /> : null}
          {post.type === "video" && videoUrl && embedUrl ? <iframe className="aspect-video max-h-[62vh] w-full bg-black" src={embedUrl} title="Video post" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /> : null}
          {post.type === "link" && sourceEmbedUrl ? <iframe className="aspect-video w-full bg-black" src={sourceEmbedUrl} title="Linked video" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /> : null}

          <div className="grid gap-6 p-5 lg:grid-cols-[1fr_340px]">
            <div>
              {editing ? (
                <div className="space-y-3">
                  <textarea value={editText} onChange={(event) => setEditText(event.target.value)} className="min-h-44 w-full resize-none rounded-2xl border border-slate-200 bg-transparent p-4 text-lg leading-8 outline-none dark:border-white/10" />
                  <div className="flex items-center justify-between text-sm text-slate-500"><span>{editText.length} chars</span><span className="flex gap-2"><button onClick={() => setEditing(false)} className="rounded-full px-4 py-2 font-bold">Cancel</button><button onClick={() => { onSaveEdit?.(editText); setEditing(false); }} className="rounded-full bg-slate-950 px-4 py-2 font-bold text-white dark:bg-white dark:text-slate-950">Save changes</button></span></div>
                </div>
              ) : <p className="whitespace-pre-wrap text-lg leading-8 text-slate-800 dark:text-slate-100">{text}</p>}
              {post.type === "link" && post.sourceUrl ? (
                <a href={normalizeExternalUrl(post.sourceUrl)} target="_blank" rel="noreferrer" className="mt-4 block rounded-2xl bg-slate-100 p-4 text-sm font-semibold hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15">
                  {post.sourceThumb ? <img className="mb-3 max-h-48 w-full rounded-xl object-cover" src={post.sourceThumb} alt="" /> : null}
                  <span className="block text-xs uppercase text-slate-500">{getPlatformLabel(post.sourcePlatform)}</span>
                  {post.sourceTitle || post.sourceUrl}
                </a>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {post.hashtags.map((tag) => <button key={tag} onClick={() => onHashtagClick?.(tag)} className="rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700 hover:underline dark:bg-teal-400/10 dark:text-teal-200">#{tag}</button>)}
              </div>
              <div className="mt-6 grid grid-cols-5 gap-2">
                <button type="button" onClick={onLike} className={`rounded-xl border border-slate-200 p-3 hover:bg-rose-50 dark:border-white/10 ${liked ? "like-pop text-rose-600" : ""}`}><Heart className="mx-auto mb-1" size={18} fill={liked ? "currentColor" : "none"} /> <span className="text-xs">{formatCount(post.likesCount)}</span></button>
                <button type="button" className="rounded-xl border border-slate-200 p-3 dark:border-white/10"><MessageCircle className="mx-auto mb-1" size={18} /> <span className="text-xs">{formatCount(post.commentsCount)}</span></button>
                <button type="button" onClick={onRepost} className={`rounded-xl border border-slate-200 p-3 dark:border-white/10 ${reposted ? "text-emerald-600" : ""}`}><Repeat2 className="mx-auto mb-1" size={18} /> <span className="text-xs">{formatCount(post.repostsCount)}</span></button>
                <button type="button" onClick={onBookmark} className={`rounded-xl border border-slate-200 p-3 dark:border-white/10 ${bookmarked ? "text-amber-600" : ""}`}><Bookmark className="mx-auto mb-1" size={18} fill={bookmarked ? "currentColor" : "none"} /> <span className="text-xs">{formatCount(post.bookmarksCount)}</span></button>
                <button type="button" onClick={() => void share()} className="rounded-xl border border-slate-200 p-3 dark:border-white/10"><Share2 className="mx-auto mb-1" size={18} /> <span className="text-xs">Share</span></button>
              </div>
              {shareStatus ? <p className="mt-3 text-sm font-semibold text-teal-600 dark:text-teal-300">{shareStatus}</p> : null}
            </div>
            <aside className="flex min-h-[320px] flex-col rounded-3xl border border-slate-200 bg-[#f5f5f7] dark:border-white/10 dark:bg-white/[0.04]">
              <div className="border-b border-slate-200 px-4 py-3 dark:border-white/10"><p className="text-sm font-black">Comments</p><p className="text-xs text-slate-500">{formatCount(post.commentsCount)} replies</p></div>
              <div className="thin-scrollbar max-h-[42vh] flex-1 space-y-1 overflow-y-auto p-3">
                {threads.map(({ item, replies }) => <div key={item.id}>{renderComment(item)}{replies.map((reply) => renderComment(reply, true))}</div>)}
                {!comments.length ? <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-white/15">No comments yet. Start the conversation.</p> : null}
              </div>
              <form onSubmit={submit} className="sticky bottom-0 border-t border-slate-200 bg-white/95 p-3 backdrop-blur dark:border-white/10 dark:bg-slate-950/95">
                {replyingTo ? <p className="mb-2 text-xs font-bold text-[#007aff]">Replying to @{replyingTo.authorUsername} <button type="button" onClick={() => setReplyingTo(undefined)} className="text-slate-400">cancel</button></p> : null}
                {pendingGif ? <img src={pendingGif} className="mb-2 max-h-32 rounded-xl" alt="Selected GIF" /> : null}
                <textarea value={comment} onChange={(event) => setComment(event.target.value)} className="max-h-28 min-h-10 w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-slate-950" placeholder={replyingTo ? `@${replyingTo.authorUsername} ` : "Reply to this post..."} />
                <div className="mt-2 flex items-center justify-between gap-2">
                  <button type="button" onClick={() => setGifSearch((value) => value || "reaction")} className="flex items-center gap-1 text-xs font-bold text-slate-500"><Sticker size={14} /> GIF</button>
                  <button type="button" onClick={() => void share()} className="flex items-center gap-1 text-xs font-bold text-slate-500"><Link size={14} /> Copy link</button>
                  <button className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:opacity-50 dark:bg-white dark:text-slate-950" disabled={!comment.trim() && !pendingGif}>Reply</button>
                </div>
                {gifSearch ? <div className="mt-2 rounded-2xl border border-slate-200 p-2 dark:border-white/10"><div className="flex gap-2"><input value={gifSearch} onChange={(event) => setGifSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Search GIFs" /><button type="button" onClick={() => void searchGifs()} className="text-xs font-bold">Search</button></div>{gifError ? <p className="text-xs text-rose-500">{gifError}</p> : null}<div className="mt-2 grid grid-cols-3 gap-1">{gifResults.map((gif) => <button type="button" key={gif} onClick={() => setPendingGif(gif)}><img className="h-16 w-full rounded-lg object-cover" src={gif} alt="" /></button>)}</div></div> : null}
              </form>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
