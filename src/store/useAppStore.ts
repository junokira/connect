import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isSupabaseConfigured } from "../lib/supabase";
import {
  addCommentRealExtended,
  blockUserReal,
  completeAuthRedirect,
  createNotification,
  createPostReal,
  createReportReal,
  deleteCommentReal,
  deletePostReal,
  getCurrentAuthEmail,
  getSessionUserId,
  likeCommentReal,
  loadBlocksAndMutes,
  loadConnectData,
  loadNotifications as loadNotificationsReal,
  loadVerificationRequestStatus,
  markNotificationsRead as markNotificationsReadReal,
  muteUserReal,
  reactToPostReal,
  requestVerificationReal,
  sendMagicLink,
  sendPasswordReset,
  sendPhoneOtp,
  signInWithPassword,
  signInWithProvider,
  signOutReal,
  signUpWithPassword,
  toggleFollowReal,
  unblockUserReal,
  unmuteUserReal,
  updatePasswordReal,
  updateEmailReal,
  updatePostReal,
  updateProfileReal,
  uploadMediaReal
} from "../lib/supabaseData";
import { CanvasView, Comment, CommentReaction, FeedStyle, Follow, Notification, Post, PostReaction, PostType, ProfileUpdate, SignupProfile, SortMode, User, UserBlock, UserMute, VerificationRequestStatus } from "../types";
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
  sourceUrl?: string;
  sourcePlatform?: Post["sourcePlatform"];
  sourceTitle?: string;
  sourceThumb?: string;
};

type AppState = {
  users: User[];
  posts: Post[];
  comments: Comment[];
  reactions: PostReaction[];
  commentReactions: CommentReaction[];
  follows: Follow[];
  notifications: Notification[];
  unreadNotificationCount: number;
  blocks: UserBlock[];
  mutes: UserMute[];
  currentUserId: string;
  currentUserEmail: string;
  verificationStatus: VerificationRequestStatus;
  verificationReason: string;
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
  updateEmail: (email: string) => Promise<{ email: string; pendingEmail: string }>;
  requestPhoneOtp: (phone: string) => Promise<void>;
  signInWithSocialProvider: (provider: "google" | "apple") => Promise<void>;
  updateProfile: (profile: ProfileUpdate) => Promise<void>;
  requestVerification: (reason?: string) => Promise<void>;
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
  updatePost: (id: string, patch: { content?: string; caption?: string }) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  deleteComment: (commentId: string, postId: string) => Promise<void>;
  addCommentExtended: (postId: string, content: string, options?: { gifUrl?: string; parentId?: string }) => Promise<void>;
  likeComment: (commentId: string) => Promise<void>;
  loadNotifications: () => Promise<void>;
  markNotificationsRead: () => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  muteUser: (userId: string) => Promise<void>;
  unmuteUser: (userId: string) => Promise<void>;
  reportPost: (postId: string, category: string, note?: string) => Promise<void>;
  reportUser: (userId: string, category: string, note?: string) => Promise<void>;
  pinPost: (postId: string) => Promise<void>;
  followUser: (id: string) => Promise<void>;
  toggleTheme: () => void;
};

