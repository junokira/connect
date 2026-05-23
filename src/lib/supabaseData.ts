import { Comment, Post, PostReaction, PostType, ProfileUpdate, SignupProfile, User } from "../types";
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
  x: number;
  y: number;
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
  verified: row.verified ?? true
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
  x: row.x,
  y: row.y,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  likesCount: row.likes_count,
  commentsCount: row.comments_count,
  repostsCount: row.reposts_count,
  bookmarksCount: row.bookmarks_count,
  hashtags: row.hashtags,
  pinned: row.pinned
});

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

function requireSupabase() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
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
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  return data.user?.id;
}

export async function signInWithPassword(email: string, password: string) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error("Supabase did not return a user.");
  return data.user.id;
}

export async function signUpWithPassword(email: string, password: string, profile: SignupProfile) {
  const client = requireSupabase();
  const username = await resolveAvailableUsername(profile.username || email.split("@")[0]);

  const { data: signUpData, error: signUpError } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: profile?.displayName || email.split("@")[0],
        username,
        bio: profile?.bio,
        location: profile?.location,
        website: profile?.website,
        avatar_url: profile?.avatarUrl,
        banner_url: profile?.bannerUrl,
        verified: true
      }
    }
  });
  if (signUpError) throw signUpError;
  if (!signUpData.user) throw new Error("Supabase did not return a user.");
  if (!signUpData.session) throw new Error("Check your email to confirm your CONNECT account, then sign in.");
  await ensureProfile(signUpData.user.id, email, { ...profile, username });
  return signUpData.user.id;
}

export async function sendMagicLink(email: string) {
  const client = requireSupabase();
  const { error } = await client.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin }
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
      website: profile?.website || "",
      verified: true
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
    { data: reactions, error: reactionsError }
  ] = await Promise.all([
    client.from("profiles").select("*").order("created_at", { ascending: true }),
    client.from("posts").select("*").order("created_at", { ascending: false }),
    client.from("comments").select("*").order("created_at", { ascending: false }),
    client.from("post_reactions").select("*").order("created_at", { ascending: false })
  ]);

  if (profilesError) throw profilesError;
  if (postsError) throw postsError;
  if (commentsError) throw commentsError;
  if (reactionsError) throw reactionsError;

  return {
    users: (profiles || []).map((row) => toUser(row as ProfileRow)),
    posts: (posts || []).map((row) => toPost(row as PostRow)),
    comments: (comments || []).map((row) => toComment(row as CommentRow)),
    reactions: (reactions || []).map((row) => toReaction(row as ReactionRow))
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
  const { data, error } = await client.from("post_reactions").insert({ post_id: postId, user_id: userId, type }).select("*").single();
  if (error?.message.includes("duplicate key")) return undefined;
  if (error) throw error;
  const counter = type === "like" ? "likes_count" : type === "repost" ? "reposts_count" : "bookmarks_count";
  const { error: counterError } = await client.rpc("increment_post_counter", { target_post_id: postId, counter_name: counter });
  if (counterError) throw counterError;
  return toReaction(data as ReactionRow);
}

export async function addCommentReal(comment: Comment) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("comments")
    .insert({ id: comment.id, post_id: comment.postId, author_id: comment.authorId, content: comment.content })
    .select("*")
    .single();
  if (error) throw error;
  const { error: counterError } = await client.rpc("increment_post_counter", { target_post_id: comment.postId, counter_name: "comments_count" });
  if (counterError) throw counterError;
  return toComment(data as CommentRow);
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
