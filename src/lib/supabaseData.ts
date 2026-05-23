import { Comment, Follow, Post, PostReaction, PostType, ProfileUpdate, SignupProfile, User } from "../types";
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
  created_at: string;
  followers_count: number;
  following_count: number;
  verified?: boolean | null;
};

type PostRow = {
  id: string;
  author_id: string;
  type: PostType;
  content: string;
  caption: string;
  image_url?: string | null;
  video_url?: string | null;
  thumbnail_url?: string | null;
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

const toUser = (row: ProfileRow): User => ({
  id: row.id,
  displayName: row.display_name,
  username: row.username,
  avatarUrl: row.avatar_url,
  bannerUrl: row.banner_url,
  bio: row.bio,
  location: row.location,
  website: row.website,
  createdAt: row.created_at,
  followersCount: row.followers_count,
  followingCount: row.following_count,
  verified: row.verified ?? false
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
    avatarUrl: user.user_metadata?.avatar_url,
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

  const { data: signUpData, error: signUpError } = await client.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: authRedirectUrl("confirmed"),
      data: {
        display_name: profile?.displayName || email.split("@")[0],
        username,
        bio: profile?.bio,
        location: profile?.location,
        website: profile?.website,
        avatar_url: profile?.avatarUrl,
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
    options: { redirectTo: window.location.origin }
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
      avatar_url: profile?.avatarUrl || undefined,
      banner_url: profile?.bannerUrl || undefined,
      bio: profile?.bio || "New to CONNECT.",
      location: profile?.location || "",
      website: profile?.website || ""
    })
    .select("*")
    .single();
  if (error) throw error;
  return toUser(createdProfile as ProfileRow);
}

export async function updateProfileReal(userId: string, profile: ProfileUpdate) {
  const client = requireSupabase();
  const username = await resolveAvailableUsername(profile.username, userId);
  const { data, error } = await client
    .from("profiles")
    .update({
      display_name: profile.displayName.trim(),
      username,
      avatar_url: profile.avatarUrl.trim(),
      banner_url: profile.bannerUrl.trim(),
      bio: profile.bio.trim(),
      location: profile.location.trim(),
      website: profile.website.trim()
    })
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return toUser(data as ProfileRow);
}

export async function loadConnectData() {
  const client = requireSupabase();
  const [
    { data: profiles, error: profilesError },
    { data: posts, error: postsError },
    { data: comments, error: commentsError },
    { data: reactions, error: reactionsError },
    { data: follows, error: followsError }
  ] = await Promise.all([
    client.from("profiles").select("*").order("created_at", { ascending: true }),
    client.from("posts").select("*").order("created_at", { ascending: false }),
    client.from("comments").select("*").order("created_at", { ascending: false }),
    client.from("post_reactions").select("*").order("created_at", { ascending: false }),
    client.from("follows").select("*").order("created_at", { ascending: false })
  ]);

  if (profilesError) throw profilesError;
  if (postsError) throw postsError;
  if (commentsError) throw commentsError;
  if (reactionsError) throw reactionsError;
  if (followsError) throw followsError;

  const mappedComments = (comments || []).map((row) => toComment(row as CommentRow));
  const mappedReactions = (reactions || []).map((row) => toReaction(row as ReactionRow));
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
    comments: mappedComments,
    reactions: mappedReactions,
    follows: mappedFollows
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
      x: post.x,
      y: post.y,
      hashtags: post.hashtags
    })
    .select("*")
    .single();
  if (error) throw error;
  return toPost(data as PostRow);
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

export async function addCommentReal(comment: Comment) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("comments")
    .insert({ id: comment.id, post_id: comment.postId, author_id: comment.authorId, content: comment.content })
    .select("*")
    .single();
  if (error) throw error;
  await client.rpc("increment_post_counter", { target_post_id: comment.postId, counter_name: "comments_count" });
  return toComment(data as CommentRow);
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
