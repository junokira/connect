export type PostType = "text" | "photo" | "video" | "link";
export type SortMode =
  | "newest"
  | "oldest"
  | "most-liked"
  | "most-commented"
  | "most-reposted"
  | "trending"
  | "media-only"
  | "text-only"
  | "photos-only"
  | "videos-only";

export type FeedStyle = "classic" | "signal" | "gallery" | "orbit" | "mosaic";
export type FeedScope = "everyone" | "following" | "liked" | "liked-media" | "liked-photos" | "liked-videos";

export type User = {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string;
  bannerUrl: string;
  bio: string;
  location: string;
  website: string;
  createdAt: string;
  followersCount: number;
  followingCount: number;
  verified: boolean;
};

export type ProfileUpdate = {
  displayName: string;
  username: string;
  avatarUrl: string;
  bannerUrl: string;
  avatarFile?: File;
  bannerFile?: File;
  bio: string;
  location: string;
  website: string;
};

export type PostReaction = {
  postId: string;
  userId: string;
  type: "like" | "repost" | "bookmark";
  createdAt: string;
};

export type Follow = {
  followerId: string;
  followingId: string;
  createdAt: string;
};

export type SignupProfile = {
  displayName: string;
  username: string;
  bio: string;
  location: string;
  website: string;
  avatarUrl?: string;
  bannerUrl?: string;
};

export type Post = {
  id: string;
  authorId: string;
  type: PostType;
  content: string;
  caption: string;
  imageUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  sourceUrl?: string;
  sourcePlatform?: "youtube" | "instagram" | "twitter" | "tiktok" | "spotify" | "github" | "generic";
  sourceTitle?: string;
  sourceThumb?: string;
  muted?: boolean;
  x: number;
  y: number;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  bookmarksCount: number;
  hashtags: string[];
  pinned?: boolean;
};

export type Comment = {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  gifUrl?: string;
  parentId?: string;
  likesCount: number;
  createdAt: string;
};

export type CommentReaction = {
  commentId: string;
  userId: string;
  type: "like";
  createdAt: string;
};

export type Notification = {
  id: string;
  recipientId: string;
  actorId: string;
  type: "like" | "comment" | "follow" | "repost" | "mention" | "reply";
  postId?: string;
  commentId?: string;
  read: boolean;
  createdAt: string;
};

export type UserBlock = {
  blockerId: string;
  blockedId: string;
  createdAt: string;
};

export type UserMute = {
  muterId: string;
  mutedId: string;
  createdAt: string;
};

export type OGPreview = {
  url: string;
  title: string;
  description: string;
  image: string;
  platform: Post["sourcePlatform"];
  embedUrl?: string;
};

export type CanvasView = {
  x: number;
  y: number;
  zoom: number;
};
