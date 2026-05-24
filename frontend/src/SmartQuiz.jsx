import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDecks } from "./lib/DeckContext";
import {
  Brain,
  RotateCcw,
  Plus,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Lightbulb,
  Clock
} from "lucide-react";

export default function SmartQuizView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { decks } = useDecks();
  const deck = decks.find((d) => String(d.id) === id);

  if (!deck) {
    return <div className="p-8">Deck not found.</div>;
  }

  // Build cards array from deck.quiz + stored "best" results
  const cards = (Array.isArray(deck.quiz) ? deck.quiz : []).map((q, idx) => {
    let raw = null;
    try {
      raw = JSON.parse(localStorage.getItem(`quiz-${deck.id}-${idx}-best`));
    } catch {}
    const best = raw || {};

    return {
      id: idx,
      question: q.question,
      percent: typeof best.percent === "number" ? best.percent : 0,
      positive: Array.isArray(best.positive) ? best.positive : [],
      negative: Array.isArray(best.negative) ? best.negative : [],
      suggestion: typeof best.suggestion === "string" ? best.suggestion : "",
      answer: typeof best.answer === "string" ? best.answer : "",
      time: typeof best.time === "number" ? best.time : 0
    };
  });

  const smartDeck = {
    description: deck.description,
    cards
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-left">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Smart Quiz</h2>
        <p className="text-gray-600">{smartDeck.description}</p>
      </div>

      {/* Quiz Cards */}
      <div className="space-y-4">
        {smartDeck.cards.map((card) => (
          <QuizCard
            key={card.id}
            quiz={card}
            onRetry={() => navigate(`/deck/${deck.id}/quiz/${card.id}`)}
          />
        ))}
      </div>

      {/* Add Quiz Button */}
      <AddQuizButton onClick={() => navigate(`/deck/${deck.id}/cards/new`)} />

      {/* Empty State */}
      {smartDeck.cards.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No quiz questions
          </h3>
          <p className="text-gray-500">
            Add some flashcards first to generate quiz questions!
          </p>
        </div>
      )}
    </div>
  );
}

function QuizCard({ quiz, onRetry }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getPerformanceColor = (percentage) => {
    if (percentage >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (percentage >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getPerformanceIcon = (percentage) => {
    if (percentage >= 80) return "🎯";
    if (percentage >= 60) return "⚡";
    return "📈";
  };

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return `${minutes}m ${remaining}s`;
  };

  return (
    <div className=" bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div onClick={() => setIsExpanded(!isExpanded)} className="cursor-pointer  bg-white border-b border-blue-100 p-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-4">
              <span className="bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-1.5 rounded-full">
                {`Q${quiz.id + 1}`}
              </span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getPerformanceColor(quiz.percent)}`}>
                {getPerformanceIcon(quiz.percent)} {quiz.percent}%
              </span>
            </div>
            <p className="text-gray-900 font-medium text-lg leading-relaxed">
              {quiz.question}
            </p>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={onRetry}
              className="p-3 text-gray-400  hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
            >
              <RotateCcw className="w-5 h-5 text-blue-500" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-3 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="p-4 space-y-2 bg-gray-50">
          {/* Answer */}
          <div className="bg-gray-100 border border-gray-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2 py-1 rounded-full">
                Your Answer
              </span>
            </div>
            <p className="text-gray-800 mt-3 leading-relaxed">{quiz.answer}</p>
          </div>

          {/* Positive Points*/}
          {quiz.positive.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-gray-900">What you did well</h4>
              </div>
              <ul className="space-y-2 ml-7">
                {quiz.positive.map((pt, i) => <li key={i} className="text-gray-700">• {pt}</li>)}
              </ul>
            </div>
          )}

          {/* Negative Points */}
          {quiz.negative.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <X className="w-5 h-5 text-red-600" />
                <h4 className="font-semibold text-gray-900">Areas for improvement</h4>
              </div>
              <ul className="space-y-2 ml-7">
                {quiz.negative.map((pt, i) => <li key={i} className="text-red-700">• {pt}</li>)}
              </ul>
            </div>
          )}

          {/* Suggestion */}
          {quiz.suggestion && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">Suggestion</h4>
              </div>
              <p className="text-gray-700 ml-7">{quiz.suggestion}</p>
            </div>
          )}

          {/* Time Taken & Retry */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-100">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">Time taken: {formatTime(quiz.time)}</span>
            <button onClick={onRetry} className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-xl flex items-center space-x-1">
              <RotateCcw className="w-4 h-4 text-green-500" />
              <span className="text-sm">Try again</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddQuizButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-6 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center space-x-3 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
    >
      <Plus className="w-6 h-6" />
      <span className="text-lg">Add New Quiz Question</span>
    </button>
  );
}

// Utility for formatting time
function formatTime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}
