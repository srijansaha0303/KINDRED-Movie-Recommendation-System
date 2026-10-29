import { Link } from "react-router-dom";
import { useState } from "react";
import { Movie } from "../types";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

interface Props {
  movie: Movie;
  onToggleWatchlist?: (movie: Movie) => void;
  inWatchlist?: boolean;
  reason?: string; // e.g. "Because you watched Interstellar"
}

// Deterministic placeholder art since MovieLens has no poster images and
// we're not wiring an external API (TMDB, etc). Each movie gets a stable
// gradient from its id so the grid still reads visually distinct.
function posterStyle(movieId: number) {
  const hue1 = (movieId * 47) % 360;
  const hue2 = (hue1 + 40) % 360;
  return {
    background: `linear-gradient(160deg, hsl(${hue1} 35% 18%), hsl(${hue2} 30% 10%))`,
  };
}

export default function MovieCard({ movie, onToggleWatchlist, inWatchlist, reason }: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [ratingBusy, setRatingBusy] = useState(false);
  const [ratingMessage, setRatingMessage] = useState("");
  const { isAuthenticated } = useAuth();
  const showPoster = movie.posterUrl && !imgFailed;

  return (
    <div className="group flex flex-col">
      <Link to={`/movie/${movie.movieId}`} className="block">
        <div
          className="relative aspect-[2/3] w-full overflow-hidden rounded-sm border border-rule transition-transform duration-200 group-hover:-translate-y-1"
          style={showPoster ? undefined : posterStyle(movie.movieId)}
        >
          {showPoster && (
            <img
              src={movie.posterUrl!}
              alt={`${movie.title} poster`}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              onError={() => setImgFailed(true)}
            />
          )}
          {!showPoster && (
            <div className="absolute inset-0 flex items-end p-3">
              <span className="font-display text-sm leading-snug text-parchment/90">
                {movie.title}
              </span>
            </div>
          )}
          {typeof movie.avgRating === "number" && movie.avgRating > 0 && (
            <span className="absolute right-2 top-2 rounded-sm bg-ink/80 px-1.5 py-0.5 text-xs text-gold">
              {movie.avgRating.toFixed(1)}
            </span>
          )}
        </div>
      </Link>

      {reason && <p className="mt-2 text-xs italic text-muted">{reason}</p>}

      {isAuthenticated && (
        <div className="mt-2" aria-label={`Rate ${movie.title}`}>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                disabled={ratingBusy}
                aria-label={`Rate ${movie.title} ${star} stars`}
                title={`Rate ${star} star${star === 1 ? "" : "s"}`}
                onClick={async () => {
                  setRatingBusy(true); setRatingMessage("");
                  try {
                    await api.rateMovie(movie.movieId, star);
                    setRating(star); setRatingMessage("Saved");
                  } catch (e) {
                    setRatingMessage(e instanceof Error ? e.message : "Rating failed");
                  } finally { setRatingBusy(false); }
                }}
                className={`text-lg leading-none transition-colors disabled:opacity-50 ${rating && star <= rating ? "text-gold" : "text-rule hover:text-gold"}`}
              >★</button>
            ))}
            {ratingMessage && <span role="status" className="ml-1 text-[10px] text-muted">{ratingMessage}</span>}
          </div>
        </div>
      )}

      <div className="mt-1.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm text-parchment/90">{movie.title}</p>
          {movie.genres?.length > 0 && (
            <p className="truncate text-xs text-muted">{movie.genres.slice(0, 2).join(" · ")}</p>
          )}
        </div>
        {onToggleWatchlist && (
          <button
            onClick={() => onToggleWatchlist(movie)}
            aria-label={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
            className={`mt-0.5 shrink-0 rounded-sm border px-2 py-1 text-xs transition-colors ${
              inWatchlist
                ? "border-gold text-gold"
                : "border-rule text-muted hover:border-parchment/40 hover:text-parchment"
            }`}
          >
            {inWatchlist ? "Added" : "+ List"}
          </button>
        )}
      </div>
    </div>
  );
}
