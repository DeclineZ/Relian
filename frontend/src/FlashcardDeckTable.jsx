// src/components/FlashcardDeckTable.jsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useDecks } from './lib/DeckContext'
import './mobileLandscape.css'

export default function FlashcardDeckTable() {
  const navigate = useNavigate()
  const { decks } = useDecks()
  const validDecks = Array.isArray(decks) ? decks : []

  const getQuizStats = (deck) => {
    const qsLen = Array.isArray(deck.quiz) ? deck.quiz.length : 0
    let attempted = 0, totalScore = 0
    for (let i = 0; i < qsLen; i++) {
      const raw = localStorage.getItem(`quiz-${deck.id}-${i}-best`)
      if (!raw) continue
      try {
        const rec = JSON.parse(raw)
        if (typeof rec.percent === 'number') {
          attempted++
          totalScore += rec.percent
        }
      } catch {}
    }
    const avgScore = attempted > 0 ? Math.round(totalScore / attempted) : 0
    return { attempted, qsLen, avgScore }
  }

  const gridStyle = {
    gridTemplateColumns: '3fr 5fr repeat(3, minmax(4rem, 1fr)) minmax(8rem, 1fr)'
  }

  return (
    <div className="flashcarddecktable-container w-full mx-auto p-6 overflow-y-auto">
      <h1 className="text-3xl font-bold mb-4 text-black">Study Decks</h1>

      <div
        className="grid text-sm font-medium text-gray-500 mb-2 px-10 items-center"
        style={gridStyle}
      >
        <div className="truncate">Deck Name</div>
        <div className="text-center">Flashcard Progress</div>
        <div className="text-center">Total</div>
        <div className="text-center">Learned</div>
        <div className="text-right">Due</div>
        <div className="text-right">Quizzes</div>
      </div>

      <div className="space-y-2">
        {validDecks.length === 0 ? (
          <p className="text-center py-10 text-gray-500">
            No decks available. Click the + icon on the left to get started.
          </p>
        ) : (
          validDecks.map((d) => {
            const { id, name } = d

            const total   = d.cards.length
            const learned = d.cards.filter(c => c.point > 5).length
            const due     = d.cards.filter(c =>
              new Date(c.nextReview).getTime() <= Date.now()
            ).length
            const pct = total > 0 ? (learned / total) * 100 : 0
            const { attempted, qsLen, avgScore } = getQuizStats(d)
            const attemptedPct = qsLen > 0 ? Math.round((attempted / qsLen) * 100) : 0

            const [iconCandidate, ...rest] = name.trim().split(' ')
            const icon = iconCandidate.length === 2 || /\p{Emoji}/u.test(iconCandidate)
              ? iconCandidate
              : '📚'
            const title = rest.join(' ') || name

            return (
              <div
                key={id}
                className="grid items-center gap-x-4 bg-white px-4 py-2 rounded-xl shadow hover:shadow-lg transition cursor-pointer"
                style={gridStyle}
                onClick={() => navigate(`/deck/${id}`)}
              >
                <div className="flex items-center gap-2 text-gray-800 truncate">
                  <span className="text-2xl">{icon}</span>
                  <span className="font-semibold truncate">{title}</span>
                </div>

                <div className="flex justify-end w-full px-2 ">
                  <div className="w-[50%] h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-2 bg-teal-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="text-center text-gray-800 font-medium pl-8">
                  {total}
                </div>

                <div
                  className={`text-center font-semibold  ${
                    learned === 0
                      ? 'text-gray-500'
                      : learned === total
                      ? 'text-red-500'
                      : 'text-green-600'
                  }`}
                >
                  {total - due}
                </div>

                <div className="text-right text-pink-500 font-semibold pr-2">
                  {due}
                </div>

                <div className="text-right">
                <div
                  className={`inline-flex flex-col items-end px-3 py-2 border rounded-lg text-xs font-medium ${
                    avgScore < 60
                      ? 'border-orange-400 text-orange-600'
                      : 'border-green-400 text-green-600'
                  }`}
                >
                  <span>{`${attemptedPct}% attempted`}</span>
                  <span className="text-xs font-normal">
                    {`${avgScore}% avg. score`}
                  </span>
                </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
