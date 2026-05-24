import { Bookmark, CalendarDays, Heart, ImagePlus, Link as LinkIcon, Loader2, MapPin, Maximize2, Menu, Minimize2, Pencil, Repeat2, Settings, Shield, Upload, X } from "lucide-react";
import { FormEvent, MouseEvent, TouchEvent, useEffect, useMemo, useRef, useState } from "react";
import { CanvasView, Follow, Post, PostReaction, ProfileUpdate, User, UserBlock, UserMute } from "../types";
import { normalizeExternalUrl } from "../utils/media";
import { formatCount, formatDate } from "../utils/posts";
import { CanvasFeed } from "./CanvasFeed";
import { PostCard } from "./PostCard";
import { VerifiedBadge } from "./VerifiedBadge";

type Props = {
  user?: User;
  currentUserId: string;
  users: User[];
  posts: Post[];
  reactions: PostReaction[];
  follows: Follow[];
  blocks?: UserBlock[];
  mutes?: UserMute[];
  onClose: () => void;
  onOpenProfile: (id: string) => void;
  onOpenPost: (id: string) => void;
  onLikePost: (id: string) => void;
  onRepostPost: (id: string) => void;
  onBookmarkPost: (id: string) => void;
  onFollowUser: (id: string) => void;
  onUpdateProfile: (profile: ProfileUpdate) => Promise<void>;
  onUpdatePassword: (password: string) => Promise<void>;
  onRequestVerification: () => Promise<void>;
  onBlockUser?: (id: string) => void;
  onUnblockUser?: (id: string) => void;
  onMuteUser?: (id: string) => void;
  onUnmuteUser?: (id: string) => void;
  onReportUser?: (id: string) => void;
};

type ProfileTab = "Canvas" | "Posts" | "Media" | "Likes" | "Saved" | "Reposts";
const tabs: ProfileTab[] = ["Canvas", "Posts", "Media", "Likes", "Saved"];

