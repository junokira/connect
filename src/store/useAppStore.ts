import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isSupabaseConfigured } from "../lib/supabase";
import { addCommentReal, createPostReal, getSessionUserId, loadConnectData, reactToPostReal, signInOrSignUp, signOutReal, uploadMediaReal } from "../lib/supabaseData";
import { CanvasView, Comment, FeedStyle, Post, PostReaction, PostType, SignupProfile, SortMode, User } from "../types";
import { placeNextPost } from "../utils/placement";

type DraftInput = {
  type: PostType;
  content: string;
  caption: string;
  imageUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  mediaFile?: File;
  thumbnailFile?: File;
};

type AppState = {
  users: User[];
  posts: Post[];
  comments: Comment[];
  reactions: PostReaction[];
  currentUserId: string;
  authed: boolean;
  backendMode: "supabase";
  loading: boolean;
  error?: string;
  activePostId?: string;
  activeProfileId?: string;
  sortMode: SortMode;
  feedStyle: FeedStyle;
  search: string;
  canvasView: CanvasView;
  theme: "light" | "dark";
  initialize: () => Promise<void>;
  refreshData: () => Promise<void>;
  signIn: (email: string, password?: string, profile?: SignupProfile) => Promise<void>;
  signOut: () => Promise<void>;
  createPost: (draft: DraftInput) => Promise<Post>;
  setActivePost: (id?: string) => void;
  setActiveProfile: (id?: string) => void;
  setSortMode: (mode: SortMode) => void;
  setFeedStyle: (style: FeedStyle) => void;
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
      users: [],
      posts: [],
      comments: [],
      reactions: [],
      currentUserId: "",
      authed: false,
      backendMode: "supabase",
      loading: true,
      error: undefined,
      activePostId: undefined,
      activeProfileId: undefined,
      sortMode: "newest",
      feedStyle: "classic",
      search: "",
      canvasView: { x: 160, y: 120, zoom: 1 },
      theme: "light",
      initialize: async () => {
        if (!isSupabaseConfigured) {
          set({
            backendMode: "supabase",
            loading: false,
            authed: false,
            error: "CONNECT needs Supabase environment variables before launch: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
          });
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
        if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
        const data = await loadConnectData();
        set(data);
      },
      signIn: async (email, password = "", profile) => {
        if (!isSupabaseConfigured) {
          set({ error: "Supabase is required for sign in. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel." });
          return;
        }
        try {
          set({ loading: true, error: undefined });
          const userId = await signInOrSignUp(email, password, profile);
          const data = await loadConnectData();
          set({ ...data, currentUserId: userId, activeProfileId: userId, authed: true, loading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Unable to sign in.", loading: false });
        }
      },
      signOut: async () => {
        await signOutReal();
        set({ authed: false, currentUserId: "" });
      },
      createPost: async (draft) => {
        if (!get().currentUserId) throw new Error("You must be signed in to create a post.");
        let imageUrl = draft.imageUrl;
        let videoUrl = draft.videoUrl;
        let thumbnailUrl = draft.thumbnailUrl;
        if (draft.mediaFile) {
          const uploadedUrl = await uploadMediaReal(draft.mediaFile, get().currentUserId);
          if (draft.type === "photo") imageUrl = uploadedUrl;
          if (draft.type === "video") videoUrl = uploadedUrl;
        }
        if (draft.thumbnailFile) {
          thumbnailUrl = await uploadMediaReal(draft.thumbnailFile, get().currentUserId);
        }
        const preparedDraft = { ...draft, imageUrl, videoUrl, thumbnailUrl };
        const post = makePost(preparedDraft, get().posts, get().currentUserId);
        const savedPost = await createPostReal(post);
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
      setFeedStyle: (feedStyle) => set({ feedStyle }),
      setSearch: (search) => set({ search }),
      setCanvasView: (view) => set({ canvasView: view }),
      likePost: async (id) => {
        try {
          const reaction = await reactToPostReal(id, get().currentUserId, "like");
          if (!reaction) return;
          set({ posts: get().posts.map((post) => (post.id === id ? { ...post, likesCount: post.likesCount + 1 } : post)), error: undefined });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Could not like this post." });
        }
      },
      repostPost: async (id) => {
        try {
          const reaction = await reactToPostReal(id, get().currentUserId, "repost");
          if (!reaction) return;
          set({
            reactions: [reaction, ...get().reactions],
            posts: get().posts.map((post) => (post.id === id ? { ...post, repostsCount: post.repostsCount + 1 } : post)),
            error: undefined
          });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Could not repost this post." });
        }
      },
      bookmarkPost: async (id) => {
        try {
          const reaction = await reactToPostReal(id, get().currentUserId, "bookmark");
          if (!reaction) return;
          set({ posts: get().posts.map((post) => (post.id === id ? { ...post, bookmarksCount: post.bookmarksCount + 1 } : post)), error: undefined });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Could not bookmark this post." });
        }
      },
      addComment: async (postId, content) => {
        if (!get().currentUserId) throw new Error("You must be signed in to comment.");
        const comment: Comment = {
          id: crypto.randomUUID(),
          postId,
          authorId: get().currentUserId,
          content,
          createdAt: new Date().toISOString()
        };
        const savedComment = await addCommentReal(comment);
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
        theme: state.theme,
        feedStyle: state.feedStyle,
        authed: state.authed,
        currentUserId: state.currentUserId
      })
    }
  )
);
