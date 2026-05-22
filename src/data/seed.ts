import { Comment, Post, User } from "../types";

export const users: User[] = [
  {
    id: "u-1",
    displayName: "Maya Chen",
    username: "maya",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1400&q=80",
    bio: "Spatial product designer. Mapping the internet as rooms, tables, and trails.",
    location: "Cape Town",
    website: "maya.design",
    createdAt: "2024-02-11T09:30:00.000Z",
    followersCount: 18420,
    followingCount: 512
  },
  {
    id: "u-2",
    displayName: "Theo Alvarez",
    username: "theo",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
    bio: "Builds video tools, drinks too much iced coffee, posts tiny launch notes.",
    location: "Lisbon",
    website: "theo.dev",
    createdAt: "2023-08-19T12:00:00.000Z",
    followersCount: 9214,
    followingCount: 781
  },
  {
    id: "u-3",
    displayName: "Nora Singh",
    username: "nora",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1400&q=80",
    bio: "Photographer and urban wanderer. Making visual field notes.",
    location: "New York",
    website: "nora.photo",
    createdAt: "2022-05-04T16:45:00.000Z",
    followersCount: 67202,
    followingCount: 1301
  }
];

export const posts: Post[] = [
  {
    id: "p-1",
    authorId: "u-1",
    type: "text",
    content: "A canvas feed makes old posts feel discoverable again. Timelines bury things; maps invite return trips. #spatial #social",
    caption: "",
    x: -220,
    y: -80,
    createdAt: "2026-05-20T08:12:00.000Z",
    updatedAt: "2026-05-20T08:12:00.000Z",
    likesCount: 820,
    commentsCount: 64,
    repostsCount: 142,
    bookmarksCount: 311,
    hashtags: ["spatial", "social"],
    pinned: true
  },
  {
    id: "p-2",
    authorId: "u-3",
    type: "photo",
    content: "",
    caption: "Late afternoon reflections under the high line. #photo #city",
    imageUrl: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80",
    x: 180,
    y: -260,
    createdAt: "2026-05-20T13:35:00.000Z",
    updatedAt: "2026-05-20T13:35:00.000Z",
    likesCount: 2411,
    commentsCount: 118,
    repostsCount: 208,
    bookmarksCount: 760,
    hashtags: ["photo", "city"]
  },
  {
    id: "p-3",
    authorId: "u-2",
    type: "video",
    content: "",
    caption: "Prototype: video cards pause until opened, then take over the detail viewer. #buildinpublic",
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    x: 520,
    y: 120,
    createdAt: "2026-05-19T18:04:00.000Z",
    updatedAt: "2026-05-19T18:04:00.000Z",
    likesCount: 1302,
    commentsCount: 87,
    repostsCount: 330,
    bookmarksCount: 540,
    hashtags: ["buildinpublic"]
  },
  {
    id: "p-4",
    authorId: "u-1",
    type: "photo",
    content: "",
    caption: "Moodboard for canvas clusters: soft shadows, clear affordances, minimal chrome.",
    imageUrl: "https://images.unsplash.com/photo-1523726491678-bf852e717f6a?auto=format&fit=crop&w=900&q=80",
    x: -620,
    y: 260,
    createdAt: "2026-05-18T10:22:00.000Z",
    updatedAt: "2026-05-18T10:22:00.000Z",
    likesCount: 624,
    commentsCount: 31,
    repostsCount: 95,
    bookmarksCount: 280,
    hashtags: ["design"]
  },
  {
    id: "p-5",
    authorId: "u-2",
    type: "text",
    content: "Tiny interaction note: zoom controls should be helpful without making the canvas feel trapped inside a dashboard.",
    caption: "",
    x: 810,
    y: -330,
    createdAt: "2026-05-17T17:11:00.000Z",
    updatedAt: "2026-05-17T17:11:00.000Z",
    likesCount: 419,
    commentsCount: 22,
    repostsCount: 61,
    bookmarksCount: 140,
    hashtags: ["ux"]
  },
  {
    id: "p-6",
    authorId: "u-3",
    type: "photo",
    content: "",
    caption: "A grid can be quiet and still give you your bearings.",
    imageUrl: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=80",
    x: -1040,
    y: -420,
    createdAt: "2026-05-16T07:45:00.000Z",
    updatedAt: "2026-05-16T07:45:00.000Z",
    likesCount: 985,
    commentsCount: 44,
    repostsCount: 133,
    bookmarksCount: 390,
    hashtags: ["grid", "photo"]
  }
];

export const comments: Comment[] = [
  { id: "c-1", postId: "p-1", authorId: "u-2", content: "The map metaphor instantly makes saved posts feel less stale.", createdAt: "2026-05-20T09:01:00.000Z" },
  { id: "c-2", postId: "p-1", authorId: "u-3", content: "I want trails through people, tags, and moments.", createdAt: "2026-05-20T09:42:00.000Z" },
  { id: "c-3", postId: "p-3", authorId: "u-1", content: "Opening video in a calm viewer is the right call.", createdAt: "2026-05-19T19:10:00.000Z" }
];
