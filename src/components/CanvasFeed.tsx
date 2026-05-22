import { SlidersHorizontal } from "lucide-react";
import { PointerEvent, TouchEvent, WheelEvent, useMemo, useRef, useState } from "react";
import { CanvasView, Post, SortMode, User } from "../types";
import { PostCard } from "./PostCard";

type Props = {
  posts: Post[];
  users: User[];
  sortMode: SortMode;
  search: string;
  view: CanvasView;
  onViewChange: (view: CanvasView) => void;
  onOpenPost: (id: string) => void;
  onOpenProfile: (id: string) => void;
  onOpenFilters: () => void;
};

const clampZoom = (zoom: number) => Math.max(0.35, Math.min(2.2, zoom));

export function CanvasFeed({ posts, users, sortMode, search, view, onViewChange, onOpenPost, onOpenProfile, onOpenFilters }: Props) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ id: number; x: number; y: number; view: CanvasView } | null>(null);
  const [size, setSize] = useState({ width: 1400, height: 900 });
  const touchRef = useRef<{ distance: number; zoom: number } | null>(null);

  const visiblePosts = useMemo(() => {
    const padding = 520;
    const minX = (-view.x - padding) / view.zoom;
    const minY = (-view.y - padding) / view.zoom;
    const maxX = (size.width - view.x + padding) / view.zoom;
    const maxY = (size.height - view.y + padding) / view.zoom;
    return posts.filter((post) => post.x > minX && post.x < maxX && post.y > minY && post.y < maxY);
  }, [posts, size.height, size.width, view]);

  const updateSize = () => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (rect) setSize({ width: rect.width, height: rect.height });
  };

  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("article,button,input,select")) return;
    updateSize();
    dragRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, view };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    onViewChange({ ...view, x: drag.view.x + event.clientX - drag.x, y: drag.view.y + event.clientY - drag.y });
  };

  const pointerUp = () => {
    dragRef.current = null;
  };

  const wheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    updateSize();
    const rect = event.currentTarget.getBoundingClientRect();
    const nextZoom = clampZoom(view.zoom * (event.deltaY > 0 ? 0.92 : 1.08));
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;
    const worldX = (mx - view.x) / view.zoom;
    const worldY = (my - view.y) / view.zoom;
    onViewChange({ zoom: nextZoom, x: mx - worldX * nextZoom, y: my - worldY * nextZoom });
  };

  const touchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 2) return;
    const [a, b] = [event.touches[0], event.touches[1]];
    const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    if (!touchRef.current) {
      touchRef.current = { distance, zoom: view.zoom };
      return;
    }
    onViewChange({ ...view, zoom: clampZoom((distance / touchRef.current.distance) * touchRef.current.zoom) });
  };

  return (
    <main
      ref={viewportRef}
      className="relative h-screen flex-1 cursor-grab overflow-hidden bg-[#f7f7f4] text-slate-950 active:cursor-grabbing dark:bg-[#0e1116] dark:text-white"
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onPointerCancel={pointerUp}
      onWheel={wheel}
      onTouchMove={touchMove}
      onTouchEnd={() => (touchRef.current = null)}
    >
      <div className="canvas-dots absolute inset-0" style={{ backgroundPosition: `${view.x}px ${view.y}px`, backgroundSize: `${24 * view.zoom}px ${24 * view.zoom}px` }} />
      <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-2xl border border-slate-200 bg-white/86 px-4 py-3 shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/86 lg:left-6">
        <p className="text-sm font-bold">Canvas</p>
        <p className="text-xs text-slate-500">{visiblePosts.length} visible · {sortMode} · {search || "all posts"}</p>
      </div>
      <button onClick={onOpenFilters} className="absolute right-4 top-4 z-20 grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white/86 shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/86 lg:hidden" aria-label="Open filters">
        <SlidersHorizontal size={19} />
      </button>
      <div className="absolute left-0 top-0 origin-top-left" style={{ transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.zoom})` }}>
        {visiblePosts.map((post) => {
          const author = users.find((user) => user.id === post.authorId)!;
          const emphasized = sortMode === "trending" || sortMode.startsWith("most");
          return (
            <div key={post.id} className="absolute" style={{ transform: `translate3d(${post.x}px, ${post.y}px, 0)` }}>
              <PostCard post={post} author={author} emphasized={emphasized} onOpen={() => onOpenPost(post.id)} onProfile={() => onOpenProfile(author.id)} />
            </div>
          );
        })}
      </div>
    </main>
  );
}
