import { Post } from "../types";

export const CANVAS_CARD_WIDTH = 390;
export const CANVAS_CARD_HEIGHT = 460;
export const CANVAS_CARD_CENTER_X = CANVAS_CARD_WIDTH / 2;
export const CANVAS_CARD_CENTER_Y = 178;
export const CANVAS_CARD_GAP = 24;

type Point = { x: number; y: number };
type CanvasLayoutItem = { post: Post; position: Point };

const stepX = CANVAS_CARD_WIDTH + CANVAS_CARD_GAP;
const stepY = CANVAS_CARD_HEIGHT + CANVAS_CARD_GAP;

export function canvasRectsOverlap(a: Point, b: Point) {
  return (
    a.x < b.x + CANVAS_CARD_WIDTH + CANVAS_CARD_GAP &&
    a.x + CANVAS_CARD_WIDTH + CANVAS_CARD_GAP > b.x &&
    a.y < b.y + CANVAS_CARD_HEIGHT + CANVAS_CARD_GAP &&
    a.y + CANVAS_CARD_HEIGHT + CANVAS_CARD_GAP > b.y
  );
}

export function resolveCanvasCollisions(items: CanvasLayoutItem[]) {
  const occupied: Point[] = [];
  return items.map((item) => {
    let position = { ...item.position };
    if (occupied.some((other) => canvasRectsOverlap(position, other))) {
      let resolved: Point | undefined;
      for (let ring = 1; ring < 80 && !resolved; ring += 1) {
        for (let dx = -ring; dx <= ring && !resolved; dx += 1) {
          for (let dy = -ring; dy <= ring && !resolved; dy += 1) {
            if (Math.abs(dx) !== ring && Math.abs(dy) !== ring) continue;
            const candidate = {
              x: Math.round(item.position.x + dx * stepX),
              y: Math.round(item.position.y + dy * stepY)
            };
            if (!occupied.some((other) => canvasRectsOverlap(candidate, other))) resolved = candidate;
          }
        }
      }
      if (resolved) position = resolved;
    }
    occupied.push(position);
    return { ...item, position };
  });
}

export function nextCanvasPosition(posts: Post[], newPostHashtags?: string[]) {
  if (!posts.length) return { x: 0, y: 0 };

  const occupied = posts.map((post) => ({ x: post.x, y: post.y }));
  if (newPostHashtags?.length) {
    const related2 = posts.filter((post) => post.hashtags.filter((tag) => newPostHashtags.includes(tag)).length >= 2);
    const related1 = related2.length ? [] : posts.filter((post) => post.hashtags.some((tag) => newPostHashtags.includes(tag)));
    const relatedGroup = related2.length ? related2 : related1;
    if (relatedGroup.length) {
      const cx = relatedGroup.reduce((sum, post) => sum + post.x, 0) / relatedGroup.length;
      const cy = relatedGroup.reduce((sum, post) => sum + post.y, 0) / relatedGroup.length;
      for (let ring = 1; ring < 10; ring += 1) {
        for (let dx = -ring; dx <= ring; dx += 1) {
          for (let dy = -ring; dy <= ring; dy += 1) {
            if (Math.abs(dx) !== ring && Math.abs(dy) !== ring) continue;
            const candidate = { x: Math.round(cx + dx * stepX), y: Math.round(cy + dy * stepY) };
            if (!occupied.some((other) => canvasRectsOverlap(candidate, other))) return candidate;
          }
        }
      }
    }
  }

  const latest = [...posts].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
  const base = latest ? { x: latest.x, y: latest.y } : { x: 0, y: 0 };

  for (let ring = 1; ring < 100; ring += 1) {
    for (let dx = -ring; dx <= ring; dx += 1) {
      for (let dy = -ring; dy <= ring; dy += 1) {
        if (Math.abs(dx) !== ring && Math.abs(dy) !== ring) continue;
        const candidate = {
          x: Math.round(base.x + dx * stepX),
          y: Math.round(base.y + dy * stepY)
        };
        if (!occupied.some((other) => canvasRectsOverlap(candidate, other))) return candidate;
      }
    }
  }

  return { x: 0, y: posts.length * stepY };
}
