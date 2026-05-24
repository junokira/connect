export function normalizeExternalUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function getVideoEmbedUrl(value?: string) {
  if (!value) return "";
  try {
    const url = new URL(normalizeExternalUrl(value));
    if (url.hostname.includes("youtube.com")) {
      const videoId = url.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=0` : "";
    }
    if (url.hostname.includes("youtu.be")) {
      const videoId = url.pathname.replace("/", "");
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=0` : "";
    }
    if (url.hostname.includes("vimeo.com")) {
      const videoId = url.pathname.split("/").filter(Boolean)[0];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : "";
    }
  } catch {
    return "";
  }
  return "";
}

export function isDirectVideoUrl(value?: string) {
  if (!value) return false;
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(value);
}

export function getYoutubeThumbnail(videoUrl: string): string {
  try {
    const url = new URL(normalizeExternalUrl(videoUrl));
    let videoId = "";
    if (url.hostname.includes("youtube.com")) videoId = url.searchParams.get("v") || "";
    if (url.hostname.includes("youtu.be")) videoId = url.pathname.slice(1);
    if (videoId) return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  } catch {
    return "";
  }
  return "";
}

export function getPlatformLabel(platform?: string): string {
  const map: Record<string, string> = {
    youtube: "YouTube",
    instagram: "Instagram",
    twitter: "X (Twitter)",
    tiktok: "TikTok",
    spotify: "Spotify",
    github: "GitHub",
    generic: "Link"
  };
  return map[platform || ""] || "Link";
}
