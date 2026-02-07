import React from "react";
import { useState, useEffect } from "react";

// --- REPLACE API KEY ---
// const API_KEY = 'YOUR_API_KEY';

// --- MOCK DATA ---
const SAMPLE_DATABASE = [
  {
    Title: "The Matrix",
    Year: "1999",
    Director: "Lana & Lilly Wachowski",
    Poster:
      "https://m.media-amazon.com/images/M/MV5BNzQzOTk3MTAtOTRhS000ZTMwLThkZmYtMzBiNzllYzY0MzdkXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SX300.jpg",
    imdbID: "tt7",
  },
  {
    Title: "The Godfather",
    Year: "1972",
    Director: "Francis Ford Coppola",
    Poster:
      "https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYzZlODY3ZTk3OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg",
    imdbID: "tt8",
  },
  {
    Title: "Inception",
    Year: "2010",
    Director: "Christopher Nolan",
    Poster:
      "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg",
    imdbID: "tt9",
  },
  {
    Title: "Interstellar",
    Year: "2014",
    Director: "Christopher Nolan",
    Poster:
      "https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2FiMmZkNWIyODZiXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg",
    imdbID: "tt10",
  },
  {
    Title: "Spider-Man: Across the Spider-Verse",
    Year: "2023",
    Director: "Joaquim Dos Santos",
    Poster:
      "https://m.media-amazon.com/images/M/MV5BMzI0NmVkMjEtYmY4MS00ZDMxLTlkZmEtMzU4MDQxYTMzMjU2XkEyXkFqcGdeQXVyMzQ0MzA0NTM@._V1_SX300.jpg",
    imdbID: "tt11",
  },
];

// --- TYPES ---

interface MovieRatings {
  overall: number;
  cinematography: number;
  plot: number;
  pacing: number;
  direction: number;
  sound: number;
}

interface Movie {
  id: string;
  title: string;
  year: string;
  poster: string;
  director: string;
  ratings: MovieRatings;
  isSaved?: boolean; // New property to track state
}

interface LikedMoviesInputProps {
  onSubmit: (movies: Movie[]) => void;
  onBack: () => void;
}

