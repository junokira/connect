import { BadgeCheck, Bookmark, CalendarDays, Heart, ImagePlus, Link as LinkIcon, Loader2, MapPin, Maximize2, Menu, Minimize2, Pencil, Repeat2, Settings, Share2, Shield, Upload, X } from "lucide-react";
import { FormEvent, MouseEvent, TouchEvent, WheelEvent, useEffect, useMemo, useRef, useState } from "react";
import { CanvasView, Follow, Post, PostReaction, ProfileUpdate, User, UserBlock, UserMute, VerificationRequestStatus } from "../types";
import { normalizeExternalUrl } from "../utils/media";
import { formatCount, formatDate } from "../utils/posts";
import { shareProfileCard } from "../utils/shareCard";
import { CanvasFeed } from "./CanvasFeed";
import { PostCard } from "./PostCard";
import { VerifiedBadge } from "./VerifiedBadge";

type Props = {
  user?: User;
  currentUserId: string;
  currentUserEmail: string;
  verificationStatus: VerificationRequestStatus;
  verificationReason: string;
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
  onUpdateEmail: (email: string) => Promise<{ email: string; pendingEmail: string }>;
  onRequestVerification: (reason?: string) => Promise<void>;
  onShareProfile?: (user: User) => void;
  onBlockUser?: (id: string) => void;
  onUnblockUser?: (id: string) => void;
  onMuteUser?: (id: string) => void;
  onUnmuteUser?: (id: string) => void;
  onReportUser?: (id: string) => void;
  onCanvasFullscreenChange?: (fullscreen: boolean) => void;
};

type ProfileTab = "Canvas" | "Posts" | "Media" | "Likes" | "Saved" | "Reposts";

