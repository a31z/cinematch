import { useState } from 'react';

interface Movie {
  title: string;
  year: number;
  genre: string;
  rating: number;
  matchScore: number;
}

interface RatingFormProps {
  movie: Movie;
  onSubmit: (rating: number, feedback: string) => void;
  onBack: () => void;
}

export function RatingForm({ movie, onSubmit, onBack }: RatingFormProps) {
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(rating, feedback);
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="mb-6 text-center">Step 4: Rate This Recommendation</h1>

      <div className="border border-border p-6 mb-6">
        <h2 className="mb-2">{movie.title}</h2>
        <p className="text-muted-foreground mb-4">
          {movie.year} • {movie.genre} • Avg Rating: {movie.rating.toFixed(1)}/10
        </p>
        <div className="text-sm">
          <span className="text-muted-foreground">Match Score:</span>{' '}
          {Math.round(movie.matchScore * 100)}%
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block mb-2">Your Rating</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="10"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-2xl w-12 text-center">{rating}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">1 = Poor, 10 = Excellent</p>
        </div>

        <div>
          <label className="block mb-2">Feedback (Optional)</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="border border-border px-3 py-2 w-full h-24"
            placeholder="What did you think about this recommendation?"
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            This rating will help improve future recommendations by training the ML model.
          </p>
        </div>

        <div className="flex justify-between items-center pt-8">
          <button
            type="button"
            onClick={onBack}
            className="border border-border px-6 py-2 hover:bg-secondary transition-colors"
          >
            Back to Recommendations
          </button>
        
          <button
            type="submit"
            className="bg-primary text-primary-foreground px-6 py-2 font-bold"
          >
            Submit Rating
          </button>
        </div>
      </form>
    </div>
  );
}
