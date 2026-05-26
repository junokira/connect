import { Comment, CommentReaction, Follow, Notification, OGPreview, Post, PostReaction, PostType, ProfileUpdate, SignupProfile, User, UserBlock, UserMute, VerificationRequest, VerificationRequestStatus } from "../types";
import { supabase } from "./supabase";

type ProfileRow = {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string;
  banner_url: string;
  bio: string;
  location: string;
  website: string;
  featured_title?: string | null;
  featured_description?: string | null;
  featured_link?: string | null;
  featured_banner_url?: string | null;
  featured_cover_url?: string | null;
  created_at: string;
  followers_count: number;
  following_count: number;
  verified?: boolean | null;
  is_admin?: boolean | null;
  banned?: boolean | null;
  post_streak?: number | null;
  last_post_at?: string | null;
};

export const DEFAULT_AVATAR_URL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 240'%3E%3Crect width='240' height='240' rx='120' fill='%23e5e7eb'/%3E%3Ccircle cx='120' cy='92' r='42' fill='%239ca3af'/%3E%3Cpath d='M48 211c10-45 42-70 72-70s62 25 72 70' fill='%239ca3af'/%3E%3C/svg%3E";

type PostRow = {
  id: string;
  author_id: string;
  type: PostType;
  content: string;
  caption: string;
  image_url?: string | null;
  video_url?: string | null;
  thumbnail_url?: string | null;
  source_url?: string | null;
  source_platform?: string | null;
  source_title?: string | null;
  source_thumb?: string | null;
  muted?: boolean | null;
  x?: number | null;
  y?: number | null;
  created_at: string;
  updated_at: string;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  bookmarks_count: number;
  hashtags: string[];
  pinned: boolean;
};

type CommentRow = {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  gif_url?: string | null;
  parent_id?: string | null;
  likes_count?: number | null;
  created_at: string;
};

type CommentReactionRow = {
  comment_id: string;
  user_id: string;
  type: "like";
  created_at: string;
};

type ReactionRow = {
  post_id: string;
  user_id: string;
  type: "like" | "repost" | "bookmark";
  created_at: string;
};

type FollowRow = {
  follower_id: string;
  following_id: string;
  created_at: string;
};

type NotificationRow = {
  id: string;
  recipient_id: string;
  actor_id: string;
  type: Notification["type"];
  post_id?: string | null;
  comment_id?: string | null;
  read: boolean;
  created_at: string;
};

type UserBlockRow = {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
};

type UserMuteRow = {
  muter_id: string;
  muted_id: string;
  created_at: string;
};

const legacyVerifiedCutoff = Date.parse("2026-05-23T12:05:00.000Z");

const toUser = (row: ProfileRow): User => ({
  id: row.id,
  displayName: row.display_name,
  username: row.username,
  avatarUrl: row.avatar_url,
  bannerUrl: row.banner_url,
  bio: row.bio,
  location: row.location,
  website: row.website,
  featuredTitle: row.featured_title || "",
  featuredDescription: row.featured_description || "",
  featuredLink: row.featured_link || "",
  featuredBannerUrl: row.featured_banner_url || "",
  featuredCoverUrl: row.featured_cover_url || "",
  createdAt: row.created_at,
  followersCount: row.followers_count,
  followingCount: row.following_count,
  verified: Boolean(row.verified) || Date.parse(row.created_at) < legacyVerifiedCutoff,
  isAdmin: Boolean(row.is_admin),
  banned: Boolean(row.banned),
  postStreak: row.post_streak ?? 0,
  lastPostAt: row.last_post_at || undefined
});

type VerificationRequestRow = {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  reason?: string | null;
  status: VerificationRequestStatus;
  created_at: string;
  reviewed_at?: string | null;
};

const toVerificationRequest = (row: VerificationRequestRow): VerificationRequest => ({
  id: row.id,
  userId: row.user_id,
  username: row.username,
  displayName: row.display_name,
  reason: row.reason || "",
  status: row.status,
  createdAt: row.created_at,
  reviewedAt: row.reviewed_at || undefined
});

