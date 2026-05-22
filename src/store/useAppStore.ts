import { create } from "zustand";
import { persist } from "zustand/middleware";
import { comments as seedComments, posts as seedPosts, users as seedUsers } from "../data/seed";
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
  activePostId?: string;
  activeProfileId?: string;
  sortMode: SortMode;
  search: string;
  canvasView: CanvasView;
  theme: "light" | "dark";
  signIn: (email: string) => void;
  signOut: () => void;
  createPost: (draft: DraftInput) => Post;
  setActivePost: (id?: string) => void;
  setActiveProfile: (id?: string) => void;
  setSortMode: (mode: SortMode) => void;
  setSearch: (search: string) => void;
  setCanvasView: (view: CanvasView) => void;
  likePost: (id: string) => void;
  repostPost: (id: string) => void;
  bookmarkPost: (id: string) => void;
  addComment: (postId: string, content: string) => void;
  toggleTheme: () => void;
};

const extractHashtags = (value: string) => [...value.matchAll(/#([a-z0-9_]+)/gi)].map((match) => match[1].toLowerCase());

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      users: seedUsers,
      posts: seedPosts,
      comments: seedComments,
      currentUserId: "u-1",
      authed: true,
      activePostId: undefined,
      activeProfileId: undefined,
      sortMode: "newest",
      search: "",
      canvasView: { x: 160, y: 120, zoom: 1 },
      theme: "light",
      signIn: () => set({ authed: true, currentUserId: "u-1" }),
      signOut: () => set({ authed: false }),
      createPost: (draft) => {
        const posts = get().posts;
        const now = new Date().toISOString();
        const position = placeNextPost(posts);
        const post: Post = {
          id: `p-${crypto.randomUUID()}`,
          authorId: get().currentUserId,
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
        set({ posts: [post, ...posts], activePostId: post.id, canvasView: { x: -post.x + 280, y: -post.y + 180, zoom: 1 } });
        return post;
      },
      setActivePost: (id) => set({ activePostId: id }),
      setActiveProfile: (id) => set({ activeProfileId: id }),
      setSortMode: (mode) => set({ sortMode: mode }),
      setSearch: (search) => set({ search }),
      setCanvasView: (view) => set({ canvasView: view }),
      likePost: (id) => set({ posts: get().posts.map((post) => (post.id === id ? { ...post, likesCount: post.likesCount + 1 } : post)) }),
      repostPost: (id) => set({ posts: get().posts.map((post) => (post.id === id ? { ...post, repostsCount: post.repostsCount + 1 } : post)) }),
      bookmarkPost: (id) => set({ posts: get().posts.map((post) => (post.id === id ? { ...post, bookmarksCount: post.bookmarksCount + 1 } : post)) }),
      addComment: (postId, content) => {
        const comment: Comment = {
          id: `c-${crypto.randomUUID()}`,
          postId,
          authorId: get().currentUserId,
          content,
          createdAt: new Date().toISOString()
        };
        set({
          comments: [comment, ...get().comments],
          posts: get().posts.map((post) => (post.id === postId ? { ...post, commentsCount: post.commentsCount + 1 } : post))
        });
      },
      toggleTheme: () => set({ theme: get().theme === "light" ? "dark" : "light" })
    }),
    {
      name: "connect-state",
      partialize: (state) => ({
        posts: state.posts,
        comments: state.comments,
        canvasView: state.canvasView,
        theme: state.theme,
        authed: state.authed
      })
    }
  )
);