// --- HELPER COMPONENT: STAR RATING ---
const StarRating = ({
  label,
  value,
  onChange,
  readOnly = false,
}: {
  label: string;
  value: number;
  onChange?: (val: number) => void;
  readOnly?: boolean;
}) => {
  // Triple-cycle Logic: Empty -> Full -> Half
  const handleStarClick = (starIndex: number) => {
    if (readOnly || !onChange) return;

    let newValue = 0;
    if (value === starIndex) {
      newValue = starIndex - 0.5; // If currently Full, go to Half
    } else if (value === starIndex - 0.5) {
      newValue = starIndex - 1;   // If currently Half, go to Empty
    } else {
      newValue = starIndex;       // Otherwise, go to Full
    }
    onChange(newValue);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
      <div className="flex items-center gap-2 min-w-[120px]">
        <span className="text-xs font-semibold uppercase text-gray-500 tracking-wide">
          {label}
        </span>
        {value > 0 && (
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
            {value.toFixed(1)}
          </span>
        )}
      </div>

      <div className={`flex gap-1 ${readOnly ? "cursor-default" : "cursor-pointer"}`}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isFull = value >= star;
          const isHalf = value === star - 0.5;

          return (
            <button
              key={star}
              type="button"
              disabled={readOnly}
              onClick={() => handleStarClick(star)}
              className={`focus:outline-none transition-transform ${
                !readOnly && "hover:scale-110"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                stroke={isFull || isHalf ? "#FFD700" : "#CBD5E1"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ fill: 'none' }}
              >
                {/* Background (Empty) Star */}
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                
                {/* Yellow Fill (Conditional Half/Full) */}
                {(isFull || isHalf) && (
                  <path
                    fill="#FFD700"
                    d={isFull 
                      ? "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-5.82 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" 
                      : "M12 2v15.77l-5.82 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    }
                  />
                )}
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
export function LikedMoviesInput({ onSubmit, onBack }: LikedMoviesInputProps) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<typeof SAMPLE_DATABASE>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Search Logic
  useEffect(() => {
    if (query.length > 1) {
      const filtered = SAMPLE_DATABASE.filter((m) =>
        m.Title.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
      setShowDropdown(true);
    } else {
      setResults([]);
      setShowDropdown(false);
    }
  }, [query]);

  const addMovie = (item: (typeof SAMPLE_DATABASE)[0]) => {
    if (movies.some((m) => m.id === item.imdbID)) {
      setQuery("");
      return;
    }

    const newMovie: Movie = {
      id: item.imdbID,
      title: item.Title,
      year: item.Year,
      poster: item.Poster,
      director: item.Director,
      isSaved: false, // Default to not saved (editing mode)
      ratings: {
        overall: 0,
        cinematography: 0,
        plot: 0,
        pacing: 0,
        direction: 0,
        sound: 0,
      },
    };
    setMovies([newMovie, ...movies]);
    setQuery("");
    setShowDropdown(false);
  };

  const removeMovie = (index: number) => {
    setMovies(movies.filter((_, i) => i !== index));
  };

  // Toggle between "Editing" (Card) and "Saved" (Poster Row)
  const toggleSaveMovie = (index: number, shouldSave: boolean) => {
    const updated = [...movies];
    updated[index].isSaved = shouldSave;
    setMovies(updated);
  };

  const updateMovieRating = (
    index: number,
    category: keyof MovieRatings,
    value: number
  ) => {
    const updatedMovies = [...movies];
    const currentMovie = updatedMovies[index];

    const newRatings = {
      ...currentMovie.ratings,
      [category]: value,
    };

    const { cinematography, plot, pacing, direction, sound } = newRatings;
    const average =
      (cinematography + plot + pacing + direction + sound) / 5;

    updatedMovies[index] = {
      ...currentMovie,
      ratings: {
        ...newRatings,
        overall: average,
      },
    };

    setMovies(updatedMovies);
  };

  const handleSubmit = () => {
    if (movies.length > 0) onSubmit(movies);
  };

  return (
    <div className="max-w-3xl mx-auto p-8 font-sans">
      <h1 className="mb-8 text-center">Step 2: Add Movies You Liked</h1>

      {/* --- SAVED MOVIES ROW (POSTERS ONLY) --- */}
      {movies.some((m) => m.isSaved) && (
        <div className="mb-8">
          <p className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">
            Ready for Recommendation ({movies.filter(m => m.isSaved).length})
          </p>
          <div className="flex gap-4 overflow-x-auto p-4 scrollbar-hide">
            {movies.map((movie, index) => {
              if (!movie.isSaved) return null;
              return (
                <div key={index} className="relative group flex-shrink-0">
                  <button
                    onClick={() => toggleSaveMovie(index, false)}
                    className="block focus:outline-none transition-transform hover:scale-105"
                    title="Click to edit rating"
                  >
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-20 h-28 object-cover rounded shadow-md border-2 border-green-500"
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded transition-opacity">
                       <span className="text-white text-xs font-bold">Edit</span>
                    </div>
                  </button>
                  {/* Rating Badge */}
                  <div className="absolute -top-3 -right-3 bg-yellow-400 text-xs font-bold w-8 h-8 flex items-center justify-center rounded-full shadow-md z-10 border-2 border-white">
                    {movie.ratings.overall.toFixed(1)}
                  </div>
                </div>
              );
            })}
          </div>
          <hr className="border-gray-200" />
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="relative mb-10">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a movie..."
          className="w-full border-2 border-gray-200 rounded-none px-5 py-4 text-lg focus:border-blue-500 outline-none transition-all shadow-sm"
        />

        {/* DROPDOWN */}
        {showDropdown && results.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-none shadow-xl overflow-hidden">
            {results.map((item) => (
              <button
                key={item.imdbID}
                onClick={() => addMovie(item)}
                className="flex items-center gap-4 w-full p-3 hover:bg-blue-50 transition-colors text-left border-b border-gray-100 last:border-0"
              >
                <img
                  src={item.Poster}
                  alt={item.Title}
                  className="w-10 h-14 object-cover rounded"
                />
                <div className="flex-1">
                  <div className="font-bold text-gray-900">{item.Title}</div>
                  <div className="flex gap-2 text-sm text-gray-500">
                    <span>{item.Year}</span>
                    <span>•</span>
                    <span className="italic">{item.Director}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* MOVIE CARDS (Only show if NOT saved) */}
      <div className="space-y-6">
        {movies.map((movie, index) => {
          if (movie.isSaved) return null; // Skip saved movies

          return (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-none shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4"
            >
              {/* CARD HEADER */}
              <div className="flex gap-4 p-4 border-b border-gray-100 bg-gray-50/50">
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="w-16 h-24 object-cover rounded-lg shadow-sm"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-xl leading-tight text-gray-900">
                    {movie.title}
                  </h3>
                  <div className="text-gray-500 text-sm mb-1">
                    <span>{movie.year}</span> •{" "}
                    <span className="italic">Dir. {movie.director}</span>
                  </div>

                  {/* OVERALL RATING */}
                  <div className="mt-2 bg-white inline-block px-3 py-1 rounded-lg border border-gray-200 shadow-sm">
                    <StarRating
                      label="Overall"
                      value={movie.ratings.overall}
                      readOnly={true}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => removeMovie(index)}
                    className="text-gray-300 hover:text-red-500 self-end p-2"
                    title="Remove movie"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* CARD BODY: Detailed Ratings */}
              <div className="p-4 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mb-6">
                  <StarRating
                    label="Cinematography"
                    value={movie.ratings.cinematography}
                    onChange={(val) =>
                      updateMovieRating(index, "cinematography", val)
                    }
                  />
                  <StarRating
                    label="Plot"
                    value={movie.ratings.plot}
                    onChange={(val) => updateMovieRating(index, "plot", val)}
                  />
                  <StarRating
                    label="Pacing"
                    value={movie.ratings.pacing}
                    onChange={(val) => updateMovieRating(index, "pacing", val)}
                  />
                  <StarRating
                    label="Direction"
                    value={movie.ratings.direction}
                    onChange={(val) => updateMovieRating(index, "direction", val)}
                  />
                  <StarRating
                    label="Sound & Score"
                    value={movie.ratings.sound}
                    onChange={(val) => updateMovieRating(index, "sound", val)}
                  />
                </div>

                {/* SAVE BUTTON */}
                <button
                  type="button"
                  onClick={() => toggleSaveMovie(index, true)}
                  className="w-full bg-black text-white py-3 font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  <span>Save</span>
                </button>
              </div>
            </div>
          );
        })}

        {/* Empty State (Only shows if no movies are being edited AND no movies are saved) */}
        {movies.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-none text-gray-400">
            No movies added yet.
          </div>
        )}
         {/* State where movies exist but all are saved (none in edit list) */}
        {movies.length > 0 && !movies.some(m => !m.isSaved) && (
             <div className="text-center py-8 text-gray-400 italic">
                All movies saved. Add more via search or click "Get Recommendations".
             </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="flex justify-between pt-6 mt-6 border-t border-gray-100">
        <button
          type="button"
          onClick={onBack}
          className="border border-gray-300 px-6 py-2 hover:bg-gray-50 transition-colors"
        >
          Back
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={movies.length === 0}
          className={`bg-primary text-primary-foreground px-6 py-2 font-bold ${
            movies.length === 0
              ? "opacity-50 cursor-not-allowed"
              : "hover:opacity-90"
          }`}
        >
          Get Recommendations
        </button>
      </div>
    </div>
  );
}