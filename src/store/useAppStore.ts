import { create } from "zustand";
import { persist } from "zustand/middleware";
import { comments as seedComments, posts as seedPosts, users as seedUsers } from "../data/seed";
import { isSupabaseConfigured } from "../lib/supabase";
import { addCommentReal, createPostReal, getSessionUserId, loadConnectData, reactToPostReal, signInOrSignUp, signOutReal } from "../lib/supabaseData";
import { CanvasView, Comment, Post, PostType, SortMode, User } from "../types";
import { placeNextPost } from "../utils/placement";

type DraftInput = {
  type: PostType;
  content: string;
  caption: string;
  imageUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
};

type AppState = {
  users: User[];
  posts: Post[];
  comments: Comment[];
  currentUserId: string;
  authed: boolean;
  backendMode: "mock" | "supabase";
  loading: boolean;
  error?: string;
  activePostId?: string;
  activeProfileId?: string;
  sortMode: SortMode;
  search: string;
  canvasView: CanvasView;
  theme: "light" | "dark";
  initialize: () => Promise<void>;
  refreshData: () => Promise<void>;
  signIn: (email: string, password?: string) => Promise<void>;
  signOut: () => Promise<void>;
  createPost: (draft: DraftInput) => Promise<Post>;
  setActivePost: (id?: string) => void;
  setActiveProfile: (id?: string) => void;
  setSortMode: (mode: SortMode) => void;
  setSearch: (search: string) => void;
  setCanvasView: (view: CanvasView) => void;
  likePost: (id: string) => Promise<void>;
  repostPost: (id: string) => Promise<void>;
  bookmarkPost: (id: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
  toggleTheme: () => void;
};

const extractHashtags = (value: string) => [...value.matchAll(/#([a-z0-9_]+)/gi)].map((match) => match[1].toLowerCase());

const makePost = (draft: DraftInput, posts: Post[], authorId: string): Post => {
  const now = new Date().toISOString();
  const position = placeNextPost(posts);
  return {
    id: crypto.randomUUID(),
    authorId,
    type: draft.type,
    content: draft.type === "text" ? draft.content : "",
    caption: draft.type === "text" ? "" : draft.caption,
    imageUrl: draft.imageUrl,
    videoUrl: draft.videoUrl,
    thumbnailUrl: draft.thumbnailUrl || draft.imageUrl,
    x: position.x,
    y: position.y,
    createdAt: now,
    updatedAt: now,
    likesCount: 0,
    commentsCount: 0,
    repostsCount: 0,
    bookmarksCount: 0,
    hashtags: extractHashtags(`${draft.content} ${draft.caption}`)
  };
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      users: seedUsers,
      posts: seedPosts,
      comments: seedComments,
      currentUserId: "u-1",
      authed: !isSupabaseConfigured,
      backendMode: isSupabaseConfigured ? "supabase" : "mock",
      loading: isSupabaseConfigured,
      error: undefined,
      activePostId: undefined,
      activeProfileId: undefined,
      sortMode: "newest",
      search: "",
      canvasView: { x: 160, y: 120, zoom: 1 },
      theme: "light",
      initialize: async () => {
        if (!isSupabaseConfigured) {
          set({ backendMode: "mock", authed: true, loading: false });
          return;
        }
        try {
          set({ backendMode: "supabase", loading: true, error: undefined });
          const userId = await getSessionUserId();
          const data = await loadConnectData();
          set({
            ...data,
            currentUserId: userId || "",
            authed: Boolean(userId),
            loading: false
          });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Unable to initialize CONNECT.", loading: false });
        }
      },
      refreshData: async () => {
        if (!isSupabaseConfigured) return;
        const data = await loadConnectData();
        set(data);
      },
      signIn: async (email, password = "connect-demo-password") => {
        if (!isSupabaseConfigured) {
          set({ authed: true, currentUserId: "u-1" });
          return;
        }
        try {
          set({ loading: true, error: undefined });
          const userId = await signInOrSignUp(email, password);
          const data = await loadConnectData();
          set({ ...data, currentUserId: userId, authed: true, loading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Unable to sign in.", loading: false });
        }
      },
      signOut: async () => {
        if (isSupabaseConfigured) await signOutReal();
        set({ authed: false, currentUserId: "" });
      },
      createPost: async (draft) => {
        const post = makePost(draft, get().posts, get().currentUserId || "u-1");
        const savedPost = isSupabaseConfigured ? await createPostReal(post) : post;
        set({
          posts: [savedPost, ...get().posts],
          activePostId: savedPost.id,
          canvasView: { x: -savedPost.x + 280, y: -savedPost.y + 180, zoom: 1 }
        });
        return savedPost;
      },
      setActivePost: (id) => set({ activePostId: id }),
      setActiveProfile: (id) => set({ activeProfileId: id }),
      setSortMode: (mode) => set({ sortMode: mode }),
      setSearch: (search) => set({ search }),
      setCanvasView: (view) => set({ canvasView: view }),
      likePost: async (id) => {
        if (isSupabaseConfigured) await reactToPostReal(id, get().currentUserId, "like");
        set({ posts: get().posts.map((post) => (post.id === id ? { ...post, likesCount: post.likesCount + 1 } : post)) });
      },
      repostPost: async (id) => {
        if (isSupabaseConfigured) await reactToPostReal(id, get().currentUserId, "repost");
        set({ posts: get().posts.map((post) => (post.id === id ? { ...post, repostsCount: post.repostsCount + 1 } : post)) });
      },
      bookmarkPost: async (id) => {
        if (isSupabaseConfigured) await reactToPostReal(id, get().currentUserId, "bookmark");
        set({ posts: get().posts.map((post) => (post.id === id ? { ...post, bookmarksCount: post.bookmarksCount + 1 } : post)) });
      },
      addComment: async (postId, content) => {
        const comment: Comment = {
          id: crypto.randomUUID(),
          postId,
          authorId: get().currentUserId || "u-1",
          content,
          createdAt: new Date().toISOString()
        };
        const savedComment = isSupabaseConfigured ? await addCommentReal(comment) : comment;
        set({
          comments: [savedComment, ...get().comments],
          posts: get().posts.map((post) => (post.id === postId ? { ...post, commentsCount: post.commentsCount + 1 } : post))
        });
      },
      toggleTheme: () => set({ theme: get().theme === "light" ? "dark" : "light" })
    }),
    {
      name: "connect-state",
      partialize: (state) => ({
        canvasView: state.canvasView,
        theme: state.theme
      })
    }
  )
);
