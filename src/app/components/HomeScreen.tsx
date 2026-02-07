import React from 'react';
import { useState, useEffect } from 'react';
import type { Movie } from '../types';

interface HomeScreenProps {
  ratedMovies: Movie[];
  recommendations: Movie[];
  discoveryMovies: Movie[];
  movieDatabase: Movie[];
  onMovieClick: (movie: Movie) => void;
  onSearchMovieSelect: (movieId: string) => void;
  onUpdatePreferences: () => void;
}

export function HomeScreen({
  ratedMovies,
  recommendations,
  discoveryMovies,
  movieDatabase,
  onMovieClick,
  onSearchMovieSelect,
  onUpdatePreferences,
}: HomeScreenProps) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (query.length > 1) {
      const filtered = movieDatabase.filter((m) =>
        m.title.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
      setShowDropdown(true);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [query, movieDatabase]);

  const handleMovieSelect = (movieId: string) => {
    onSearchMovieSelect(movieId);
    setQuery('');
    setShowDropdown(false);
  };

  const isMovieRated = (movieId: string) => {
    return ratedMovies.some(m => m.id === movieId);
  };

  return (
    <div className="max-w-7xl mx-auto p-8 text-white">
      {/* Search Bar and Update Preferences Button */}
      <div className="flex gap-4 mb-8">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a movie to rate..."
            className="w-full border border-red-700 px-4 py-2 focus:outline-none focus:border-red-800"
          />
          
          {/* Search Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-black border border-border shadow-lg max-h-96 overflow-y-auto">
              {searchResults.map((movie) => {
                const isRated = isMovieRated(movie.id);
                return (
                  <button
                    key={movie.id}
                    onClick={() => handleMovieSelect(movie.id)}
                    className="flex items-center gap-3 w-full p-3 hover:bg-accent transition-colors text-left border-b border-border last:border-0"
                  >
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-10 h-14 object-cover border border-border"
                    />
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {movie.title}
                        {isRated && (
                          <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-bold">
                            Rated
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {movie.year} • {
                          Array.isArray(movie.genre) 
                            ? movie.genre.join(', ')
                            : movie.genre
                                .replace(/[\[\]'"]/g, '')             
                                .replace(/,/g, ', ')                  
                                .replace(/([a-z])([A-Z])/g, '$1 $2')
                        } • Dir. {movie.director}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        
        <button
          onClick={onUpdatePreferences}
          className="border border-red-700 bg-red-700 px-6 py-2 hover:bg-red-800 whitespace-nowrap"
        >
          Update Preferences
        </button>
      </div>

      {/* Previously Rated Movies */}
      <section className="mb-12">
        <h2 className="mb-4">Previously Rated Movies</h2>
        {ratedMovies.length === 0 ? (
          <p className="text-muted-foreground">
            No rated movies yet. Use the search bar above to find and rate movies.
          </p>
        ) : (
          <div className="grid grid-cols-6 gap-4">
            {ratedMovies.map((movie) => (
              <button
                key={movie.id}
                onClick={() => onMovieClick(movie)}
                className="group"
              >
                <div className="relative mb-2">
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="w-full aspect-[2/3] object-cover border border-border group-hover:opacity-80"
                  />
                  {/* Rating Badge */}
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-xs font-bold w-8 h-8 flex items-center justify-center rounded-full shadow-md border-2 border-white">
                    {movie.ratings.overall.toFixed(1)}
                  </div>
                </div>
                <div className="text-sm text-left h-[56px] flex flex-col justify-start">
                  <div className="font-medium line-clamp-2">{movie.title}</div>
                  {movie.dateRated && (
                    <div className="text-xs text-muted-foreground">
                      Rated: {movie.dateRated}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Recommendations */}
      <section className="mb-12">
        <h2 className="mb-4">Recommendations</h2>
        {recommendations.length === 0 ? (
          <p className="text-muted-foreground">
            Rate some movies to get personalized recommendations.
          </p>
        ) : (
          <div className="grid grid-cols-6 gap-4">
            {recommendations.map((movie) => (
              <button
                key={movie.id}
                onClick={() => onMovieClick(movie)}
                className="group"
              >
                <div className="relative mb-2">
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="w-full aspect-[2/3] object-cover border border-border group-hover:opacity-80"
                  />
                  {/* Match Score Badge */}
                  {movie.matchScore && (
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold w-8 h-8 flex items-center justify-center rounded-full shadow-md border-2 border-white">
                      {Math.round(movie.matchScore * 100)}%
                    </div>
                  )}
                </div>
                <div className="text-sm text-left h-[56px] flex flex-col justify-start">
                  <div className="font-medium line-clamp-2">{movie.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {movie.ratings.overall.toFixed(1)} avg
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Discovery Mode */}
      <section>
        <h2 className="mb-4">Discover</h2>
        {discoveryMovies.length === 0 ? (
          <p className="text-muted-foreground">
            Explore more movies to discover new favorites.
          </p>
        ) : (
          <div className="grid grid-cols-6 gap-4">
            {discoveryMovies.map((movie) => (
              <button
                key={movie.id}
                onClick={() => onMovieClick(movie)}
                className="group"
              >
                <div className="relative mb-2">
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="w-full aspect-[2/3] object-cover border border-border group-hover:opacity-80"
                  />
                </div>
                <div className="text-sm text-left h-[56px] flex flex-col justify-start">
                  <div className="font-medium line-clamp-2">{movie.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {movie.ratings.overall.toFixed(1)} avg
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
