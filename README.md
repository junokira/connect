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

## Production Backend

CONNECT runs in mock mode until Supabase environment variables are present. To make it real:

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Copy `.env.example` to `.env.local`.
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. Restart `npm run dev`.

For Vercel, add the same two environment variables in the Vercel project settings. Once those are set, CONNECT uses Supabase auth, profiles, posts, comments, likes, reposts, bookmarks, follows-ready tables, and persisted canvas coordinates.

Media is URL-based in this version. The database schema is ready for real media URLs; the next step is adding Supabase Storage upload controls.

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