const extractHashtags = (value: string) => [...value.matchAll(/#([a-z0-9_]+)/gi)].map((match) => match[1].toLowerCase());
const emptyExtras = { blocks: [] as UserBlock[], mutes: [] as UserMute[] };
const loadSafeExtras = async (userId?: string) => {
  if (!userId) return emptyExtras;
  try {
    return await loadBlocksAndMutes(userId);
  } catch {
    return emptyExtras;
  }
};
const loadSafeNotifications = async (userId?: string) => {
  if (!userId) return [] as Notification[];
  try {
    return await loadNotificationsReal(userId);
  } catch {
    return [] as Notification[];
  }
};
const loadSafeVerification = async (userId?: string) => {
  if (!userId) return { status: "none" as VerificationRequestStatus, reason: "" };
  try {
    return await loadVerificationRequestStatus(userId);
  } catch {
    return { status: "none" as VerificationRequestStatus, reason: "" };
  }
};

const makePost = (draft: DraftInput, posts: Post[], authorId: string): Post => {
  const now = new Date().toISOString();
  const hashtags = extractHashtags(`${draft.content} ${draft.caption}`);
  const position = placeNextPost(posts, hashtags);
  return {
    id: crypto.randomUUID(),
    authorId,
    type: draft.type,
    content: draft.type === "text" || draft.type === "link" ? draft.content : "",
    caption: draft.type === "text" || draft.type === "link" ? "" : draft.caption,
    imageUrl: draft.imageUrl,
    videoUrl: draft.videoUrl,
    thumbnailUrl: draft.thumbnailUrl || draft.imageUrl,
    sourceUrl: draft.sourceUrl,
    sourcePlatform: draft.sourcePlatform,
    sourceTitle: draft.sourceTitle,
    sourceThumb: draft.sourceThumb,
    x: position.x,
    y: position.y,
    createdAt: now,
    updatedAt: now,
    likesCount: 0,
    commentsCount: 0,
    repostsCount: 0,
    bookmarksCount: 0,
    hashtags
  };
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      users: [],
      posts: [],
      comments: [],
      reactions: [],
      commentReactions: [],
      follows: [],
      notifications: [],
      unreadNotificationCount: 0,
      blocks: [],
      mutes: [],
      currentUserId: "",
      currentUserEmail: "",
      verificationStatus: "none",
      verificationReason: "",
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
            error: "CONNECT cannot reach the AWAKEN CULT sign-in service yet."
          });
          return;
        }
        try {
          set({ backendMode: "supabase", loading: true, error: undefined });
          const redirectedUserId = await completeAuthRedirect();
          const userId = redirectedUserId || (await getSessionUserId());
          const currentUserEmail = userId ? await getCurrentAuthEmail() : "";
          const data = await loadConnectData();
          const extras = await loadSafeExtras(userId);
          const notifications = await loadSafeNotifications(userId);
          const verification = await loadSafeVerification(userId);
          set({
            ...data,
            ...extras,
            notifications,
            unreadNotificationCount: notifications.filter((notification) => !notification.read).length,
            currentUserId: userId || "",
            currentUserEmail,
            verificationStatus: verification.status,
            verificationReason: verification.reason,
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
        const userId = get().currentUserId;
        const currentUserEmail = userId ? await getCurrentAuthEmail() : "";
        const extras = await loadSafeExtras(userId);
        const notifications = await loadSafeNotifications(userId);
        const verification = await loadSafeVerification(userId);
        set({ ...data, ...extras, currentUserEmail, verificationStatus: verification.status, verificationReason: verification.reason, notifications, unreadNotificationCount: notifications.filter((notification) => !notification.read).length });
      },
      signIn: async (email, password) => {
        if (!isSupabaseConfigured) {
          set({ error: "CONNECT cannot reach the AWAKEN CULT sign-in service yet." });
          return;
        }
        try {
          set({ loading: true, error: undefined });
          const userId = await signInWithPassword(email, password);
          const currentUserEmail = await getCurrentAuthEmail();
          const data = await loadConnectData();
          const extras = await loadSafeExtras(userId);
          const notifications = await loadSafeNotifications(userId);
          const verification = await loadSafeVerification(userId);
          set({ ...data, ...extras, notifications, unreadNotificationCount: notifications.filter((notification) => !notification.read).length, currentUserId: userId, currentUserEmail, verificationStatus: verification.status, verificationReason: verification.reason, authed: true, loading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Unable to sign in.", loading: false });
        }
      },
      signUp: async (email, password, profile) => {
        if (!isSupabaseConfigured) {
          set({ error: "CONNECT cannot reach the AWAKEN CULT sign-in service yet." });
          return false;
        }
        try {
          set({ loading: true, error: undefined });
          const { userId, sessionReady } = await signUpWithPassword(email, password, profile);
          if (!sessionReady) {
            set({ authed: false, currentUserId: "", currentUserEmail: "", verificationStatus: "none", verificationReason: "", loading: false, error: undefined });
            return false;
          }
          const currentUserEmail = await getCurrentAuthEmail();
          const data = await loadConnectData();
          const extras = await loadSafeExtras(userId);
          const notifications = await loadSafeNotifications(userId);
          const verification = await loadSafeVerification(userId);
          set({ ...data, ...extras, notifications, unreadNotificationCount: notifications.filter((notification) => !notification.read).length, currentUserId: userId, currentUserEmail, verificationStatus: verification.status, verificationReason: verification.reason, activeProfileId: userId, authed: true, loading: false });
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
      updateEmail: async (email) => {
        if (!get().currentUserId) throw new Error("You must be signed in to change your email.");
        const result = await updateEmailReal(email);
        set({ currentUserEmail: result.pendingEmail || result.email, error: undefined });
        return result;
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
        let featuredBannerUrl = profile.featuredBannerUrl;
        let featuredCoverUrl = profile.featuredCoverUrl;
        if (profile.avatarFile) avatarUrl = await uploadMediaReal(profile.avatarFile, userId, "profiles/avatar");
        if (profile.bannerFile) bannerUrl = await uploadMediaReal(profile.bannerFile, userId, "profiles/banner");
        if (profile.featuredBannerFile) featuredBannerUrl = await uploadMediaReal(profile.featuredBannerFile, userId, "profiles/featured/banner");
        if (profile.featuredCoverFile) featuredCoverUrl = await uploadMediaReal(profile.featuredCoverFile, userId, "profiles/featured/cover");
        const updated = await updateProfileReal(userId, { ...profile, avatarUrl, bannerUrl, featuredBannerUrl, featuredCoverUrl });
        set({
          users: get().users.map((user) => (user.id === userId ? updated : user)),
          activeProfileId: userId,
          error: undefined
        });
      },
      requestVerification: async (reason = "") => {
        const currentUser = get().users.find((user) => user.id === get().currentUserId);
        if (!currentUser) throw new Error("You must be signed in to request verification.");
        await requestVerificationReal(currentUser, reason);
        set({ verificationStatus: "pending", verificationReason: reason.trim(), error: undefined });
      },
      signOut: async () => {
        await signOutReal();
        set({ authed: false, currentUserId: "", currentUserEmail: "", verificationStatus: "none", verificationReason: "" });
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
          const target = get().posts.find((post) => post.id === id);
          if (result.active && target) void createNotification({ recipientId: target.authorId, actorId: userId, type: "like", postId: id });
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
          const target = get().posts.find((post) => post.id === id);
          if (result.active && target) void createNotification({ recipientId: target.authorId, actorId: userId, type: "repost", postId: id });
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
      updatePost: async (id, patch) => {
        const previous = get().posts;
        const target = previous.find((post) => post.id === id);
        if (!target) throw new Error("Post not found.");
        const nextPatch = target.type === "text" || target.type === "link" ? { content: patch.content ?? target.content } : { caption: patch.caption ?? patch.content ?? target.caption };
        set({ posts: previous.map((post) => (post.id === id ? { ...post, ...nextPatch, updatedAt: new Date().toISOString() } : post)), error: undefined });
        try {
          const saved = await updatePostReal(id, nextPatch);
          set({ posts: get().posts.map((post) => (post.id === id ? saved : post)), error: undefined });
        } catch (error) {
          set({ posts: previous, error: error instanceof Error ? error.message : "Could not update post." });
        }
      },
      deletePost: async (id) => {
        const previous = get().posts;
        set({ posts: previous.filter((post) => post.id !== id), activePostId: get().activePostId === id ? undefined : get().activePostId, error: undefined });
        try {
          await deletePostReal(id);
        } catch (error) {
          set({ posts: previous, error: error instanceof Error ? error.message : "Could not delete post." });
        }
      },
      deleteComment: async (commentId, postId) => {
        const previousComments = get().comments;
        const removed = previousComments.find((comment) => comment.id === commentId);
        set({
          comments: previousComments.filter((comment) => comment.id !== commentId && comment.parentId !== commentId),
          posts: get().posts.map((post) => (post.id === postId && !removed?.parentId ? { ...post, commentsCount: Math.max(0, post.commentsCount - 1) } : post)),
          error: undefined
        });
        try {
          await deleteCommentReal(commentId, postId);
        } catch (error) {
          set({ comments: previousComments, error: error instanceof Error ? error.message : "Could not delete comment." });
        }
      },
      addCommentExtended: async (postId, content, options) => {
        if (!get().currentUserId) throw new Error("You must be signed in to comment.");
        const comment: Comment = {
          id: crypto.randomUUID(),
          postId,
          authorId: get().currentUserId,
          content,
          gifUrl: options?.gifUrl,
          parentId: options?.parentId,
          likesCount: 0,
          createdAt: new Date().toISOString()
        };
        const savedComment = await addCommentRealExtended(comment);
        const post = get().posts.find((candidate) => candidate.id === postId);
        const parent = options?.parentId ? get().comments.find((candidate) => candidate.id === options.parentId) : undefined;
        set({
          comments: [savedComment, ...get().comments],
          posts: get().posts.map((item) => (item.id === postId && !options?.parentId ? { ...item, commentsCount: item.commentsCount + 1 } : item))
        });
        if (post) void createNotification({ recipientId: post.authorId, actorId: get().currentUserId, type: "comment", postId, commentId: savedComment.id });
        if (parent) void createNotification({ recipientId: parent.authorId, actorId: get().currentUserId, type: "reply", postId, commentId: savedComment.id });
        const mentioned = [...new Set([...content.matchAll(/@([a-zA-Z0-9_]+)/g)].map((match) => match[1].toLowerCase()))];
        mentioned.forEach((username) => {
          const user = get().users.find((candidate) => candidate.username.toLowerCase() === username);
          if (user) void createNotification({ recipientId: user.id, actorId: get().currentUserId, type: "mention", postId, commentId: savedComment.id });
        });
      },
      likeComment: async (commentId) => {
        const userId = get().currentUserId;
        if (!userId) throw new Error("You must be signed in to like comments.");
        const existing = get().commentReactions.find((reaction) => reaction.commentId === commentId && reaction.userId === userId);
        const optimistic: CommentReaction = existing || { commentId, userId, type: "like", createdAt: new Date().toISOString() };
        set({
          commentReactions: existing ? get().commentReactions.filter((reaction) => !(reaction.commentId === commentId && reaction.userId === userId)) : [optimistic, ...get().commentReactions],
          comments: get().comments.map((comment) => (comment.id === commentId ? { ...comment, likesCount: Math.max(0, comment.likesCount + (existing ? -1 : 1)) } : comment)),
          error: undefined
        });
        try {
          await likeCommentReal(commentId, userId);
        } catch (error) {
          set({
            commentReactions: existing ? [existing, ...get().commentReactions.filter((reaction) => !(reaction.commentId === commentId && reaction.userId === userId))] : get().commentReactions.filter((reaction) => !(reaction.commentId === commentId && reaction.userId === userId)),
            comments: get().comments.map((comment) => (comment.id === commentId ? { ...comment, likesCount: Math.max(0, comment.likesCount + (existing ? 1 : -1)) } : comment)),
            error: error instanceof Error ? error.message : "Could not like comment."
          });
        }
      },
      loadNotifications: async () => {
        const userId = get().currentUserId;
        if (!userId) return;
        const notifications = await loadNotificationsReal(userId);
        set({ notifications, unreadNotificationCount: notifications.filter((notification) => !notification.read).length });
      },
      markNotificationsRead: async () => {
        const userId = get().currentUserId;
        if (!userId) return;
        set({ notifications: get().notifications.map((notification) => ({ ...notification, read: true })), unreadNotificationCount: 0 });
        await markNotificationsReadReal(userId);
      },
      blockUser: async (id) => {
        const userId = get().currentUserId;
        if (!userId || userId === id) return;
        const block: UserBlock = { blockerId: userId, blockedId: id, createdAt: new Date().toISOString() };
        set({ blocks: [block, ...get().blocks.filter((item) => item.blockedId !== id)], follows: get().follows.filter((follow) => !(follow.followerId === userId && follow.followingId === id)) });
        await blockUserReal(userId, id);
      },
      unblockUser: async (id) => {
        const userId = get().currentUserId;
        if (!userId) return;
        set({ blocks: get().blocks.filter((item) => item.blockedId !== id) });
        await unblockUserReal(userId, id);
      },
      muteUser: async (id) => {
        const userId = get().currentUserId;
        if (!userId || userId === id) return;
        const mute: UserMute = { muterId: userId, mutedId: id, createdAt: new Date().toISOString() };
        set({ mutes: [mute, ...get().mutes.filter((item) => item.mutedId !== id)] });
        await muteUserReal(userId, id);
      },
      unmuteUser: async (id) => {
        const userId = get().currentUserId;
        if (!userId) return;
        set({ mutes: get().mutes.filter((item) => item.mutedId !== id) });
        await unmuteUserReal(userId, id);
      },
      reportPost: async (postId, category, note) => {
        if (!get().currentUserId) throw new Error("You must be signed in to report posts.");
        await createReportReal(get().currentUserId, postId, undefined, category, note);
      },
      reportUser: async (userId, category, note) => {
        if (!get().currentUserId) throw new Error("You must be signed in to report users.");
        await createReportReal(get().currentUserId, undefined, userId, category, note);
      },
      pinPost: async (postId) => {
        const previous = get().posts;
        set({ posts: previous.map((post) => (post.id === postId ? { ...post, pinned: true, x: 0, y: 0 } : post)) });
        try {
          const updated = await updatePostReal(postId, { pinned: true, x: 0, y: 0 });
          set({ posts: get().posts.map((post) => (post.id === postId ? updated : post)) });
        } catch (error) {
          set({ posts: previous, error: error instanceof Error ? error.message : "Could not pin post." });
        }
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
          if (result.active) void createNotification({ recipientId: id, actorId: userId, type: "follow" });
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
        currentUserId: state.currentUserId,
        currentUserEmail: state.currentUserEmail
      })
    }
  )
);
