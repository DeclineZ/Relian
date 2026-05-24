// FlashcardCard.jsx
// Flipping card display for Q/A

import { ThumbsUp } from "lucide-react";

function getTaxonomyColorClass(taxonomy) {
  switch (taxonomy) {
    case "Remembering": return "text-blue-500";
    case "Understanding": return "text-green-500";
    case "Applying": return "text-yellow-500";
    default: return "text-gray-500";
  }
}

export default function FlashcardCard({ card, showAnswer, onShowAnswer, liked, onLike }) {
  if (!card) return null;
  return (
    <div className="perspective card w-full" onClick={onShowAnswer}>
      <div className={`card-3d ${showAnswer ? 'rotate-x-180' : ''} w-full h-full`}>
        {/* Front (question) */}
        <div className="card-face flex items-center justify-center bg-white rounded shadow p-6 border border-gray-200 front">
          <p className="absolute top-4 left-4 text-6xl font-bold text-gray-300">Q</p>
          <div className={`absolute top-6 text-sm font-medium ${getTaxonomyColorClass(card.taxonomy)}`}>
            <strong>({card.taxonomy})</strong>
          </div>
          <p className="text-center text-xl font-semibold text-black">{card.question}</p>
        </div>
        {/* Back (answer) */}
        <div className="card-face rotate-y-180 flex items-center justify-center bg-white rounded shadow p-6 border border-gray-200 back">
          <p className="absolute top-4 left-4 text-6xl font-bold text-gray-300">A</p>
          <div className={`absolute top-6 text-sm font-medium ${getTaxonomyColorClass(card.taxonomy)}`}>
            <strong>({card.taxonomy})</strong>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onLike(card.id); }}
            className="absolute top-3 right-3 rounded-full p-1 transition hover:bg-gray-100"
          >
            <ThumbsUp
              size={20}
              className={liked ? 'text-blue-500 fill-blue-500' : 'text-gray-400'}
            />
          </button>
          <div className="flex flex-col items-center gap-1 h-full w-full justify-center">
            {card.image && card.needs_image && (
              <div className="h-50 w-80 overflow-hidden rounded-lg sm:h-50 sm:w-70 mb-4">
                <img src={card.image} alt={card.keyword || 'illustration'} className="mt-4 object-contain" />
              </div>
            )}
            <p className="text-center text-xl font-semibold mb-4 text-black">{card.answer}</p>
          </div>
        </div>
      </div>
    </div>
  );
}