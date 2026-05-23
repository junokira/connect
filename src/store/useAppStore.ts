import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isSupabaseConfigured } from "../lib/supabase";
import {
  addCommentReal,
  completeAuthRedirect,
  createPostReal,
  getSessionUserId,
  loadConnectData,
  reactToPostReal,
  sendMagicLink,
  sendPasswordReset,
  sendPhoneOtp,
  signInWithPassword,
  signInWithProvider,
  signOutReal,
  signUpWithPassword,
  toggleFollowReal,
  updatePasswordReal,
  updateProfileReal,
  uploadMediaReal
} from "../lib/supabaseData";
import { CanvasView, Comment, FeedStyle, Follow, Post, PostReaction, PostType, ProfileUpdate, SignupProfile, SortMode, User } from "../types";
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
  follows: Follow[];
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
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, profile: SignupProfile) => Promise<boolean>;
  requestMagicLink: (email: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  requestPhoneOtp: (phone: string) => Promise<void>;
  signInWithSocialProvider: (provider: "google" | "apple") => Promise<void>;
  updateProfile: (profile: ProfileUpdate) => Promise<void>;
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
  followUser: (id: string) => Promise<void>;
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
      follows: [],
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
      canvasView: { x: 0, y: 0, zoom: 1 },
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
          const redirectedUserId = await completeAuthRedirect();
          const userId = redirectedUserId || (await getSessionUserId());
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
      signIn: async (email, password) => {
        if (!isSupabaseConfigured) {
          set({ error: "Supabase is required for sign in. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel." });
          return;
        }
        try {
          set({ loading: true, error: undefined });
          const userId = await signInWithPassword(email, password);
          const data = await loadConnectData();
          set({ ...data, currentUserId: userId, authed: true, loading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Unable to sign in.", loading: false });
        }
      },
      signUp: async (email, password, profile) => {
        if (!isSupabaseConfigured) {
          set({ error: "Supabase is required for sign up. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel." });
          return false;
        }
        try {
          set({ loading: true, error: undefined });
          const { userId, sessionReady } = await signUpWithPassword(email, password, profile);
          if (!sessionReady) {
            set({ authed: false, currentUserId: "", loading: false, error: undefined });
            return false;
          }
          const data = await loadConnectData();
          set({ ...data, currentUserId: userId, activeProfileId: userId, authed: true, loading: false });
          return true;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Unable to create your account.", loading: false });
          return false;
        }
      },
      requestMagicLink: async (email) => {
        try {
          set({ loading: true, error: undefined });
          await sendMagicLink(email);
          set({ loading: false, error: undefined });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Could not send a magic link.", loading: false });
          throw error;
        }
      },
      requestPasswordReset: async (email) => {
        try {
          set({ loading: true, error: undefined });
          await sendPasswordReset(email);
          set({ loading: false, error: undefined });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Could not send password reset email.", loading: false });
          throw error;
        }
      },
      updatePassword: async (password) => {
        if (!get().currentUserId) throw new Error("You must be signed in to set a password.");
        await updatePasswordReal(password);
        set({ error: undefined });
      },
      requestPhoneOtp: async (phone) => {
        try {
          set({ loading: true, error: undefined });
          await sendPhoneOtp(phone);
          set({ loading: false, error: undefined });
        } catch (error) {
          set({ error: error instanceof Error ? `${error.message} Phone auth requires Supabase SMS provider configuration.` : "Phone auth requires Supabase SMS provider configuration.", loading: false });
          throw error;
        }
      },
      signInWithSocialProvider: async (provider) => {
        try {
          set({ loading: true, error: undefined });
          await signInWithProvider(provider);
          set({ loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? `${error.message} ${provider} sign-in requires provider credentials in Supabase.` : `${provider} sign-in requires provider credentials in Supabase.`,
            loading: false
          });
          throw error;
        }
      },
      updateProfile: async (profile) => {
        const userId = get().currentUserId;
        if (!userId) throw new Error("You must be signed in to edit your profile.");
        let avatarUrl = profile.avatarUrl;
        let bannerUrl = profile.bannerUrl;
        if (profile.avatarFile) avatarUrl = await uploadMediaReal(profile.avatarFile, userId, "profiles/avatar");
        if (profile.bannerFile) bannerUrl = await uploadMediaReal(profile.bannerFile, userId, "profiles/banner");
        const updated = await updateProfileReal(userId, { ...profile, avatarUrl, bannerUrl });
        set({
          users: get().users.map((user) => (user.id === userId ? updated : user)),
          activeProfileId: userId,
          error: undefined
        });
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
          canvasView: { x: -savedPost.x, y: -savedPost.y, zoom: 1 }
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
        const userId = get().currentUserId;
        if (!userId) throw new Error("You must be signed in to like posts.");
        const existing = get().reactions.find((reaction) => reaction.postId === id && reaction.userId === userId && reaction.type === "like");
        const optimisticReaction: PostReaction = existing || { postId: id, userId, type: "like", createdAt: new Date().toISOString() };
        set({
          reactions: existing ? get().reactions.filter((reaction) => !(reaction.postId === id && reaction.userId === userId && reaction.type === "like")) : [optimisticReaction, ...get().reactions],
          posts: get().posts.map((post) => (post.id === id ? { ...post, likesCount: Math.max(0, post.likesCount + (existing ? -1 : 1)) } : post)),
          error: undefined
        });
        try {
          const result = await reactToPostReal(id, userId, "like");
          set({
            reactions: result.active ? [result.reaction, ...get().reactions.filter((reaction) => !(reaction.postId === id && reaction.userId === userId && reaction.type === "like"))] : get().reactions.filter((reaction) => !(reaction.postId === id && reaction.userId === userId && reaction.type === "like")),
            error: undefined
          });
        } catch (error) {
          set({
            reactions: existing ? [existing, ...get().reactions.filter((reaction) => !(reaction.postId === id && reaction.userId === userId && reaction.type === "like"))] : get().reactions.filter((reaction) => !(reaction.postId === id && reaction.userId === userId && reaction.type === "like")),
            posts: get().posts.map((post) => (post.id === id ? { ...post, likesCount: Math.max(0, post.likesCount + (existing ? 1 : -1)) } : post))
          });
          set({ error: error instanceof Error ? error.message : "Could not like this post." });
        }
      },
      repostPost: async (id) => {
        const userId = get().currentUserId;
        if (!userId) throw new Error("You must be signed in to repost.");
        const existing = get().reactions.find((reaction) => reaction.postId === id && reaction.userId === userId && reaction.type === "repost");
        const optimisticReaction: PostReaction = existing || { postId: id, userId, type: "repost", createdAt: new Date().toISOString() };
        set({
          reactions: existing ? get().reactions.filter((reaction) => !(reaction.postId === id && reaction.userId === userId && reaction.type === "repost")) : [optimisticReaction, ...get().reactions],
          posts: get().posts.map((post) => (post.id === id ? { ...post, repostsCount: Math.max(0, post.repostsCount + (existing ? -1 : 1)) } : post)),
          error: undefined
        });
        try {
          const result = await reactToPostReal(id, userId, "repost");
          set({
            reactions: result.active ? [result.reaction, ...get().reactions.filter((reaction) => !(reaction.postId === id && reaction.userId === userId && reaction.type === "repost"))] : get().reactions.filter((reaction) => !(reaction.postId === id && reaction.userId === userId && reaction.type === "repost")),
            error: undefined
          });
        } catch (error) {
          set({
            reactions: existing ? [existing, ...get().reactions.filter((reaction) => !(reaction.postId === id && reaction.userId === userId && reaction.type === "repost"))] : get().reactions.filter((reaction) => !(reaction.postId === id && reaction.userId === userId && reaction.type === "repost")),
            posts: get().posts.map((post) => (post.id === id ? { ...post, repostsCount: Math.max(0, post.repostsCount + (existing ? 1 : -1)) } : post))
          });
          set({ error: error instanceof Error ? error.message : "Could not repost this post." });
        }
      },
      bookmarkPost: async (id) => {
        const userId = get().currentUserId;
        if (!userId) throw new Error("You must be signed in to bookmark posts.");
        const existing = get().reactions.find((reaction) => reaction.postId === id && reaction.userId === userId && reaction.type === "bookmark");
        const optimisticReaction: PostReaction = existing || { postId: id, userId, type: "bookmark", createdAt: new Date().toISOString() };
        set({
          reactions: existing ? get().reactions.filter((reaction) => !(reaction.postId === id && reaction.userId === userId && reaction.type === "bookmark")) : [optimisticReaction, ...get().reactions],
          posts: get().posts.map((post) => (post.id === id ? { ...post, bookmarksCount: Math.max(0, post.bookmarksCount + (existing ? -1 : 1)) } : post)),
          error: undefined
        });
        try {
          const result = await reactToPostReal(id, userId, "bookmark");
          set({
            reactions: result.active ? [result.reaction, ...get().reactions.filter((reaction) => !(reaction.postId === id && reaction.userId === userId && reaction.type === "bookmark"))] : get().reactions.filter((reaction) => !(reaction.postId === id && reaction.userId === userId && reaction.type === "bookmark")),
            error: undefined
          });
        } catch (error) {
          set({
            reactions: existing ? [existing, ...get().reactions.filter((reaction) => !(reaction.postId === id && reaction.userId === userId && reaction.type === "bookmark"))] : get().reactions.filter((reaction) => !(reaction.postId === id && reaction.userId === userId && reaction.type === "bookmark")),
            posts: get().posts.map((post) => (post.id === id ? { ...post, bookmarksCount: Math.max(0, post.bookmarksCount + (existing ? 1 : -1)) } : post))
          });
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
      followUser: async (id) => {
        const userId = get().currentUserId;
        if (!userId) throw new Error("You must be signed in to follow people.");
        if (userId === id) throw new Error("You cannot follow yourself.");
        const existing = get().follows.find((follow) => follow.followerId === userId && follow.followingId === id);
        const optimisticFollow: Follow = existing || { followerId: userId, followingId: id, createdAt: new Date().toISOString() };
        set({
          follows: existing ? get().follows.filter((follow) => !(follow.followerId === userId && follow.followingId === id)) : [optimisticFollow, ...get().follows],
          users: get().users.map((user) => {
            if (user.id === id) return { ...user, followersCount: Math.max(0, user.followersCount + (existing ? -1 : 1)) };
            if (user.id === userId) return { ...user, followingCount: Math.max(0, user.followingCount + (existing ? -1 : 1)) };
            return user;
          }),
          error: undefined
        });
        try {
          const result = await toggleFollowReal(userId, id);
          set({
            follows: result.active ? [result.follow, ...get().follows.filter((follow) => !(follow.followerId === userId && follow.followingId === id))] : get().follows.filter((follow) => !(follow.followerId === userId && follow.followingId === id)),
            error: undefined
          });
        } catch (error) {
          set({
            follows: existing ? [existing, ...get().follows.filter((follow) => !(follow.followerId === userId && follow.followingId === id))] : get().follows.filter((follow) => !(follow.followerId === userId && follow.followingId === id)),
            users: get().users.map((user) => {
              if (user.id === id) return { ...user, followersCount: Math.max(0, user.followersCount + (existing ? 1 : -1)) };
              if (user.id === userId) return { ...user, followingCount: Math.max(0, user.followingCount + (existing ? 1 : -1)) };
              return user;
            }),
            error: error instanceof Error ? error.message : "Could not update follow."
          });
        }
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
