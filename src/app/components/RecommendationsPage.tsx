interface Movie {
  title: string;
  year: number;
  genre: string;
  rating: number;
  matchScore: number;
}

interface RecommendationsPageProps {
  recommendations: Movie[];
  onSelectMovie: (movie: Movie) => void;
  onBack: () => void;
}

export function RecommendationsPage({
  recommendations,
  onSelectMovie,
  onBack,
}: RecommendationsPageProps) {
  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="mb-2 text-center">Step 3: Your Recommendations</h1>
      <p className="mb-6 text-muted-foreground text-center">
        Based on your preferences and liked movies. Click a movie to rate it.
      </p>

      <div className="space-y-3 mb-6">
        {recommendations.map((movie, index) => (
          <button
            key={index}
            onClick={() => onSelectMovie(movie)}
            className="w-full border border-border p-4 text-left hover:bg-accent"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3>{movie.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {movie.year} • {movie.genre}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Match</div>
                <div>{Math.round(movie.matchScore * 100)}%</div>
              </div>
            </div>
            <div className="text-sm">
              Average Rating: {movie.rating.toFixed(1)}/10
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={onBack}
        className="border border-border px-6 py-2 hover:bg-secondary transition-colors"
      >
        Back to Preferences
      </button>
    </div>
  );
}