function EditProfileDialog({ user, currentEmail, onClose, onSave, onUpdatePassword, onUpdateEmail, onRequestVerification }: { user: User; currentEmail: string; onClose: () => void; onSave: (profile: ProfileUpdate) => Promise<void>; onUpdatePassword: (password: string) => Promise<void>; onUpdateEmail: (email: string) => Promise<{ email: string; pendingEmail: string }>; onRequestVerification: (reason?: string) => Promise<void> }) {
  const [form, setForm] = useState<ProfileUpdate>({
    displayName: user.displayName,
    username: user.username,
    avatarUrl: user.avatarUrl,
    bannerUrl: user.bannerUrl,
    bio: user.bio,
    location: user.location,
    website: user.website,
    featuredTitle: user.featuredTitle,
    featuredDescription: user.featuredDescription,
    featuredLink: user.featuredLink,
    featuredBannerUrl: user.featuredBannerUrl,
    featuredCoverUrl: user.featuredCoverUrl
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");
  const [featuredBannerPreview, setFeaturedBannerPreview] = useState("");
  const [featuredCoverPreview, setFeaturedCoverPreview] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState("");
  const [email, setEmail] = useState(currentEmail);
  const [emailStatus, setEmailStatus] = useState("");
  const [verificationReason, setVerificationReason] = useState("");
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
    if (!form.featuredBannerFile) {
      setFeaturedBannerPreview("");
      return;
    }
    const url = URL.createObjectURL(form.featuredBannerFile);
    setFeaturedBannerPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [form.featuredBannerFile]);

  useEffect(() => {
    if (!form.featuredCoverFile) {
      setFeaturedCoverPreview("");
      return;
    }
    const url = URL.createObjectURL(form.featuredCoverFile);
    setFeaturedCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [form.featuredCoverFile]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const update = (key: keyof ProfileUpdate, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const updateFile = (key: "avatarFile" | "bannerFile" | "featuredBannerFile" | "featuredCoverFile", file?: File) => setForm((current) => ({ ...current, [key]: file }));

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

  const saveEmail = async () => {
    const nextEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    if (nextEmail === currentEmail.trim().toLowerCase()) {
      setEmailStatus("This is already your account email.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      setEmailStatus("");
      const result = await onUpdateEmail(nextEmail);
      if (result.pendingEmail) {
        setEmailStatus("Confirmation sent. Open the email from Supabase to finish changing your CONNECT login email.");
      } else {
        setEmailStatus("Email updated.");
      }
    } catch (emailError) {
      setError(emailError instanceof Error ? emailError.message : "Could not update email.");
    } finally {
      setSaving(false);
    }
  };

  const requestVerification = async () => {
    try {
      setSaving(true);
      setError("");
      await onRequestVerification(verificationReason);
      setVerificationStatus("Verification request sent.");
    } catch (verificationError) {
      setError(verificationError instanceof Error ? verificationError.message : "Could not request verification.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div onPointerDown={(event) => { if (event.target === event.currentTarget) onClose(); }} className="fixed inset-0 z-[60] grid place-items-end bg-slate-950/45 p-0 backdrop-blur-sm sm:place-items-center sm:p-4">
      <form onSubmit={submit} onPointerDown={(event) => event.stopPropagation()} className="modal-scroll-pane thin-scrollbar flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0f1115] sm:rounded-[28px]">
        <div className="modal-scroll-pane min-h-0 flex-1 overflow-y-auto p-5 pb-6">
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
          <p className="text-sm font-bold">Spotlight</p>
          <p className="mt-1 text-sm text-slate-500">Feature your current work, drop, project, or link on your profile.</p>
          <div className="mt-3 overflow-hidden rounded-3xl bg-slate-100 dark:bg-white/10">
            <div className="aspect-[3/1] bg-slate-200 dark:bg-white/10">
              {(featuredBannerPreview || form.featuredBannerUrl) ? <img className="h-full w-full object-cover" src={featuredBannerPreview || form.featuredBannerUrl} alt="" /> : null}
            </div>
            <div className="-mt-10 flex items-end gap-3 p-4">
              <div className="h-24 w-24 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-xl dark:border-[#0f1115] dark:bg-[#0f1115]">
                {(featuredCoverPreview || form.featuredCoverUrl) ? <img className="h-full w-full object-cover" src={featuredCoverPreview || form.featuredCoverUrl} alt="" /> : null}
              </div>
              <div className="flex flex-wrap gap-2 pb-1">
                <label className="cursor-pointer rounded-full bg-white/90 px-3 py-2 text-xs font-bold shadow-glass dark:bg-slate-950/80">
                  Banner image
                  <input className="sr-only" type="file" accept="image/*" onChange={(event) => updateFile("featuredBannerFile", event.target.files?.[0])} />
                </label>
                <label className="cursor-pointer rounded-full bg-white/90 px-3 py-2 text-xs font-bold shadow-glass dark:bg-slate-950/80">
                  Cover image
                  <input className="sr-only" type="file" accept="image/*" onChange={(event) => updateFile("featuredCoverFile", event.target.files?.[0])} />
                </label>
              </div>
            </div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input value={form.featuredTitle} onChange={(event) => update("featuredTitle", event.target.value)} className="rounded-2xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-teal-500 dark:border-white/10" placeholder="Title" />
            <input value={form.featuredLink} onChange={(event) => update("featuredLink", event.target.value)} className="rounded-2xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-teal-500 dark:border-white/10" placeholder="External link" />
          </div>
          <textarea value={form.featuredDescription} onChange={(event) => update("featuredDescription", event.target.value)} className="mt-3 min-h-20 w-full resize-none rounded-2xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-teal-500 dark:border-white/10" placeholder="Short description" />
        </div>
        <div className="mt-4 rounded-2xl border border-slate-200 p-4 dark:border-white/10">
          <p className="text-sm font-bold">Email</p>
          <p className="mt-1 text-sm text-slate-500">Change the email you use to sign in. You may need to confirm the new address before it takes effect.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-2xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-teal-500 dark:border-white/10" placeholder="you@example.com" autoComplete="email" />
            <button type="button" disabled={saving || !email.trim()} onClick={() => void saveEmail()} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-50 dark:bg-white dark:text-slate-950">Change email</button>
          </div>
          {emailStatus ? <p className="mt-2 text-sm font-semibold text-emerald-600 dark:text-emerald-300">{emailStatus}</p> : null}
        </div>
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
            <>
              <textarea value={verificationReason} onChange={(event) => setVerificationReason(event.target.value)} className="mt-3 min-h-20 w-full resize-none rounded-2xl border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none focus:border-teal-500 dark:border-white/10" placeholder="Why should this profile be verified?" />
              <button type="button" disabled={saving} onClick={() => void requestVerification()} className="mt-3 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold disabled:opacity-50 dark:border-white/15">Request verification</button>
            </>
          ) : null}
          {verificationStatus ? <p className="mt-2 text-sm font-semibold text-emerald-600 dark:text-emerald-300">{verificationStatus}</p> : null}
        </div>
        {error ? <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-400/10 dark:text-rose-200">{error}</p> : null}
        </div>
        <div className="z-10 grid shrink-0 gap-2 border-t border-slate-200 bg-white/94 p-4 pb-[max(16px,calc(env(safe-area-inset-bottom)+96px))] backdrop-blur dark:border-white/10 dark:bg-[#0f1115]/94 sm:grid-cols-2 sm:pb-4">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold disabled:opacity-50 dark:border-white/15">Cancel</button>
        <button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 font-bold text-white disabled:opacity-50 dark:bg-white dark:text-slate-950">
          {saving ? <Loader2 className="animate-spin" size={17} /> : <Pencil size={17} />}
          {saving ? "Saving..." : "Save profile"}
        </button>
        </div>
      </form>
    </div>
  );
}

function VerificationSheet({ user, isOwnProfile, status, reason, onClose, onRequestVerification }: { user: User; isOwnProfile: boolean; status: VerificationRequestStatus; reason: string; onClose: () => void; onRequestVerification: (reason?: string) => Promise<void> }) {
  const [requestReason, setRequestReason] = useState(reason);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const derivedStatus = user.verified ? "approved" : status;
  const title = user.verified ? "Verified account" : derivedStatus === "pending" ? "Verification request pending" : "Request verification";

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const submit = async () => {
    try {
      setSaving(true);
      setError("");
      await onRequestVerification(requestReason);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not request verification.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div onPointerDown={(event) => { if (event.target === event.currentTarget) onClose(); }} className="fixed inset-0 z-[76] grid place-items-end bg-slate-950/45 p-0 backdrop-blur-sm sm:place-items-center sm:p-4">
      <section onPointerDown={(event) => event.stopPropagation()} className="modal-enter modal-scroll-pane w-full max-w-md rounded-t-[28px] border border-slate-200 bg-white p-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-2xl dark:border-white/10 dark:bg-[#0f1115] sm:rounded-[28px]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#007aff]/10 text-[#007aff]">
              <BadgeCheck size={24} />
            </span>
            <div>
              <h2 className="text-lg font-black">{title}</h2>
              <p className="text-sm text-slate-500">@{user.username}</p>
            </div>
          </div>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close verification details"><X size={19} /></button>
        </div>
        <p className="mt-5 text-sm leading-6 text-slate-600 dark:text-slate-300">Verification on CONNECT means this account has been manually recognized as the authentic presence for a person, artist, company, or project.</p>
        {user.verified ? <p className="mt-4 rounded-2xl bg-blue-50 p-3 text-sm font-semibold text-blue-700 dark:bg-blue-400/10 dark:text-blue-200">Verified account</p> : null}
        {!user.verified && derivedStatus === "pending" ? <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-700 dark:bg-amber-400/10 dark:text-amber-200">Verification request pending</p> : null}
        {isOwnProfile && !user.verified && derivedStatus !== "pending" ? (
          <div className="mt-5">
            <label className="text-sm font-bold">Request message</label>
            <textarea value={requestReason} onChange={(event) => setRequestReason(event.target.value)} className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none focus:border-teal-500 dark:border-white/10" placeholder="Tell us what this account represents." />
            {error ? <p className="mt-3 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-400/10 dark:text-rose-200">{error}</p> : null}
            <button disabled={saving} onClick={() => void submit()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-50 dark:bg-white dark:text-slate-950">
              {saving ? <Loader2 className="animate-spin" size={16} /> : null}
              Submit request
            </button>
          </div>
        ) : null}
      </section>
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

export function ProfileView({ user, currentUserId, currentUserEmail, verificationStatus, verificationReason, users, posts, reactions, follows, blocks = [], mutes = [], onClose, onOpenProfile, onOpenPost, onLikePost, onRepostPost, onBookmarkPost, onFollowUser, onUpdateProfile, onUpdatePassword, onUpdateEmail, onRequestVerification, onShareProfile, onBlockUser, onUnblockUser, onReportUser, onCanvasFullscreenChange }: Props) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("Canvas");
  const [editing, setEditing] = useState(false);
  const [viewer, setViewer] = useState<{ src: string; label: string; shape: "avatar" | "banner" } | undefined>();
  const [networkList, setNetworkList] = useState<"followers" | "following" | undefined>();
  const [menuOpen, setMenuOpen] = useState(false);
  const [safetyMenuOpen, setSafetyMenuOpen] = useState(false);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [canvasFullscreen, setCanvasFullscreen] = useState(false);
  const [shareCardBusy, setShareCardBusy] = useState(false);
  const [embeddedCanvasView, setEmbeddedCanvasView] = useState<CanvasView>({ x: 0, y: 0, zoom: 0.95 });
  const [fullscreenCanvasView, setFullscreenCanvasView] = useState<CanvasView>({ x: 0, y: 0, zoom: 0.95 });
  const embeddedCanvasViewRef = useRef(embeddedCanvasView);
  const touchStartRef = useRef<{ x: number; y: number; canClose: boolean } | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !canvasFullscreen) onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [canvasFullscreen, onClose]);

  useEffect(() => {
    if (!canvasFullscreen) return undefined;
    const closeFullscreenOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCanvasFullscreen(false);
    };
    window.addEventListener("keydown", closeFullscreenOnEscape);
    return () => window.removeEventListener("keydown", closeFullscreenOnEscape);
  }, [canvasFullscreen]);

  useEffect(() => {
    onCanvasFullscreenChange?.(canvasFullscreen);
    document.body.classList.toggle("canvas-fs-active", canvasFullscreen);
    if (!canvasFullscreen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove("canvas-fs-active");
      onCanvasFullscreenChange?.(false);
    };
  }, [canvasFullscreen, onCanvasFullscreenChange]);

  useEffect(() => {
    if (!networkList) return undefined;
    const previousOverflow = document.body.style.overflow;
    const scroller = scrollerRef.current;
    const previousScrollerOverflow = scroller?.style.overflow || "";
    document.body.style.overflow = "hidden";
    if (scroller) scroller.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      if (scroller) scroller.style.overflow = previousScrollerOverflow;
    };
  }, [networkList]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: 0, behavior: "auto" });
    setActiveTab("Canvas");
    setEmbeddedCanvasView({ x: 0, y: 0, zoom: 0.95 });
    setFullscreenCanvasView({ x: 0, y: 0, zoom: 0.95 });
  }, [user?.id]);

  useEffect(() => {
    if (canvasFullscreen) return;
    setEmbeddedCanvasView({ x: 0, y: 0, zoom: 0.95 });
  }, [canvasFullscreen]);

  useEffect(() => {
    embeddedCanvasViewRef.current = embeddedCanvasView;
  }, [embeddedCanvasView]);

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
  const streakLabel = user.postStreak >= 30 ? "Legendary" : user.postStreak >= 7 ? "Blazing" : "On Fire";
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
  const visibleTabs: ProfileTab[] = isOwnProfile ? ["Canvas", "Posts", "Media", "Likes", "Saved"] : ["Canvas", "Posts", "Media", "Likes"];
  const websiteUrl = user.website ? normalizeExternalUrl(user.website) : "";
  const featuredUrl = user.featuredLink ? normalizeExternalUrl(user.featuredLink) : "";
  const hasFeatured = Boolean(user.featuredTitle || user.featuredDescription || user.featuredLink || user.featuredBannerUrl || user.featuredCoverUrl);
  const discoveryUsers = users
    .filter((candidate) => candidate.id !== currentUserId && candidate.id !== user.id && !blocks.some((block) => block.blockedId === candidate.id))
    .slice(0, 6);
  const touchStart = (event: TouchEvent) => {
    const touch = event.touches[0];
    const target = event.target as HTMLElement;
    if (target.closest("[data-network-sheet]")) {
      touchStartRef.current = null;
      return;
    }
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, canClose: !target.closest(".canvas-viewport,button,a,input,textarea,select") && (scrollerRef.current?.scrollTop || 0) <= 8 };
  };
  const touchEnd = (event: TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start?.canClose) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = Math.abs(touch.clientY - start.y);
    if (deltaX > 110 && deltaX > deltaY * 2.2) onClose();
  };
  const stopFullscreenControlEvent = (event: MouseEvent | TouchEvent) => {
    event.stopPropagation();
  };
  const openCanvasFullscreen = (event?: MouseEvent<HTMLButtonElement> | TouchEvent<HTMLButtonElement>) => {
    event?.preventDefault();
    event?.stopPropagation();
    setMenuOpen(false);
    setSafetyMenuOpen(false);
    setVerificationOpen(false);
    setFullscreenCanvasView({ x: 0, y: 0, zoom: 0.95 });
    setCanvasFullscreen(true);
  };
  const closeCanvasFullscreen = (event?: MouseEvent<HTMLButtonElement> | TouchEvent<HTMLButtonElement>) => {
    event?.preventDefault();
    event?.stopPropagation();
    setCanvasFullscreen(false);
    setFullscreenCanvasView({ x: 0, y: 0, zoom: 0.95 });
    setEmbeddedCanvasView({ x: 0, y: 0, zoom: 0.95 });
  };
  const shareProfile = () => {
    navigator.vibrate?.(8);
    onShareProfile?.(user);
  };
  const shareStoryCard = async () => {
    try {
      setShareCardBusy(true);
      navigator.vibrate?.([6, 18, 6]);
      await shareProfileCard(user, `${window.location.origin}/u/${encodeURIComponent(user.username)}`);
    } finally {
      setShareCardBusy(false);
    }
  };
  const passPreviewWheelToPage = (event: WheelEvent<HTMLDivElement>) => {
    if (canvasFullscreen) return;
    if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
    event.preventDefault();
    scrollerRef.current?.scrollBy({ top: event.deltaY, behavior: "auto" });
  };

  return (
    <div ref={scrollerRef} data-scroll-root="profile" onTouchStart={touchStart} onTouchEnd={touchEnd} className="modal-enter modal-scroll-pane fixed inset-0 z-20 overflow-y-auto bg-[#f5f5f7] pb-[max(96px,calc(env(safe-area-inset-bottom)+80px))] text-slate-950 dark:bg-[#050505] dark:text-white lg:left-72 lg:pb-0">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-slate-950/90">
        <div className="min-w-0">
          <p className="flex items-center gap-1 font-bold">
            <span className="truncate">{user.displayName}</span>
            {(user.verified || isOwnProfile) ? (
              <button onClick={() => setVerificationOpen(true)} className="rounded-full text-slate-400 hover:text-[#007aff] dark:text-slate-500 dark:hover:text-[#64d2ff]" aria-label="Open verification details">
                {user.verified ? <VerifiedBadge verified size={15} /> : <BadgeCheck size={15} strokeWidth={2.4} />}
              </button>
            ) : null}
          </p>
          <p className="text-sm text-slate-500">{profileData.userPosts.length} posts</p>
        </div>
        <div className="relative flex shrink-0 items-center gap-1 rounded-2xl border border-slate-200 bg-white/70 p-1 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
          <button onClick={() => { setSafetyMenuOpen(false); setMenuOpen((open) => !open); }} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Profile menu">
            <Menu size={20} />
          </button>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close profile">
            <X size={20} />
          </button>
          {menuOpen ? (
            <div className="absolute right-0 top-12 z-[74] w-64 rounded-3xl border border-slate-200 bg-white/95 p-2 text-sm shadow-2xl backdrop-blur dark:border-white/10 dark:bg-slate-950/95">
              <button onClick={() => { setActiveTab("Media"); setMenuOpen(false); }} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left font-semibold hover:bg-slate-100 dark:hover:bg-white/10"><ImagePlus size={17} /> Media</button>
              <button onClick={() => { setActiveTab("Reposts"); setMenuOpen(false); }} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left font-semibold hover:bg-slate-100 dark:hover:bg-white/10"><Repeat2 size={17} /> Reposts</button>
              <button onClick={() => { shareProfile(); setMenuOpen(false); }} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left font-semibold hover:bg-slate-100 dark:hover:bg-white/10"><Share2 size={17} /> Share profile</button>
              <button onClick={() => { void shareStoryCard(); setMenuOpen(false); }} disabled={shareCardBusy} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left font-semibold hover:bg-slate-100 disabled:opacity-60 dark:hover:bg-white/10"><ImagePlus size={17} /> Share story card</button>
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
      <div className="mx-auto max-w-5xl pb-[max(96px,calc(env(safe-area-inset-bottom)+80px))]">
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
                <>
                  <button onClick={() => setEditing(true)} className="rounded-full border border-slate-300 px-5 py-2 text-sm font-bold hover:bg-slate-100 dark:border-white/15 dark:hover:bg-white/10">Edit profile</button>
                  <button onClick={() => setVerificationOpen(true)} className="grid h-10 w-10 place-items-center rounded-full border border-slate-300 hover:bg-slate-100 dark:border-white/15 dark:hover:bg-white/10" aria-label="Verification settings"><BadgeCheck size={17} /></button>
                  <button onClick={shareProfile} className="grid h-10 w-10 place-items-center rounded-full border border-slate-300 hover:bg-slate-100 dark:border-white/15 dark:hover:bg-white/10" aria-label="Share profile"><Share2 size={17} /></button>
                </>
              ) : isBlocked ? (
                <button onClick={() => onUnblockUser?.(user.id)} className="rounded-full border border-slate-300 px-5 py-2 text-sm font-bold hover:bg-slate-100 dark:border-white/15 dark:hover:bg-white/10">Unblock</button>
              ) : (
                <button onClick={() => onFollowUser(user.id)} className={`rounded-full px-5 py-2 text-sm font-bold ${isFollowing ? "border border-slate-300 hover:bg-slate-100 dark:border-white/15 dark:hover:bg-white/10" : "bg-slate-950 text-white dark:bg-white dark:text-slate-950"}`}>{isFollowing ? "Following" : "Follow"}</button>
              )}
              {!isOwnProfile ? (
                <div className="relative">
                  <button onClick={() => { setMenuOpen(false); setSafetyMenuOpen((open) => !open); }} className="grid h-10 w-10 place-items-center rounded-full border border-slate-300 hover:bg-slate-100 dark:border-white/15 dark:hover:bg-white/10" aria-label="Profile safety menu"><Shield size={17} /></button>
                  {safetyMenuOpen ? (
                    <div className="absolute right-0 top-12 z-40 w-52 rounded-2xl border border-slate-200 bg-white p-2 text-sm shadow-2xl dark:border-white/10 dark:bg-slate-950">
                      <button onClick={() => { (isBlocked ? onUnblockUser : onBlockUser)?.(user.id); setSafetyMenuOpen(false); }} className="w-full rounded-xl px-3 py-2 text-left font-semibold hover:bg-slate-100 dark:hover:bg-white/10">{isBlocked ? "Unblock" : `Block @${user.username}`}</button>
                      <button onClick={() => { onReportUser?.(user.id); setSafetyMenuOpen(false); }} className="w-full rounded-xl px-3 py-2 text-left font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-400/10">Report user</button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
          <div className="mt-4">
            <h1 className="flex items-center gap-2 text-2xl font-black">
              {user.displayName}
              {(user.verified || isOwnProfile) ? (
                <button onClick={() => setVerificationOpen(true)} className="rounded-full text-slate-400 hover:text-[#007aff] dark:text-slate-500 dark:hover:text-[#64d2ff]" aria-label="Open verification details">
                  {user.verified ? <VerifiedBadge verified size={21} /> : <BadgeCheck size={21} strokeWidth={2.4} />}
                </button>
              ) : null}
            </h1>
            <p className="text-slate-500">@{user.username}</p>
            <p className="mt-3 max-w-2xl whitespace-pre-wrap leading-7 text-slate-700 dark:text-slate-200">{user.bio}</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
              {user.location ? <span className="flex items-center gap-1"><MapPin size={16} /> {user.location}</span> : null}
              {websiteUrl ? <a className="flex items-center gap-1 hover:text-slate-950 hover:underline dark:hover:text-white" href={websiteUrl} target="_blank" rel="noreferrer"><LinkIcon size={16} /> {user.website}</a> : null}
              <span className="flex items-center gap-1"><CalendarDays size={16} /> Joined {formatDate(user.createdAt)}</span>
            </div>
            {isOwnProfile ? (
              <div className="mt-3 flex flex-wrap items-center gap-5 text-sm">
                <button onClick={() => setNetworkList("following")} className="hover:underline"><b>{formatCount(user.followingCount)}</b> Following</button>
                <button onClick={() => setNetworkList("followers")} className="hover:underline"><b>{formatCount(user.followersCount)}</b> Followers</button>
                {user.postStreak >= 3 ? (
                  <span className={`streak-badge ${user.postStreak >= 7 ? "streak-badge-hot" : ""} rounded-full px-3 py-1 text-xs font-black text-white`}>
                    {user.postStreak >= 30 ? "⚡" : user.postStreak >= 7 ? "🔥🔥" : "🔥"} {user.postStreak} day {streakLabel}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        <div className={`grid ${isOwnProfile ? "grid-cols-5" : "grid-cols-4"} border-y border-slate-200 text-center text-sm font-semibold dark:border-white/10`}>
          {visibleTabs.map((tab) => (
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
            <div
              className={canvasFullscreen ? "fixed inset-0 z-[80] overflow-hidden bg-[#f5f5f7] dark:bg-[#050505]" : "relative h-[70vh] min-h-[480px] overflow-hidden rounded-3xl border border-slate-200 shadow-glass transition-all duration-300 ease-out dark:border-white/10"}
              style={canvasFullscreen ? { paddingBottom: "env(safe-area-inset-bottom)", paddingTop: "env(safe-area-inset-top)" } : undefined}
              role={canvasFullscreen ? "dialog" : undefined}
              aria-modal={canvasFullscreen ? "true" : undefined}
              aria-label={canvasFullscreen ? "Canvas fullscreen view" : undefined}
            >
              {canvasFullscreen ? (
                <button
                  onMouseDown={stopFullscreenControlEvent}
                  onTouchStart={stopFullscreenControlEvent}
                  onClick={(event) => {
                    closeCanvasFullscreen(event);
                  }}
                  className="pointer-events-auto absolute right-3 top-[calc(env(safe-area-inset-top)+12px)] z-[81] grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-white/88 text-slate-950 shadow-glass backdrop-blur dark:border-white/10 dark:bg-slate-950/88 dark:text-white"
                  aria-label="Close fullscreen canvas"
                >
                  <X size={18} />
                </button>
              ) : null}
              {!verificationOpen && !networkList ? <button
                onMouseDown={canvasFullscreen ? stopFullscreenControlEvent : undefined}
                onTouchStart={canvasFullscreen ? stopFullscreenControlEvent : undefined}
                onClick={(event) => {
                  if (canvasFullscreen) {
                    closeCanvasFullscreen(event);
                    return;
                  }
                  openCanvasFullscreen(event);
                }}
                className={`pointer-events-auto absolute z-[81] flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white/88 px-3 text-sm font-bold shadow-glass backdrop-blur dark:border-white/10 dark:bg-slate-950/88 ${canvasFullscreen ? "left-3 top-[calc(env(safe-area-inset-top)+12px)]" : "left-1/2 top-3 -translate-x-1/2"}`}
                aria-label={canvasFullscreen ? "Minimize profile canvas" : "Open profile canvas fullscreen"}
              >
                {canvasFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                <span>{canvasFullscreen ? "Minimize" : "Open canvas"}</span>
              </button> : null}
              <div className="h-full" onWheel={passPreviewWheelToPage}>
                <CanvasFeed posts={profileData.userPosts} users={users} reactions={reactions} currentUserId={currentUserId} sortMode="newest" feedStyle="gallery" view={canvasFullscreen ? fullscreenCanvasView : embeddedCanvasView} onViewChange={canvasFullscreen ? setFullscreenCanvasView : setEmbeddedCanvasView} onOpenPost={(id) => { closeCanvasFullscreen(); onOpenPost(id); }} onOpenProfile={onOpenProfile} onLikePost={onLikePost} onRepostPost={onRepostPost} onBookmarkPost={onBookmarkPost} blocks={blocks} mutes={mutes} className="h-full min-h-full" interactionMode={canvasFullscreen ? "full" : "horizontal"} showControls={canvasFullscreen} controlsClassName="left-1/2 top-[calc(env(safe-area-inset-top)+12px)] -translate-x-1/2" />
              </div>
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
        {hasFeatured ? (
          <section className="px-4 pb-6">
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-glass dark:border-white/10 dark:bg-[#111113]">
              <div className="relative aspect-[3/1] bg-slate-100 dark:bg-white/10">
                {user.featuredBannerUrl ? <img className="h-full w-full object-cover" src={user.featuredBannerUrl} alt="" loading="lazy" /> : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                <p className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-950 shadow-glass backdrop-blur">Spotlight</p>
              </div>
              <div className="flex flex-col gap-4 p-5 sm:-mt-16 sm:flex-row sm:items-end">
                <div className="relative mx-auto h-32 w-32 shrink-0 overflow-hidden rounded-3xl border-4 border-white bg-slate-100 shadow-2xl dark:border-[#111113] dark:bg-white/10 sm:mx-0">
                  {user.featuredCoverUrl ? <img className="h-full w-full object-cover" src={user.featuredCoverUrl} alt="" loading="lazy" /> : null}
                </div>
                <div className="relative min-w-0 flex-1 text-center sm:text-left">
                  <h2 className="text-2xl font-black">{user.featuredTitle || "Current work"}</h2>
                  {user.featuredDescription ? <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{user.featuredDescription}</p> : null}
                  {featuredUrl ? (
                    <a href={featuredUrl} target="_blank" rel="noreferrer" className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white dark:bg-white dark:text-slate-950 sm:mx-0">
                      Open link <LinkIcon size={15} />
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        ) : null}
        {discoveryUsers.length ? (
          <section className="px-4 pb-10">
            <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-glass dark:border-white/10 dark:bg-[#111113]">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-black">People to discover</h2>
                <span className="text-xs font-semibold text-slate-500">Suggested from CONNECT</span>
              </div>
              <div className="grid gap-2">
                {discoveryUsers.map((candidate) => {
                  const followingCandidate = follows.some((follow) => follow.followerId === currentUserId && follow.followingId === candidate.id);
                  return (
                    <div key={candidate.id} className="flex items-center gap-3 rounded-2xl p-2 hover:bg-slate-100 dark:hover:bg-white/10">
                      <button onClick={() => onOpenProfile(candidate.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        <img className="h-12 w-12 rounded-full object-cover" src={candidate.avatarUrl} alt="" />
                        <span className="min-w-0">
                          <span className="flex items-center gap-1 truncate text-sm font-bold">{candidate.displayName}<VerifiedBadge verified={candidate.verified} size={14} /></span>
                          <span className="block truncate text-xs text-slate-500">@{candidate.username}</span>
                        </span>
                      </button>
                      <button onClick={() => onFollowUser(candidate.id)} className={`rounded-full px-4 py-2 text-xs font-bold ${followingCandidate ? "border border-slate-300 dark:border-white/15" : "bg-slate-950 text-white dark:bg-white dark:text-slate-950"}`}>
                        {followingCandidate ? "Following" : "Follow"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}
      </div>
      {editing ? <EditProfileDialog user={user} currentEmail={currentUserEmail} onClose={() => setEditing(false)} onSave={onUpdateProfile} onUpdatePassword={onUpdatePassword} onUpdateEmail={onUpdateEmail} onRequestVerification={onRequestVerification} /> : null}
      {verificationOpen ? <VerificationSheet user={user} isOwnProfile={isOwnProfile} status={verificationStatus} reason={verificationReason} onClose={() => setVerificationOpen(false)} onRequestVerification={onRequestVerification} /> : null}
      {viewer ? <FullscreenMedia src={viewer.src} label={viewer.label} shape={viewer.shape} onClose={() => setViewer(undefined)} /> : null}
      {networkList ? (
        <div
          data-network-sheet
          onPointerDown={(event) => { if (event.target === event.currentTarget) setNetworkList(undefined); }}
          onTouchStart={(event) => event.stopPropagation()}
          onTouchEnd={(event) => event.stopPropagation()}
          className="fixed inset-0 z-[72] grid place-items-end overflow-hidden bg-slate-950/45 p-0 backdrop-blur-sm sm:place-items-center sm:p-4"
        >
          <section
            onPointerDown={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
            onTouchEnd={(event) => event.stopPropagation()}
            className="modal-enter modal-scroll-pane flex h-[min(90dvh,720px)] max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-16px)] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white p-4 pb-[max(16px,env(safe-area-inset-bottom))] shadow-2xl dark:border-white/10 dark:bg-slate-950 sm:rounded-3xl"
          >
            <div className="mb-4 flex shrink-0 items-center justify-between">
              <p className="text-lg font-black">{networkList === "followers" ? "Followers" : "Following"}</p>
              <button onClick={() => setNetworkList(undefined)} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close network list"><X size={19} /></button>
            </div>
            <div
              data-network-sheet
              className="thin-scrollbar modal-scroll-pane min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1"
              onWheel={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
              onTouchStart={(event) => event.stopPropagation()}
              onTouchEnd={(event) => event.stopPropagation()}
              style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y", overscrollBehavior: "contain" }}
            >
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