const toPost = (row: PostRow): Post => ({
  id: row.id,
  authorId: row.author_id,
  type: row.type,
  content: row.content,
  caption: row.caption,
  imageUrl: row.image_url || undefined,
  videoUrl: row.video_url || undefined,
  thumbnailUrl: row.thumbnail_url || undefined,
  sourceUrl: row.source_url || undefined,
  sourcePlatform: (row.source_platform as Post["sourcePlatform"]) || undefined,
  sourceTitle: row.source_title || undefined,
  sourceThumb: row.source_thumb || undefined,
  muted: row.muted || false,
  x: Number.isFinite(row.x) ? Number(row.x) : 0,
  y: Number.isFinite(row.y) ? Number(row.y) : 0,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  likesCount: row.likes_count,
  commentsCount: row.comments_count,
  repostsCount: row.reposts_count,
  bookmarksCount: row.bookmarks_count,
  hashtags: row.hashtags,
  pinned: row.pinned
});

const fallbackCanvasPosition = (index: number) => {
  if (index === 0) return { x: 0, y: 0 };
  const ring = Math.ceil((Math.sqrt(index + 1) - 1) / 2);
  const slots = Math.max(8, ring * 8);
  const slot = index % slots;
  const radius = 290 + ring * 255;
  const angle = (slot / slots) * Math.PI * 2 + ring * 0.38;
  return { x: Math.round(Math.cos(angle) * radius), y: Math.round(Math.sin(angle) * radius) };
};

const ensureCanvasPositions = (posts: Post[]) => {
  const seen = new Set<string>();
  let fallbackIndex = 0;
  return posts
    .slice()
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
    .map((post) => {
      const key = `${post.x}:${post.y}`;
      const invalid = !Number.isFinite(post.x) || !Number.isFinite(post.y);
      const duplicated = seen.has(key);
      if (!invalid && !duplicated) {
        seen.add(key);
        return post;
      }
      let position = fallbackCanvasPosition(fallbackIndex);
      while (seen.has(`${position.x}:${position.y}`)) {
        fallbackIndex += 1;
        position = fallbackCanvasPosition(fallbackIndex);
      }
      fallbackIndex += 1;
      seen.add(`${position.x}:${position.y}`);
      return { ...post, ...position };
    })
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
};

const toComment = (row: CommentRow): Comment => ({
  id: row.id,
  postId: row.post_id,
  authorId: row.author_id,
  content: row.content,
  gifUrl: row.gif_url || undefined,
  parentId: row.parent_id || undefined,
  likesCount: row.likes_count ?? 0,
  createdAt: row.created_at
});

const toCommentReaction = (row: CommentReactionRow): CommentReaction => ({
  commentId: row.comment_id,
  userId: row.user_id,
  type: row.type,
  createdAt: row.created_at
});

const toReaction = (row: ReactionRow): PostReaction => ({
  postId: row.post_id,
  userId: row.user_id,
  type: row.type,
  createdAt: row.created_at
});

const toFollow = (row: FollowRow): Follow => ({
  followerId: row.follower_id,
  followingId: row.following_id,
  createdAt: row.created_at
});

function requireSupabase() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

function authRedirectUrl(mode: "confirmed" | "magic" | "reset" = "confirmed") {
  const origin = typeof window === "undefined" ? "https://connect-one-kappa.vercel.app" : window.location.origin;
  return `${origin}/?auth=${mode}`;
}

export function normalizeUsername(value: string, fallback = "connectuser") {
  const cleaned = value
    .trim()
    .replace(/^@+/, "")
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_[0-9a-fA-F]{5,8}$/, "")
    .slice(0, 24);
  return cleaned || fallback;
}

async function resolveAvailableUsername(username: string, currentUserId?: string) {
  const client = requireSupabase();
  const base = normalizeUsername(username);
  for (let index = 0; index < 100; index += 1) {
    const candidate = index === 0 ? base : `${base}${index}`;
    let query = client.from("profiles").select("id").eq("username", candidate).limit(1);
    if (currentUserId) query = query.neq("id", currentUserId);
    const { data, error } = await query;
    if (error) throw error;
    if (!data?.length) return candidate;
  }
  throw new Error("That username is taken. Try a slightly different one.");
}

export async function getSessionUserId() {
  const client = requireSupabase();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session?.user.id;
}

export async function getCurrentAuthEmail() {
  const client = requireSupabase();
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  return data.user?.email || "";
}

