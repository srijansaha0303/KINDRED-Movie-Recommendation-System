import { Link } from "react-router-dom";
import { WatchListEntry, WatchHistoryEntry } from "../types";
import { useLocalCollection } from "../hooks/useLocalCollection";
import { EmptyState } from "../components/StateViews";

export default function WatchList() {
  const watchlist = useLocalCollection<WatchListEntry>("watchlist");
  const history = useLocalCollection<WatchHistoryEntry>("watch_history");

  function markWatched(entry: WatchListEntry) {
    history.add({
      movieId: entry.movieId,
      title: entry.title,
      genres: entry.genres,
      watchedAt: Date.now(),
    });
    watchlist.remove(entry.movieId);
  }

  return (
    <div className="mx-auto max-w-3xl px-5 pb-24">
      <h1 className="mt-8 font-display text-3xl text-parchment">Your watchlist</h1>

      {watchlist.items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Nothing saved yet"
            body="Browse movies and tap “+ List” on anything you want to watch later."
          />
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-rule border-y border-rule">
          {watchlist.items.map((entry) => (
            <li key={entry.movieId} className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0">
                <Link to={`/movie/${entry.movieId}`} className="truncate font-display text-lg text-parchment hover:text-gold">
                  {entry.title}
                </Link>
                <p className="text-sm text-muted">{entry.genres?.slice(0, 3).join(" · ")}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => markWatched(entry)}
                  className="border border-rule px-3 py-1.5 text-sm text-parchment hover:border-parchment/50"
                >
                  Mark watched
                </button>
                <button
                  onClick={() => watchlist.remove(entry.movieId)}
                  className="border border-rule px-3 py-1.5 text-sm text-muted hover:border-parchment/50 hover:text-parchment"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
