import { Post } from "../types";

const CARD_W = 320;
const CARD_H = 280;
const GAP = 72;

const collides = (x: number, y: number, posts: Post[]) =>
  posts.some((post) => Math.abs(post.x - x) < CARD_W + GAP && Math.abs(post.y - y) < CARD_H + GAP);

export function placeNextPost(posts: Post[]) {
  if (posts.length === 0) return { x: 0, y: 0 };

  const latest = [...posts].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
  const angleStep = 0.62;
  const radiusStep = 42;

  // Spiral placement keeps new posts near the latest activity while avoiding obvious overlap.
  for (let i = 1; i < 220; i += 1) {
    const radius = 280 + i * radiusStep;
    const angle = i * angleStep;
    const x = Math.round(latest.x + Math.cos(angle) * radius);
    const y = Math.round(latest.y + Math.sin(angle) * radius);
    if (!collides(x, y, posts)) return { x, y };
  }

  return { x: latest.x + 420, y: latest.y + 220 };
}

export function rearrangePosts(posts: Post[], mode: "ranked" | "media") {
  return posts.map((post, index) => {
    const col = index % 4;
    const row = Math.floor(index / 4);
    const offset = mode === "media" && post.type !== "text" ? -140 : 0;
    return {
      ...post,
      x: col * 390 - 560 + offset,
      y: row * 360 - 180
    };
  });
}