export async function completeAuthRedirect() {
  if (typeof window === "undefined") return undefined;
  const client = requireSupabase();
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const authMode = url.searchParams.get("auth");

  if (code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (error) throw error;
  }

  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  const user = data.session?.user;

  if (code || authMode) {
    url.searchParams.delete("code");
    url.searchParams.delete("auth");
    url.searchParams.delete("error");
    url.searchParams.delete("error_code");
    url.searchParams.delete("error_description");
    window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
  }

  if (!user) return undefined;
  await ensureProfile(user.id, user.email || `${user.id}@connect.local`, {
    displayName: user.user_metadata?.display_name || user.email?.split("@")[0] || "CONNECT user",
    username: user.user_metadata?.username || user.email?.split("@")[0] || "connectuser",
    bio: user.user_metadata?.bio || "New to CONNECT.",
    location: user.user_metadata?.location || "",
    website: user.user_metadata?.website || "",
    avatarUrl: user.user_metadata?.avatar_url || DEFAULT_AVATAR_URL,
    bannerUrl: user.user_metadata?.banner_url
  });
  return user.id;
}

export async function signInWithPassword(email: string, password: string) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    if (/invalid login credentials/i.test(error.message)) {
      throw new Error("Email or password is incorrect. If you joined with a magic link, use Forgot password to set a password.");
    }
    throw error;
  }
  if (!data.user) throw new Error("Supabase did not return a user.");
  return data.user.id;
}

export async function emailAlreadyRegistered(email: string) {
  const client = requireSupabase();
  const { data, error } = await client.rpc("connect_email_registered", { target_email: email.trim().toLowerCase() });
  if (error) return false;
  return Boolean(data);
}

export async function signUpWithPassword(email: string, password: string, profile: SignupProfile) {
  const client = requireSupabase();
  if (await emailAlreadyRegistered(email)) {
    throw new Error("An account with this email already exists. Sign in instead.");
  }
  const username = await resolveAvailableUsername(profile.username || email.split("@")[0]);
  const displayName = profile?.displayName?.trim() || username;

  const { data: signUpData, error: signUpError } = await client.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: authRedirectUrl("confirmed"),
      data: {
        display_name: displayName,
        full_name: displayName,
        name: displayName,
        username,
        bio: profile?.bio,
        location: profile?.location,
        website: profile?.website,
        avatar_url: profile?.avatarUrl || DEFAULT_AVATAR_URL,
        banner_url: profile?.bannerUrl
      }
    }
  });
  if (signUpError) throw signUpError;
  if (!signUpData.user) throw new Error("Supabase did not return a user.");
  if (!signUpData.session) return { userId: signUpData.user.id, sessionReady: false };
  await ensureProfile(signUpData.user.id, email, { ...profile, username });
  return { userId: signUpData.user.id, sessionReady: true };
}

export async function sendPasswordReset(email: string) {
  const client = requireSupabase();
  const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: authRedirectUrl("reset") });
  if (error) throw error;
}

export async function updatePasswordReal(password: string) {
  const client = requireSupabase();
  const { error } = await client.auth.updateUser({ password });
  if (error) throw error;
}

export async function updateEmailReal(email: string) {
  const client = requireSupabase();
  const nextEmail = email.trim().toLowerCase();
  const { data, error } = await client.auth.updateUser({ email: nextEmail }, { emailRedirectTo: authRedirectUrl("confirmed") });
  if (error) {
    if (/already registered|already exists|duplicate/i.test(error.message)) {
      throw new Error("That email is already connected to another CONNECT account.");
    }
    throw error;
  }
  const user = data.user as typeof data.user & { new_email?: string };
  return {
    email: user?.email || nextEmail,
    pendingEmail: user?.new_email || (user?.email === nextEmail ? "" : nextEmail)
  };
}

export async function requestVerificationReal(user: User, reason = "") {
  const client = requireSupabase();
  const { error } = await client.from("verification_requests").insert({
    user_id: user.id,
    username: user.username,
    display_name: user.displayName,
    reason: reason.trim(),
    status: "pending"
  });
  if (error) {
    if (/duplicate key/i.test(error.message)) throw new Error("Your verification request is already pending.");
    throw error;
  }
}

export async function loadVerificationRequestStatus(userId: string): Promise<{ status: VerificationRequestStatus; reason: string }> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("verification_requests")
    .select("status, reason, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    if (/relation .*verification_requests/i.test(error.message)) return { status: "none", reason: "" };
    throw error;
  }
  return { status: (data?.status as VerificationRequestStatus | undefined) || "none", reason: data?.reason || "" };
}

