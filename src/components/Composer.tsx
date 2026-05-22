import { Image, Send, Upload, Video } from "lucide-react";
import { FormEvent, MouseEvent, useEffect, useMemo, useState } from "react";
import { PostType, User } from "../types";

type Props = {
  open: boolean;
  currentUser: User;
  onClose: () => void;
  onPublish: (draft: { type: PostType; content: string; caption: string; imageUrl?: string; videoUrl?: string; thumbnailUrl?: string; mediaFile?: File; thumbnailFile?: File }) => void | Promise<unknown>;
};

export function Composer({ open, currentUser, onClose, onPublish }: Props) {
  const [type, setType] = useState<PostType>("text");
  const [content, setContent] = useState("");
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [mediaFile, setMediaFile] = useState<File | undefined>();
  const [thumbnailFile, setThumbnailFile] = useState<File | undefined>();
  const [mediaPreview, setMediaPreview] = useState("");
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  const preview = useMemo(() => (type === "text" ? content : caption), [caption, content, type]);
  const hasMedia = type === "photo" ? Boolean(mediaFile || imageUrl.trim()) : type === "video" ? Boolean(mediaFile || videoUrl.trim()) : true;
  const canPublish = type === "text" ? Boolean(content.trim()) : hasMedia;

  useEffect(() => {
    if (!mediaFile) {
      setMediaPreview("");
      return;
    }
    const url = URL.createObjectURL(mediaFile);
    setMediaPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [mediaFile]);

  useEffect(() => {
    if (!thumbnailFile) {
      setThumbnailPreview("");
      return;
    }
    const url = URL.createObjectURL(thumbnailFile);
    setThumbnailPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [thumbnailFile]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  if (!open) return null;

  const stop = (event: MouseEvent) => event.stopPropagation();

  const publish = async (event: FormEvent) => {
    event.preventDefault();
    if (!canPublish || publishing) return;
    try {
      setPublishing(true);
      setError("");
      await onPublish({
        type,
        content,
        caption,
        imageUrl: type === "photo" ? imageUrl.trim() : undefined,
        videoUrl: type === "video" ? videoUrl.trim() : undefined,
        thumbnailUrl: type === "video" ? thumbnailUrl.trim() : undefined,
        mediaFile,
        thumbnailFile
      });
      setContent("");
      setCaption("");
      setImageUrl("");
      setVideoUrl("");
      setThumbnailUrl("");
      setMediaFile(undefined);
      setThumbnailFile(undefined);
      onClose();
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : "Could not publish this post. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div onMouseDown={onClose} className="fixed inset-0 z-50 grid place-items-end bg-slate-950/35 p-0 backdrop-blur-sm sm:place-items-center sm:p-4">
      <form onMouseDown={stop} onSubmit={publish} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-slate-950 sm:rounded-3xl">
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
              placeholder={type === "photo" ? "Paste image URL or choose a photo" : "Paste video URL or choose a video"}
            />
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-3 text-sm font-semibold text-slate-600 hover:border-teal-500 hover:text-teal-700 dark:border-white/15 dark:text-slate-300 dark:hover:text-teal-200">
              <Upload size={17} />
              {type === "photo" ? "Choose photo from library" : "Choose video from library"}
              <input
                className="sr-only"
                type="file"
                accept={type === "photo" ? "image/*" : "video/*"}
                onChange={(event) => setMediaFile(event.target.files?.[0])}
              />
            </label>
            {type === "video" ? (
              <>
                <input
                  value={thumbnailUrl}
                  onChange={(event) => setThumbnailUrl(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-teal-500 dark:border-white/10"
                  placeholder="Thumbnail URL"
                />
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-3 text-sm font-semibold text-slate-600 hover:border-teal-500 hover:text-teal-700 dark:border-white/15 dark:text-slate-300 dark:hover:text-teal-200">
                  <Upload size={17} />
                  Choose thumbnail from library
                  <input className="sr-only" type="file" accept="image/*" onChange={(event) => setThumbnailFile(event.target.files?.[0])} />
                </label>
              </>
            ) : null}
          </div>
        )}

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
          {type === "photo" && (mediaPreview || imageUrl) ? <img className="max-h-[420px] w-full bg-slate-100 object-contain dark:bg-black" src={mediaPreview || imageUrl} alt="" /> : null}
          {type === "video" && mediaPreview ? <video className="max-h-[420px] w-full bg-black object-contain" src={mediaPreview} controls /> : null}
          {type === "video" && !mediaPreview && videoUrl ? <video className="max-h-[420px] w-full bg-black object-contain" src={videoUrl} poster={thumbnailPreview || thumbnailUrl} controls /> : null}
          {type === "video" && !mediaPreview && !videoUrl && (thumbnailPreview || thumbnailUrl) ? <img className="max-h-[420px] w-full bg-slate-100 object-contain dark:bg-black" src={thumbnailPreview || thumbnailUrl} alt="" /> : null}
          <div className="p-4">
            <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Draft preview</p>
            <p className="min-h-8 text-sm text-slate-700 dark:text-slate-200">{preview || (type === "text" ? "Your post preview will appear here." : "Media posts can publish with or without a caption.")}</p>
          </div>
        </div>

        {error ? <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm font-medium text-rose-700 dark:bg-rose-400/10 dark:text-rose-200">{error}</p> : null}
        <button type="submit" className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-slate-950" disabled={!canPublish || publishing}>
          <Send size={18} />
          {publishing ? "Publishing..." : "Publish to canvas"}
        </button>
      </form>
    </div>
  );
}
