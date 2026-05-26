import { Apple, Eye, EyeOff, ImageOff, LocateFixed, LogIn, Mail, Maximize2, Minus, Moon, Phone, Plus, Search, SlidersHorizontal, Sun, UserPlus, Volume2, VolumeX, X } from "lucide-react";
import { FormEvent, TouchEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CanvasFeed } from "./components/CanvasFeed";
import { ActivityView as NotificationsActivityView } from "./components/ActivityView";
import { Composer } from "./components/Composer";
import { AdminDashboard } from "./components/AdminDashboard";
import { MobileNav } from "./components/MobileNav";
import { PostCard } from "./components/PostCard";
import { PostModal } from "./components/PostModal";
import { ProfileView } from "./components/ProfileView";
import { Sidebar } from "./components/Sidebar";
import { VerifiedBadge } from "./components/VerifiedBadge";
import { supabase } from "./lib/supabase";
import { useAppStore } from "./store/useAppStore";
import { FeedScope, FeedStyle, Post, SortMode, User } from "./types";
import { playNotification, unlockAudio } from "./utils/audio";
import { CANVAS_CARD_CENTER_X, CANVAS_CARD_CENTER_Y } from "./utils/canvasLayout";
import { getYoutubeThumbnail } from "./utils/media";
import { getFilteredPosts } from "./utils/posts";

// Z-INDEX LAYERS
// 10  - sticky headers / canvas controls
// 20  - page-level overlays (ProfileView)
// 30  - app chrome (header)
// 50  - drawers / panels (AdjustPanel, Composer)
// 60  - modals (PostModal)
// 70  - sub-modals / image viewers
// 80  - fullscreen takeovers (canvas fullscreen)
// 90  - system toasts / alerts (future)

const sortOptions: { value: SortMode; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "most-liked", label: "Most liked" },
  { value: "most-commented", label: "Most commented" },
  { value: "most-reposted", label: "Most reposted" },
  { value: "trending", label: "Trending" },
  { value: "media-only", label: "Media only" },
  { value: "text-only", label: "Text only" },
  { value: "photos-only", label: "Photos only" },
  { value: "videos-only", label: "Videos only" }
];

const feedStyles: { value: FeedStyle; label: string }[] = [
  { value: "classic", label: "Classic" },
  { value: "signal", label: "Signal Clusters" },
  { value: "gallery", label: "Gallery Flow" },
  { value: "orbit", label: "Orbit" },
  { value: "mosaic", label: "Mosaic Boards" }
];

const feedScopes: { value: FeedScope; label: string }[] = [
  { value: "everyone", label: "Everyone" },
  { value: "following", label: "Following" },
  { value: "liked", label: "Liked posts" },
  { value: "liked-media", label: "Liked media" },
  { value: "liked-photos", label: "Liked photos" },
  { value: "liked-videos", label: "Liked videos" }
];

