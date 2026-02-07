export type PacingPreference = 'Fast' | 'Slow';

export interface Preferences {
  genres: string[];
  rankedCriteria: string[];
  unimportantCriteria: string[];
  pacingPreference: PacingPreference;
}

export interface MovieRatings {
  overall: number;
  cinematography: number;
  plot: number;
  pacing: number;
  direction: number;
  sound: number;
}

export interface Movie {
  id: string;
  title: string;
  year: string;
  poster: string;
  director: string;
  genre?: string;
  ratings: MovieRatings;
  matchScore?: number;
  dateRated?: string;
  isSaved?: boolean;
}

export interface MovieCsvRow {
  id: string;
  title: string;
  genres: string;
  keywords: string;
  overview: string;
  release_date: string;
  runtime: string;
  cinematography_rating: string;
  pacing_rating: string;
  music_rating: string;
  direction_rating: string;
  plot_rating: string;
  tags: string;
  overall: string;
  pacing: string;
  director: string;
}
