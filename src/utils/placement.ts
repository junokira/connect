import { Post } from "../types";
import { nextCanvasPosition } from "./canvasLayout";

export function placeNextPost(posts: Post[], hashtags?: string[]) {
  return nextCanvasPosition(posts, hashtags);
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
