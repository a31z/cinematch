import { useState, useEffect } from 'react';
import { PreferencesForm } from './components/PreferencesForm';
import { LikedMoviesInput } from './components/LikedMoviesInput';
import { HomeScreen } from './components/HomeScreen';
import { MovieModal } from './components/MovieModal';
import { STORAGE_KEYS, saveItem, getItem } from './utils/storage';
import type { Movie, Preferences, MovieCsvRow } from './types';

type Page = 'home' | 'preferences' | 'addMovies';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

const toStringValue = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  return String(value);
};

const toNumberValue = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const parseYear = (releaseDate: string) => {
  if (!releaseDate) return '';
  return releaseDate.slice(0, 4);
};

const parsePrimaryGenre = (genres: string) => {
  if (!genres) return undefined;
  const first = genres.split('|')[0]?.trim();
  return first || genres;
};

const mapCriteriaWeights = (prefs: Preferences): number[] => {
  const baseCriteria = ['Cinematography', 'Plot', 'Pacing', 'Direction', 'Sound and Score'];
  return baseCriteria.map((criterion) => {
    const index = prefs.rankedCriteria.indexOf(criterion);
    if (index === -1) return 0;
    return baseCriteria.length - index;
  });
};

const buildPosterUrl = (id: string) => `${API_BASE_URL}/poster/${encodeURIComponent(id)}`;

const ensurePoster = (movie: Movie): Movie => {
  const poster = buildPosterUrl(movie.id);
  if (movie.poster === poster) return movie;
  return {
    ...movie,
    poster,
  };
};

const mapApiMovie = (row: MovieCsvRow): Movie => {
  const title = toStringValue(row.title);
  const releaseDate = toStringValue(row.release_date);
  const cinematography = toNumberValue(row.cinematography_rating);
  const plot = toNumberValue(row.plot_rating);
  const pacing = toNumberValue(row.pacing_rating);
  const direction = toNumberValue(row.direction_rating);
  const sound = toNumberValue(row.music_rating);
  const overall = toNumberValue(row.overall) || (cinematography + plot + pacing + direction + sound) / 5;

  return {
    id: toStringValue(row.id),
    title,
    year: parseYear(releaseDate),
    poster: buildPosterUrl(toStringValue(row.id)),
    director: 'Unknown',
    genre: parsePrimaryGenre(toStringValue(row.genres)),
    ratings: {
      overall,
      cinematography,
      plot,
      pacing,
      direction,
      sound,
    },
  };
};

