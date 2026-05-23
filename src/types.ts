export type PostType = "text" | "photo" | "video";
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
  createdAt: string;
};

export type CanvasView = {
  x: number;
  y: number;
  zoom: number;
};