function EditProfileDialog({ user, onClose, onSave, onUpdatePassword, onRequestVerification }: { user: User; onClose: () => void; onSave: (profile: ProfileUpdate) => Promise<void>; onUpdatePassword: (password: string) => Promise<void>; onRequestVerification: () => Promise<void> }) {
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
  const [newPassword, setNewPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("");

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

  const savePassword = async () => {
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      await onUpdatePassword(newPassword);
      setNewPassword("");
      setPasswordStatus("Password updated.");
    } catch (passwordError) {
      setError(passwordError instanceof Error ? passwordError.message : "Could not update password.");
    } finally {
      setSaving(false);
    }
  };

  const requestVerification = async () => {
    try {
      setSaving(true);
      setError("");
      await onRequestVerification();
      setVerificationStatus("Verification request sent.");
    } catch (verificationError) {
      setError(verificationError instanceof Error ? verificationError.message : "Could not request verification.");
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
          <div className="aspect-[3/1] overflow-hidden rounded-3xl bg-slate-100 dark:bg-white/10">
            <img className="h-full w-full object-cover" src={bannerPreview || form.bannerUrl} alt="" />
          </div>
          <label className="absolute right-3 top-3 flex cursor-pointer items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-bold shadow-glass backdrop-blur dark:bg-slate-950/80">
            <Upload size={14} /> Banner
            <input className="sr-only" type="file" accept="image/*" onChange={(event) => updateFile("bannerFile", event.target.files?.[0])} />
          </label>
          <div className="absolute -bottom-12 left-5 z-20">
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
        <div className="mt-4 rounded-2xl border border-slate-200 p-4 dark:border-white/10">
          <p className="text-sm font-bold">Password</p>
          <p className="mt-1 text-sm text-slate-500">Set or change your password after signing in with magic link.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
            <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="rounded-2xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-teal-500 dark:border-white/10" placeholder="New password" />
            <button type="button" disabled={saving || newPassword.length < 8} onClick={() => void savePassword()} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-50 dark:bg-white dark:text-slate-950">Set password</button>
          </div>
          {passwordStatus ? <p className="mt-2 text-sm font-semibold text-emerald-600 dark:text-emerald-300">{passwordStatus}</p> : null}
        </div>
        <div className="mt-4 rounded-2xl border border-slate-200 p-4 dark:border-white/10">
          <p className="text-sm font-bold">Verification</p>
          <p className="mt-1 text-sm text-slate-500">{user.verified ? "This profile is verified." : "Request review for a CONNECT verification badge."}</p>
          {!user.verified ? (
            <button type="button" disabled={saving} onClick={() => void requestVerification()} className="mt-3 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold disabled:opacity-50 dark:border-white/15">Request verification</button>
          ) : null}
          {verificationStatus ? <p className="mt-2 text-sm font-semibold text-emerald-600 dark:text-emerald-300">{verificationStatus}</p> : null}
        </div>
        {error ? <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-400/10 dark:text-rose-200">{error}</p> : null}
        <button disabled={saving} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 font-bold text-white disabled:opacity-50 dark:bg-white dark:text-slate-950">
          {saving ? <Loader2 className="animate-spin" size={17} /> : <Pencil size={17} />}
          {saving ? "Saving..." : "Save profile"}
        </button>
      </form>
    </div>
  );
}

function FullscreenMedia({ src, label, shape, onClose }: { src: string; label: string; shape: "avatar" | "banner"; onClose: () => void }) {
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
      <img
        onMouseDown={(event) => event.stopPropagation()}
        className={shape === "avatar" ? "aspect-square max-h-[78dvh] w-[min(78dvh,86vw)] rounded-full border-4 border-white/20 object-cover shadow-2xl" : "aspect-[3/1] w-[min(94vw,1100px)] rounded-3xl object-cover shadow-2xl"}
        src={src}
        alt={label}
      />
    </div>
  );
}

export function ProfileView({ user, currentUserId, users, posts, reactions, follows, blocks = [], mutes = [], onClose, onOpenProfile, onOpenPost, onLikePost, onRepostPost, onBookmarkPost, onFollowUser, onUpdateProfile, onUpdatePassword, onRequestVerification, onBlockUser, onUnblockUser, onMuteUser, onUnmuteUser, onReportUser }: Props) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("Canvas");
  const [editing, setEditing] = useState(false);
  const [viewer, setViewer] = useState<{ src: string; label: string; shape: "avatar" | "banner" } | undefined>();
  const [networkList, setNetworkList] = useState<"followers" | "following" | undefined>();
  const [menuOpen, setMenuOpen] = useState(false);
  const [canvasFullscreen, setCanvasFullscreen] = useState(false);
  const [profileCanvasView, setProfileCanvasView] = useState<CanvasView>({ x: 0, y: 0, zoom: 0.95 });
  const touchStartRef = useRef<{ x: number; y: number; canClose: boolean } | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: 0, behavior: "auto" });
    setActiveTab("Canvas");
  }, [user?.id]);

  const profileData = useMemo(() => {
    if (!user) return { userPosts: [], mediaPosts: [], likedPosts: [], bookmarkedPosts: [], repostedPosts: [], pinned: undefined };
    const repostedIds = new Set(reactions.filter((reaction) => reaction.userId === user.id && reaction.type === "repost").map((reaction) => reaction.postId));
    const likedIds = new Set(reactions.filter((reaction) => reaction.userId === user.id && reaction.type === "like").map((reaction) => reaction.postId));
    const bookmarkedIds = new Set(reactions.filter((reaction) => reaction.userId === user.id && reaction.type === "bookmark").map((reaction) => reaction.postId));
    const userPosts = posts.filter((post) => post.authorId === user.id || repostedIds.has(post.id));
    return {
      userPosts,
      mediaPosts: userPosts.filter((post) => post.type !== "text"),
      likedPosts: posts.filter((post) => likedIds.has(post.id)),
      bookmarkedPosts: posts.filter((post) => bookmarkedIds.has(post.id)),
      repostedPosts: posts.filter((post) => repostedIds.has(post.id)),
      pinned: userPosts.find((post) => post.pinned)
    };
  }, [posts, reactions, user]);

  if (!user) return null;
  const isOwnProfile = user.id === currentUserId;
  const isFollowing = follows.some((follow) => follow.followerId === currentUserId && follow.followingId === user.id);
  const isBlocked = blocks.some((block) => block.blockedId === user.id);
  const isMuted = mutes.some((mute) => mute.mutedId === user.id);
  const reactionState = (postId: string) => ({
    liked: reactions.some((reaction) => reaction.postId === postId && reaction.userId === currentUserId && reaction.type === "like"),
    reposted: reactions.some((reaction) => reaction.postId === postId && reaction.userId === currentUserId && reaction.type === "repost"),
    bookmarked: reactions.some((reaction) => reaction.postId === postId && reaction.userId === currentUserId && reaction.type === "bookmark")
  });
  const visiblePosts =
    activeTab === "Media" ? profileData.mediaPosts :
      activeTab === "Likes" && isOwnProfile ? profileData.likedPosts :
        activeTab === "Saved" && isOwnProfile ? profileData.bookmarkedPosts :
          activeTab === "Reposts" ? profileData.repostedPosts :
            profileData.userPosts;
  const websiteUrl = user.website ? normalizeExternalUrl(user.website) : "";
  const touchStart = (event: TouchEvent) => {
    const touch = event.touches[0];
    const target = event.target as HTMLElement;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, canClose: !target.closest(".canvas-viewport,button,a,input,textarea,select") && (scrollerRef.current?.scrollTop || 0) <= 8 };
  };
  const touchEnd = (event: TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start?.canClose) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = Math.abs(touch.clientY - start.y);
    if (deltaX > 100 && deltaX > deltaY * 1.5) onClose();
  };

  return (
    <div ref={scrollerRef} onTouchStart={touchStart} onTouchEnd={touchEnd} className="modal-enter fixed inset-0 z-50 overflow-y-auto bg-[#f5f5f7] text-slate-950 dark:bg-[#050505] dark:text-white">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-slate-950/90">
        <div>
          <p className="flex items-center gap-1 font-bold">
            {user.displayName}
            <VerifiedBadge verified={user.verified} size={15} />
          </p>
          <p className="text-sm text-slate-500">{profileData.userPosts.length} posts</p>
        </div>
        <div className="relative flex items-center gap-1">
          <button onClick={() => setMenuOpen((open) => !open)} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Profile menu">
            <Menu size={20} />
          </button>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close profile">
            <X size={20} />
          </button>
          {menuOpen ? (
            <div className="absolute right-0 top-12 z-30 w-64 rounded-3xl border border-slate-200 bg-white/95 p-2 text-sm shadow-2xl backdrop-blur dark:border-white/10 dark:bg-slate-950/95">
              <button onClick={() => { setActiveTab("Media"); setMenuOpen(false); }} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left font-semibold hover:bg-slate-100 dark:hover:bg-white/10"><ImagePlus size={17} /> Media</button>
              <button onClick={() => { setActiveTab("Reposts"); setMenuOpen(false); }} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left font-semibold hover:bg-slate-100 dark:hover:bg-white/10"><Repeat2 size={17} /> Reposts</button>
              {isOwnProfile ? (
                <>
                  <button onClick={() => { setActiveTab("Likes"); setMenuOpen(false); }} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left font-semibold hover:bg-slate-100 dark:hover:bg-white/10"><Heart size={17} /> Liked posts</button>
                  <button onClick={() => { setActiveTab("Saved"); setMenuOpen(false); }} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left font-semibold hover:bg-slate-100 dark:hover:bg-white/10"><Bookmark size={17} /> Saved posts</button>
                  <button onClick={() => { setEditing(true); setMenuOpen(false); }} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left font-semibold hover:bg-slate-100 dark:hover:bg-white/10"><Settings size={17} /> Settings and verification</button>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>
      <div className="mx-auto max-w-5xl pb-24">
        <div className="relative z-0 h-44 overflow-hidden bg-slate-200 sm:h-64 dark:bg-white/10">
          <button onClick={() => setViewer({ src: user.bannerUrl, label: `${user.displayName} banner`, shape: "banner" })} className="h-full w-full">
            <img className="h-full w-full object-cover" src={user.bannerUrl} alt="" />
          </button>
        </div>
        <section className="relative z-10 px-4 pb-6">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
            <button onClick={() => setViewer({ src: user.avatarUrl, label: `${user.displayName} avatar`, shape: "avatar" })} className="relative z-30 rounded-full">
              <img className="h-28 w-28 rounded-full border-4 border-[#f5f5f7] bg-white object-cover shadow-xl dark:border-[#050505] dark:bg-slate-950" src={user.avatarUrl} alt="" />
            </button>
            <div className="flex items-center gap-2">
              {isOwnProfile ? (
                <button onClick={() => setEditing(true)} className="rounded-full border border-slate-300 px-5 py-2 text-sm font-bold hover:bg-slate-100 dark:border-white/15 dark:hover:bg-white/10">Edit profile</button>
              ) : isBlocked ? (
                <button onClick={() => onUnblockUser?.(user.id)} className="rounded-full border border-slate-300 px-5 py-2 text-sm font-bold hover:bg-slate-100 dark:border-white/15 dark:hover:bg-white/10">Unblock</button>
              ) : (
                <button onClick={() => onFollowUser(user.id)} className={`rounded-full px-5 py-2 text-sm font-bold ${isFollowing ? "border border-slate-300 hover:bg-slate-100 dark:border-white/15 dark:hover:bg-white/10" : "bg-slate-950 text-white dark:bg-white dark:text-slate-950"}`}>{isFollowing ? "Following" : "Follow"}</button>
              )}
              {!isOwnProfile ? (
                <div className="relative">
                  <button onClick={() => setMenuOpen((open) => !open)} className="grid h-10 w-10 place-items-center rounded-full border border-slate-300 hover:bg-slate-100 dark:border-white/15 dark:hover:bg-white/10" aria-label="Profile safety menu"><Shield size={17} /></button>
                  {menuOpen ? (
                    <div className="absolute right-0 top-12 z-40 w-52 rounded-2xl border border-slate-200 bg-white p-2 text-sm shadow-2xl dark:border-white/10 dark:bg-slate-950">
                      <button onClick={() => { (isMuted ? onUnmuteUser : onMuteUser)?.(user.id); setMenuOpen(false); }} className="w-full rounded-xl px-3 py-2 text-left font-semibold hover:bg-slate-100 dark:hover:bg-white/10">{isMuted ? "Unmute" : `Mute @${user.username}`}</button>
                      <button onClick={() => { (isBlocked ? onUnblockUser : onBlockUser)?.(user.id); setMenuOpen(false); }} className="w-full rounded-xl px-3 py-2 text-left font-semibold hover:bg-slate-100 dark:hover:bg-white/10">{isBlocked ? "Unblock" : `Block @${user.username}`}</button>
                      <button onClick={() => { onReportUser?.(user.id); setMenuOpen(false); }} className="w-full rounded-xl px-3 py-2 text-left font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-400/10">Report user</button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
          <div className="mt-4">
            <h1 className="flex items-center gap-2 text-2xl font-black">
              {user.displayName}
              <VerifiedBadge verified={user.verified} size={21} />
            </h1>
            <p className="text-slate-500">@{user.username}</p>
            <p className="mt-3 max-w-2xl whitespace-pre-wrap leading-7 text-slate-700 dark:text-slate-200">{user.bio}</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
              {user.location ? <span className="flex items-center gap-1"><MapPin size={16} /> {user.location}</span> : null}
              {websiteUrl ? <a className="flex items-center gap-1 hover:text-slate-950 hover:underline dark:hover:text-white" href={websiteUrl} target="_blank" rel="noreferrer"><LinkIcon size={16} /> {user.website}</a> : null}
              <span className="flex items-center gap-1"><CalendarDays size={16} /> Joined {formatDate(user.createdAt)}</span>
            </div>
            {isOwnProfile ? (
              <div className="mt-3 flex gap-5 text-sm">
                <button onClick={() => setNetworkList("following")} className="hover:underline"><b>{formatCount(user.followingCount)}</b> Following</button>
                <button onClick={() => setNetworkList("followers")} className="hover:underline"><b>{formatCount(user.followersCount)}</b> Followers</button>
              </div>
            ) : null}
          </div>
        </section>

        <div className="grid grid-cols-5 border-y border-slate-200 text-center text-sm font-semibold dark:border-white/10">
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
              {...reactionState(profileData.pinned.id)}
              onOpen={() => onOpenPost(profileData.pinned?.id || "")}
              onProfile={() => onOpenProfile(user.id)}
              onLike={() => onLikePost(profileData.pinned?.id || "")}
              onComment={() => onOpenPost(profileData.pinned?.id || "")}
              onRepost={() => onRepostPost(profileData.pinned?.id || "")}
              onBookmark={() => onBookmarkPost(profileData.pinned?.id || "")}
            />
          </section>
        ) : null}

        <section className="px-4 py-6">
          {activeTab === "Canvas" ? (
            <div className={canvasFullscreen ? "fixed inset-0 z-[55] overflow-hidden bg-[#f5f5f7] dark:bg-[#050505]" : "relative h-[70vh] min-h-[480px] overflow-hidden rounded-3xl border border-slate-200 shadow-glass dark:border-white/10"}>
              <button onClick={() => setCanvasFullscreen((value) => !value)} className="absolute right-3 top-3 z-30 grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white/88 shadow-glass backdrop-blur dark:border-white/10 dark:bg-slate-950/88" aria-label="Toggle profile canvas fullscreen">
                {canvasFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              {canvasFullscreen ? <button onClick={() => setCanvasFullscreen(false)} className="absolute left-3 top-3 z-30 rounded-xl border border-slate-200 bg-white/88 px-3 py-2 text-sm font-bold shadow-glass backdrop-blur dark:border-white/10 dark:bg-slate-950/88">Back to profile</button> : null}
              <CanvasFeed posts={profileData.userPosts} users={users} reactions={reactions} currentUserId={currentUserId} sortMode="newest" feedStyle="classic" view={profileCanvasView} onViewChange={setProfileCanvasView} onOpenPost={onOpenPost} onOpenProfile={onOpenProfile} onLikePost={onLikePost} onRepostPost={onRepostPost} onBookmarkPost={onBookmarkPost} blocks={blocks} mutes={mutes} className="h-full min-h-full" />
            </div>
          ) : activeTab === "Media" ? (
            <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 md:grid-cols-3">
              {profileData.mediaPosts.map((post) => (
                <button key={post.id} onClick={() => onOpenPost(post.id)} className="aspect-[4/5] overflow-hidden rounded-2xl bg-slate-100 dark:bg-white/10">
                  <img className="h-full w-full object-cover" src={post.imageUrl || post.thumbnailUrl} alt="" />
                </button>
              ))}
              {!profileData.mediaPosts.length ? <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-white/15">No media yet.</p> : null}
            </div>
          ) : (
            <div className="mx-auto grid max-w-[760px] justify-items-center gap-4 sm:grid-cols-2">
              {visiblePosts.map((post) => (
                <div key={post.id} className="space-y-2">
                  {post.authorId !== user.id ? <p className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-300">Reposted by @{user.username}</p> : null}
                  <PostCard post={post} author={users.find((candidate) => candidate.id === post.authorId) || user} {...reactionState(post.id)} onOpen={() => onOpenPost(post.id)} onProfile={() => onOpenProfile(post.authorId)} onLike={() => onLikePost(post.id)} onComment={() => onOpenPost(post.id)} onRepost={() => onRepostPost(post.id)} onBookmark={() => onBookmarkPost(post.id)} />
                </div>
              ))}
              {!visiblePosts.length ? <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-white/15">Nothing here yet.</p> : null}
            </div>
          )}
        </section>
      </div>
      {editing ? <EditProfileDialog user={user} onClose={() => setEditing(false)} onSave={onUpdateProfile} onUpdatePassword={onUpdatePassword} onRequestVerification={onRequestVerification} /> : null}
      {viewer ? <FullscreenMedia src={viewer.src} label={viewer.label} shape={viewer.shape} onClose={() => setViewer(undefined)} /> : null}
      {networkList ? (
        <div onMouseDown={() => setNetworkList(undefined)} className="fixed inset-0 z-[75] grid place-items-end bg-slate-950/45 p-0 backdrop-blur-sm sm:place-items-center sm:p-4">
          <section onMouseDown={(event) => event.stopPropagation()} className="modal-enter thin-scrollbar max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-white/10 dark:bg-slate-950 sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-black">{networkList === "followers" ? "Followers" : "Following"}</p>
              <button onClick={() => setNetworkList(undefined)} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close network list"><X size={19} /></button>
            </div>
            <div className="space-y-2">
              {users
                .filter((candidate) => networkList === "followers"
                  ? follows.some((follow) => follow.followingId === user.id && follow.followerId === candidate.id)
                  : follows.some((follow) => follow.followerId === user.id && follow.followingId === candidate.id))
                .map((candidate) => (
                  <button key={candidate.id} onClick={() => { setNetworkList(undefined); onOpenProfile(candidate.id); }} className="flex w-full items-center gap-3 rounded-2xl p-3 text-left hover:bg-slate-100 dark:hover:bg-white/10">
                    <img className="h-11 w-11 rounded-full object-cover" src={candidate.avatarUrl} alt="" />
                    <span className="min-w-0">
                      <span className="flex items-center gap-1 truncate text-sm font-bold">{candidate.displayName}<VerifiedBadge verified={candidate.verified} size={14} /></span>
                      <span className="block truncate text-xs text-slate-500">@{candidate.username}</span>
                    </span>
                  </button>
                ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
