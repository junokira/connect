import { LocateFixed } from "lucide-react";
import { PointerEvent, TouchEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CanvasView, FeedStyle, Post, SortMode, User } from "../types";
import { PostCard } from "./PostCard";

type Props = {
  posts: Post[];
  users: User[];
  sortMode: SortMode;
  feedStyle: FeedStyle;
  view: CanvasView;
  onViewChange: (view: CanvasView) => void;
  onOpenPost: (id: string) => void;
  onOpenProfile: (id: string) => void;
  onLatest: () => void;
  onLikePost: (id: string) => void;
  onRepostPost: (id: string) => void;
  onBookmarkPost: (id: string) => void;
};

const clampZoom = (zoom: number) => Math.max(0.35, Math.min(2.2, zoom));

const getStyledPosition = (post: Post, index: number, style: FeedStyle) => {
  if (style === "classic") return { x: post.x, y: post.y };
  if (style === "gallery") {
    const col = index % 5;
    const row = Math.floor(index / 5);
    const lift = post.type === "text" ? 80 : 0;
    return { x: col * 380 - 760, y: row * 350 - 220 + lift };
  }
  if (style === "mosaic") {
    const columns = [-760, -380, 0, 380, 760];
    const col = index % columns.length;
    const row = Math.floor(index / columns.length);
    const stagger = [0, 150, 70, 220, 110][col];
    const mediaLift = post.type === "text" ? 90 : -20;
    return { x: columns[col], y: row * 430 + stagger + mediaLift - 260 };
  }
  if (style === "orbit") {
    const ring = Math.floor(index / 8) + 1;
    const inRing = index % 8;
    const angle = (inRing / 8) * Math.PI * 2 + ring * 0.34;
    const radius = 230 + ring * 260;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  }
  const typeOffset = post.type === "photo" ? -360 : post.type === "video" ? 360 : 0;
  const column = index % 3;
  const row = Math.floor(index / 3);
  return { x: typeOffset + column * 80 - 80, y: row * 330 - 220 };
};

export function CanvasFeed({ posts, users, sortMode, feedStyle, view, onViewChange, onOpenPost, onOpenProfile, onLatest, onLikePost, onRepostPost, onBookmarkPost }: Props) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ id: number; x: number; y: number; view: CanvasView } | null>(null);
  const didDragRef = useRef(false);
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
    if (rect) setSize({ width: rect.width, height: rect.height });
  }, []);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;

    const handleWheel = (event: globalThis.WheelEvent) => {
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
  }, [scheduleView, updateSize]);

  const positionedPosts = useMemo(
    () => posts.map((post, index) => ({ post, position: getStyledPosition(post, index, feedStyle) })),
    [feedStyle, posts]
  );

  const visiblePosts = useMemo(() => {
    const padding = 640;
    const centerX = size.width / 2;
    const centerY = size.height / 2;
    const minX = (-centerX - view.x - padding) / view.zoom;
    const minY = (-centerY - view.y - padding) / view.zoom;
    const maxX = (size.width - centerX - view.x + padding) / view.zoom;
    const maxY = (size.height - centerY - view.y + padding) / view.zoom;
    return positionedPosts.filter(({ position }) => position.x > minX && position.x < maxX && position.y > minY && position.y < maxY);
  }, [positionedPosts, size.height, size.width, view]);

  useEffect(() => {
    if (!positionedPosts.length || visiblePosts.length) return;
    const latest = [...positionedPosts].sort((a, b) => Date.parse(b.post.createdAt) - Date.parse(a.post.createdAt))[0];
    onViewChange({ x: -latest.position.x, y: -latest.position.y, zoom: 0.95 });
  }, [onViewChange, positionedPosts, visiblePosts.length]);

  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button,input,select,textarea,a,video")) return;
    updateSize();
    didDragRef.current = false;
    dragRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, view };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 6) didDragRef.current = true;
    scheduleView({ ...viewRef.current, x: drag.view.x + event.clientX - drag.x, y: drag.view.y + event.clientY - drag.y });
  };

  const pointerUp = () => {
    dragRef.current = null;
  };

  const touchMove = (event: TouchEvent<HTMLDivElement>) => {
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
      className="canvas-viewport relative h-screen flex-1 cursor-grab overflow-hidden bg-[#f5f5f7] text-slate-950 active:cursor-grabbing dark:bg-[#050505] dark:text-white"
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onPointerCancel={pointerUp}
      onTouchMove={touchMove}
      onTouchEnd={() => (touchRef.current = null)}
      onClickCapture={(event) => {
        if (!didDragRef.current) return;
        event.stopPropagation();
        didDragRef.current = false;
      }}
    >
      <div className="canvas-dots absolute inset-0" style={{ backgroundPosition: `${view.x}px ${view.y}px`, backgroundSize: `${24 * view.zoom}px ${24 * view.zoom}px` }} />
      <button
        onClick={(event) => {
          event.stopPropagation();
          onLatest();
        }}
        className="absolute left-4 top-4 z-20 flex h-11 items-center gap-2 rounded-2xl border border-[#d2d2d7] bg-white/88 px-3 text-sm font-bold shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-[#111113]/88"
        aria-label="Jump to latest posts"
      >
        <LocateFixed size={17} />
        <span className="hidden sm:inline">Latest</span>
      </button>
      {posts.length && !visiblePosts.length ? (
        <div className="absolute left-1/2 top-24 z-20 w-[min(90vw,360px)] -translate-x-1/2 rounded-3xl border border-amber-200 bg-white/92 p-4 text-center text-sm shadow-glass backdrop-blur-xl dark:border-amber-300/20 dark:bg-[#111113]/92">
          <p className="font-bold">Posts are loaded, but the canvas is off target.</p>
          <p className="mt-1 text-slate-500 dark:text-slate-400">{posts.length} posts are available. Use Latest to recenter.</p>
          <button onClick={onLatest} className="mt-3 rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white dark:bg-white dark:text-slate-950">Show posts</button>
        </div>
      ) : null}
      {!posts.length ? (
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
                onOpen={() => onOpenPost(post.id)}
                onProfile={() => onOpenProfile(author.id)}
                onLike={() => onLikePost(post.id)}
                onComment={() => onOpenPost(post.id)}
                onRepost={() => onRepostPost(post.id)}
                onBookmark={() => onBookmarkPost(post.id)}
              />
            </div>
          );
        })}
      </div>
    </main>
  );
}
