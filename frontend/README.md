# Kindred — Movie Recommendation Frontend

React + TypeScript + Tailwind, built against your existing FastAPI/Neo4j backend.

## Auth

Real accounts now exist: `/auth/signup` and `/auth/login` create/verify a
`User` node with `username` + bcrypt-hashed `passwordHash`, and return a
JWT. The frontend stores that token in `localStorage` (`kindred_auth`) and
attaches it as `Authorization: Bearer <token>` on every request. Browsing
(Home, Browse, Movie Details) stays public; Recommendations, Watchlist,
History, Profile, and rating a movie all require login (see
`ProtectedRoute.tsx`).

Your original 138,493 MovieLens `User` nodes (from `ratings.csv`) have no
`username`/`passwordHash` and can't log in — they're historical rating
data, not accounts. New signups get assigned the next free integer
`userId` above your existing max, so they live in the same `User` label
without colliding. This means a fresh signup starts with **zero
ratings** and won't get interesting recommendations until you rate a
handful of movies through the UI.

Before first use, run `auth_setup.cql` once (adds a uniqueness
constraint on `username`).

## Setup

In this `frontend` folder, in a VS Code terminal:

```powershell
npm install
npm run dev
```

Opens at `http://localhost:5173`. It expects your FastAPI backend running at
`http://localhost:8000` (see `vite.config.ts` for the proxy — change the
target there if your backend runs elsewhere).

Start the backend first (from your `backend` folder, with your venv active):

```powershell
uvicorn main:app --reload
```

## What's real vs. what's local-only

- **Home, Browse, Movie Details, Recommendations, Profile's top-rated** —
  hit your actual FastAPI endpoints (`/movies`, `/movies/{id}`, `/recommend`,
  `/hybrid`, `/similar`, `/top-rated`, `/rate`). These are functionally real.
- **Watchlist and Watch History** — stored in browser `localStorage`, not
  the backend. Your Neo4j schema/CSV data has no WatchList/WatchHistory
  node types, so there's nothing to persist to server-side yet. The code
  is structured (`useLocalCollection` hook + `services/api.ts`) so you can
  swap in real endpoints later without touching the page components.
- **Actor / Director / Cast** — intentionally not shown. MovieLens 20M has
  no cast data (`movie.csv` only has title + genres). Faking this would
  violate the "no fake data" requirement. If you want it, you'd need to
  join `link.csv`'s `tmdbId` against the TMDB API (needs a free API key)
  and add nodes/relationships to the graph.
- **Posters** — no image data exists in MovieLens either, so cards use
  deterministic color gradients per movie ID instead of fake stock photos.
- **Auth** — there's now real signup/login (JWT-based). Rating a movie,
  seeing recommendations, and your profile all require being logged in.

## "Taste Skills"

I didn't have access to an installed "Taste Skills" skill in the
environment this was built in — I used Anthropic's own `frontend-design`
skill instead, which is built for the same goal (deliberate, non-templated
visual design). The visual identity here: ink-black background, warm
film-ticket amber accent (`#D4A048`), serif display type (Fraunces) for
titles paired with Inter for UI text, sharp corners instead of rounded
cards, editorial magazine layout rather than a uniform grid. If you have
Taste Skills available in a different tool (e.g. Claude Code), rerunning
the design pass there against this same component structure would be
straightforward.

## Known gaps to close next

- No pagination count/total from `/movies` — "Next" button always enabled.
- No debounced server-side genre validation (typing a genre not in the enum silently returns nothing — this is a filter dropdown so it's constrained, but worth hardening).
- Rating a movie in Movie Details doesn't retrain `SIMILAR_TO`/`CONTENT_SIMILAR_TO` — those only update when you re-run `setup_graph.cql`. New ratings feed the graph immediately but not the precomputed embeddings.
- No error boundary at the route level — a thrown render error will white-screen rather than show a fallback.
