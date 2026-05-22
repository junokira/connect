import { SlidersHorizontal } from "lucide-react";
import { PointerEvent, TouchEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CanvasView, FeedStyle, Post, SortMode, User } from "../types";
import { PostCard } from "./PostCard";

type Props = {
  posts: Post[];
  users: User[];
  sortMode: SortMode;
  feedStyle: FeedStyle;
  search: string;
  view: CanvasView;
  onViewChange: (view: CanvasView) => void;
  onOpenPost: (id: string) => void;
  onOpenProfile: (id: string) => void;
  onOpenFilters: () => void;
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

export function CanvasFeed({ posts, users, sortMode, feedStyle, search, view, onViewChange, onOpenPost, onOpenProfile, onOpenFilters, onLikePost, onRepostPost, onBookmarkPost }: Props) {
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
      const worldX = (mx - current.x) / current.zoom;
      const worldY = (my - current.y) / current.zoom;
      scheduleView({ zoom: nextZoom, x: mx - worldX * nextZoom, y: my - worldY * nextZoom });
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
    const minX = (-view.x - padding) / view.zoom;
    const minY = (-view.y - padding) / view.zoom;
    const maxX = (size.width - view.x + padding) / view.zoom;
    const maxY = (size.height - view.y + padding) / view.zoom;
    return positionedPosts.filter(({ position }) => position.x > minX && position.x < maxX && position.y > minY && position.y < maxY);
  }, [positionedPosts, size.height, size.width, view]);

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
      className="canvas-viewport relative h-screen flex-1 cursor-grab overflow-hidden bg-[#f7f7f4] text-slate-950 active:cursor-grabbing dark:bg-[#0e1116] dark:text-white"
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
      <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-2xl border border-slate-200 bg-white/86 px-4 py-3 shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/86 lg:left-6">
        <p className="text-sm font-bold">Canvas</p>
        <p className="text-xs text-slate-500">{visiblePosts.length} visible · {feedStyle} · {sortMode} · {search || "all posts"}</p>
      </div>
      <button onClick={onOpenFilters} className="absolute right-4 top-4 z-20 grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white/86 shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/86 lg:hidden" aria-label="Open filters">
        <SlidersHorizontal size={19} />
      </button>
      <div className="canvas-layer absolute left-0 top-0" style={{ transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.zoom})` }}>
        {visiblePosts.map(({ post, position }) => {
          const author = users.find((user) => user.id === post.authorId)!;
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
