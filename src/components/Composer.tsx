import { Image, Send, Video } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { PostType, User } from "../types";

type Props = {
  open: boolean;
  currentUser: User;
  onClose: () => void;
  onPublish: (draft: { type: PostType; content: string; caption: string; imageUrl?: string; videoUrl?: string; thumbnailUrl?: string }) => void | Promise<unknown>;
};

const sampleImage = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80";
const sampleVideo = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

export function Composer({ open, currentUser, onClose, onPublish }: Props) {
  const [type, setType] = useState<PostType>("text");
  const [content, setContent] = useState("");
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState(sampleImage);
  const [videoUrl, setVideoUrl] = useState(sampleVideo);
  const [thumbnailUrl, setThumbnailUrl] = useState(sampleImage);

  const preview = useMemo(() => (type === "text" ? content : caption), [caption, content, type]);

  if (!open) return null;

  const publish = async (event: FormEvent) => {
    event.preventDefault();
    if (!preview.trim()) return;
    await onPublish({
      type,
      content,
      caption,
      imageUrl: type === "photo" ? imageUrl : undefined,
      videoUrl: type === "video" ? videoUrl : undefined,
      thumbnailUrl: type === "video" ? thumbnailUrl : undefined
    });
    setContent("");
    setCaption("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/35 p-0 backdrop-blur-sm sm:place-items-center sm:p-4">
      <form onSubmit={publish} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-slate-950 sm:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img className="h-11 w-11 rounded-full object-cover" src={currentUser.avatarUrl} alt="" />
            <div>
              <p className="font-semibold text-slate-950 dark:text-white">Create post</p>
              <p className="text-sm text-slate-500">@{currentUser.username}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-white/10">
            Close
          </button>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-white/10">
          {(["text", "photo", "video"] as PostType[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setType(option)}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold capitalize ${
                type === option ? "bg-white shadow-sm dark:bg-slate-900" : "text-slate-500"
              }`}
            >
              {option === "photo" ? <Image size={16} /> : option === "video" ? <Video size={16} /> : null}
              {option}
            </button>
          ))}
        </div>

        {type === "text" ? (
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="min-h-36 w-full resize-none rounded-2xl border border-slate-200 bg-transparent p-4 outline-none focus:border-teal-500 dark:border-white/10"
            placeholder="What should this canvas remember?"
          />
        ) : (
          <div className="space-y-3">
            <textarea
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              className="min-h-28 w-full resize-none rounded-2xl border border-slate-200 bg-transparent p-4 outline-none focus:border-teal-500 dark:border-white/10"
              placeholder="Write a caption..."
            />
            <input
              value={type === "photo" ? imageUrl : videoUrl}
              onChange={(event) => (type === "photo" ? setImageUrl(event.target.value) : setVideoUrl(event.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-teal-500 dark:border-white/10"
              placeholder={type === "photo" ? "Image URL" : "Video URL"}
            />
            {type === "video" ? (
              <input
                value={thumbnailUrl}
                onChange={(event) => setThumbnailUrl(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-teal-500 dark:border-white/10"
                placeholder="Thumbnail URL"
              />
            ) : null}
          </div>
        )}

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
          {type === "photo" && imageUrl ? <img className="h-56 w-full object-cover" src={imageUrl} alt="" /> : null}
          {type === "video" && thumbnailUrl ? <img className="h-56 w-full object-cover" src={thumbnailUrl} alt="" /> : null}
          <div className="p-4">
            <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Draft preview</p>
            <p className="min-h-8 text-sm text-slate-700 dark:text-slate-200">{preview || "Your post preview will appear here."}</p>
          </div>
        </div>

        <button type="submit" className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-slate-950" disabled={!preview.trim()}>
          <Send size={18} />
          Publish to canvas
        </button>
      </form>
    </div>
  );
}
