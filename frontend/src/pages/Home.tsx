
import { useEffect, useState, ReactNode } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { Movie } from "../types";
import MovieCard from "../components/MovieCard";
import { CardGridSkeleton, ErrorState } from "../components/StateViews";
import { useLocalCollection } from "../hooks/useLocalCollection";
import { WatchListEntry } from "../types";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="font-display text-xl text-parchment">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function Home() {
  const [hero, setHero] = useState<Movie | null>(null);
  const [recs, setRecs] = useState<Movie[]>([]);
  const [popular, setPopular] = useState<Movie[]>([]);
  const [recent, setRecent] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const watchlist = useLocalCollection<WatchListEntry>("watchlist");
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    load();
  }, [isAuthenticated]);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const [recsData, popularData] = await Promise.all([
        isAuthenticated
          ? api.getMyHybridRecommendations(8).catch(() => [])
          : Promise.resolve([]),
        api.listMovies({ sort: "rating", pageSize: 12 }),
      ]);

      setRecs(recsData);
      setPopular(popularData);
      setRecent([...popularData].reverse().slice(0, 8));
      setHero(recsData[0] || popularData[0] || null);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load home page"
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleWatchlist(movie: Movie) {
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

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-10">
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24">
      {/* Hero banner */}
      <section className="mt-8 border border-rule bg-surface md:flex md:min-h-[380px]">
        {loading || !hero ? (
          <div className="h-64 w-full animate-pulse bg-surfaceRaised md:h-auto md:w-1/2" />
        ) : (
          <div
            className="relative h-64 w-full overflow-hidden bg-surfaceRaised md:min-h-[380px] md:w-1/2"
            style={{
              background: `linear-gradient(160deg, hsl(${
                (hero.movieId * 47) % 360
              } 35% 18%), hsl(${
                ((hero.movieId * 47) % 360 + 40) % 360
              } 30% 10%))`,
            }}
          >
            {hero.posterUrl && (
              <img
                src={hero.posterUrl}
                alt={`${hero.title} poster`}
                className="absolute inset-0 h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            )}

            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-ink/30" />
          </div>
        )}

        <div className="flex flex-1 flex-col justify-center p-8">
          <p className="text-xs uppercase tracking-widest text-gold">
            Tonight's pick
          </p>

          <h1 className="mt-3 font-display text-3xl leading-tight text-parchment md:text-4xl">
            {loading ? "Loading..." : hero?.title || "Welcome to Kindred"}
          </h1>

          {hero?.genres?.length ? (
            <p className="mt-3 text-sm text-muted">
              {hero.genres.join(" · ")}
            </p>
          ) : null}

          {hero && (
            <Link
              to={`/movie/${hero.movieId}`}
              className="mt-6 inline-block w-fit border border-gold px-5 py-2 text-sm text-gold transition-colors hover:bg-gold hover:text-ink"
            >
              View details
            </Link>
          )}
        </div>
      </section>

      <Section title="Recommended for you">
        {!isAuthenticated ? (
          <p className="text-sm text-muted">
            <Link to="/login" className="text-gold hover:underline">
              Log in
            </Link>{" "}
            to get picks based on your ratings.
          </p>
        ) : loading ? (
          <CardGridSkeleton count={6} />
        ) : recs.length === 0 ? (
          <p className="text-sm text-muted">
            Rate a few movies to unlock personalized picks — see the Profile
            page.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {recs.map((m) => (
              <MovieCard
                key={m.movieId}
                movie={m}
                onToggleWatchlist={toggleWatchlist}
                inWatchlist={watchlist.has(m.movieId)}
              />
            ))}
          </div>
        )}
      </Section>

      <Section title="Popular right now">
        {loading ? (
          <CardGridSkeleton count={6} />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {popular.map((m) => (
              <MovieCard
                key={m.movieId}
                movie={m}
                onToggleWatchlist={toggleWatchlist}
                inWatchlist={watchlist.has(m.movieId)}
              />
            ))}
          </div>
        )}
      </Section>

      <Section title="Recently added">
        {loading ? (
          <CardGridSkeleton count={6} />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {recent.map((m) => (
              <MovieCard
                key={m.movieId}
                movie={m}
                onToggleWatchlist={toggleWatchlist}
                inWatchlist={watchlist.has(m.movieId)}
              />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