export async function loadAdminDashboardReal() {
  const client = requireSupabase();
  const [{ data: users, error: usersError }, { data: requests, error: requestsError }] = await Promise.all([
    client.rpc("connect_admin_users"),
    client.rpc("connect_admin_verification_requests")
  ]);
  if (usersError) throw usersError;
  if (requestsError) throw requestsError;
  return {
    users: ((users || []) as ProfileRow[]).map(toUser),
    verificationRequests: ((requests || []) as VerificationRequestRow[]).map(toVerificationRequest)
  };
}

export async function adminUpdateUserReal(userId: string, patch: { username?: string; displayName?: string; verified?: boolean; banned?: boolean }) {
  const client = requireSupabase();
  const { data, error } = await client.rpc("connect_admin_update_user", {
    target_user_id: userId,
    next_username: patch.username ?? null,
    next_display_name: patch.displayName ?? null,
    next_verified: patch.verified ?? null,
    next_banned: patch.banned ?? null
  });
  if (error) throw error;
  return toUser(data as ProfileRow);
}

export async function adminReviewVerificationReal(requestId: string, status: "approved" | "rejected") {
  const client = requireSupabase();
  const { data, error } = await client.rpc("connect_admin_review_verification", {
    target_request_id: requestId,
    next_status: status
  });
  if (error) throw error;
  return toVerificationRequest(data as VerificationRequestRow);
}

export async function sendMagicLink(email: string) {
  const client = requireSupabase();
  const { error } = await client.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: authRedirectUrl("magic") }
  });
  if (error) throw error;
}

export async function signInWithProvider(provider: "google" | "apple") {
  const client = requireSupabase();
  const { error } = await client.auth.signInWithOAuth({
    provider,
    options: { redirectTo: authRedirectUrl("confirmed") }
  });
  if (error) throw error;
}

export async function sendPhoneOtp(phone: string) {
  const client = requireSupabase();
  const { error } = await client.auth.signInWithOtp({ phone });
  if (error) throw error;
}