function AuthGate() {
  const signIn = useAppStore((state) => state.signIn);
  const signUp = useAppStore((state) => state.signUp);
  const requestMagicLink = useAppStore((state) => state.requestMagicLink);
  const requestPasswordReset = useAppStore((state) => state.requestPasswordReset);
  const requestPhoneOtp = useAppStore((state) => state.requestPhoneOtp);
  const signInWithSocialProvider = useAppStore((state) => state.signInWithSocialProvider);
  const loading = useAppStore((state) => state.loading);
  const error = useAppStore((state) => state.error);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [status, setStatus] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setStatus("");
    if (mode === "signin") {
      void signIn(email, password);
      return;
    }
    void (async () => {
      const signedIn = await signUp(email, password, {
        displayName,
        username,
        bio,
        location: "",
        website: "",
        avatarUrl: undefined,
        bannerUrl
      });
      if (!signedIn) setStatus("Confirmation email sent. Open it on this device or browser, then CONNECT will finish signing you in.");
    })();
  };

  const sendLink = async () => {
    setStatus("");
    try {
      await requestMagicLink(email);
      setStatus("Magic link sent. Check your email, then return here after confirmation.");
    } catch {
      setStatus("");
    }
  };

  const sendPhone = async () => {
    setStatus("");
    try {
      await requestPhoneOtp(phone);
      setStatus("Phone sign-in requested. Delivery depends on Supabase SMS provider configuration.");
    } catch {
      setStatus("");
    }
  };

  const resetPassword = async () => {
    setStatus("");
    try {
      await requestPasswordReset(email);
      setStatus("Password reset sent. Open the email, then set a new password in CONNECT.");
    } catch {
      setStatus("");
    }
  };

  return (
    <main className="h-[100dvh] overflow-y-auto bg-[#f5f5f7] p-4 dark:bg-[#050505]">
      <form onSubmit={submit} className="mx-auto my-4 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-glass dark:border-white/10 dark:bg-slate-950 sm:my-10">
        <p className="mb-1 text-2xl font-black text-slate-950 dark:text-white">CONNECT</p>
        <p className="mb-5 text-sm text-slate-500">Step into AWAKEN CULT's spatial social world.</p>
        <div className="mb-5 grid grid-cols-2 rounded-2xl bg-slate-100 p-1 dark:bg-white/10">
          <button type="button" onClick={() => setMode("signin")} className={`rounded-xl px-3 py-2 text-sm font-bold ${mode === "signin" ? "bg-white shadow-sm dark:bg-slate-900" : "text-slate-500"}`}>Sign in</button>
          <button type="button" onClick={() => setMode("signup")} className={`rounded-xl px-3 py-2 text-sm font-bold ${mode === "signup" ? "bg-white shadow-sm dark:bg-slate-900" : "text-slate-500"}`}>Sign up</button>
        </div>
        {mode === "signup" ? (
          <>
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Display name</span>
                <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-teal-500 dark:border-white/10" placeholder="Your name" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Username</span>
                <input value={username} onChange={(event) => setUsername(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-teal-500 dark:border-white/10" placeholder="calvin" />
              </label>
            </div>
            <label className="mb-2 block text-sm font-semibold">Bio</label>
            <textarea value={bio} onChange={(event) => setBio(event.target.value)} className="mb-4 min-h-20 w-full resize-none rounded-2xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-teal-500 dark:border-white/10" placeholder="A little about you" />
            <label className="mb-2 block text-sm font-semibold">Banner URL</label>
            <input value={bannerUrl} onChange={(event) => setBannerUrl(event.target.value)} className="mb-4 w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-teal-500 dark:border-white/10" placeholder="Optional" />
          </>
        ) : null}
        <label className="mb-2 block text-sm font-semibold">Email</label>
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mb-4 w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-teal-500 dark:border-white/10" />
        <label className="mb-2 block text-sm font-semibold">Password</label>
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mb-4 w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-teal-500 dark:border-white/10" />
        {error ? <p className="mb-4 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-400/10 dark:text-rose-200">{error}</p> : null}
        {status ? <p className="mb-4 rounded-2xl bg-teal-50 p-3 text-sm text-teal-700 dark:bg-teal-400/10 dark:text-teal-200">{status}</p> : null}
        <button disabled={loading || !email || !password} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-slate-950">
          {mode === "signup" ? <UserPlus size={18} /> : <LogIn size={18} />}
          {loading ? "Connecting..." : mode === "signup" ? "Create account" : "Sign in"}
        </button>
        {mode === "signin" ? (
          <button type="button" disabled={!email || loading} onClick={() => void resetPassword()} className="mt-3 w-full text-center text-sm font-bold text-[#007aff] disabled:opacity-50">
            Forgot password?
          </button>
        ) : null}
        <div className="my-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-xs font-bold uppercase text-slate-400">
          <span className="h-px bg-slate-200 dark:bg-white/10" /> Or <span className="h-px bg-slate-200 dark:bg-white/10" />
        </div>
        <div className="grid gap-2">
          <button type="button" disabled={!email || loading} onClick={() => void sendLink()} className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold disabled:opacity-50 dark:border-white/10">
            <Mail size={17} /> Email magic link
          </button>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <input value={phone} onChange={(event) => setPhone(event.target.value)} className="rounded-2xl border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none focus:border-teal-500 dark:border-white/10" placeholder="+15555555555" />
            <button type="button" disabled={!phone || loading} onClick={() => void sendPhone()} className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold disabled:opacity-50 dark:border-white/10">
              <Phone size={16} /> Phone
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => void signInWithSocialProvider("google").catch(() => undefined)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold dark:border-white/10">Google</button>
            <button type="button" onClick={() => void signInWithSocialProvider("apple").catch(() => undefined)} className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold dark:border-white/10"><Apple size={16} /> Apple</button>
          </div>
        </div>
      </form>
    </main>
  );
}

function PublicSharedView({ post, author, profile, onSignIn }: { post?: Post; author?: User; profile?: User; onSignIn: () => void }) {
  return (
    <main className="min-h-[100dvh] bg-[#f5f5f7] p-4 text-slate-950 dark:bg-[#050505] dark:text-white">
      <div className="mx-auto max-w-xl py-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xl font-black">CONNECT</p>
            <p className="text-sm text-slate-500">Shared from AWAKEN CULT</p>
          </div>
          <button onClick={onSignIn} className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white dark:bg-white dark:text-slate-950">Sign in</button>
        </div>
        {profile ? (
          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-glass dark:border-white/10 dark:bg-[#111113]">
            <img className="aspect-[3/1] w-full object-cover" src={profile.bannerUrl} alt="" />
            <div className="p-5">
              <img className="-mt-16 h-24 w-24 rounded-full border-4 border-white bg-white object-cover shadow-xl dark:border-[#111113] dark:bg-[#111113]" src={profile.avatarUrl} alt="" />
              <h1 className="mt-3 flex items-center gap-2 text-2xl font-black">{profile.displayName}<VerifiedBadge verified={profile.verified} size={21} /></h1>
              <p className="text-slate-500">@{profile.username}</p>
              {profile.bio ? <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-700 dark:text-slate-200">{profile.bio}</p> : null}
            </div>
          </section>
        ) : null}
        {post && author ? (
          <PostCard
            post={post}
            author={author}
            onOpen={() => undefined}
            onProfile={() => undefined}
            onLike={() => undefined}
            onComment={() => undefined}
            onRepost={() => undefined}
            onBookmark={() => undefined}
            widthClass="w-full"
          />
        ) : null}
        {!profile && !post ? <p className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500 dark:border-white/15 dark:bg-[#111113]">This shared link is loading or no longer exists.</p> : null}
      </div>
    </main>
  );
}

function SearchBox({ compact = false, onFocus }: { compact?: boolean; onFocus?: () => void }) {
  const search = useAppStore((state) => state.search);
  const setSearch = useAppStore((state) => state.setSearch);

  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
      <input
        value={search}
        onFocus={onFocus}
        onChange={(event) => setSearch(event.target.value)}
        className={`h-11 w-full rounded-2xl border border-slate-200 bg-white/90 pl-10 pr-4 text-sm outline-none focus:border-slate-950 dark:border-white/10 dark:bg-slate-950/90 dark:focus:border-white ${compact ? "lg:w-80" : ""}`}
        placeholder="Search CONNECT"
      />
    </label>
  );
}

function AdjustPanel({
  open,
  onClose,
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  onLatest,
  onHide,
  feedScope,
  onFeedScopeChange,
  theme,
  onToggleTheme
}: {
  open: boolean;
  onClose: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onLatest: () => void;
  onHide: () => void;
  feedScope: FeedScope;
  onFeedScopeChange: (scope: FeedScope) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}) {
  const sortMode = useAppStore((state) => state.sortMode);
  const feedStyle = useAppStore((state) => state.feedStyle);
  const setSortMode = useAppStore((state) => state.setSortMode);
  const setFeedStyle = useAppStore((state) => state.setFeedStyle);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div onMouseDown={onClose} className="fixed inset-0 z-50 grid place-items-end bg-slate-950/35 p-0 backdrop-blur-sm sm:place-items-center sm:p-4">
      <section onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-xl rounded-t-[28px] border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#0f1115] sm:rounded-[28px]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-lg font-black">Adjust</p>
            <p className="text-sm text-slate-500">Tune the canvas without cluttering it.</p>
          </div>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close adjust panel">
            <X size={19} />
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="mb-2 block text-sm font-semibold">Canvas feed</span>
            <select value={feedScope} onChange={(event) => onFeedScopeChange(event.target.value as FeedScope)} className="h-12 w-full rounded-2xl border border-slate-200 bg-transparent px-3 text-sm font-medium outline-none dark:border-white/10">
              {feedScopes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label>
            <span className="mb-2 block text-sm font-semibold">Feed style</span>
            <select value={feedStyle} onChange={(event) => setFeedStyle(event.target.value as FeedStyle)} className="h-12 w-full rounded-2xl border border-slate-200 bg-transparent px-3 text-sm font-medium outline-none dark:border-white/10">
              {feedStyles.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label>
            <span className="mb-2 block text-sm font-semibold">Sort and filter</span>
            <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} className="h-12 w-full rounded-2xl border border-slate-200 bg-transparent px-3 text-sm font-medium outline-none dark:border-white/10">
              {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-5 rounded-3xl bg-slate-100 p-3 dark:bg-white/10">
          <div className="mb-3 flex items-center justify-between px-1">
            <span className="text-sm font-bold">Canvas zoom</span>
            <span className="text-sm font-semibold text-slate-500">{Math.round(zoom * 100)}%</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            <button onClick={onZoomOut} className="grid h-11 place-items-center rounded-2xl bg-white dark:bg-slate-950" aria-label="Zoom out"><Minus size={17} /></button>
            <button onClick={onZoomIn} className="grid h-11 place-items-center rounded-2xl bg-white dark:bg-slate-950" aria-label="Zoom in"><Plus size={17} /></button>
            <button onClick={onReset} className="grid h-11 place-items-center rounded-2xl bg-white dark:bg-slate-950" aria-label="Reset view"><Maximize2 size={17} /></button>
            <button onClick={onLatest} className="grid h-11 place-items-center rounded-2xl bg-white dark:bg-slate-950" aria-label="Latest posts"><LocateFixed size={17} /></button>
            <button onClick={onHide} className="grid h-11 place-items-center rounded-2xl bg-white dark:bg-slate-950" aria-label="Hide interface"><EyeOff size={17} /></button>
          </div>
        </div>
        <button onClick={onToggleTheme} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold dark:border-white/10">
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
      </section>
    </div>
  );
}

function SearchView({
  posts,
  users,
  reactionState,
  onOpenPost,
  onOpenProfile,
  onLikePost,
  onRepostPost,
  onBookmarkPost
}: {
  posts: ReturnType<typeof getFilteredPosts>;
  users: ReturnType<typeof useAppStore.getState>["users"];
  reactionState: (postId: string) => { liked: boolean; reposted: boolean; bookmarked: boolean };
  onOpenPost: (id: string) => void;
  onOpenProfile: (id: string) => void;
  onLikePost: (id: string) => void;
  onRepostPost: (id: string) => void;
  onBookmarkPost: (id: string) => void;
}) {
  const search = useAppStore((state) => state.search);
  const term = search.trim().toLowerCase();
  const matchedUsers = term
    ? users.filter((user) => [user.displayName, user.username, user.bio, user.location, user.website].join(" ").toLowerCase().includes(term)).slice(0, 8)
    : [];
  const hasSearch = Boolean(term);
  const hasResults = posts.length > 0 || matchedUsers.length > 0;

  return (
    <main className="thin-scrollbar h-full overflow-y-auto px-4 pb-28 pt-20 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 max-w-2xl">
          <h1 className="mb-3 text-3xl font-black">Search</h1>
          <SearchBox />
        </div>
        {matchedUsers.length ? (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-bold uppercase text-slate-400">Profiles</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {matchedUsers.map((user) => (
                <button key={user.id} onClick={() => onOpenProfile(user.id)} className="flex min-w-0 items-center gap-3 rounded-3xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-glass dark:border-white/10 dark:bg-[#111113]">
                  <img className="h-12 w-12 rounded-full object-cover" src={user.avatarUrl} alt="" />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1 truncate text-sm font-bold">
                      <span className="truncate">{user.displayName}</span>
                      <VerifiedBadge verified={user.verified} size={14} />
                    </span>
                    <span className="block truncate text-xs text-slate-500">@{user.username}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : null}
        {posts.length ? <h2 className="mb-3 text-sm font-bold uppercase text-slate-400">Posts</h2> : null}
        <div className="grid justify-items-center gap-4 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} author={users.find((user) => user.id === post.authorId) || users[0]} {...reactionState(post.id)} onOpen={() => onOpenPost(post.id)} onProfile={() => onOpenProfile(post.authorId)} onLike={() => onLikePost(post.id)} onComment={() => onOpenPost(post.id)} onRepost={() => onRepostPost(post.id)} onBookmark={() => onBookmarkPost(post.id)} />
          ))}
          {!hasResults ? <p className="rounded-3xl border border-dashed border-slate-300 p-8 text-sm text-slate-500 dark:border-white/15">{hasSearch ? "No posts or profiles match that search yet." : "Search posts, captions, usernames, display names, hashtags, and media types."}</p> : null}
        </div>
      </div>
    </main>
  );
}

function ExploreMediaTile({ post, preview, onOpen }: { post: ReturnType<typeof getFilteredPosts>[number]; preview: string; onOpen: () => void }) {
  const [failed, setFailed] = useState(false);
  return (
    <button onClick={onOpen} className="aspect-[4/5] overflow-hidden rounded-2xl bg-slate-100 text-left dark:bg-white/10">
      {preview && !failed ? (
        <img onError={() => setFailed(true)} className="h-full w-full object-cover" src={preview} alt="" loading="lazy" />
      ) : (
        <span className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center text-xs font-bold text-slate-500 dark:text-slate-300">
          <ImageOff size={22} />
          {post.type === "link" ? "Open link" : "Open media"}
        </span>
      )}
    </button>
  );
}

function ExploreView({
  posts,
  users,
  reactionState,
  onOpenPost,
  onOpenProfile,
  onLikePost,
  onRepostPost,
  onBookmarkPost
}: {
  posts: ReturnType<typeof getFilteredPosts>;
  users: ReturnType<typeof useAppStore.getState>["users"];
  reactionState: (postId: string) => { liked: boolean; reposted: boolean; bookmarked: boolean };
  onOpenPost: (id: string) => void;
  onOpenProfile: (id: string) => void;
  onLikePost: (id: string) => void;
  onRepostPost: (id: string) => void;
  onBookmarkPost: (id: string) => void;
}) {
  const trending = [...posts].sort((a, b) => b.likesCount + b.commentsCount * 2 + b.repostsCount * 3 - (a.likesCount + a.commentsCount * 2 + a.repostsCount * 3)).slice(0, 8);
  const media = posts.filter((post) => post.type !== "text").slice(0, 9);
  const people = users.slice(0, 6);
  const mediaPreview = (post: ReturnType<typeof getFilteredPosts>[number]) => post.imageUrl || post.thumbnailUrl || post.sourceThumb || getYoutubeThumbnail(post.videoUrl || post.sourceUrl || "");

  return (
    <main className="thin-scrollbar h-full overflow-y-auto px-4 pb-28 pt-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-black">Explore</h1>
          <p className="text-sm text-slate-500">Trending posts, media, and people across CONNECT.</p>
        </div>
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-bold uppercase text-slate-400">Trending now</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {trending.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                author={users.find((user) => user.id === post.authorId) || users[0]}
                emphasized
                widthClass="w-full"
                {...reactionState(post.id)}
                onOpen={() => onOpenPost(post.id)}
                onProfile={() => onOpenProfile(post.authorId)}
                onLike={() => onLikePost(post.id)}
                onComment={() => onOpenPost(post.id)}
                onRepost={() => onRepostPost(post.id)}
                onBookmark={() => onBookmarkPost(post.id)}
              />
            ))}
          </div>
        </section>
        <section className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div>
            <h2 className="mb-3 text-sm font-bold uppercase text-slate-400">Media wall</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {media.map((post) => {
                const preview = mediaPreview(post);
                return <ExploreMediaTile key={post.id} post={post} preview={preview} onOpen={() => onOpenPost(post.id)} />;
              })}
            </div>
          </div>
          <aside>
            <h2 className="mb-3 text-sm font-bold uppercase text-slate-400">People to visit</h2>
            <div className="space-y-3">
              {people.map((user) => (
                <button key={user.id} onClick={() => onOpenProfile(user.id)} className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left dark:border-white/10 dark:bg-slate-950">
                  <img className="h-12 w-12 rounded-full object-cover" src={user.avatarUrl} alt="" />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1 truncate text-sm font-bold">
                      <span className="truncate">{user.displayName}</span>
                      <VerifiedBadge verified={user.verified} size={14} />
                    </span>
                    <span className="block truncate text-xs text-slate-500">@{user.username}</span>
                  </span>
                </button>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

export default function App() {
  const {
    users,
    posts,
    comments,
    reactions,
    commentReactions,
    follows,
    notifications,
    unreadNotificationCount,
    blocks,
    mutes,
    currentUserId,
    currentUserEmail,
    verificationStatus,
    verificationReason,
    authed,
    loading,
    error,
    activePostId,
    activeProfileId,
    sortMode,
    feedStyle,
    search,
    canvasView,
    theme,
    soundEnabled,
    createPost,
    setActivePost,
    setActiveProfile,
    setCanvasView,
    likePost,
    repostPost,
    bookmarkPost,
    updatePost,
    deletePost,
    deleteComment,
    addCommentExtended,
    likeComment,
    markNotificationsRead,
    blockUser,
    unblockUser,
    muteUser,
    unmuteUser,
    reportPost,
    reportUser,
    pinPost,
    followUser,
    updateProfile,
    updatePassword,
    updateEmail,
    requestVerification,
    signOut,
    toggleTheme,
    toggleSound
  } = useAppStore();
  const initialize = useAppStore((state) => state.initialize);
  const refreshData = useAppStore((state) => state.refreshData);

  const [composerOpen, setComposerOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [chromeHidden, setChromeHidden] = useState(false);
  const [activeView, setActiveView] = useState<"canvas" | "explore" | "search" | "activity">("canvas");
  const [feedScope, setFeedScope] = useState<FeedScope>("everyone");
  const [canvasRecenterSignal, setCanvasRecenterSignal] = useState(0);
  const [canvasOverviewSignal, setCanvasOverviewSignal] = useState(0);
  const [editingPostId, setEditingPostId] = useState<string | undefined>();
  const [profileCanvasFullscreen, setProfileCanvasFullscreen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [refreshPull, setRefreshPull] = useState(0);
  const [refreshingPull, setRefreshingPull] = useState(false);
  const refreshTimer = useRef<number | undefined>(undefined);
  const focusedInitialCluster = useRef(false);
  const pullRef = useRef<{ y: number; active: boolean } | null>(null);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    if (!adjustOpen) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAdjustOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [adjustOpen]);

  useEffect(() => {
    if (!supabase || !authed) return undefined;
    const client = supabase;
    const scheduleRefresh = () => {
      window.clearTimeout(refreshTimer.current);
      refreshTimer.current = window.setTimeout(() => {
        void refreshData().catch(() => undefined);
      }, 350);
    };
    const channel = client
      .channel("connect-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "post_reactions" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "comment_reactions" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "follows" }, scheduleRefresh)
      .subscribe();

    return () => {
      window.clearTimeout(refreshTimer.current);
      void client.removeChannel(channel);
    };
  }, [authed, refreshData]);

  const currentUser = users.find((user) => user.id === currentUserId) || users[0];
  const filteredPosts = useMemo(() => getFilteredPosts(posts, users, sortMode, search), [posts, search, sortMode, users]);
  const searchPosts = useMemo(() => getFilteredPosts(posts, users, "newest", search), [posts, search, users]);
  const scopedPosts = useMemo(() => {
    const followingIds = new Set(follows.filter((follow) => follow.followerId === currentUserId).map((follow) => follow.followingId));
    const likedIds = new Set(reactions.filter((reaction) => reaction.userId === currentUserId && reaction.type === "like").map((reaction) => reaction.postId));
    if (feedScope === "following") return posts.filter((post) => followingIds.has(post.authorId) || post.authorId === currentUserId);
    if (feedScope === "liked") return posts.filter((post) => likedIds.has(post.id));
    if (feedScope === "liked-media") return posts.filter((post) => likedIds.has(post.id) && post.type !== "text");
    if (feedScope === "liked-photos") return posts.filter((post) => likedIds.has(post.id) && post.type === "photo");
    if (feedScope === "liked-videos") return posts.filter((post) => likedIds.has(post.id) && post.type === "video");
    return posts;
  }, [currentUserId, feedScope, follows, posts, reactions]);
  const sortedCanvasPosts = useMemo(() => getFilteredPosts(scopedPosts, users, sortMode, ""), [scopedPosts, sortMode, users]);
  const canvasPosts = sortedCanvasPosts;
  const activePost = posts.find((post) => post.id === activePostId);
  const activeAuthor = activePost ? users.find((user) => user.id === activePost.authorId) : undefined;
  const activeProfile = users.find((user) => user.id === activeProfileId);
  const isAdmin = Boolean(currentUser?.isAdmin && currentUser.username.toLowerCase() === "anti" && !currentUser.banned);
  const latest = [...canvasPosts].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];

  useEffect(() => {
    const syncFromUrl = () => {
      const { pathname, search: urlSearch } = window.location;
      const params = new URLSearchParams(urlSearch);
      const postParam = params.get("post") || pathname.match(/^\/post\/([^/]+)/)?.[1];
      const profileParam = params.get("profile");
      const usernameParam = pathname.match(/^\/u\/([^/]+)/)?.[1];
      const dashboard = pathname === "/dashboard";
      setDashboardOpen(dashboard);
      if (dashboard) {
        setActivePost(undefined);
        setActiveProfile(undefined);
        return;
      }
      if (postParam) {
        setActiveProfile(undefined);
        setActivePost(decodeURIComponent(postParam));
        return;
      }
      if (usernameParam) {
        const profile = users.find((user) => user.username.toLowerCase() === decodeURIComponent(usernameParam).toLowerCase());
        setActivePost(undefined);
        if (profile) setActiveProfile(profile.id);
        return;
      }
      if (profileParam) {
        setActivePost(undefined);
        setActiveProfile(profileParam);
        return;
      }
      setActivePost(undefined);
      setActiveProfile(undefined);
    };
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [setActivePost, setActiveProfile, users]);
  useEffect(() => {
    const setMeta = (attribute: "name" | "property", key: string, value: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.setAttribute("content", value);
    };
    const title = activePost && activeAuthor
      ? `Post by ${activeAuthor.displayName} on CONNECT`
      : activeProfile
        ? `${activeProfile.displayName} (@${activeProfile.username}) on CONNECT`
        : "CONNECT by AWAKEN CULT";
    const description = activePost
      ? (activePost.content || activePost.caption || "A CONNECT post").slice(0, 160)
      : activeProfile
        ? (activeProfile.bio || `Explore @${activeProfile.username}'s CONNECT profile.`).slice(0, 160)
        : "Explore AWAKEN CULT's spatial social world.";
    const image = activePost?.imageUrl || activePost?.thumbnailUrl || activePost?.sourceThumb || activeProfile?.bannerUrl || activeProfile?.avatarUrl || "";
    const url = activePost
      ? `${window.location.origin}/post/${encodeURIComponent(activePost.id)}`
      : activeProfile
        ? `${window.location.origin}/u/${encodeURIComponent(activeProfile.username)}`
        : `${window.location.origin}/`;
    document.title = title;
    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", url);
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    if (image) {
      setMeta("property", "og:image", image);
      setMeta("name", "twitter:image", image);
    }
  }, [activeAuthor, activePost, activeProfile]);
  const reactionState = (postId: string) => ({
    liked: reactions.some((reaction) => reaction.postId === postId && reaction.userId === currentUserId && reaction.type === "like"),
    reposted: reactions.some((reaction) => reaction.postId === postId && reaction.userId === currentUserId && reaction.type === "repost"),
    bookmarked: reactions.some((reaction) => reaction.postId === postId && reaction.userId === currentUserId && reaction.type === "bookmark")
  });
  const zoomBy = (amount: number) => setCanvasView({ ...canvasView, zoom: Math.max(0.35, Math.min(2.2, canvasView.zoom + amount)) });
  const focusPost = useCallback((post = latest, zoom = 0.95) => {
    if (!post) return;
    setCanvasView({ x: -(post.x + CANVAS_CARD_CENTER_X), y: -(post.y + CANVAS_CARD_CENTER_Y), zoom });
  }, [latest, setCanvasView]);
  const recenterCanvas = useCallback(() => {
    setActiveProfile(undefined);
    setActiveView("canvas");
    setCanvasRecenterSignal((value) => value + 1);
  }, [setActiveProfile]);
  const openHomeOverview = useCallback(() => {
    setActiveProfile(undefined);
    setActiveView("canvas");
    setCanvasOverviewSignal((value) => value + 1);
  }, [setActiveProfile]);
  const openExplore = useCallback(() => {
    setActiveProfile(undefined);
    setActiveView("explore");
  }, [setActiveProfile]);
  const openActivity = useCallback(() => {
    setActiveProfile(undefined);
    setActiveView("activity");
  }, [setActiveProfile]);
  const openComposer = useCallback(() => {
    setComposerOpen(true);
  }, []);
  const openPost = useCallback((id?: string) => {
    setActivePost(id);
    if (id) window.history.pushState({}, "", `/post/${encodeURIComponent(id)}`);
  }, [setActivePost]);
  const openProfile = useCallback((id?: string) => {
    setActiveProfile(id);
    const profile = users.find((user) => user.id === id);
    if (id) window.history.pushState({}, "", profile ? `/u/${encodeURIComponent(profile.username)}` : `?profile=${id}`);
  }, [setActiveProfile, users]);
  const closePost = useCallback(() => {
    setEditingPostId(undefined);
    setActivePost(undefined);
    window.history.pushState({}, "", "/");
  }, [setActivePost]);
  const closeProfile = useCallback(() => {
    setActiveProfile(undefined);
    window.history.pushState({}, "", "/");
  }, [setActiveProfile]);
  const shareProfile = useCallback(async (profile: User) => {
    const url = `${window.location.origin}/u/${encodeURIComponent(profile.username)}`;
    const title = `${profile.displayName} (@${profile.username}) on CONNECT`;
    const text = profile.verified ? `Verified CONNECT profile: @${profile.username}` : `CONNECT profile: @${profile.username}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
    } catch {
      await navigator.clipboard?.writeText(url).catch(() => undefined);
    }
  }, []);
  const runPullRefresh = useCallback(async () => {
    if (refreshingPull) return;
    setRefreshingPull(true);
    setRefreshPull(72);
    try {
      await refreshData();
    } finally {
      window.setTimeout(() => {
        setRefreshingPull(false);
        setRefreshPull(0);
      }, 420);
    }
  }, [refreshData, refreshingPull]);
  const handlePullStart = useCallback((event: TouchEvent<HTMLDivElement>) => {
    if (activeView === "canvas" && !activeProfile) return;
    if (event.touches.length !== 1) return;
    const target = event.target as HTMLElement;
    if (target.closest(".canvas-viewport,[role='dialog'],input,textarea,select,button,a,iframe,video")) return;
    const scrollParent = target.closest<HTMLElement>(".thin-scrollbar, [data-scroll-root='profile']");
    const atTop = !scrollParent || scrollParent.scrollTop <= 2;
    pullRef.current = { y: event.touches[0].clientY, active: atTop };
  }, [activeProfile, activeView]);
  const handlePullMove = useCallback((event: TouchEvent<HTMLDivElement>) => {
    const start = pullRef.current;
    if (!start?.active || refreshingPull) return;
    const delta = event.touches[0].clientY - start.y;
    if (delta <= 0) {
      setRefreshPull(0);
      return;
    }
    setRefreshPull(Math.min(86, delta * 0.42));
  }, [refreshingPull]);
  const handlePullEnd = useCallback(() => {
    const shouldRefresh = refreshPull > 58;
    pullRef.current = null;
    if (shouldRefresh) {
      void runPullRefresh();
      return;
    }
    setRefreshPull(0);
  }, [refreshPull, runPullRefresh]);
  const handleHashtagClick = useCallback((tag: string) => {
    useAppStore.getState().setSearch(`#${tag}`);
    setActiveView("search");
  }, []);

  useEffect(() => {
    if (!authed || !latest || focusedInitialCluster.current) return;
    focusedInitialCluster.current = true;
    focusPost(latest, 0.95);
  }, [authed, focusPost, latest]);

  if (loading && !authed) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f7f4] p-4 text-slate-950 dark:bg-[#0e1116] dark:text-white">
        <p className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold shadow-glass dark:border-white/10 dark:bg-slate-950">Loading CONNECT...</p>
      </main>
    );
  }

  if (!authed || !currentUser) {
    if (activePost || activeProfile) {
      return <PublicSharedView post={activePost} author={activeAuthor} profile={activeProfile} onSignIn={() => { setActivePost(undefined); setActiveProfile(undefined); window.history.pushState({}, "", "/"); }} />;
    }
    return <AuthGate />;
  }

  return (
    <div
      className="flex h-screen overflow-hidden bg-[#f5f5f7] text-slate-950 dark:bg-[#050505] dark:text-white"
      onTouchStart={handlePullStart}
      onTouchMove={handlePullMove}
      onTouchEnd={handlePullEnd}
      onTouchCancel={handlePullEnd}
    >
      <div
        className="pointer-events-none fixed left-1/2 top-[max(12px,env(safe-area-inset-top))] z-[90] -translate-x-1/2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-xs font-black text-slate-600 shadow-glass backdrop-blur-xl transition-all duration-200 dark:border-white/10 dark:bg-slate-950/90 dark:text-slate-200"
        style={{ opacity: refreshPull > 8 || refreshingPull ? 1 : 0, transform: `translate(-50%, ${Math.max(0, refreshPull - 18)}px) scale(${refreshingPull ? 1 : 0.94 + Math.min(refreshPull, 70) / 700})` }}
      >
        {refreshingPull ? "Refreshing..." : refreshPull > 58 ? "Release to refresh" : "Pull to refresh"}
      </div>
      {!chromeHidden && !profileCanvasFullscreen ? (
        <Sidebar
          currentUser={currentUser}
          activeView={activeView}
          unreadCount={unreadNotificationCount}
          onHome={openHomeOverview}
          onExplore={openExplore}
          onActivity={openActivity}
          onCreate={openComposer}
          onProfile={() => openProfile(currentUser.id)}
          onSignOut={() => void signOut()}
        />
      ) : null}
      <div className="relative flex min-w-0 flex-1 flex-col">
        {!activeProfile && !profileCanvasFullscreen ? (
          <header className={`fixed left-0 right-0 top-0 z-30 flex items-center justify-end gap-3 p-4 ${chromeHidden ? "" : "lg:left-72"}`}>
            {!chromeHidden ? <div className="hidden lg:block"><SearchBox compact onFocus={() => setActiveView("search")} /></div> : null}
            {!chromeHidden && error ? <span className="hidden max-w-72 truncate rounded-2xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:bg-rose-400/10 dark:text-rose-200 lg:block">{error}</span> : null}
            {!chromeHidden ? <button onClick={() => setActiveView("search")} className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white/88 shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/88" aria-label="Search current canvas">
              <Search size={18} />
            </button> : null}
            {!chromeHidden ? <button onClick={() => setAdjustOpen(true)} className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white/88 shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/88" aria-label="Adjust canvas">
              <SlidersHorizontal size={18} />
            </button> : null}
            {!chromeHidden ? <button onClick={() => { unlockAudio(); if (!soundEnabled) playNotification(); toggleSound(); }} className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white/88 shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/88" aria-label={soundEnabled ? "Disable CONNECT sounds" : "Enable CONNECT sounds"}>
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button> : null}
            {chromeHidden ? (
              <button onClick={() => setChromeHidden(false)} className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white/88 shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/88" aria-label="Show interface">
                <Eye size={18} />
              </button>
            ) : null}
          </header>
        ) : null}

        {activeView === "canvas" ? (
          <CanvasFeed
            posts={canvasPosts}
            users={users}
            reactions={reactions}
            currentUserId={currentUserId}
            sortMode={sortMode}
            feedStyle={feedStyle}
            view={canvasView}
            onViewChange={setCanvasView}
            onOpenPost={openPost}
            onOpenProfile={openProfile}
            onLikePost={(id) => void likePost(id)}
            onRepostPost={(id) => void repostPost(id)}
            onBookmarkPost={(id) => void bookmarkPost(id)}
            blocks={blocks}
            mutes={mutes}
            onEditPost={(id) => { setEditingPostId(id); openPost(id); }}
            onDeletePost={(id) => void deletePost(id)}
            onMuteUser={(id) => void (mutes.some((mute) => mute.mutedId === id) ? unmuteUser(id) : muteUser(id))}
            onReportPost={(id) => void reportPost(id, "other")}
            onHashtagClick={handleHashtagClick}
            onPinPost={(id) => void pinPost(id)}
            recenterSignal={canvasRecenterSignal}
            overviewSignal={canvasOverviewSignal}
            adminMode={isAdmin}
            onOpenDashboard={() => {
              if (!isAdmin) return;
              setDashboardOpen(true);
              window.history.pushState({}, "", "/dashboard");
            }}
          />
        ) : activeView === "explore" ? (
          <ExploreView posts={filteredPosts} users={users} reactionState={reactionState} onOpenPost={openPost} onOpenProfile={openProfile} onLikePost={(id) => void likePost(id)} onRepostPost={(id) => void repostPost(id)} onBookmarkPost={(id) => void bookmarkPost(id)} />
        ) : activeView === "activity" ? (
          <NotificationsActivityView notifications={notifications} users={users} posts={posts} onMarkAllRead={() => void markNotificationsRead()} onOpenPost={openPost} onOpenProfile={openProfile} />
        ) : (
          <SearchView posts={searchPosts} users={users} reactionState={reactionState} onOpenPost={openPost} onOpenProfile={openProfile} onLikePost={(id) => void likePost(id)} onRepostPost={(id) => void repostPost(id)} onBookmarkPost={(id) => void bookmarkPost(id)} />
        )}
      </div>

      {!chromeHidden && !profileCanvasFullscreen ? (
        <MobileNav
          activeView={activeView}
          profileActive={Boolean(activeProfile)}
          unreadCount={unreadNotificationCount}
          onHome={openHomeOverview}
          onExplore={openExplore}
          onCreate={openComposer}
          onActivity={openActivity}
          onProfile={() => openProfile(currentUser.id)}
        />
      ) : null}

      <AdjustPanel
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        zoom={canvasView.zoom}
        onZoomIn={() => zoomBy(0.12)}
        onZoomOut={() => zoomBy(-0.12)}
        onReset={() => focusPost(latest, 0.95)}
        onLatest={recenterCanvas}
        onHide={() => {
          setChromeHidden(true);
          setAdjustOpen(false);
        }}
        feedScope={feedScope}
        onFeedScopeChange={setFeedScope}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <Composer open={composerOpen} currentUser={currentUser} onClose={() => setComposerOpen(false)} onPublish={createPost} />
      <PostModal
        post={activePost}
        author={activeAuthor}
        currentUser={currentUser}
        currentUserId={currentUserId}
        users={users}
        comments={comments.filter((comment) => comment.postId === activePostId)}
        commentReactions={commentReactions}
        editMode={Boolean(editingPostId && activePostId === editingPostId)}
        onClose={closePost}
        liked={activePost ? reactionState(activePost.id).liked : false}
        reposted={activePost ? reactionState(activePost.id).reposted : false}
        bookmarked={activePost ? reactionState(activePost.id).bookmarked : false}
        onLike={() => activePost && likePost(activePost.id)}
        onRepost={() => activePost && repostPost(activePost.id)}
        onBookmark={() => activePost && bookmarkPost(activePost.id)}
        onDeletePost={() => activePost && void deletePost(activePost.id)}
        onEditPost={() => activePost && setEditingPostId(activePost.id)}
        onSaveEdit={(content) => activePost && void updatePost(activePost.id, { content, caption: content })}
        onLikeComment={(id) => void likeComment(id)}
        onDeleteComment={(id) => activePost && void deleteComment(id, activePost.id)}
        onAddCommentExtended={(content, options) => activePost && void addCommentExtended(activePost.id, content, options)}
        onOpenProfile={openProfile}
        onHashtagClick={handleHashtagClick}
      />
      <ProfileView
        user={activeProfile}
        currentUserId={currentUserId}
        currentUserEmail={currentUserEmail}
        verificationStatus={verificationStatus}
        verificationReason={verificationReason}
        users={users}
        posts={posts}
        reactions={reactions}
        follows={follows}
        blocks={blocks}
        mutes={mutes}
        onClose={closeProfile}
        onOpenProfile={openProfile}
        onOpenPost={openPost}
        onLikePost={(id) => void likePost(id)}
        onRepostPost={(id) => void repostPost(id)}
        onBookmarkPost={(id) => void bookmarkPost(id)}
        onFollowUser={(id) => void followUser(id)}
        onUpdateProfile={updateProfile}
        onUpdatePassword={updatePassword}
        onUpdateEmail={updateEmail}
        onRequestVerification={requestVerification}
        onShareProfile={shareProfile}
        onBlockUser={(id) => void blockUser(id)}
        onUnblockUser={(id) => void unblockUser(id)}
        onMuteUser={(id) => void muteUser(id)}
        onUnmuteUser={(id) => void unmuteUser(id)}
        onReportUser={(id) => void reportUser(id, "other")}
        onCanvasFullscreenChange={setProfileCanvasFullscreen}
      />
      {dashboardOpen ? (
        <AdminDashboard
          currentUser={currentUser}
          onClose={() => {
            setDashboardOpen(false);
            window.history.pushState({}, "", "/");
          }}
        />
      ) : null}
    </div>
  );
}
