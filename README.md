# CONNECT

CONNECT is an MVP social platform where the home feed is an infinite spatial canvas. Posts are positioned as nodes, can be panned and zoomed like a design tool, and open into social detail views with comments and interactions.

## Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- Zustand
- Mock local persistence via `localStorage`

## Run

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

## MVP Features

- Mock email sign-in.
- Infinite dotted canvas with pan, wheel zoom, pinch zoom, reset view, and jump to latest.
- Viewport culling for canvas posts.
- Text, photo, and video composer with draft preview.
- Sorting, media filters, post type filters, and search by keyword, username, hashtag, or type.
- Click or tap post cards to open detailed modal.
- Like, comment, repost, bookmark, and share actions.
- Responsive desktop sidebar and mobile bottom navigation.
- X-style profile pages with Instagram-like media grid.