export async function signOutReal() {
  const client = requireSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function ensureProfile(userId: string, email: string, profile?: SignupProfile) {
  const client = requireSupabase();
  const username = await resolveAvailableUsername(profile?.username || email.split("@")[0], userId);
  const { data } = await client.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (data) return toUser(data as ProfileRow);

  const { data: createdProfile, error } = await client
    .from("profiles")
    .insert({
      id: userId,
      display_name: profile?.displayName || username,
      username,
      avatar_url: profile?.avatarUrl || DEFAULT_AVATAR_URL,
      banner_url: profile?.bannerUrl || undefined,
      bio: profile?.bio || "New to CONNECT.",
      location: profile?.location || "",
      website: profile?.website || "",
      featured_title: "",
      featured_description: "",
      featured_link: "",
      featured_banner_url: "",
      featured_cover_url: ""
    })
    .select("*")
    .single();
  if (error) throw error;
  return toUser(createdProfile as ProfileRow);
}

export async function updateProfileReal(userId: string, profile: ProfileUpdate) {
  const client = requireSupabase();
  const username = await resolveAvailableUsername(profile.username, userId);
  const displayName = profile.displayName.trim();
  const avatarUrl = profile.avatarUrl.trim() || DEFAULT_AVATAR_URL;
  const { data, error } = await client
    .from("profiles")
    .update({
      display_name: displayName,
      username,
      avatar_url: avatarUrl,
      banner_url: profile.bannerUrl.trim(),
      bio: profile.bio.trim(),
      location: profile.location.trim(),
      website: profile.website.trim(),
      featured_title: profile.featuredTitle.trim(),
      featured_description: profile.featuredDescription.trim(),
      featured_link: profile.featuredLink.trim(),
      featured_banner_url: profile.featuredBannerUrl.trim(),
      featured_cover_url: profile.featuredCoverUrl.trim()
    })
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw error;
  const { error: authError } = await client.auth.updateUser({
    data: {
      display_name: displayName,
      full_name: displayName,
      name: displayName,
      username,
      avatar_url: avatarUrl
    }
  });
  if (authError) throw authError;
  return toUser(data as ProfileRow);
}

export async function loadConnectData() {
  const client = requireSupabase();
  const [
    { data: profiles, error: profilesError },
    { data: posts, error: postsError },
    { data: comments, error: commentsError },
    { data: reactions, error: reactionsError },
    { data: follows, error: followsError },
    { data: commentReactions, error: commentReactionsError }
  ] = await Promise.all([
    client.from("profiles").select("*").order("created_at", { ascending: true }),
    client.from("posts").select("*").order("created_at", { ascending: false }),
    client.from("comments").select("*").order("created_at", { ascending: false }),
    client.from("post_reactions").select("*").order("created_at", { ascending: false }),
    client.from("follows").select("*").order("created_at", { ascending: false }),
    client.from("comment_reactions").select("*").order("created_at", { ascending: false })
  ]);

  if (profilesError) throw profilesError;
  if (postsError) throw postsError;
  if (commentsError) throw commentsError;
  if (reactionsError) throw reactionsError;
  if (followsError) throw followsError;
  if (commentReactionsError && !/relation .*comment_reactions/i.test(commentReactionsError.message)) throw commentReactionsError;

  const mappedComments = (comments || []).map((row) => toComment(row as CommentRow));
  const mappedReactions = (reactions || []).map((row) => toReaction(row as ReactionRow));
  const mappedCommentReactions = commentReactionsError ? [] : (commentReactions || []).map((row) => toCommentReaction(row as CommentReactionRow));
  const mappedFollows = (follows || []).map((row) => toFollow(row as FollowRow));
  const users = (profiles || []).map((row) => {
    const user = toUser(row as ProfileRow);
    return {
      ...user,
      followersCount: mappedFollows.filter((follow) => follow.followingId === user.id).length,
      followingCount: mappedFollows.filter((follow) => follow.followerId === user.id).length
    };
  });
  const countedPosts = ensureCanvasPositions((posts || []).map((row) => toPost(row as PostRow))).map((post) => ({
    ...post,
    likesCount: mappedReactions.filter((reaction) => reaction.postId === post.id && reaction.type === "like").length,
    commentsCount: mappedComments.filter((comment) => comment.postId === post.id).length,
    repostsCount: mappedReactions.filter((reaction) => reaction.postId === post.id && reaction.type === "repost").length,
    bookmarksCount: mappedReactions.filter((reaction) => reaction.postId === post.id && reaction.type === "bookmark").length
  }));

  return {
    users,
    posts: countedPosts,
    comments: mappedComments.map((comment) => ({
      ...comment,
      likesCount: mappedCommentReactions.filter((reaction) => reaction.commentId === comment.id).length
    })),
    reactions: mappedReactions,
    follows: mappedFollows,
    commentReactions: mappedCommentReactions
  };
}

export async function createPostReal(post: Post) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("posts")
    .insert({
      id: post.id,
      author_id: post.authorId,
      type: post.type,
      content: post.content,
      caption: post.caption,
      image_url: post.imageUrl,
      video_url: post.videoUrl,
      thumbnail_url: post.thumbnailUrl,
      source_url: post.sourceUrl,
      source_platform: post.sourcePlatform,
      source_title: post.sourceTitle,
      source_thumb: post.sourceThumb,
      x: post.x,
      y: post.y,
      hashtags: post.hashtags
    })
    .select("*")
    .single();
  if (error) throw error;
  return toPost(data as PostRow);
}

