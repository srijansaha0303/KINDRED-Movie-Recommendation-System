import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { WatchListEntry, WatchHistoryEntry, Movie } from "../types";
import { useLocalCollection } from "../hooks/useLocalCollection";
import MovieCard from "../components/MovieCard";
import { CardGridSkeleton } from "../components/StateViews";


function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-rule px-5 py-4">
      <p className="font-display text-2xl text-gold">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-muted">{label}</p>
    </div>
  );
}

export default function Profile() {
  const { username } = useAuth();
  const watchlist = useLocalCollection<WatchListEntry>("watchlist");
  const history = useLocalCollection<WatchHistoryEntry>("watch_history");
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMyTopRated(6)
      .then(setTopRated)
      .catch(() => setTopRated([]))
      .finally(() => setLoading(false));
  }, []);

  const genreCounts: Record<string, number> = {};
  history.items.forEach((h) => h.genres?.forEach((g) => { genreCounts[g] = (genreCounts[g] || 0) + 1; }));
  const favoriteGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([g]) => g);

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24">
      <div className="mt-8 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gold font-display text-2xl text-gold">
          {username?.[0]?.toUpperCase() || "?"}
        </div>
        <div>
          <h1 className="font-display text-2xl text-parchment">{username}</h1>
          <p className="text-sm text-muted">Member since your first rated movie</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Watched" value={history.items.length} />
        <Stat label="Watchlist" value={watchlist.items.length} />
        <Stat label="Top rated" value={topRated.length} />
        <Stat label="Favorite genre" value={favoriteGenres[0] || "—"} />
      </div>

      {favoriteGenres.length > 0 && (
        <p className="mt-4 text-sm text-muted">
          You gravitate toward {favoriteGenres.join(", ")}.
        </p>
      )}

      <section className="mt-12">
        <h2 className="font-display text-xl text-parchment">Your top rated</h2>
        <div className="mt-4">
          {loading ? (
            <CardGridSkeleton count={6} />
          ) : topRated.length === 0 ? (
            <p className="text-sm text-muted">Rate some movies to see them here.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
              {topRated.map((m) => <MovieCard key={m.movieId} movie={m} />)}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
