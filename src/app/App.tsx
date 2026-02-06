import { useState } from 'react';
import { PreferencesForm } from './components/PreferencesForm';
import { LikedMoviesInput } from './components/LikedMoviesInput';
import { HomeScreen } from './components/HomeScreen';
import { MovieModal } from './components/MovieModal';

type Page = 'home' | 'preferences' | 'addMovies';

interface Preferences {
  genres: string[];
  rankedCriteria: string[];
  unimportantCriteria: string[];
  pacingPreference: 'Fast' | 'Slow';
}

interface Movie {
  id: string;
  title: string;
  year: string;
  poster: string;
  director: string;
  genre?: string;
  ratings: {
    overall: number;
    cinematography: number;
    plot: number;
    pacing: number;
    direction: number;
    sound: number;
  };
  matchScore?: number;
  dateRated?: string;
}

// Mock database for discovery mode
const DISCOVERY_MOVIES: Movie[] = [
  {
    id: 'tt1',
    title: 'Blade Runner 2049',
    year: '2017',
    director: 'Denis Villeneuve',
    genre: 'Sci-Fi',
    poster: 'https://m.media-amazon.com/images/M/MV5BNzA1Njg4NzYxOV5BMl5BanBnXkFtZTgwODk5NjU3MzI@._V1_SX300.jpg',
    ratings: { overall: 8.0, cinematography: 0, plot: 0, pacing: 0, direction: 0, sound: 0 },
  },
  {
    id: 'tt2',
    title: 'Parasite',
    year: '2019',
    director: 'Bong Joon Ho',
    genre: 'Drama',
    poster: 'https://m.media-amazon.com/images/M/MV5BYWZjMjk3ZTItODQ2ZC00NTY5LWE0ZDYtZTI3MjcwN2Q5NTVkXkEyXkFqcGdeQXVyODk4OTc3MTY@._V1_SX300.jpg',
    ratings: { overall: 8.6, cinematography: 0, plot: 0, pacing: 0, direction: 0, sound: 0 },
  },
  {
    id: 'tt3',
    title: 'Whiplash',
    year: '2014',
    director: 'Damien Chazelle',
    genre: 'Drama',
    poster: 'https://m.media-amazon.com/images/M/MV5BOTA5NDZlZGUtMjAxOS00YTRkLTkwYmMtYWQ0NWEwZDZiNjEzXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg',
    ratings: { overall: 8.5, cinematography: 0, plot: 0, pacing: 0, direction: 0, sound: 0 },
  },
  {
    id: 'tt4',
    title: 'Everything Everywhere All at Once',
    year: '2022',
    director: 'Daniel Kwan, Daniel Scheinert',
    genre: 'Sci-Fi',
    poster: 'https://m.media-amazon.com/images/M/MV5BYTdiOTIyZTQtNmQ1OS00NjZlLWIyMTgtYzk5Y2M3ZDVmMDk1XkEyXkFqcGdeQXVyMTAzMDg4NzU0._V1_SX300.jpg',
    ratings: { overall: 7.8, cinematography: 0, plot: 0, pacing: 0, direction: 0, sound: 0 },
  },
  {
    id: 'tt5',
    title: 'Dune',
    year: '2021',
    director: 'Denis Villeneuve',
    genre: 'Sci-Fi',
    poster: 'https://m.media-amazon.com/images/M/MV5BN2FjNmEyNWMtYzM0ZS00NjIyLTg5YzYtYThlMGVjNzE1OGViXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_SX300.jpg',
    ratings: { overall: 8.0, cinematography: 0, plot: 0, pacing: 0, direction: 0, sound: 0 },
  },
  {
    id: 'tt6',
    title: 'The Grand Budapest Hotel',
    year: '2014',
    director: 'Wes Anderson',
    genre: 'Comedy',
    poster: 'https://m.media-amazon.com/images/M/MV5BMzM5NjUxOTEyMl5BMl5BanBnXkFtZTgwNjEyMDM0MDE@._V1_SX300.jpg',
    ratings: { overall: 8.1, cinematography: 0, plot: 0, pacing: 0, direction: 0, sound: 0 },
  },
];

// Complete searchable movie database
const MOVIE_DATABASE: Movie[] = [
  ...DISCOVERY_MOVIES,
  {
    id: 'tt7',
    title: 'The Matrix',
    year: '1999',
    director: 'Lana & Lilly Wachowski',
    genre: 'Sci-Fi',
    poster: 'https://m.media-amazon.com/images/M/MV5BNzQzOTk3MTAtOTRhS000ZTMwLThkZmYtMzBiNzllYzY0MzdkXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SX300.jpg',
    ratings: { overall: 8.7, cinematography: 0, plot: 0, pacing: 0, direction: 0, sound: 0 },
  },
  {
    id: 'tt8',
    title: 'The Godfather',
    year: '1972',
    director: 'Francis Ford Coppola',
    genre: 'Drama',
    poster: 'https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYzZlODY3ZTk3OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg',
    ratings: { overall: 9.2, cinematography: 0, plot: 0, pacing: 0, direction: 0, sound: 0 },
  },
  {
    id: 'tt9',
    title: 'Inception',
    year: '2010',
    director: 'Christopher Nolan',
    genre: 'Sci-Fi',
    poster: 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg',
    ratings: { overall: 8.8, cinematography: 0, plot: 0, pacing: 0, direction: 0, sound: 0 },
  },
  {
    id: 'tt10',
    title: 'Interstellar',
    year: '2014',
    director: 'Christopher Nolan',
    genre: 'Sci-Fi',
    poster: 'https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2FiMmZkNWIyODZiXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg',
    ratings: { overall: 8.6, cinematography: 0, plot: 0, pacing: 0, direction: 0, sound: 0 },
  },
  {
    id: 'tt11',
    title: 'Spider-Man: Across the Spider-Verse',
    year: '2023',
    director: 'Joaquim Dos Santos',
    genre: 'Action',
    poster: 'https://m.media-amazon.com/images/M/MV5BMzI0NmVkMjEtYmY4MS00ZDMxLTlkZmEtMzU4MDQxYTMzMjU2XkEyXkFqcGdeQXVyMzQ0MzA0NTM@._V1_SX300.jpg',
    ratings: { overall: 8.7, cinematography: 0, plot: 0, pacing: 0, direction: 0, sound: 0 },
  },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('preferences');
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [ratedMovies, setRatedMovies] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);

  const generateRecommendations = (prefs: Preferences | null, rated: Movie[]): Movie[] => {
    if (!prefs || rated.length === 0) return [];

    // Simple mock: filter discovery movies by genre preference
    const filtered = DISCOVERY_MOVIES.filter((movie) => {
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
    setCurrentPage('addMovies');
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
      const movie = MOVIE_DATABASE.find(m => m.id === movieId);
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
        {currentPage === 'preferences' && (
          <PreferencesForm onSubmit={handlePreferencesSubmit} />
        )}

        {currentPage === 'addMovies' && (
          <LikedMoviesInput
            onSubmit={handleMoviesSubmit}
            onBack={() => setCurrentPage(preferences ? 'home' : 'preferences')}
          />
        )}

        {currentPage === 'home' && (
          <HomeScreen
            ratedMovies={ratedMovies}
            recommendations={recommendations}
            discoveryMovies={DISCOVERY_MOVIES}
            movieDatabase={MOVIE_DATABASE}
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