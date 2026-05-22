import { LocateFixed, Maximize2, Minus, Plus } from "lucide-react";

type Props = {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onLatest: () => void;
};

export function CanvasControls({ zoom, onZoomIn, onZoomOut, onReset, onLatest }: Props) {
  return (
    <div className="fixed bottom-24 right-4 z-30 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/88 p-2 shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/88 lg:bottom-5">
      <button className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10" onClick={onZoomOut} aria-label="Zoom out">
        <Minus size={18} />
      </button>
      <span className="min-w-14 text-center text-xs font-semibold">{Math.round(zoom * 100)}%</span>
      <button className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10" onClick={onZoomIn} aria-label="Zoom in">
        <Plus size={18} />
      </button>
      <button className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10" onClick={onReset} aria-label="Reset view">
        <Maximize2 size={18} />
      </button>
      <button className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10" onClick={onLatest} aria-label="Jump to latest">
        <LocateFixed size={18} />
      </button>
    </div>
  );
}
