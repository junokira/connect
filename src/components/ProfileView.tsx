import { CalendarDays, ImagePlus, Link as LinkIcon, Loader2, MapPin, Pencil, Upload, X } from "lucide-react";
import { FormEvent, MouseEvent, useEffect, useMemo, useState } from "react";
import { Post, PostReaction, ProfileUpdate, User } from "../types";
import { normalizeExternalUrl } from "../utils/media";
import { formatCount, formatDate } from "../utils/posts";
import { PostCard } from "./PostCard";

type Props = {
  user?: User;
  currentUserId: string;
  users: User[];
  posts: Post[];
  reactions: PostReaction[];
  onClose: () => void;
  onOpenPost: (id: string) => void;
  onUpdateProfile: (profile: ProfileUpdate) => Promise<void>;
};

const tabs = ["Posts", "Replies", "Media", "Likes"] as const;

function EditProfileDialog({ user, onClose, onSave }: { user: User; onClose: () => void; onSave: (profile: ProfileUpdate) => Promise<void> }) {
  const [form, setForm] = useState<ProfileUpdate>({
    displayName: user.displayName,
    username: user.username,
    avatarUrl: user.avatarUrl,
    bannerUrl: user.bannerUrl,
    bio: user.bio,
    location: user.location,
    website: user.website
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");

  useEffect(() => {
    if (!form.avatarFile) {
      setAvatarPreview("");
      return;
    }
    const url = URL.createObjectURL(form.avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [form.avatarFile]);

  useEffect(() => {
    if (!form.bannerFile) {
      setBannerPreview("");
      return;
    }
    const url = URL.createObjectURL(form.bannerFile);
    setBannerPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [form.bannerFile]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const update = (key: keyof ProfileUpdate, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const updateFile = (key: "avatarFile" | "bannerFile", file?: File) => setForm((current) => ({ ...current, [key]: file }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.displayName.trim()) {
      setError("Display name is required.");
      return;
    }
    if (!form.username.trim()) {
      setError("Username is required.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      await onSave(form);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  const stop = (event: MouseEvent) => event.stopPropagation();

  return (
    <div onMouseDown={onClose} className="fixed inset-0 z-[60] grid place-items-end bg-slate-950/45 p-0 backdrop-blur-sm sm:place-items-center sm:p-4">
      <form onSubmit={submit} onMouseDown={stop} className="thin-scrollbar max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[28px] border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#0f1115] sm:rounded-[28px]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-lg font-black">Edit profile</p>
            <p className="text-sm text-slate-500">Upload images, preview them, then save when it feels right.</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close edit profile">
            <X size={20} />
          </button>
        </div>
        <div className="relative mb-16">
          <div className="h-36 overflow-hidden rounded-3xl bg-slate-100 dark:bg-white/10">
            <img className="h-full w-full object-cover" src={bannerPreview || form.bannerUrl} alt="" />
          </div>
          <label className="absolute right-3 top-3 flex cursor-pointer items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-bold shadow-glass backdrop-blur dark:bg-slate-950/80">
            <Upload size={14} /> Banner
            <input className="sr-only" type="file" accept="image/*" onChange={(event) => updateFile("bannerFile", event.target.files?.[0])} />
          </label>
          <div className="absolute -bottom-12 left-5">
            <img className="h-24 w-24 rounded-full border-4 border-white bg-white object-cover shadow-xl dark:border-[#0f1115] dark:bg-[#0f1115]" src={avatarPreview || form.avatarUrl} alt="" />
            <label className="absolute bottom-1 right-1 grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-slate-950 text-white shadow-lg dark:bg-white dark:text-slate-950">
              <ImagePlus size={16} />
              <input className="sr-only" type="file" accept="image/*" onChange={(event) => updateFile("avatarFile", event.target.files?.[0])} />
            </label>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="mb-2 block text-sm font-semibold">Display name</span>
            <input value={form.displayName} onChange={(event) => update("displayName", event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-teal-500 dark:border-white/10" />
          </label>
          <label>
            <span className="mb-2 block text-sm font-semibold">Username</span>
            <input value={form.username} onChange={(event) => update("username", event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-teal-500 dark:border-white/10" />
          </label>
          <label>
            <span className="mb-2 block text-sm font-semibold">Avatar URL</span>
            <input value={form.avatarUrl} onChange={(event) => update("avatarUrl", event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-teal-500 dark:border-white/10" />
          </label>
          <label>
            <span className="mb-2 block text-sm font-semibold">Banner URL</span>
            <input value={form.bannerUrl} onChange={(event) => update("bannerUrl", event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-teal-500 dark:border-white/10" />
          </label>
          <label>
            <span className="mb-2 block text-sm font-semibold">Location</span>
            <input value={form.location} onChange={(event) => update("location", event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-teal-500 dark:border-white/10" />
          </label>
          <label>
            <span className="mb-2 block text-sm font-semibold">Website</span>
            <input value={form.website} onChange={(event) => update("website", event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-teal-500 dark:border-white/10" />
          </label>
        </div>
        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-semibold">Bio</span>
          <textarea value={form.bio} onChange={(event) => update("bio", event.target.value)} className="min-h-28 w-full resize-none rounded-2xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-teal-500 dark:border-white/10" />
        </label>
        {error ? <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-400/10 dark:text-rose-200">{error}</p> : null}
        <button disabled={saving} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 font-bold text-white disabled:opacity-50 dark:bg-white dark:text-slate-950">
          {saving ? <Loader2 className="animate-spin" size={17} /> : <Pencil size={17} />}
          {saving ? "Saving..." : "Save profile"}
        </button>
      </form>
    </div>
  );
}

function FullscreenMedia({ src, label, onClose }: { src: string; label: string; onClose: () => void }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div onMouseDown={onClose} className="fixed inset-0 z-[70] grid place-items-center bg-black/88 p-4 backdrop-blur-sm">
      <button onClick={onClose} className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur" aria-label="Close image">
        <X size={20} />
      </button>
      <img onMouseDown={(event) => event.stopPropagation()} className="max-h-[88dvh] max-w-[94vw] rounded-2xl object-contain shadow-2xl" src={src} alt={label} />
    </div>
  );
}

export function ProfileView({ user, currentUserId, users, posts, reactions, onClose, onOpenPost, onUpdateProfile }: Props) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Posts");
  const [editing, setEditing] = useState(false);
  const [viewer, setViewer] = useState<{ src: string; label: string } | undefined>();

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const profileData = useMemo(() => {
    if (!user) return { userPosts: [], mediaPosts: [], likedPosts: [], pinned: undefined };
    const repostedIds = new Set(reactions.filter((reaction) => reaction.userId === user.id && reaction.type === "repost").map((reaction) => reaction.postId));
    const likedIds = new Set(reactions.filter((reaction) => reaction.userId === user.id && reaction.type === "like").map((reaction) => reaction.postId));
    const userPosts = posts.filter((post) => post.authorId === user.id || repostedIds.has(post.id));
    return {
      userPosts,
      mediaPosts: userPosts.filter((post) => post.type !== "text"),
      likedPosts: posts.filter((post) => likedIds.has(post.id)),
      pinned: userPosts.find((post) => post.pinned)
    };
  }, [posts, reactions, user]);

  if (!user) return null;
  const isOwnProfile = user.id === currentUserId;
  const visiblePosts = activeTab === "Media" ? profileData.mediaPosts : activeTab === "Likes" ? profileData.likedPosts : profileData.userPosts;
  const websiteUrl = user.website ? normalizeExternalUrl(user.website) : "";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f7f7f4] text-slate-950 dark:bg-[#0e1116] dark:text-white">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-slate-950/90">
        <div>
          <p className="font-bold">{user.displayName}</p>
          <p className="text-sm text-slate-500">{profileData.userPosts.length} posts</p>
        </div>
        <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close profile">
          <X size={20} />
        </button>
      </header>
      <div className="mx-auto max-w-5xl pb-24">
        <div className="relative h-44 overflow-hidden bg-slate-200 sm:h-64 dark:bg-white/10">
          <button onClick={() => setViewer({ src: user.bannerUrl, label: `${user.displayName} banner` })} className="h-full w-full">
            <img className="h-full w-full object-cover" src={user.bannerUrl} alt="" />
          </button>
        </div>
        <section className="px-4 pb-6">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
            <button onClick={() => setViewer({ src: user.avatarUrl, label: `${user.displayName} avatar` })} className="rounded-full">
              <img className="h-28 w-28 rounded-full border-4 border-[#f7f7f4] bg-white object-cover shadow-xl dark:border-[#0e1116] dark:bg-slate-950" src={user.avatarUrl} alt="" />
            </button>
            {isOwnProfile ? (
              <button onClick={() => setEditing(true)} className="rounded-full border border-slate-300 px-5 py-2 text-sm font-bold hover:bg-slate-100 dark:border-white/15 dark:hover:bg-white/10">Edit profile</button>
            ) : (
              <button className="rounded-full bg-slate-950 px-5 py-2 text-sm font-bold text-white dark:bg-white dark:text-slate-950">Follow</button>
            )}
          </div>
          <div className="mt-4">
            <h1 className="text-2xl font-black">{user.displayName}</h1>
            <p className="text-slate-500">@{user.username}</p>
            <p className="mt-3 max-w-2xl whitespace-pre-wrap leading-7 text-slate-700 dark:text-slate-200">{user.bio}</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
              {user.location ? <span className="flex items-center gap-1"><MapPin size={16} /> {user.location}</span> : null}
              {websiteUrl ? <a className="flex items-center gap-1 hover:text-slate-950 hover:underline dark:hover:text-white" href={websiteUrl} target="_blank" rel="noreferrer"><LinkIcon size={16} /> {user.website}</a> : null}
              <span className="flex items-center gap-1"><CalendarDays size={16} /> Joined {formatDate(user.createdAt)}</span>
            </div>
            <div className="mt-3 flex gap-5 text-sm">
              <span><b>{formatCount(user.followingCount)}</b> Following</span>
              <span><b>{formatCount(user.followersCount)}</b> Followers</span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-4 border-y border-slate-200 text-center text-sm font-semibold dark:border-white/10">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-4 hover:bg-slate-100 dark:hover:bg-white/10 ${activeTab === tab ? "border-b-2 border-slate-950 dark:border-white" : "text-slate-500"}`}>{tab}</button>
          ))}
        </div>

        {profileData.pinned && activeTab === "Posts" ? (
          <section className="px-4 py-6">
            <p className="mb-3 text-xs font-bold uppercase text-slate-400">Pinned post</p>
            <PostCard
              post={profileData.pinned}
              author={user}
              emphasized
              onOpen={() => onOpenPost(profileData.pinned?.id || "")}
              onProfile={() => undefined}
              onLike={() => undefined}
              onComment={() => onOpenPost(profileData.pinned?.id || "")}
              onRepost={() => undefined}
              onBookmark={() => undefined}
            />
          </section>
        ) : null}

        <section className="grid gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <h2 className="mb-3 text-sm font-bold uppercase text-slate-400">{activeTab === "Media" ? "Media" : activeTab === "Likes" ? "Liked posts" : "Status feed"}</h2>
            <div className="mx-auto grid max-w-[700px] gap-4 sm:grid-cols-2">
              {visiblePosts.map((post) => (
                <div key={post.id} className="space-y-2">
                  {post.authorId !== user.id ? <p className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-300">Reposted by @{user.username}</p> : null}
                  <PostCard
                    post={post}
                    author={users.find((candidate) => candidate.id === post.authorId) || user}
                    onOpen={() => onOpenPost(post.id)}
                    onProfile={() => undefined}
                    onLike={() => undefined}
                    onComment={() => onOpenPost(post.id)}
                    onRepost={() => undefined}
                    onBookmark={() => undefined}
                  />
                </div>
              ))}
              {!visiblePosts.length ? <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-white/15">Nothing here yet.</p> : null}
            </div>
          </div>
          <aside>
            <h2 className="mb-3 text-sm font-bold uppercase text-slate-400">Media grid</h2>
            <div className="grid grid-cols-2 gap-2">
              {profileData.mediaPosts.map((post) => (
                <button key={post.id} onClick={() => onOpenPost(post.id)} className="aspect-square overflow-hidden rounded-xl bg-slate-100 dark:bg-white/10">
                  <img className="h-full w-full object-cover" src={post.imageUrl || post.thumbnailUrl} alt="" />
                </button>
              ))}
            </div>
            <h2 className="mb-3 mt-6 text-sm font-bold uppercase text-slate-400">People</h2>
            <div className="space-y-3">
              {users.filter((candidate) => candidate.id !== user.id).slice(0, 4).map((candidate) => (
                <div key={candidate.id} className="flex items-center gap-3 rounded-2xl bg-slate-100 p-3 dark:bg-white/10">
                  <img className="h-10 w-10 rounded-full object-cover" src={candidate.avatarUrl} alt="" />
                  <div>
                    <p className="text-sm font-semibold">{candidate.displayName}</p>
                    <p className="text-xs text-slate-500">@{candidate.username}</p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </div>
      {editing ? <EditProfileDialog user={user} onClose={() => setEditing(false)} onSave={onUpdateProfile} /> : null}
      {viewer ? <FullscreenMedia src={viewer.src} label={viewer.label} onClose={() => setViewer(undefined)} /> : null}
    </div>
  );
}
