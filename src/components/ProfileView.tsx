import { CalendarDays, Link as LinkIcon, Loader2, MapPin, Pencil, X } from "lucide-react";
import { FormEvent, MouseEvent, useEffect, useMemo, useState } from "react";
import { Post, PostReaction, ProfileUpdate, User } from "../types";
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

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const update = (key: keyof ProfileUpdate, value: string) => setForm((current) => ({ ...current, [key]: value }));

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
      <form onSubmit={submit} onMouseDown={stop} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-slate-950 sm:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-lg font-black">Edit profile</p>
            <p className="text-sm text-slate-500">Your username stays clean. A number is added only if it is taken.</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close edit profile">
            <X size={20} />
          </button>
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

export function ProfileView({ user, currentUserId, users, posts, reactions, onClose, onOpenPost, onUpdateProfile }: Props) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Posts");
  const [editing, setEditing] = useState(false);

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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-slate-950/90">
        <div>
          <p className="font-bold">{user.displayName}</p>
          <p className="text-sm text-slate-500">{profileData.userPosts.length} posts</p>
        </div>
        <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close profile">
          <X size={20} />
        </button>
      </header>
      <div className="mx-auto max-w-6xl pb-24">
        <div className="relative h-44 overflow-hidden bg-slate-200 sm:h-64 dark:bg-white/10">
          <img className="h-full w-full object-cover" src={user.bannerUrl} alt="" />
        </div>
        <section className="px-4 pb-6">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
            <img className="h-28 w-28 rounded-full border-4 border-white bg-white object-cover shadow-xl dark:border-slate-950 dark:bg-slate-950" src={user.avatarUrl} alt="" />
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
              {user.website ? <span className="flex items-center gap-1"><LinkIcon size={16} /> {user.website}</span> : null}
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

        <section className="grid gap-6 px-4 py-6 lg:grid-cols-[1fr_360px]">
          <div>
            <h2 className="mb-3 text-sm font-bold uppercase text-slate-400">{activeTab === "Media" ? "Media" : activeTab === "Likes" ? "Liked posts" : "Status feed"}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
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
    </div>
  );
}
