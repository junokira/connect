import { LocateFixed } from "lucide-react";
import { PointerEvent, TouchEvent, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CanvasView, FeedStyle, Post, PostReaction, SortMode, User, UserBlock, UserMute } from "../types";
import { CANVAS_CARD_CENTER_X, CANVAS_CARD_CENTER_Y, CANVAS_CARD_HEIGHT, CANVAS_CARD_WIDTH, resolveCanvasCollisions } from "../utils/canvasLayout";
import { PostCard } from "./PostCard";

type Props = {
  posts: Post[];
  users: User[];
  reactions: PostReaction[];
  currentUserId: string;
  sortMode: SortMode;
  feedStyle: FeedStyle;
  view: CanvasView;
  onViewChange: (view: CanvasView) => void;
  onOpenPost: (id: string) => void;
  onOpenProfile: (id: string) => void;
  onLikePost: (id: string) => void;
  onRepostPost: (id: string) => void;
  onBookmarkPost: (id: string) => void;
  blocks?: UserBlock[];
  mutes?: UserMute[];
  onEditPost?: (id: string) => void;
  onDeletePost?: (id: string) => void;
  onMuteUser?: (userId: string) => void;
  onReportPost?: (id: string) => void;
  onHashtagClick?: (tag: string) => void;
  onPinPost?: (id: string) => void;
  className?: string;
  recenterSignal?: number;
  interactive?: boolean;
  interactionMode?: "full" | "horizontal" | "none";
  showControls?: boolean;
};

const clampZoom = (zoom: number) => Math.max(0.35, Math.min(2.2, zoom));
const hashValue = (value: string) => [...value].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) % 9973, 17);

const clusterAnchor = (post: Post) => {
  const tag = post.hashtags[0] || post.authorId || "connect";
  const hash = hashValue(tag);
  const angle = (hash % 360) * (Math.PI / 180);
  const radius = 64 + (hash % 4) * 46;
  return { x: Math.round(Math.cos(angle) * radius), y: Math.round(Math.sin(angle) * radius) };
};

const engagementScore = (post: Post) => post.likesCount + post.commentsCount * 2 + post.repostsCount * 3 + post.bookmarksCount;

const getStyledPosition = (post: Post, index: number, style: FeedStyle) => {
  const anchor = clusterAnchor(post);
  if (style === "classic") {
    const ring = Math.floor(index / 8);
    const slot = index % 8;
    const angle = slot * 0.785 + ring * 0.28;
    const radius = ring === 0 ? 56 + slot * 14 : 150 + ring * 92;
    return { x: anchor.x + Math.round(Math.cos(angle) * radius), y: anchor.y + Math.round(Math.sin(angle) * radius * 0.76) };
  }
  if (style === "gallery") {
    const col = index % 4;
    const row = Math.floor(index / 4);
    const stagger = [0, 92, 36, 128][col];
    const lift = post.type === "text" ? 90 : post.type === "video" ? -20 : 0;
    return { x: col * 306 - 460, y: row * 316 + stagger - 190 + lift };
  }
  if (style === "mosaic") {
    const columns = [-470, -178, 114, 406];
    const col = index % columns.length;
    const row = Math.floor(index / columns.length);
    const stagger = [0, 76, 26, 112][col];
    const depth = (engagementScore(post) % 3) * 12;
    return { x: columns[col] + depth, y: row * 302 + stagger - 190 - depth };
  }
  if (style === "orbit") {
    const ring = Math.floor(index / 10) + 1;
    const inRing = index % 10;
    const angle = (inRing / 10) * Math.PI * 2 + ring * 0.22;
    const radius = 170 + ring * 132;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  }
  const day = Math.floor(Date.parse(post.createdAt) / 86_400_000);
  const topic = anchor.x / 2;
  const column = index % 5;
  const row = Math.floor(index / 5);
  return { x: topic + column * 214 - 428, y: (day % 9) * 28 + row * 268 - 190 };
};

