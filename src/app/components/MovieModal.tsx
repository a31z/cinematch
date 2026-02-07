import { X } from 'lucide-react';
import React from 'react';
import { useState } from 'react';
import type { Movie } from '../types';

interface MovieModalProps {
  movie: Movie;
  isRated: boolean;
  onClose: () => void;
  onSaveRating: (ratings: Movie['ratings']) => void;
  onRemoveRating: () => void;
}

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
  // Logic for the triple-cycle
  const handleStarClick = (starIndex: number) => {
    if (readOnly || !onChange) return;

    let newValue = 0;
    if (value === starIndex) {
      newValue = starIndex - 0.5; // If currently Full, go to Half
    } else if (value === starIndex - 0.5) {
      newValue = starIndex - 1;   // If currently Half, go to Empty
    } else {
      newValue = starIndex;       // If lower or empty, go to Full
    }
    onChange(newValue);
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium min-w-[140px]">{label}</span>
      <div className={`flex gap-1 ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}>
        {[1, 2, 3, 4, 5].map((star) => {
          // Determine if this specific star is Full, Half, or Empty
          const isFull = value >= star;
          const isHalf = value === star - 0.5;

          return (
            <button
              key={star}
              type="button"
              disabled={readOnly}
              onClick={() => handleStarClick(star)}
              className={`focus:outline-none ${!readOnly && 'hover:scale-110'}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                stroke={isFull || isHalf ? '#FFD700' : '#CBD5E1'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ fill: 'none' }} 
              >
                {/* Background (Empty) Star */}
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                
                {/* Yellow Fill (Conditional) */}
                {(isFull || isHalf) && (
                  <path
                    fill="#FFD700"
                    d={isFull 
                      ? "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-5.82 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" // Full
                      : "M12 2v15.77l-5.82 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" // Half (Left Side Only)
                    }
                  />
                )}
              </svg>
            </button>
          );
        })}
      </div>
      <span className="text-sm text-muted-foreground w-8">{value.toFixed(1)}</span>
    </div>
  );
};

export function MovieModal({ movie, isRated, onClose, onSaveRating, onRemoveRating }: MovieModalProps) {
  const [isEditing, setIsEditing] = useState(!isRated);
  const [ratings, setRatings] = useState(movie.ratings);

  const updateRating = (category: keyof Movie['ratings'], value: number) => {
    const newRatings = {
      ...ratings,
      [category]: value,
    };

    const { cinematography, plot, pacing, direction, sound } = newRatings;
    const average = (cinematography + plot + pacing + direction + sound) / 5;

    const updatedRatings = {
      ...newRatings,
      overall: average,
    };

    setRatings(updatedRatings);
  };

  const handleSave = () => {
    onSaveRating(ratings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-border">
          <div className="flex gap-4">
            <img
              src={movie.poster}
              alt={movie.title}
              className="w-24 aspect-[2/3] object-cover border border-border"
            />
            <div>
              <h2 className="mb-1">{movie.title}</h2>
              <p className="text-sm text-muted-foreground">
                {movie.year} • {
                  Array.isArray(movie.genre) 
                    ? movie.genre.join(', ')
                    : movie.genre
                        .replace(/[\[\]'"]/g, '')             
                        .replace(/,/g, ', ')                  
                        .replace(/([a-z])([A-Z])/g, '$1 $2')
                } • Dir. {movie.director}
              </p>
              {movie.matchScore && (
                <p className="text-sm mt-2">
                  <span className="font-medium">Match Score:</span>{' '}
                  {Math.round(movie.matchScore * 100)}%
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Rating Breakdown */}
        <div className="p-6">
          <h3 className="mb-4">Rating Breakdown</h3>
          <div className="space-y-3 mb-6">
            <StarRating
              label="Overall"
              value={ratings.overall}
              readOnly={true}
            />
            <div className="border-t border-border my-4" />
            <StarRating
              label="Cinematography"
              value={ratings.cinematography}
              onChange={(val) => updateRating('cinematography', val)}
              readOnly={!isEditing}
            />
            <StarRating
              label="Plot"
              value={ratings.plot}
              onChange={(val) => updateRating('plot', val)}
              readOnly={!isEditing}
            />
            <StarRating
              label="Pacing"
              value={ratings.pacing}
              onChange={(val) => updateRating('pacing', val)}
              readOnly={!isEditing}
            />
            <StarRating
              label="Direction"
              value={ratings.direction}
              onChange={(val) => updateRating('direction', val)}
              readOnly={!isEditing}
            />
            <StarRating
              label="Sound & Score"
              value={ratings.sound}
              onChange={(val) => updateRating('sound', val)}
              readOnly={!isEditing}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            {isRated && !isEditing ? (
              <>
                <button
                  onClick={onRemoveRating}
                  className="border border-border px-6 py-2 text-red-600 hover:bg-red-50"
                >
                  Remove Rating
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-primary text-primary-foreground px-6 py-2 font-bold"
                >
                  Edit Rating
                </button>
              </>
            ) : (
              <>
                {/* Cancel Button - Now First */}
                {isRated && (
                  <button
                    onClick={() => {
                      setRatings(movie.ratings);
                      setIsEditing(false);
                    }}
                    className="border border-border px-6 py-2"
                  >
                    Cancel
                  </button>
                )}
          
                {/* Save Button - Now Second */}
                <button
                  onClick={handleSave}
                  className="bg-primary text-primary-foreground px-6 py-2 font-bold"
                >
                  {isRated ? 'Save Changes' : 'Add Rating'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