export async function updatePostReal(postId: string, patch: { content?: string; caption?: string; hashtags?: string[]; muted?: boolean; pinned?: boolean; x?: number; y?: number }) {
  const client = requireSupabase();
  const userId = (await client.auth.getUser()).data.user?.id ?? "";
  const { data, error } = await client
    .from("posts")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", postId)
    .eq("author_id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return toPost(data as PostRow);
}

export async function deletePostReal(postId: string) {
  const client = requireSupabase();
  const { error } = await client.from("posts").delete().eq("id", postId);
  if (error) throw error;
}

export async function reactToPostReal(postId: string, userId: string, type: "like" | "repost" | "bookmark") {
  const client = requireSupabase();
  const counter = type === "like" ? "likes_count" : type === "repost" ? "reposts_count" : "bookmarks_count";
  const { data: existing, error: existingError } = await client
    .from("post_reactions")
    .select("*")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .eq("type", type)
    .maybeSingle();
  if (existingError) throw existingError;

  if (existing) {
    const { error } = await client.from("post_reactions").delete().eq("post_id", postId).eq("user_id", userId).eq("type", type);
    if (error) throw error;
    await client.rpc("adjust_post_counter", { target_post_id: postId, counter_name: counter, amount: -1 });
    return { reaction: toReaction(existing as ReactionRow), active: false };
  }

  const { data, error } = await client.from("post_reactions").insert({ post_id: postId, user_id: userId, type }).select("*").single();
  if (error) throw error;
  await client.rpc("adjust_post_counter", { target_post_id: postId, counter_name: counter, amount: 1 });
  return { reaction: toReaction(data as ReactionRow), active: true };
}

export async function deleteCommentReal(commentId: string, postId: string) {
  const client = requireSupabase();
  const { error } = await client.from("comments").delete().eq("id", commentId);
  if (error) throw error;
  await client.rpc("decrement_post_comments", { target_post_id: postId });
}

export async function addCommentRealExtended(comment: Comment) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("comments")
    .insert({
      id: comment.id,
      post_id: comment.postId,
      author_id: comment.authorId,
      content: comment.content,
      gif_url: comment.gifUrl || null,
      parent_id: comment.parentId || null
    })
    .select("*")
    .single();
  if (error) throw error;
  if (!comment.parentId) await client.rpc("increment_post_counter", { target_post_id: comment.postId, counter_name: "comments_count" });
  return toComment(data as CommentRow);
}

export const addCommentReal = addCommentRealExtended;

export async function likeCommentReal(commentId: string, userId: string) {
  const client = requireSupabase();
  const { data: existing, error: existingError } = await client.from("comment_reactions").select("*").eq("comment_id", commentId).eq("user_id", userId).maybeSingle();
  if (existingError) throw existingError;
  if (existing) {
    const { error } = await client.from("comment_reactions").delete().eq("comment_id", commentId).eq("user_id", userId);
    if (error) throw error;
    await client.rpc("adjust_comment_likes", { target_comment_id: commentId, amount: -1 });
    return { active: false };
  }
  const { error } = await client.from("comment_reactions").insert({ comment_id: commentId, user_id: userId, type: "like" });
  if (error) throw error;
  await client.rpc("adjust_comment_likes", { target_comment_id: commentId, amount: 1 });
  return { active: true };
}

export async function loadNotifications(userId: string) {
  const client = requireSupabase();
  const { data, error } = await client.from("notifications").select("*").eq("recipient_id", userId).order("created_at", { ascending: false }).limit(60);
  if (error) throw error;
  return ((data || []) as NotificationRow[]).map((row) => ({
    id: row.id,
    recipientId: row.recipient_id,
    actorId: row.actor_id,
    type: row.type,
    postId: row.post_id || undefined,
    commentId: row.comment_id || undefined,
    read: row.read,
    createdAt: row.created_at
  }) as Notification);
}

export async function markNotificationsRead(userId: string) {
  const client = requireSupabase();
  const { error } = await client.from("notifications").update({ read: true }).eq("recipient_id", userId).eq("read", false);
  if (error) throw error;
}

export async function createNotification(n: Omit<Notification, "id" | "createdAt" | "read">) {
  const client = requireSupabase();
  if (n.actorId === n.recipientId) return;
  const { error } = await client.from("notifications").insert({
    recipient_id: n.recipientId,
    actor_id: n.actorId,
    type: n.type,
    post_id: n.postId || null,
    comment_id: n.commentId || null
  });
  if (error) throw error;
}

export async function blockUserReal(blockerId: string, blockedId: string) {
  const client = requireSupabase();
  const { error } = await client.from("user_blocks").upsert({ blocker_id: blockerId, blocked_id: blockedId });
  if (error) throw error;
}

export async function unblockUserReal(blockerId: string, blockedId: string) {
  const client = requireSupabase();
  const { error } = await client.from("user_blocks").delete().eq("blocker_id", blockerId).eq("blocked_id", blockedId);
  if (error) throw error;
}

export async function muteUserReal(muterId: string, mutedId: string) {
  const client = requireSupabase();
  const { error } = await client.from("user_mutes").upsert({ muter_id: muterId, muted_id: mutedId });
  if (error) throw error;
}

