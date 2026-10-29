import { useEffect, useState } from "react";
import { api } from "../services/api";
import { Movie, WatchListEntry } from "../types";
import MovieCard from "../components/MovieCard";
import { CardGridSkeleton, EmptyState, ErrorState } from "../components/StateViews";
import { useLocalCollection } from "../hooks/useLocalCollection";


interface Row {
  title: string;
  explain: string;
  fetcher: () => Promise<Movie[]>;
}

export default function Recommendations() {
  const [data, setData] = useState<Record<string, Movie[]>>({});
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const watchlist = useLocalCollection<WatchListEntry>("watchlist");

  const rows: Row[] = [
    {
      title: "Recommended for you",
      explain: "Blends your ratings with what similar viewers loved.",
      fetcher: () => api.getMyHybridRecommendations(12),
    },
    {
      title: "Based on your ratings",
      explain: "From viewers who rated the same movies you did highly.",
      fetcher: () => api.getMyRecommendations(12),
    },
    {
      title: "Because you rated these highly",
      explain: "A look back at what you've already loved.",
      fetcher: () => api.getMyTopRated(12),
    },
  ];

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const results: Record<string, Movie[]> = {};
    const fails: Record<string, boolean> = {};
    await Promise.all(
      rows.map(async (row) => {
        try {
          results[row.title] = await row.fetcher();
        } catch {
          fails[row.title] = true;
        }
      })
    );
    setData(results);
    setFailed(fails);
    setLoading(false);
  }

  function toggleWatchlist(movie: Movie) {
    if (watchlist.has(movie.movieId)) watchlist.remove(movie.movieId);
    else watchlist.add({ movieId: movie.movieId, title: movie.title, genres: movie.genres, addedAt: Date.now() });
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24">
      <h1 className="mt-8 font-display text-3xl text-parchment">For you</h1>
      <p className="mt-2 max-w-prose text-sm text-muted">
        Every section below explains why it's showing what it's showing — nothing here is generic.
      </p>

      {rows.map((row) => (
        <section key={row.title} className="mt-12">
          <h2 className="font-display text-xl text-parchment">{row.title}</h2>
          <p className="mt-1 text-sm italic text-muted">{row.explain}</p>
          <div className="mt-4">
            {loading ? (
              <CardGridSkeleton count={6} />
            ) : failed[row.title] ? (
              <ErrorState message="This recommendation type isn't available right now." onRetry={load} />
            ) : !data[row.title]?.length ? (
              <EmptyState title="Nothing here yet" body="Rate a few more movies to unlock this section." />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {data[row.title].map((m) => (
                  <MovieCard key={m.movieId} movie={m} onToggleWatchlist={toggleWatchlist} inWatchlist={watchlist.has(m.movieId)} />
                ))}
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
