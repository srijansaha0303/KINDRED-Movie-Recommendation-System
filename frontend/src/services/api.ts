import { Movie, MovieDetail, MoviesQuery } from "../types";

const BASE = "/api";

function getToken(): string | null {
  try {
    const raw = localStorage.getItem("kindred_auth");
    return raw ? JSON.parse(raw).token : null;
  } catch {
    return null;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  // ---- Auth ----
  signup(username: string, password: string, email?: string) {
    return request<{ token: string; userId: number; username: string }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ username, password, email }),
    });
  },

  login(username: string, password: string) {
    return request<{ token: string; userId: number; username: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  // ---- Public browsing ----
  listMovies(query: MoviesQuery = {}): Promise<Movie[]> {
    const params = new URLSearchParams();
    if (query.search) params.set("search", query.search);
    if (query.genre) params.set("genre", query.genre);
    if (query.minRating) params.set("min_rating", String(query.minRating));
    if (query.sort) params.set("sort", query.sort);
    if (query.page) params.set("page", String(query.page));
    if (query.pageSize) params.set("page_size", String(query.pageSize));
    return request(`/movies?${params.toString()}`);
  },

  getMovie(movieId: number): Promise<MovieDetail> {
    return request(`/movies/${movieId}`);
  },

  getSimilarMovies(movieId: number, limit = 8): Promise<Movie[]> {
    return request(`/similar/${movieId}?limit=${limit}`);
  },

  // ---- Requires login (identified via token, no userId needed) ----
  getMyRecommendations(limit = 12): Promise<Movie[]> {
    return request(`/recommend/me?limit=${limit}`);
  },

  getMyHybridRecommendations(limit = 12): Promise<Movie[]> {
    return request(`/hybrid/me?limit=${limit}`);
  },

  getMyTopRated(limit = 12): Promise<Movie[]> {
    return request(`/top-rated/me?limit=${limit}`);
  },

  getMyMovieRating(movieId: number): Promise<{ movieId: number; rating: number | null }> {
    return request(`/rating/${movieId}`);
  },

  rateMovie(movieId: number, rating: number) {
    return request(`/rate`, {
      method: "POST",
      body: JSON.stringify({ movieId, rating }),
    });
  },
};