export async function unmuteUserReal(muterId: string, mutedId: string) {
  const client = requireSupabase();
  const { error } = await client.from("user_mutes").delete().eq("muter_id", muterId).eq("muted_id", mutedId);
  if (error) throw error;
}

export async function loadBlocksAndMutes(userId: string) {
  const client = requireSupabase();
  const [{ data: blocks, error: blocksError }, { data: mutes, error: mutesError }] = await Promise.all([
    client.from("user_blocks").select("*").eq("blocker_id", userId),
    client.from("user_mutes").select("*").eq("muter_id", userId)
  ]);
  if (blocksError) throw blocksError;
  if (mutesError) throw mutesError;
  return {
    blocks: ((blocks || []) as UserBlockRow[]).map((row) => ({ blockerId: row.blocker_id, blockedId: row.blocked_id, createdAt: row.created_at }) as UserBlock),
    mutes: ((mutes || []) as UserMuteRow[]).map((row) => ({ muterId: row.muter_id, mutedId: row.muted_id, createdAt: row.created_at }) as UserMute)
  };
}

export async function createReportReal(reporterId: string, postId: string | undefined, reportedUserId: string | undefined, category: string, note?: string) {
  const client = requireSupabase();
  const { error } = await client.from("reports").insert({ reporter_id: reporterId, post_id: postId || null, reported_user_id: reportedUserId || null, category, note: note || null });
  if (error) throw error;
}

export async function fetchOGPreview(url: string): Promise<OGPreview> {
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  const response = await fetch(proxyUrl);
  if (!response.ok) throw new Error("Could not fetch URL preview.");
  const { contents } = await response.json();
  const parser = new DOMParser();
  const doc = parser.parseFromString(contents, "text/html");
  const getMeta = (property: string) =>
    doc.querySelector(`meta[property="${property}"]`)?.getAttribute("content") ||
    doc.querySelector(`meta[name="${property}"]`)?.getAttribute("content") || "";
  const title = getMeta("og:title") || getMeta("twitter:title") || doc.title || url;
  const description = getMeta("og:description") || getMeta("twitter:description") || "";
  const image = getMeta("og:image") || getMeta("twitter:image") || "";
  let platform: OGPreview["platform"] = "generic";
  let embedUrl: string | undefined;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace("www.", "");
    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      platform = "youtube";
      const videoId = parsed.searchParams.get("v") || (host.includes("youtu.be") ? parsed.pathname.slice(1) : "");
      if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0`;
    } else if (host.includes("instagram.com")) platform = "instagram";
    else if (host.includes("twitter.com") || host.includes("x.com")) platform = "twitter";
    else if (host.includes("tiktok.com")) platform = "tiktok";
    else if (host.includes("spotify.com")) platform = "spotify";
    else if (host.includes("github.com")) platform = "github";
  } catch {
    platform = "generic";
  }
  return { url, title, description, image, platform, embedUrl };
}

export async function toggleFollowReal(followerId: string, followingId: string) {
  const client = requireSupabase();
  if (followerId === followingId) throw new Error("You cannot follow yourself.");
  const { data: existing, error: existingError } = await client.from("follows").select("*").eq("follower_id", followerId).eq("following_id", followingId).maybeSingle();
  if (existingError) throw existingError;
  if (existing) {
    const { error } = await client.from("follows").delete().eq("follower_id", followerId).eq("following_id", followingId);
    if (error) throw error;
    await client.rpc("adjust_follow_counts", { target_follower_id: followerId, target_following_id: followingId, amount: -1 });
    return { follow: toFollow(existing as FollowRow), active: false };
  }
  const { data, error } = await client.from("follows").insert({ follower_id: followerId, following_id: followingId }).select("*").single();
  if (error) throw error;
  await client.rpc("adjust_follow_counts", { target_follower_id: followerId, target_following_id: followingId, amount: 1 });
  return { follow: toFollow(data as FollowRow), active: true };
}

export async function uploadMediaReal(file: File, userId: string, folder = "posts") {
  const client = requireSupabase();
  const extension = file.name.split(".").pop() || "bin";
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${extension}`;
  const { error } = await client.storage.from("connect-media").upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false
  });
  if (error) throw error;
  const { data } = client.storage.from("connect-media").getPublicUrl(path);
  return data.publicUrl;
}
