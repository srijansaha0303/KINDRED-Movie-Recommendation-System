import { useEffect, useState } from "react";
import { api } from "../services/api";
import { Movie, WatchListEntry } from "../types";
import MovieCard from "../components/MovieCard";
import { CardGridSkeleton, EmptyState, ErrorState } from "../components/StateViews";
import { useLocalCollection } from "../hooks/useLocalCollection";

const GENRES = [
  "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary",
  "Drama", "Fantasy", "Horror", "Musical", "Mystery", "Romance",
  "Sci-Fi", "Thriller", "War",
];

export default function Browse() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState<"title" | "rating">("title");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const watchlist = useLocalCollection<WatchListEntry>("watchlist");

  useEffect(() => {
    const t = setTimeout(load, 300); // debounce search typing
    return () => clearTimeout(t);
  }, [search, genre, minRating, sort, page]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listMovies({
        search: search || undefined,
        genre: genre || undefined,
        minRating: minRating || undefined,
        sort,
        page,
        pageSize: 24,
      });
      setMovies(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load movies");
    } finally {
      setLoading(false);
    }
  }

  function toggleWatchlist(movie: Movie) {
    if (watchlist.has(movie.movieId)) {
      watchlist.remove(movie.movieId);
    } else {
      watchlist.add({ movieId: movie.movieId, title: movie.title, genres: movie.genres, addedAt: Date.now() });
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24">
      <h1 className="mt-8 font-display text-3xl text-parchment">Browse</h1>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          placeholder="Search by title..."
          className="w-full flex-1 border border-rule bg-surface px-3 py-2 text-sm text-parchment placeholder:text-muted focus:border-gold sm:w-auto"
        />
        <select
          value={genre}
          onChange={(e) => { setPage(1); setGenre(e.target.value); }}
          className="border border-rule bg-surface px-3 py-2 text-sm text-parchment"
        >
          <option value="">All genres</option>
          {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <select
          value={minRating}
          onChange={(e) => { setPage(1); setMinRating(Number(e.target.value)); }}
          className="border border-rule bg-surface px-3 py-2 text-sm text-parchment"
        >
          <option value={0}>Any rating</option>
          <option value={3}>3+ stars</option>
          <option value={4}>4+ stars</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "title" | "rating")}
          className="border border-rule bg-surface px-3 py-2 text-sm text-parchment"
        >
          <option value="title">Sort: Title</option>
          <option value="rating">Sort: Rating</option>
        </select>
      </div>

      <div className="mt-8">
        {loading ? (
          <CardGridSkeleton count={12} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : movies.length === 0 ? (
          <EmptyState title="No movies match that" body="Try a broader search or clear a filter." />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {movies.map((m) => (
              <MovieCard key={m.movieId} movie={m} onToggleWatchlist={toggleWatchlist} inWatchlist={watchlist.has(m.movieId)} />
            ))}
          </div>
        )}
      </div>

      {!loading && movies.length > 0 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="border border-rule px-4 py-1.5 text-sm text-parchment disabled:opacity-30"
          >
            Previous
          </button>
          <span className="text-sm text-muted">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            className="border border-rule px-4 py-1.5 text-sm text-parchment"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
