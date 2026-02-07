import { useState, useEffect } from 'react';
import { PreferencesForm } from './components/PreferencesForm';
import { LikedMoviesInput } from './components/LikedMoviesInput';
import { HomeScreen } from './components/HomeScreen';
import { MovieModal } from './components/MovieModal';
import { STORAGE_KEYS, saveItem, getItem } from './utils/storage';
import type { Movie, Preferences, MovieCsvRow } from './types';

type Page = 'home' | 'preferences' | 'addMovies';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
const POSTER_PLACEHOLDER = 'https://via.placeholder.com/300x450?text=No+Poster';

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
    poster: POSTER_PLACEHOLDER,
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
  const initialRatedMovies = getItem<Movie[]>(STORAGE_KEYS.RATED_MOVIES) || [];
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
  
  // Persist preferences when they change
  useEffect(() => {
    saveItem(STORAGE_KEYS.PREFERENCES, preferences);
  }, [preferences]);

  // Persist rated movies when they change
  useEffect(() => {
    saveItem(STORAGE_KEYS.RATED_MOVIES, ratedMovies);
  }, [ratedMovies]);

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

  const generateRecommendations = (prefs: Preferences | null, rated: Movie[]): Movie[] => {
    if (!prefs || rated.length === 0) return [];

    // Simple mock: filter discovery movies by genre preference
    const source = discoveryMovies.length > 0 ? discoveryMovies : movieDatabase;
    const filtered = source.filter((movie) => {
      const matchesGenre = prefs.genres.length === 0 || prefs.genres.includes(movie.genre || '');
      return matchesGenre;
    });

    return filtered.map((movie) => ({
      ...movie,
      matchScore: 0.75 + Math.random() * 0.25,
    })).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)).slice(0, 5);
  };

  const handlePreferencesSubmit = (prefs: Preferences) => {
    setPreferences(prefs);
    
    // LOGIC: If the user has already rated movies, they aren't "new"
    // Skip the onboarding step and go straight to results.
    if (ratedMovies.length > 0) {
      // Regenerate recommendations with the new preferences
      const recs = generateRecommendations(prefs, ratedMovies);
      setRecommendations(recs);
      setCurrentPage('home');
    } else {
      setCurrentPage('addMovies');
    }
  };

  const handleMoviesSubmit = (movies: Movie[]) => {
    const moviesWithDates = movies.map(movie => ({
      ...movie,
      dateRated: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    }));
    setRatedMovies([...ratedMovies, ...moviesWithDates]);
    
    const recs = generateRecommendations(preferences, [...ratedMovies, ...moviesWithDates]);
    setRecommendations(recs);
    
    setCurrentPage('home');
  };

  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie);
  };

  const handleSaveRating = (ratings: Movie['ratings']) => {
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
    
    const recs = generateRecommendations(preferences, updatedRated);
    setRecommendations(recs);
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
    <div className="min-h-screen bg-background p-6">
      {/* PERSISTENT HEADER */}
      <header className="mb-10 border-b-2 border-black pb-4">
        <h1 className="text-2xl font-black uppercase tracking-tighter">CINEMATCH</h1>
        <p className="text-xs text-gray-500 font-bold mt-1">
          by absolute
        </p>
      </header>

      {/* DYNAMIC CONTENT */}
      <main>
        {isLoadingMovies && (
          <div className="mb-4 text-sm text-muted-foreground">Loading movies...</div>
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
        />
      )}
    </div>
  );
}
