import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { MovieDetail, Movie, WatchListEntry, WatchHistoryEntry } from "../types";
import MovieCard from "../components/MovieCard";
import { CardGridSkeleton, ErrorState } from "../components/StateViews";
import { useLocalCollection } from "../hooks/useLocalCollection";

export default function MovieDetails() {
  const { id } = useParams<{ id: string }>();
  const movieId = Number(id);

  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [similar, setSimilar] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [ratingMessage, setRatingMessage] = useState<string | null>(null);

  const watchlist = useLocalCollection<WatchListEntry>("watchlist");
  const history = useLocalCollection<WatchHistoryEntry>("watch_history");
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    load();
  }, [movieId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [detail, sims] = await Promise.all([
        api.getMovie(movieId),
        api.getSimilarMovies(movieId, 6).catch(() => []),
      ]);
      setMovie(detail);
      setSimilar(sims);
      if (isAuthenticated) {
        const savedRating = await api.getMyMovieRating(movieId).catch(() => null);
        setUserRating(savedRating?.rating ?? null);
      } else {
        setUserRating(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load this movie");
    } finally {
      setLoading(false);
    }
  }

  async function submitRating(value: number) {
    if (!isAuthenticated) return;
    setSaving(true);
    setRatingMessage(null);
    try {
      await api.rateMovie(movieId, value);
      setUserRating(value);
      setRatingMessage("Your rating was saved.");
    } catch (e) {
      setRatingMessage(e instanceof Error ? e.message : "Could not save your rating. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function markWatched() {
    if (!movie) return;
    history.add({
      movieId: movie.movieId,
      title: movie.title,
      genres: movie.genres,
      watchedAt: Date.now(),
      userRating: userRating ?? undefined,
    });
  }

  function toggleWatchlist() {
    if (!movie) return;
    if (watchlist.has(movie.movieId)) {
      watchlist.remove(movie.movieId);
    } else {
      watchlist.add({
        movieId: movie.movieId,
        title: movie.title,
        genres: movie.genres,
        addedAt: Date.now(),
      });
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="h-80 w-full animate-pulse bg-surface" />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-10">
        <ErrorState message={error || "Movie not found"} onRetry={load} />
      </div>
    );
  }

  const inWatchlist = watchlist.has(movie.movieId);
  const hue = (movie.movieId * 47) % 360;

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24">
      <div className="mt-8 flex flex-col gap-8 md:flex-row">
        <div
          className="h-72 w-full shrink-0 overflow-hidden rounded-sm border border-rule md:h-96 md:w-72"
          style={movie.posterUrl ? undefined : { background: `linear-gradient(160deg, hsl(${hue} 35% 18%), hsl(${(hue + 40) % 360} 30% 10%))` }}
        >
          {movie.posterUrl && (
            <img
              src={movie.posterUrl}
              alt={`${movie.title} poster`}
              className="h-full w-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}
        </div>

        <div className="flex-1">
          <h1 className="font-display text-3xl text-parchment md:text-4xl">{movie.title}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted">
            {movie.genres?.map((g) => (
              <span key={g} className="border border-rule px-2 py-0.5">{g}</span>
            ))}
            {movie.avgRating ? (
              <span className="text-gold">★ {movie.avgRating.toFixed(1)} ({movie.ratingCount} ratings)</span>
            ) : (
              <span>No ratings yet</span>
            )}
          </div>

          {movie.topTags?.length > 0 && (
            <p className="mt-4 max-w-prose text-sm text-muted">
              Tagged by viewers as: {movie.topTags.join(", ")}
            </p>
          )}

          {/* Cast/director intentionally omitted - not present in the
              MovieLens dataset. Wire up TMDB or similar if you want this. */}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={toggleWatchlist}
              className={`border px-4 py-2 text-sm transition-colors ${
                inWatchlist ? "border-gold text-gold" : "border-rule text-parchment hover:border-parchment/50"
              }`}
            >
              {inWatchlist ? "In your watchlist" : "Add to watchlist"}
            </button>
            <button
              onClick={markWatched}
              className="border border-rule px-4 py-2 text-sm text-parchment hover:border-parchment/50"
            >
              Mark as watched
            </button>
          </div>

          <div className="mt-6">
            <p className="text-sm text-muted">Your rating</p>
            {!isAuthenticated ? (
              <p className="mt-2 text-sm text-muted">
                <Link to="/login" className="text-gold hover:underline">Log in</Link> to rate this movie.
              </p>
            ) : (
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    disabled={saving}
                    onClick={() => submitRating(star)}
                    aria-label={`Rate ${star} stars`}
                    className={`text-2xl transition-colors ${
                      userRating && star <= userRating ? "text-gold" : "text-rule hover:text-muted"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            )}
            {ratingMessage && <p role="status" className="mt-2 text-sm text-muted">{ratingMessage}</p>}
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-xl text-parchment">
            Because you're looking at {movie.title}
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
            {similar.map((m) => (
              <MovieCard key={m.movieId} movie={m} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