export default function App() {
  const initialPreferences = getItem<Preferences>(STORAGE_KEYS.PREFERENCES);
  const initialRatedMovies = (getItem<Movie[]>(STORAGE_KEYS.RATED_MOVIES) || []).map(ensurePoster);
  const initialPage: Page = initialPreferences
    ? (initialRatedMovies.length > 0 ? 'home' : 'addMovies')
    : 'preferences';

  const [currentPage, setCurrentPage] = useState<Page>(initialPage);
  const [preferences, setPreferences] = useState<Preferences | null>(initialPreferences);
  const [ratedMovies, setRatedMovies] = useState<Movie[]>(initialRatedMovies);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [movieDatabase, setMovieDatabase] = useState<Movie[]>([]);
  const [discoveryMovies, setDiscoveryMovies] = useState<Movie[]>([]);
  const [isLoadingMovies, setIsLoadingMovies] = useState(false);
  const [movieLoadError, setMovieLoadError] = useState<string | null>(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);
  
  // Persist preferences when they change
  useEffect(() => {
    saveItem(STORAGE_KEYS.PREFERENCES, preferences);
  }, [preferences]);

  // Persist rated movies when they change
  useEffect(() => {
    saveItem(STORAGE_KEYS.RATED_MOVIES, ratedMovies.map(ensurePoster));
  }, [ratedMovies]);

  const saveProfile = async (prefs: Preferences) => {
    const payload = {
      user_weights: mapCriteriaWeights(prefs),
      preferred_genres: prefs.genres,
      pacing_pref: prefs.pacingPreference.toLowerCase(),
      discovery_mode: false,
    };

    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to save profile (${response.status})`);
    }
  };

  const fetchRecommendations = async () => {
    setIsLoadingRecommendations(true);
    setRecommendationsError(null);
    try {
      if (!preferences) {
        throw new Error('Please set preferences before fetching recommendations.');
      }
      await saveProfile(preferences);
      const response = await fetch(`${API_BASE_URL}/recommend?top_n=10`);
      const data = await response.json();
      if (!response.ok || data?.error) {
        throw new Error(data?.error || `Failed to fetch recommendations (${response.status})`);
      }
      const recs = (data.recommendations as MovieCsvRow[]).map(mapApiMovie);
      setRecommendations(recs);
    } catch (error) {
      setRecommendationsError(error instanceof Error ? error.message : 'Failed to load recommendations');
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  useEffect(() => {
    let isActive = true;

    const loadMovies = async () => {
      setIsLoadingMovies(true);
      setMovieLoadError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/movies`);
        if (!response.ok) {
          throw new Error(`Failed to load movies (${response.status})`);
        }
        const data = (await response.json()) as MovieCsvRow[];
        const mapped = data.map(mapApiMovie);
        if (isActive) {
          setMovieDatabase(mapped);
          setDiscoveryMovies(mapped.slice(0, 18));
        }
      } catch (error) {
        if (isActive) {
          setMovieLoadError(error instanceof Error ? error.message : 'Failed to load movies');
        }
      } finally {
        if (isActive) {
          setIsLoadingMovies(false);
        }
      }
    };

    loadMovies();

    return () => {
      isActive = false;
    };
  }, []);

  const handlePreferencesSubmit = async (prefs: Preferences) => {
    setPreferences(prefs);
    
    // LOGIC: If the user has already rated movies, they aren't "new"
    // Skip the onboarding step and go straight to results.
    if (ratedMovies.length > 0) {
      await fetchRecommendations();
      setCurrentPage('home');
    } else {
      setCurrentPage('addMovies');
    }
  };

  const handleMoviesSubmit = async (movies: Movie[]) => {
    const moviesWithDates = movies.map(movie => ({
      ...movie,
      dateRated: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    }));
    setRatedMovies([...ratedMovies, ...moviesWithDates]);
    
    await fetchRecommendations();
    
    setCurrentPage('home');
  };

  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie);
  };

  const handleSaveRating = async (ratings: Movie['ratings']) => {
    if (!selectedMovie) return;

    const isAlreadyRated = ratedMovies.some(m => m.id === selectedMovie.id);

    if (isAlreadyRated) {
      // Update existing rating
      setRatedMovies(ratedMovies.map(m =>
        m.id === selectedMovie.id ? { ...m, ratings } : m
      ));
    } else {
      // Add new rating
      const newMovie = {
        ...selectedMovie,
        ratings,
        dateRated: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      };
      setRatedMovies([...ratedMovies, newMovie]);
    }

    // Regenerate recommendations
    const updatedRated = isAlreadyRated
      ? ratedMovies.map(m => m.id === selectedMovie.id ? { ...m, ratings } : m)
      : [...ratedMovies, { ...selectedMovie, ratings }];
    
    await fetchRecommendations();
  };

  const handleRemoveRating = async (movieId: string) => {
    const updatedRated = ratedMovies.filter((m) => m.id !== movieId);
    setRatedMovies(updatedRated);
    await fetchRecommendations();
    setSelectedMovie(null);
  };

  const isMovieRated = (movie: Movie) => {
    return ratedMovies.some(m => m.id === movie.id);
  };

  const handleSearchMovieSelect = (movieId: string) => {
    // Check if movie is already rated
    const ratedMovie = ratedMovies.find(m => m.id === movieId);
    if (ratedMovie) {
      // Open modal with existing rating
      setSelectedMovie(ratedMovie);
    } else {
      // Find movie in database and open modal for new rating
      const movie = movieDatabase.find(m => m.id === movieId);
      if (movie) {
        setSelectedMovie(movie);
      }
    }
  };

  return (
    <div className="min-h-screen bg-black p-6">
      {/* PERSISTENT HEADER */}
      <header className="mb-10 border-b-2 border-black pb-4 flex flex-col gap-1">
        <p className="text-xs text-white font-bold uppercase tracking-wide">
          ABSOLLUTE
        </p>
        <h1 className="text-2xl text-red-700 font-black uppercase tracking-tighter">CINEMATCH</h1>
      </header>

      {/* DYNAMIC CONTENT */}
      <main>
        {isLoadingMovies && (
          <div className="mb-4 text-sm text-muted-foreground">Loading movies...</div>
        )}
        {isLoadingRecommendations && (
          <div className="mb-4 text-sm text-muted-foreground">Loading recommendations...</div>
        )}
        {recommendationsError && (
          <div className="mb-4 text-sm text-red-600">Failed to load recommendations: {recommendationsError}</div>
        )}
        {movieLoadError && (
          <div className="mb-4 text-sm text-red-600">Failed to load movies: {movieLoadError}</div>
        )}
        {currentPage === 'preferences' && (
          <PreferencesForm onSubmit={handlePreferencesSubmit} />
        )}

        {currentPage === 'addMovies' && (
          <LikedMoviesInput
            onSubmit={handleMoviesSubmit}
            // If they click back, they go to preferences; 
            // if they already have movies, they could also go home.
            onBack={() => setCurrentPage('preferences')} 
            movieDatabase={movieDatabase}
          />
        )}

        {currentPage === 'home' && (
          <HomeScreen
            ratedMovies={ratedMovies}
            recommendations={recommendations}
            discoveryMovies={discoveryMovies}
            movieDatabase={movieDatabase}
            onMovieClick={handleMovieClick}
            onSearchMovieSelect={handleSearchMovieSelect}
            onUpdatePreferences={() => setCurrentPage('preferences')}
          />
        )}
      </main>

      {/* MOVIE MODAL */}
      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          isRated={isMovieRated(selectedMovie)}
          onClose={() => setSelectedMovie(null)}
          onSaveRating={handleSaveRating}
          onRemoveRating={() => handleRemoveRating(selectedMovie.id)}
        />
      )}
    </div>
  );
}
