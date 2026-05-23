import { Apple, Eye, EyeOff, LocateFixed, LogIn, Mail, Maximize2, Minus, Moon, Phone, Plus, Search, SlidersHorizontal, Sun, UserPlus, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CanvasFeed } from "./components/CanvasFeed";
import { Composer } from "./components/Composer";
import { MobileNav } from "./components/MobileNav";
import { PostCard } from "./components/PostCard";
import { PostModal } from "./components/PostModal";
import { ProfileView } from "./components/ProfileView";
import { Sidebar } from "./components/Sidebar";
import { VerifiedBadge } from "./components/VerifiedBadge";
import { supabase } from "./lib/supabase";
import { useAppStore } from "./store/useAppStore";
import { FeedStyle, SortMode } from "./types";
import { getFilteredPosts } from "./utils/posts";

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

function AuthGate() {
  const signIn = useAppStore((state) => state.signIn);
  const signUp = useAppStore((state) => state.signUp);
  const requestMagicLink = useAppStore((state) => state.requestMagicLink);
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
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [status, setStatus] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setStatus("");
    if (mode === "signin") {
      void signIn(email, password);
      return;
    }
    void signUp(email, password, {
      displayName,
      username,
      bio,
      location: "",
      website: "",
      avatarUrl,
      bannerUrl
    });
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

  return (
    <main className="h-[100dvh] overflow-y-auto bg-[#f5f5f7] p-4 dark:bg-[#050505]">
      <form onSubmit={submit} className="mx-auto my-4 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-glass dark:border-white/10 dark:bg-slate-950 sm:my-10">
        <p className="mb-1 text-2xl font-black text-slate-950 dark:text-white">CONNECT</p>
        <p className="mb-5 text-sm text-slate-500">Enter the spatial feed with real Supabase auth.</p>
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
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Avatar URL</span>
                <input value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-teal-500 dark:border-white/10" placeholder="Optional" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Banner URL</span>
                <input value={bannerUrl} onChange={(event) => setBannerUrl(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-teal-500 dark:border-white/10" placeholder="Optional" />
              </label>
            </div>
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

function SearchBox({ compact = false }: { compact?: boolean }) {
  const search = useAppStore((state) => state.search);
  const setSearch = useAppStore((state) => state.setSearch);

  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
      <input
        value={search}
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

function SearchView({ posts, users, onOpenPost, onOpenProfile }: { posts: ReturnType<typeof getFilteredPosts>; users: ReturnType<typeof useAppStore.getState>["users"]; onOpenPost: (id: string) => void; onOpenProfile: (id: string) => void }) {
  return (
    <main className="thin-scrollbar h-full overflow-y-auto px-4 pb-28 pt-20 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 max-w-2xl">
          <h1 className="mb-3 text-3xl font-black">Search</h1>
          <SearchBox />
        </div>
        <div className="grid justify-items-center gap-4 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} author={users.find((user) => user.id === post.authorId) || users[0]} onOpen={() => onOpenPost(post.id)} onProfile={() => onOpenProfile(post.authorId)} onLike={() => undefined} onComment={() => onOpenPost(post.id)} onRepost={() => undefined} onBookmark={() => undefined} />
          ))}
          {!posts.length ? <p className="rounded-3xl border border-dashed border-slate-300 p-8 text-sm text-slate-500 dark:border-white/15">Search posts, captions, usernames, hashtags, and media types.</p> : null}
        </div>
      </div>
    </main>
  );
}

function ExploreView({
  posts,
  users,
  onOpenPost,
  onOpenProfile
}: {
  posts: ReturnType<typeof getFilteredPosts>;
  users: ReturnType<typeof useAppStore.getState>["users"];
  onOpenPost: (id: string) => void;
  onOpenProfile: (id: string) => void;
}) {
  const trending = [...posts].sort((a, b) => b.likesCount + b.commentsCount * 2 + b.repostsCount * 3 - (a.likesCount + a.commentsCount * 2 + a.repostsCount * 3)).slice(0, 8);
  const media = posts.filter((post) => post.type !== "text").slice(0, 9);
  const people = users.slice(0, 6);

  return (
    <main className="thin-scrollbar h-full overflow-y-auto px-4 pb-28 pt-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-black">Explore</h1>
          <p className="text-sm text-slate-500">Trending posts, media, and people across CONNECT.</p>
        </div>
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-bold uppercase text-slate-400">Trending now</h2>
          <div className="grid justify-items-center gap-4 md:grid-cols-2 xl:grid-cols-3">
            {trending.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                author={users.find((user) => user.id === post.authorId) || users[0]}
                emphasized
                onOpen={() => onOpenPost(post.id)}
                onProfile={() => onOpenProfile(post.authorId)}
                onLike={() => undefined}
                onComment={() => onOpenPost(post.id)}
                onRepost={() => undefined}
                onBookmark={() => undefined}
              />
            ))}
          </div>
        </section>
        <section className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div>
            <h2 className="mb-3 text-sm font-bold uppercase text-slate-400">Media wall</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {media.map((post) => (
                <button key={post.id} onClick={() => onOpenPost(post.id)} className="aspect-[4/5] overflow-hidden rounded-2xl bg-slate-100 text-left dark:bg-white/10">
                  <img className="h-full w-full object-cover" src={post.imageUrl || post.thumbnailUrl} alt="" />
                </button>
              ))}
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
    currentUserId,
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
    createPost,
    setActivePost,
    setActiveProfile,
    setCanvasView,
    likePost,
    repostPost,
    bookmarkPost,
    addComment,
    updateProfile,
    signOut,
    toggleTheme
  } = useAppStore();
  const initialize = useAppStore((state) => state.initialize);
  const refreshData = useAppStore((state) => state.refreshData);

  const [composerOpen, setComposerOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [chromeHidden, setChromeHidden] = useState(false);
  const [activeView, setActiveView] = useState<"canvas" | "explore" | "search">("canvas");
  const refreshTimer = useRef<number | undefined>(undefined);
  const focusedInitialCluster = useRef(false);

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
      .subscribe();

    return () => {
      window.clearTimeout(refreshTimer.current);
      void client.removeChannel(channel);
    };
  }, [authed, refreshData]);

  const currentUser = users.find((user) => user.id === currentUserId) || users[0];
  const filteredPosts = useMemo(() => getFilteredPosts(posts, users, sortMode, search), [posts, search, sortMode, users]);
  const activePost = posts.find((post) => post.id === activePostId);
  const activeAuthor = activePost ? users.find((user) => user.id === activePost.authorId) : undefined;
  const activeProfile = users.find((user) => user.id === activeProfileId);
  const latest = [...posts].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
  const zoomBy = (amount: number) => setCanvasView({ ...canvasView, zoom: Math.max(0.35, Math.min(2.2, canvasView.zoom + amount)) });
  const focusPost = useCallback((post = latest, zoom = 0.95) => {
    if (!post) return;
    setCanvasView({ x: -post.x, y: -post.y, zoom });
  }, [latest, setCanvasView]);

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

  if (!authed || !currentUser) return <AuthGate />;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f5f7] text-slate-950 dark:bg-[#050505] dark:text-white">
      {!chromeHidden ? (
        <Sidebar
          currentUser={currentUser}
          activeView={activeView}
          onHome={() => {
            setActiveView("canvas");
            focusPost(latest, 0.95);
          }}
          onExplore={() => setActiveView("explore")}
          onSearch={() => setActiveView("search")}
          onCreate={() => setComposerOpen(true)}
          onProfile={() => setActiveProfile(currentUser.id)}
          onSignOut={() => void signOut()}
        />
      ) : null}
      <div className="relative flex min-w-0 flex-1 flex-col">
        <header className={`fixed left-0 right-0 top-0 z-30 flex items-center justify-end gap-3 p-4 ${chromeHidden ? "" : "lg:left-72"}`}>
          {!chromeHidden ? <div className="hidden lg:block"><SearchBox compact /></div> : null}
          {!chromeHidden && error ? <span className="hidden max-w-72 truncate rounded-2xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:bg-rose-400/10 dark:text-rose-200 lg:block">{error}</span> : null}
          {!chromeHidden ? <button onClick={() => setAdjustOpen(true)} className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white/88 shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/88" aria-label="Adjust canvas">
            <SlidersHorizontal size={18} />
          </button> : null}
          {chromeHidden ? (
            <button onClick={() => setChromeHidden(false)} className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white/88 shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/88" aria-label="Show interface">
              <Eye size={18} />
            </button>
          ) : null}
        </header>

        {activeView === "canvas" ? (
          <CanvasFeed
            posts={filteredPosts}
            users={users}
            sortMode={sortMode}
            feedStyle={feedStyle}
            view={canvasView}
            onViewChange={setCanvasView}
            onOpenPost={setActivePost}
            onOpenProfile={setActiveProfile}
            onLikePost={(id) => void likePost(id)}
            onRepostPost={(id) => void repostPost(id)}
            onBookmarkPost={(id) => void bookmarkPost(id)}
          />
        ) : activeView === "explore" ? (
          <ExploreView posts={filteredPosts} users={users} onOpenPost={setActivePost} onOpenProfile={setActiveProfile} />
        ) : (
          <SearchView posts={filteredPosts} users={users} onOpenPost={setActivePost} onOpenProfile={setActiveProfile} />
        )}
      </div>

      {!chromeHidden ? (
        <MobileNav
          activeView={activeView}
          onHome={() => {
            setActiveView("canvas");
            focusPost(latest, 0.95);
          }}
          onExplore={() => setActiveView("explore")}
          onCreate={() => setComposerOpen(true)}
          onSearch={() => setActiveView("search")}
          onProfile={() => setActiveProfile(currentUser.id)}
        />
      ) : null}

      <AdjustPanel
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        zoom={canvasView.zoom}
        onZoomIn={() => zoomBy(0.12)}
        onZoomOut={() => zoomBy(-0.12)}
        onReset={() => focusPost(latest, 0.95)}
        onLatest={() => focusPost(latest, 0.95)}
        onHide={() => {
          setChromeHidden(true);
          setAdjustOpen(false);
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <Composer open={composerOpen} currentUser={currentUser} onClose={() => setComposerOpen(false)} onPublish={createPost} />
      <PostModal
        post={activePost}
        author={activeAuthor}
        currentUser={currentUser}
        users={users}
        comments={comments.filter((comment) => comment.postId === activePostId)}
        onClose={() => setActivePost(undefined)}
        onLike={() => activePost && likePost(activePost.id)}
        onRepost={() => activePost && repostPost(activePost.id)}
        onBookmark={() => activePost && bookmarkPost(activePost.id)}
        onComment={(content) => activePost && addComment(activePost.id, content)}
      />
      <ProfileView
        user={activeProfile}
        currentUserId={currentUserId}
        users={users}
        posts={posts}
        reactions={reactions}
        onClose={() => setActiveProfile(undefined)}
        onOpenPost={setActivePost}
        onUpdateProfile={updateProfile}
      />
    </div>
  );
}
