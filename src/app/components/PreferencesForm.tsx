import { useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { X, Check, GripVertical } from 'lucide-react';
import type { Preferences } from '../types';

interface PreferencesFormProps {
  onSubmit: (preferences: Preferences) => void;
}

const GENRES = [
  'Action',
  'Comedy',
  'Drama',
  'Sci-Fi',
  'Horror',
  'Romance',
  'Thriller',
  'Documentary',
];

const DEFAULT_CRITERIA = [
  'Cinematography',
  'Plot',
  'Pacing',
  'Direction',
  'Sound and Score',
];

interface DraggableCriteriaItemProps {
  criterion: string;
  index: number;
  area: 'ranked' | 'unimportant';
  moveCriterion: (dragIndex: number, hoverIndex: number, fromArea: string, toArea: string) => void;
  pacingPreference?: 'Fast' | 'Slow';
  onPacingChange?: (value: 'Fast' | 'Slow') => void;
}

function DraggableCriteriaItem({ 
  criterion, 
  index, 
  area,
  moveCriterion,
  pacingPreference,
  onPacingChange,
}: DraggableCriteriaItemProps) {
  const [{ isDragging }, drag, preview] = useDrag({
    type: 'CRITERION',
    item: { index, area },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'CRITERION',
    hover: (item: { index: number; area: string }) => {
      if (item.index !== index || item.area !== area) {
        moveCriterion(item.index, index, item.area, area);
        item.index = index;
        item.area = area;
      }
    },
  });

  return (
    <div
      ref={(node) => preview(drop(node))}
      className="border border-border px-4 py-3 bg-background flex items-center gap-3"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {/* Drag Handle */}
      <div
        ref={drag}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      {/* Content Area */}
      <div className="flex-1 flex items-center justify-between">
        <span>{criterion}</span>
        
        <div className="flex items-center gap-3">
          {/* Pacing Toggle - strictly height-controlled */}
          {criterion === 'Pacing' && area === 'ranked' && pacingPreference && onPacingChange && (
            <div 
              className="relative flex items-center w-28 h-6 bg-gray-200 rounded-full p-0.5 cursor-pointer select-none border border-black/5"
              onClick={() => onPacingChange(pacingPreference === 'Slow' ? 'Fast' : 'Slow')}
            >
              {/* Sliding Background Pill */}
              <div
                className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] bg-white rounded-full shadow-sm transition-transform duration-200 ease-in-out ${
                  pacingPreference === 'Fast' ? 'translate-x-[calc(100%+0px)]' : 'translate-x-0'
                }`}
              />
          
              {/* Labels with tight line-height to prevent expansion */}
              <div className={`relative z-10 flex-1 text-center text-[9px] leading-none font-bold transition-colors duration-200 ${
                pacingPreference === 'Slow' ? 'text-gray-900' : 'text-gray-400'
              }`}>
                SLOW
              </div>
          
              <div className={`relative z-10 flex-1 text-center text-[9px] leading-none font-bold transition-colors duration-200 ${
                pacingPreference === 'Fast' ? 'text-gray-900' : 'text-gray-400'
              }`}>
                FAST
              </div>
            </div>
          )}
          
          {area === 'ranked' && (
            <span className="text-muted-foreground text-sm">#{index + 1}</span>
          )}
        </div>
      </div>
    </div>
  );
}

interface DropZoneProps {
  area: 'ranked' | 'unimportant';
  criteria: string[];
  moveCriterion: (dragIndex: number, hoverIndex: number, fromArea: string, toArea: string) => void;
  pacingPreference: 'Fast' | 'Slow';
  onPacingChange: (value: 'Fast' | 'Slow') => void;
}

function DropZone({ area, criteria, moveCriterion, pacingPreference, onPacingChange }: DropZoneProps) {
  const [, drop] = useDrop({
    accept: 'CRITERION',
    drop: (item: { index: number; area: string }) => {
      if (item.area !== area) {
        moveCriterion(item.index, criteria.length, item.area, area);
      }
    },
  });

  return (
    <div ref={drop} className="border border-border p-4 space-y-2 min-h-[100px]">
      {criteria.length === 0 ? (
        <div className="text-muted-foreground text-sm text-center py-4">
          Drag criteria here
        </div>
      ) : (
        criteria.map((criterion, index) => (
          <DraggableCriteriaItem
            key={criterion}
            criterion={criterion}
            index={index}
            area={area}
            moveCriterion={moveCriterion}
            pacingPreference={criterion === 'Pacing' ? pacingPreference : undefined}
            onPacingChange={criterion === 'Pacing' ? onPacingChange : undefined}
          />
        ))
      )}
    </div>
  );
}

function PreferencesFormContent({ onSubmit }: PreferencesFormProps) {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [rankedCriteria, setRankedCriteria] = useState<string[]>(DEFAULT_CRITERIA);
  const [unimportantCriteria, setUnimportantCriteria] = useState<string[]>([]);
  const [pacingPreference, setPacingPreference] = useState<'Fast' | 'Slow'>('Slow');

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const moveCriterion = (dragIndex: number, hoverIndex: number, fromArea: string, toArea: string) => {
    const sourceList = fromArea === 'ranked' ? [...rankedCriteria] : [...unimportantCriteria];
    const targetList = toArea === 'ranked' ? [...rankedCriteria] : [...unimportantCriteria];

    if (fromArea === toArea) {
      // Reordering within same list
      const [removed] = sourceList.splice(dragIndex, 1);
      sourceList.splice(hoverIndex, 0, removed);
      if (fromArea === 'ranked') {
        setRankedCriteria(sourceList);
      } else {
        setUnimportantCriteria(sourceList);
      }
    } else {
      // Moving between lists
      const [removed] = sourceList.splice(dragIndex, 1);
      targetList.splice(hoverIndex, 0, removed);
      
      if (fromArea === 'ranked') {
        setRankedCriteria(sourceList);
        setUnimportantCriteria(targetList);
      } else {
        setUnimportantCriteria(sourceList);
        setRankedCriteria(targetList);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      genres: selectedGenres,
      rankedCriteria,
      unimportantCriteria,
      pacingPreference,
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="mb-8 text-center">Set Your Preferences</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Left Section: Genre Preferences */}
          <div>
            <h2 className="mb-4 text-white">Genre Preferences</h2>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((genre) => {
                const isSelected = selectedGenres.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`flex items-center gap-2 px-4 py-2 border ${
                      isSelected
                        ? 'bg-green-100 border-green-500 text-green-900'
                        : 'bg-gray-100 border-gray-300 text-gray-700'
                    }`}
                    style={{ borderRadius: '20px' }}
                  >
                    {isSelected ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    <span>{genre}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Section: Criteria Ranking */}
          <div>
          <h2 className="mb-1 text-white">Ranking by Importance</h2> 
          <p className="text-sm text-muted-foreground mb-4">
            Drag to reorder (top = most important)
          </p>
          <DropZone
            area="ranked"
            criteria={rankedCriteria}
            moveCriterion={moveCriterion}
            pacingPreference={pacingPreference}
            onPacingChange={setPacingPreference}
          />
        
          <h3 className="mt-8 mb-2 text-white">Unimportant / No preference</h3>
          <DropZone
            area="unimportant"
            criteria={unimportantCriteria}
            moveCriterion={moveCriterion}
            pacingPreference={pacingPreference}
            onPacingChange={setPacingPreference}
          />
        </div>
        </div>

        <div className="flex justify-end">
        <button
          type="submit"
          className="bg-red-700 text-primary-foreground px-6 py-2 font-bold tracking-normal"
        >
          Continue
        </button>
      </div>
      </form>
    </div>
  );
}

export function PreferencesForm(props: PreferencesFormProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <PreferencesFormContent {...props} />
    </DndProvider>
  );
}
