# CONNECT

CONNECT is an MVP social platform where the home feed is an infinite spatial canvas. Posts are positioned as nodes, can be panned and zoomed like a design tool, and open into social detail views with comments and interactions.

## Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- Zustand
- Supabase Auth, Postgres, Storage, and Realtime

## Run

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

## Production Backend

CONNECT requires Supabase environment variables for auth, profiles, posts, comments, reactions, and media storage:

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Copy `.env.example` to `.env.local`.
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. Restart `npm run dev`.

For Vercel, add the same two environment variables in the Vercel project settings. CONNECT uses Supabase auth, profiles, posts, comments, likes, reposts, bookmarks, follows-ready tables, media storage, realtime feed refreshes, and persisted canvas coordinates.

Media uploads use the `connect-media` Supabase Storage bucket created by `supabase/schema.sql`.

Google, Apple, and phone auth buttons call Supabase only where supported. Provider credentials and SMS delivery must be configured in the Supabase dashboard before those methods can complete.

## MVP Features

- Separate real email/password sign-in and sign-up through Supabase.
- Magic link, Google, Apple, and phone auth entry points with configuration-required states where provider setup is missing.
- Clean username allocation that preserves the requested name and only adds simple numeric suffixes when needed.
- Infinite dotted canvas with pan, wheel zoom, pinch zoom, reset view, and jump to latest.
- Functional Explore view with trending posts, media, and people.
- Viewport culling for canvas posts.
- Text, photo, and video composer with draft preview.
- Sorting, media filters, post type filters, and search by keyword, username, hashtag, or type.
- Feed style modes: Classic, Signal Clusters, Gallery Flow, Orbit, and Mosaic Boards.
- Click or tap post cards to open a detailed social post view with Escape and outside-click close.
- Like, comment, repost, bookmark, and share actions.
- First-open onboarding creates a profile that is reflected in the profile view and used for new posts.
- Owner-aware profiles with Edit profile, Supabase profile saving, and Follow on other profiles.
- Photo/video file pickers work with mobile photo libraries, including iPhone Safari.
- Responsive desktop sidebar and mobile bottom navigation.
- X-style profile pages with Instagram-like media grid.
