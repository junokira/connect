import { create } from "zustand";
import { persist } from "zustand/middleware";
import { comments as seedComments, posts as seedPosts, users as seedUsers } from "../data/seed";
import { isSupabaseConfigured } from "../lib/supabase";
import { addCommentReal, createPostReal, getSessionUserId, loadConnectData, reactToPostReal, signInOrSignUp, signOutReal, uploadMediaReal } from "../lib/supabaseData";
import { CanvasView, Comment, FeedStyle, Post, PostType, SignupProfile, SortMode, User } from "../types";
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
  currentUserId: string;
  authed: boolean;
  backendMode: "mock" | "supabase";
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

const profileFromSignup = (email: string, profile?: SignupProfile): User => {
  const id = `local-${crypto.randomUUID()}`;
  const fallbackUsername = email.split("@")[0].replace(/[^a-z0-9_]/gi, "").toLowerCase() || `user${id.slice(6, 11)}`;
  return {
    id,
    displayName: profile?.displayName.trim() || fallbackUsername,
    username: (profile?.username.trim() || fallbackUsername).replace(/^@/, "").toLowerCase(),
    avatarUrl: profile?.avatarUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(profile?.displayName || fallbackUsername)}`,
    bannerUrl: profile?.bannerUrl || "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1400&q=80",
    bio: profile?.bio || "New to CONNECT.",
    location: profile?.location || "",
    website: profile?.website || "",
    createdAt: new Date().toISOString(),
    followersCount: 0,
    followingCount: 0
  };
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      users: seedUsers,
      posts: seedPosts,
      comments: seedComments,
      currentUserId: "u-1",
      authed: false,
      backendMode: isSupabaseConfigured ? "supabase" : "mock",
      loading: isSupabaseConfigured,
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
          set({ backendMode: "mock", loading: false });
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
      signIn: async (email, password = "connect-demo-password", profile) => {
        if (!isSupabaseConfigured) {
          const existingUser = get().users.find((user) => user.username === profile?.username || user.username === email.split("@")[0]);
          const user = existingUser || profileFromSignup(email, profile);
          set({
            authed: true,
            currentUserId: user.id,
            activeProfileId: user.id,
            users: existingUser ? get().users : [user, ...get().users]
          });
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
        if (isSupabaseConfigured) await signOutReal();
        set({ authed: false, currentUserId: "" });
      },
      createPost: async (draft) => {
        let imageUrl = draft.imageUrl;
        let videoUrl = draft.videoUrl;
        let thumbnailUrl = draft.thumbnailUrl;
        if (draft.mediaFile) {
          const uploadedUrl = isSupabaseConfigured
            ? await uploadMediaReal(draft.mediaFile, get().currentUserId)
            : URL.createObjectURL(draft.mediaFile);
          if (draft.type === "photo") imageUrl = uploadedUrl;
          if (draft.type === "video") videoUrl = uploadedUrl;
        }
        if (draft.thumbnailFile) {
          thumbnailUrl = isSupabaseConfigured ? await uploadMediaReal(draft.thumbnailFile, get().currentUserId) : URL.createObjectURL(draft.thumbnailFile);
        }
        const preparedDraft = { ...draft, imageUrl, videoUrl, thumbnailUrl };
        const post = makePost(preparedDraft, get().posts, get().currentUserId || "u-1");
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
      setFeedStyle: (feedStyle) => set({ feedStyle }),
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
        theme: state.theme,
        feedStyle: state.feedStyle,
        ...(!isSupabaseConfigured
          ? {
              users: state.users,
              posts: state.posts,
              comments: state.comments,
              currentUserId: state.currentUserId,
              authed: state.authed
            }
          : {})
      })
    }
  )
);
