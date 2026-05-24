// FlashcardControls.jsx
// Buttons (Show Answer, Remembered, Try Again, AI, Add More)

import { Lightbulb } from "lucide-react";

export default function FlashcardControls({
  showAnswer,
  onShowAnswer,
  onRate,
  onAI,
  onAddMore,
  loadingAi
}) {
  if (!showAnswer) {
    return (
      <button
        onClick={onShowAnswer}
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Show Answer
      </button>
    );
  }
  return (
    <div className="flex flex-wrap justify-between tabby">
      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={() => onRate(true)}
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Remembered
        </button>
        <button
          onClick={() => onRate(false)}
          className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
      {/* AI Explanation and Add More */}
      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={onAI}
          disabled={loadingAi}
          className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-2 ai-x-button button animated-gradient"
        >
          <Lightbulb size={20} />
          AI Explanation
        </button>
        <button
          onClick={onAddMore}
          className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 add-more-button button"
        >
          Add More Like This
        </button>
      </div>
    </div>
  );
}