import { Link } from "react-router-dom";
import { WatchHistoryEntry } from "../types";
import { useLocalCollection } from "../hooks/useLocalCollection";
import { EmptyState } from "../components/StateViews";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function WatchHistory() {
  const history = useLocalCollection<WatchHistoryEntry>("watch_history");
  const sorted = [...history.items].sort((a, b) => b.watchedAt - a.watchedAt);

  return (
    <div className="mx-auto max-w-3xl px-5 pb-24">
      <h1 className="mt-8 font-display text-3xl text-parchment">Watch history</h1>

      {sorted.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No history yet"
            body="Movies you mark as watched will show up here, newest first."
          />
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-rule border-y border-rule">
          {sorted.map((entry) => (
            <li key={entry.movieId} className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0">
                <Link to={`/movie/${entry.movieId}`} className="truncate font-display text-lg text-parchment hover:text-gold">
                  {entry.title}
                </Link>
                <p className="text-sm text-muted">
                  Watched {formatDate(entry.watchedAt)}
                  {entry.userRating ? ` · Rated ${entry.userRating}★` : ""}
                </p>
              </div>
              <button
                onClick={() => history.remove(entry.movieId)}
                className="shrink-0 border border-rule px-3 py-1.5 text-sm text-muted hover:border-parchment/50 hover:text-parchment"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
