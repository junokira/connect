import { Post, SortMode, User } from "../types";

export function getFilteredPosts(posts: Post[], users: User[], sortMode: SortMode, search: string) {
  const term = search.trim().toLowerCase();
  const searched = term
    ? posts.filter((post) => {
        const author = users.find((user) => user.id === post.authorId);
        const haystack = [
          post.type,
          post.content,
          post.caption,
          author?.displayName,
          author?.username,
          ...post.hashtags.map((tag) => `#${tag}`)
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(term);
      })
    : posts;

  const filtered = searched.filter((post) => {
    if (sortMode === "media-only") return post.type !== "text";
    if (sortMode === "text-only") return post.type === "text";
    if (sortMode === "photos-only") return post.type === "photo";
    if (sortMode === "videos-only") return post.type === "video";
    return true;
  });

  return [...filtered].sort((a, b) => {
    if (sortMode === "oldest") return Date.parse(a.createdAt) - Date.parse(b.createdAt);
    if (sortMode === "most-liked") return b.likesCount - a.likesCount;
    if (sortMode === "most-commented") return b.commentsCount - a.commentsCount;
    if (sortMode === "most-reposted") return b.repostsCount - a.repostsCount;
    if (sortMode === "trending") {
      const score = (post: Post) => post.likesCount * 1 + post.commentsCount * 2 + post.repostsCount * 3 + post.bookmarksCount;
      return score(b) - score(a);
    }
    return Date.parse(b.createdAt) - Date.parse(a.createdAt);
  });
}

export function formatCount(value: number) {
  return Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}
