import { Post } from "../types";

const CARD_W = 320;
const CARD_H = 280;
const GAP = 48;

const collides = (x: number, y: number, posts: Post[]) =>
  posts.some((post) => Math.abs(post.x - x) < CARD_W + GAP && Math.abs(post.y - y) < CARD_H + GAP);

export function placeNextPost(posts: Post[]) {
  if (posts.length === 0) return { x: 0, y: 0 };

  const sorted = [...posts].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  const startIndex = sorted.length;

  // Deterministic rings keep the social map close to origin and expand only as content grows.
  for (let ring = 1; ring < 80; ring += 1) {
    const slots = 6 + ring * 4;
    const radius = 250 + ring * 245;
    for (let offset = 0; offset < slots; offset += 1) {
      const slot = (startIndex + offset) % slots;
      const angle = (slot / slots) * Math.PI * 2 + ring * 0.38;
      const x = Math.round(Math.cos(angle) * radius);
      const y = Math.round(Math.sin(angle) * radius);
      if (!collides(x, y, posts)) return { x, y };
    }
  }

  return { x: 0, y: (posts.length + 1) * (CARD_H + GAP) };
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
