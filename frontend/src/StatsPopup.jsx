import { useDecks } from './lib/DeckContext';
import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend
} from 'recharts';
import { X } from 'lucide-react';
import './mobileLandscape.css'

export default function StatsPopup({ deckId, onClose, onReset }) {

  
  

  const { decks } = useDecks();
  const deck = decks.find((d) => d.id === deckId);
  if (!deck) return null;

  // Flashcard Stats: compute due dynamically from nextReview timestamps
  const now = Date.now();
  const totalCards = deck.cards.length;
  const dueCount = deck.cards.filter((card) => {
    if (!card.nextReview) return false;
    const next = new Date(card.nextReview).getTime();
    return next <= now;
  }).length;
  const learnedCount = totalCards - dueCount;
  const studiedPct = ((learnedCount / (totalCards || 1)) * 100).toFixed(1);

  // Quiz Stats from localStorage

  const [quizData, setQuizData] = useState([]);
  useEffect(() => {
    if (Array.isArray(deck.quiz)) {
      const data = deck.quiz.map((q, idx) => {
        const raw = localStorage.getItem(`quiz-${deck.id}-${idx}-best`);
        let percent = 0;
        try {
          const parsed = JSON.parse(raw) || {};
          percent = parsed.percent || 0;
        } catch {}
        percent = Math.max(0, Math.min(percent, 100));
        return { name: `Q${idx + 1}`, percent };
      });
      setQuizData(data);
    }
  }, [deck]);
  

  const totalQuiz = quizData.length;
  const avgQuizScore = (
    quizData.reduce((sum, q) => sum + q.percent, 0) / (totalQuiz || 1)
  ).toFixed(1);

    // Colors: blue for learned, violet for due, and violet bars
  const pieColors = ['#3B82F6', '#443559'];
  const barColor = '#3B82F6';

  const flashPie = [
    { name: 'Learned', value: learnedCount },
    { name: 'Due', value: dueCount }
  ];

  

  return (
    <div className="statspopup-container fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-medium text-gray-900">Progress</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Stats Boxes */}
        <div className="p-6 pt-4">
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="p-4 bg-green-100 rounded-xl text-center">
              <div className="text-2xl font-semibold text-gray-900">{learnedCount}</div>
              <div className="text-sm text-gray-500 uppercase">Learned</div>
            </div>
            <div className="p-4 bg-orange-100 rounded-xl text-center">
              <div className="text-2xl font-semibold text-gray-900">{dueCount}</div>
              <div className="text-sm text-gray-500 uppercase">Due</div>
            </div>
            <div className="p-4 bg-gray-100 rounded-xl text-center">
              <div className="text-2xl font-semibold text-gray-900">{totalCards}</div>
              <div className="text-sm text-gray-500 uppercase">Total</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-6 bg-blue-100 rounded-xl">
            <div className="p-4  text-center">
              <div className="text-2xl font-semibold text-gray-900">{avgQuizScore}%</div>
              <div className="text-sm text-gray-500 uppercase">Avg Quiz Score</div>
            </div>
            <div className="p-4 text-center">
              <div className="text-2xl font-semibold text-gray-900">{totalQuiz}</div>
              <div className="text-sm text-gray-500 uppercase">Quizzes</div>
            </div>
          </div>
        </div>

        {/* Detailed Charts: only show if data exists */}
        <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Flashcard Completion Pie */}
          {totalCards > 0 && (
            <div className="flex flex-col items-center">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Completion</h3>
              <ResponsiveContainer width={240} height={200}>
                <PieChart>
                  <Pie
                    data={flashPie}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={30}
                    outerRadius={40}
                    paddingAngle={4}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {flashPie.map((entry, idx) => (
                      <Cell key={idx} fill={pieColors[idx]} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Quiz Scores Bar */}
          {totalQuiz > 0 && (
            <div className="flex flex-col">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Quiz Scores</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={quizData} margin={{ left: 0, right: 0 }}>
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="percent" fill={barColor} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end p-6 border-t space-x-4">
          {onReset && (
            <button
              onClick={onReset}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800"
            >
              Reset Progress
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