export function CanvasFeed({ posts, users, reactions, currentUserId, sortMode, feedStyle, view, onViewChange, onOpenPost, onOpenProfile, onLikePost, onRepostPost, onBookmarkPost, blocks = [], mutes = [], onEditPost, onDeletePost, onMuteUser, onReportPost, onHashtagClick, onPinPost, className = "h-screen", recenterSignal = 0, interactive = true, interactionMode, showControls = true }: Props) {
  const mode = interactionMode || (interactive ? "full" : "none");
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ id: number; x: number; y: number; view: CanvasView; postId?: string } | null>(null);
  const didDragRef = useRef(false);
  const suppressClickRef = useRef(false);
  const centeredStartupRef = useRef("");
  const viewRef = useRef(view);
  const frameRef = useRef<number | null>(null);
  const queuedViewRef = useRef<CanvasView | null>(null);
  const [size, setSize] = useState({ width: 1400, height: 900 });
  const touchRef = useRef<{ distance: number; zoom: number } | null>(null);

  const scheduleView = useCallback((nextView: CanvasView) => {
    queuedViewRef.current = nextView;
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      const queued = queuedViewRef.current;
      if (!queued) return;
      queuedViewRef.current = null;
      viewRef.current = queued;
      onViewChange(queued);
    });
  }, [onViewChange]);

  const updateSize = useCallback(() => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (rect?.width && rect.height) setSize({ width: rect.width, height: rect.height });
  }, []);

  useLayoutEffect(() => {
    updateSize();
    const firstFrame = requestAnimationFrame(updateSize);
    const secondFrame = requestAnimationFrame(() => requestAnimationFrame(updateSize));
    const node = viewportRef.current;
    const observer = node && "ResizeObserver" in window ? new ResizeObserver(updateSize) : undefined;
    if (node && observer) observer.observe(node);
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      observer?.disconnect();
    };
  }, [updateSize]);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node || mode === "none") return;

    const handleWheel = (event: globalThis.WheelEvent) => {
      if (mode === "horizontal") {
        const horizontalDelta = Math.abs(event.deltaX) >= Math.abs(event.deltaY) ? event.deltaX : event.shiftKey ? event.deltaY : 0;
        if (!horizontalDelta) return;
        event.preventDefault();
        scheduleView({ ...viewRef.current, x: viewRef.current.x - horizontalDelta });
        return;
      }
      event.preventDefault();
      updateSize();
      const current = viewRef.current;
      const rect = node.getBoundingClientRect();
      const delta = Math.max(-80, Math.min(80, event.deltaY));
      const nextZoom = clampZoom(current.zoom * (delta > 0 ? 0.93 : 1.07));
      const mx = event.clientX - rect.left;
      const my = event.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const worldX = (mx - centerX - current.x) / current.zoom;
      const worldY = (my - centerY - current.y) / current.zoom;
      scheduleView({ zoom: nextZoom, x: mx - centerX - worldX * nextZoom, y: my - centerY - worldY * nextZoom });
    };

    node.addEventListener("wheel", handleWheel, { passive: false });
    return () => node.removeEventListener("wheel", handleWheel);
  }, [mode, scheduleView, updateSize]);

  const visibleSourcePosts = useMemo(() => posts.filter((post) => !blocks.some((block) => block.blockedId === post.authorId) && !mutes.some((mute) => mute.mutedId === post.authorId)), [blocks, mutes, posts]);

  const positionedPosts = useMemo(
    () => resolveCanvasCollisions(visibleSourcePosts.map((post, index) => ({ post, position: getStyledPosition(post, index, feedStyle) }))),
    [feedStyle, visibleSourcePosts]
  );

  const centerLatest = useCallback(() => {
    const latest = [...positionedPosts].sort((a, b) => Date.parse(b.post.createdAt) - Date.parse(a.post.createdAt))[0];
    if (!latest) return;
    onViewChange({ x: -(latest.position.x + CANVAS_CARD_CENTER_X), y: -(latest.position.y + CANVAS_CARD_CENTER_Y), zoom: 0.95 });
  }, [onViewChange, positionedPosts]);

  const visiblePosts = useMemo(() => {
    const padding = 640;
    const centerX = size.width / 2;
    const centerY = size.height / 2;
    const minX = (-centerX - view.x - padding) / view.zoom;
    const minY = (-centerY - view.y - padding) / view.zoom;
    const maxX = (size.width - centerX - view.x + padding) / view.zoom;
    const maxY = (size.height - centerY - view.y + padding) / view.zoom;
    return positionedPosts.filter(({ position }) => position.x + CANVAS_CARD_WIDTH > minX && position.x < maxX && position.y + CANVAS_CARD_HEIGHT > minY && position.y < maxY);
  }, [positionedPosts, size.height, size.width, view]);

  const cardMode = view.zoom < 0.62 ? "compact" : view.zoom > 1.28 ? "expanded" : "standard";
  useEffect(() => {
    if (!positionedPosts.length || visiblePosts.length) return;
    centerLatest();
  }, [centerLatest, positionedPosts.length, visiblePosts.length]);

  useEffect(() => {
    const latest = [...positionedPosts].sort((a, b) => Date.parse(b.post.createdAt) - Date.parse(a.post.createdAt))[0];
    if (!latest) return;
    const startupKey = `${feedStyle}:${latest.post.id}`;
    if (centeredStartupRef.current === startupKey) return;
    centeredStartupRef.current = startupKey;
    const frame = requestAnimationFrame(centerLatest);
    return () => cancelAnimationFrame(frame);
  }, [centerLatest, feedStyle, positionedPosts]);

  useEffect(() => {
    if (!recenterSignal) return;
    centerLatest();
  }, [centerLatest, recenterSignal]);

  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (mode === "none") return;
    if ((event.target as HTMLElement).closest("button,input,select,textarea,a,video")) return;
    const postElement = (event.target as HTMLElement).closest<HTMLElement>("[data-canvas-post-id]");
    updateSize();
    didDragRef.current = false;
    suppressClickRef.current = false;
    dragRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, view: viewRef.current, postId: postElement?.dataset.canvasPostId };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    const deltaX = event.clientX - drag.x;
    const deltaY = event.clientY - drag.y;
    if (Math.hypot(deltaX, deltaY) > 6) didDragRef.current = true;
    if (mode === "horizontal") {
      if (Math.abs(deltaY) > Math.abs(deltaX) * 1.1) return;
      scheduleView({ ...viewRef.current, x: drag.view.x + deltaX, y: drag.view.y });
      return;
    }
    scheduleView({ ...viewRef.current, x: drag.view.x + deltaX, y: drag.view.y + deltaY });
  };

  const pointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (drag?.id === event.pointerId && drag.postId && !didDragRef.current) {
      suppressClickRef.current = true;
      onOpenPost(drag.postId);
    }
    dragRef.current = null;
  };

  const touchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (mode !== "full") return;
    event.stopPropagation();
    if (event.touches.length !== 2) return;
    event.preventDefault();
    const [a, b] = [event.touches[0], event.touches[1]];
    const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    if (!touchRef.current) {
      touchRef.current = { distance, zoom: view.zoom };
      return;
    }
    scheduleView({ ...viewRef.current, zoom: clampZoom((distance / touchRef.current.distance) * touchRef.current.zoom) });
  };

  return (
    <main
      ref={viewportRef}
      className={`canvas-viewport relative flex-1 overflow-hidden bg-[#f5f5f7] text-slate-950 dark:bg-[#050505] dark:text-white ${mode !== "none" ? "cursor-grab active:cursor-grabbing" : "cursor-default"} ${className}`}
      style={{ touchAction: mode === "horizontal" ? "pan-y" : mode === "full" ? "none" : "auto" }}
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onPointerCancel={pointerUp}
      onTouchMove={touchMove}
      onTouchStart={(event) => {
        if (mode === "full") event.stopPropagation();
      }}
      onTouchEnd={() => (touchRef.current = null)}
      onClickCapture={(event) => {
        if (!didDragRef.current && !suppressClickRef.current) return;
        event.stopPropagation();
        didDragRef.current = false;
        suppressClickRef.current = false;
      }}
    >
      <div className="canvas-dots absolute inset-0" style={{ backgroundPosition: `${view.x}px ${view.y}px`, backgroundSize: `${24 * view.zoom}px ${24 * view.zoom}px` }} />
      {showControls ? <button
        onClick={(event) => {
          event.stopPropagation();
          centerLatest();
        }}
        className="absolute left-4 top-4 z-20 flex h-11 items-center gap-2 rounded-2xl border border-[#d2d2d7] bg-white/88 px-3 text-sm font-bold shadow-glass backdrop-blur-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 dark:border-white/10 dark:bg-[#111113]/88 dark:focus-visible:ring-white"
        aria-label="Jump to latest posts"
      >
        <LocateFixed size={17} />
        <span className="hidden sm:inline">Latest</span>
      </button> : null}
      {visibleSourcePosts.length && !visiblePosts.length ? (
        <div className="absolute left-1/2 top-24 z-20 w-[min(90vw,360px)] -translate-x-1/2 rounded-3xl border border-amber-200 bg-white/92 p-4 text-center text-sm shadow-glass backdrop-blur-xl dark:border-amber-300/20 dark:bg-[#111113]/92">
          <p className="font-bold">Posts are loaded, but the canvas is off target.</p>
          <p className="mt-1 text-slate-500 dark:text-slate-400">{visibleSourcePosts.length} posts are available. Use Latest to recenter.</p>
          <button onClick={centerLatest} className="mt-3 rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white dark:bg-white dark:text-slate-950">Show posts</button>
        </div>
      ) : null}
      {!visibleSourcePosts.length ? (
        <div className="absolute left-1/2 top-24 z-20 w-[min(90vw,360px)] -translate-x-1/2 rounded-3xl border border-[#d2d2d7] bg-white/92 p-4 text-center text-sm shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-[#111113]/92">
          <p className="font-bold">No canvas posts yet.</p>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Create a post and it will appear near the center of the map.</p>
        </div>
      ) : null}
      <div
        className="canvas-layer absolute left-0 top-0"
        style={{ transform: `translate3d(${size.width / 2 + view.x}px, ${size.height / 2 + view.y}px, 0) scale(${view.zoom})` }}
      >
        {visiblePosts.map(({ post, position }) => {
          const author = users.find((user) => user.id === post.authorId) || users[0];
          if (!author) return null;
          const emphasized = sortMode === "trending" || sortMode.startsWith("most");
          return (
            <div key={post.id} className="absolute will-change-transform" style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0)` }}>
              <PostCard
                post={post}
                author={author}
                emphasized={emphasized}
                density={cardMode}
                currentUserId={currentUserId}
                muted={mutes.some((mute) => mute.mutedId === author.id)}
                liked={reactions.some((reaction) => reaction.postId === post.id && reaction.userId === currentUserId && reaction.type === "like")}
                reposted={reactions.some((reaction) => reaction.postId === post.id && reaction.userId === currentUserId && reaction.type === "repost")}
                bookmarked={reactions.some((reaction) => reaction.postId === post.id && reaction.userId === currentUserId && reaction.type === "bookmark")}
                onOpen={() => onOpenPost(post.id)}
                onProfile={() => onOpenProfile(author.id)}
                onLike={() => onLikePost(post.id)}
                onComment={() => onOpenPost(post.id)}
                onRepost={() => onRepostPost(post.id)}
                onBookmark={() => onBookmarkPost(post.id)}
                onEdit={() => onEditPost?.(post.id)}
                onDelete={() => onDeletePost?.(post.id)}
                onMute={() => onMuteUser?.(author.id)}
                onReport={() => onReportPost?.(post.id)}
                onHashtagClick={onHashtagClick}
                onPinPost={() => onPinPost?.(post.id)}
              />
            </div>
          );
        })}
      </div>
    </main>
  );
}
