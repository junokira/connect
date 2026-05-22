import { LogIn, Moon, Search, SlidersHorizontal, Sun } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { CanvasControls } from "./components/CanvasControls";
import { CanvasFeed } from "./components/CanvasFeed";
import { Composer } from "./components/Composer";
import { MobileNav } from "./components/MobileNav";
import { PostModal } from "./components/PostModal";
import { ProfileView } from "./components/ProfileView";
import { Sidebar } from "./components/Sidebar";
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
  { value: "orbit", label: "Orbit" }
];

function AuthGate() {
  const signIn = useAppStore((state) => state.signIn);
  const loading = useAppStore((state) => state.loading);
  const error = useAppStore((state) => state.error);
  const backendMode = useAppStore((state) => state.backendMode);
  const [email, setEmail] = useState("maya@example.com");
  const [password, setPassword] = useState("connect-demo-password");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void signIn(email, password, {
      displayName,
      username,
      bio,
      location: "",
      website: "",
      avatarUrl,
      bannerUrl
    });
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f7f4] p-4 dark:bg-[#0e1116]">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-glass dark:border-white/10 dark:bg-slate-950">
        <p className="mb-1 text-2xl font-black text-slate-950 dark:text-white">CONNECT</p>
        <p className="mb-6 text-sm text-slate-500">{backendMode === "supabase" ? "Sign in or create your CONNECT account." : "Mock sign-in for your spatial social canvas."}</p>
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Display name</span>
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-teal-500 dark:border-white/10" placeholder="Your name" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Username</span>
            <input value={username} onChange={(event) => setUsername(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-teal-500 dark:border-white/10" placeholder="username" />
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
        <label className="mb-2 block text-sm font-semibold">Email</label>
        <input value={email} onChange={(event) => setEmail(event.target.value)} className="mb-4 w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-teal-500 dark:border-white/10" />
        <label className="mb-2 block text-sm font-semibold">Password</label>
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mb-4 w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-teal-500 dark:border-white/10" />
        {error ? <p className="mb-4 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-400/10 dark:text-rose-200">{error}</p> : null}
        <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-slate-950">
          <LogIn size={18} />
          {loading ? "Connecting..." : "Enter canvas"}
        </button>
      </form>
    </main>
  );
}

function FilterBar({ mobile = false, onClose }: { mobile?: boolean; onClose?: () => void }) {
  const search = useAppStore((state) => state.search);
  const sortMode = useAppStore((state) => state.sortMode);
  const feedStyle = useAppStore((state) => state.feedStyle);
  const setSearch = useAppStore((state) => state.setSearch);
  const setSortMode = useAppStore((state) => state.setSortMode);
  const setFeedStyle = useAppStore((state) => state.setFeedStyle);

  return (
    <div className={mobile ? "space-y-4" : "hidden items-center gap-3 lg:flex"}>
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-11 w-full rounded-2xl border border-slate-200 bg-white/90 pl-10 pr-4 text-sm outline-none focus:border-teal-500 dark:border-white/10 dark:bg-slate-950/90 lg:w-80"
          placeholder="Search posts, people, #tags, type"
        />
      </label>
      <select
        value={sortMode}
        onChange={(event) => setSortMode(event.target.value as SortMode)}
        className="h-11 w-full rounded-2xl border border-slate-200 bg-white/90 px-3 text-sm font-medium outline-none focus:border-teal-500 dark:border-white/10 dark:bg-slate-950/90 lg:w-48"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <select
        value={feedStyle}
        onChange={(event) => setFeedStyle(event.target.value as FeedStyle)}
        className="h-11 w-full rounded-2xl border border-slate-200 bg-white/90 px-3 text-sm font-medium outline-none focus:border-teal-500 dark:border-white/10 dark:bg-slate-950/90 lg:w-44"
      >
        {feedStyles.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {onClose ? (
        <button onClick={onClose} className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
          Apply
        </button>
      ) : null}
    </div>
  );
}

export default function App() {
  const {
    users,
    posts,
    comments,
    currentUserId,
    authed,
    backendMode,
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
    signOut,
    toggleTheme
  } = useAppStore();
  const initialize = useAppStore((state) => state.initialize);

  const [composerOpen, setComposerOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const currentUser = users.find((user) => user.id === currentUserId) || users[0];
  const filteredPosts = useMemo(() => getFilteredPosts(posts, users, sortMode, search), [posts, search, sortMode, users]);
  const activePost = posts.find((post) => post.id === activePostId);
  const activeAuthor = activePost ? users.find((user) => user.id === activePost.authorId) : undefined;
  const activeProfile = users.find((user) => user.id === activeProfileId);

  if (loading && !authed) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f7f4] p-4 text-slate-950 dark:bg-[#0e1116] dark:text-white">
        <p className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold shadow-glass dark:border-white/10 dark:bg-slate-950">Loading CONNECT...</p>
      </main>
    );
  }

  if (!authed || !currentUser) return <AuthGate />;

  const zoomBy = (amount: number) => setCanvasView({ ...canvasView, zoom: Math.max(0.35, Math.min(2.2, canvasView.zoom + amount)) });
  const latest = [...posts].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f7f4] text-slate-950 dark:bg-[#0e1116] dark:text-white">
      <Sidebar currentUser={currentUser} onCreate={() => setComposerOpen(true)} onProfile={() => setActiveProfile(currentUser.id)} onSignOut={() => void signOut()} />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <header className="fixed left-0 right-0 top-0 z-30 flex items-center justify-end gap-3 p-4 lg:left-72">
          <FilterBar />
          {error ? <span className="hidden max-w-72 truncate rounded-2xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:bg-rose-400/10 dark:text-rose-200 lg:block">{error}</span> : null}
          <span className="hidden rounded-2xl border border-slate-200 bg-white/88 px-3 py-2 text-xs font-bold uppercase text-slate-500 shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/88 lg:block">
            {backendMode}
          </span>
          <button onClick={toggleTheme} className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white/88 shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/88" aria-label="Toggle theme">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={() => setFiltersOpen(true)} className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white/88 shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/88 lg:hidden" aria-label="Filters">
            <SlidersHorizontal size={18} />
          </button>
        </header>

        <CanvasFeed
          posts={filteredPosts}
          users={users}
          sortMode={sortMode}
          feedStyle={feedStyle}
          search={search}
          view={canvasView}
          onViewChange={setCanvasView}
          onOpenPost={setActivePost}
          onOpenProfile={setActiveProfile}
          onOpenFilters={() => setFiltersOpen(true)}
        />

        <CanvasControls
          zoom={canvasView.zoom}
          onZoomIn={() => zoomBy(0.12)}
          onZoomOut={() => zoomBy(-0.12)}
          onReset={() => setCanvasView({ x: 160, y: 120, zoom: 1 })}
          onLatest={() => latest && setCanvasView({ x: -latest.x + 320, y: -latest.y + 200, zoom: 1 })}
        />
      </div>

      <MobileNav onCreate={() => setComposerOpen(true)} onFilters={() => setFiltersOpen(true)} onProfile={() => setActiveProfile(currentUser.id)} />

      {filtersOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/35 p-0 backdrop-blur-sm lg:hidden">
          <section className="w-full rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-slate-950">
            <div className="mb-4 h-1.5 w-12 rounded-full bg-slate-300 mx-auto dark:bg-white/20" />
            <FilterBar mobile onClose={() => setFiltersOpen(false)} />
          </section>
        </div>
      ) : null}

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
      <ProfileView user={activeProfile} users={users} posts={posts} onClose={() => setActiveProfile(undefined)} onOpenPost={setActivePost} />
    </div>
  );
}
