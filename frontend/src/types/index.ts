export interface Movie {
  movieId: number;
  title: string;
  genres: string[];
  avgRating?: number;
  ratingCount?: number;
  posterUrl?: string | null;
  score?: number;
}

export interface MovieDetail extends Movie {
  topTags: string[];
}

export interface WatchListEntry {
  movieId: number;
  title: string;
  genres: string[];
  addedAt: number;
}

export interface WatchHistoryEntry {
  movieId: number;
  title: string;
  genres: string[];
  watchedAt: number;
  userRating?: number;
}

export interface MoviesQuery {
  search?: string;
  genre?: string;
  minRating?: number;
  sort?: "title" | "year" | "rating";
  page?: number;
  pageSize?: number;
}
