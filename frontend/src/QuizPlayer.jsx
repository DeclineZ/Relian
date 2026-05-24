
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDecks } from './lib/DeckContext';
import { ArrowLeft, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import './mobileLandscape.css'

export default function QuizPlayer() {
  const { id, idx } = useParams();
  const qIndex = Number(idx);
  const navigate = useNavigate();
  const { decks } = useDecks();
  const deck = decks.find(d => String(d.id) === id);

  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [qSeconds, setQSeconds] = useState(0);
  const textareaRef = useRef(null);

  const [loadingEval, setLoadingEval] = useState(false);
  const [showXpMessage, setShowXpMessage] = useState(false);
  const [xpMessage, setXpMessage] = useState('');
  const { userXP, setUserXP } = useDecks();

  const feedbackRef = useRef(null);
  const isCapacitor = window?.Capacitor?.isNativePlatform();
  const BASE = isCapacitor
    ? (import.meta.env.VITE_API_URL || 'https://relian-backend.vercel.app')
    : (import.meta.env.VITE_API_URL || '');




  useEffect(() => {
    textareaRef.current?.focus();
    setAnswer('');
    setResult(null);
  }, [qIndex]);

  useEffect(() => {
    const t = setInterval(() => setSeconds(s => s + 1), 1_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setQSeconds(0);
    const t = setInterval(() => setQSeconds(s => s + 1), 1_000);
    return () => clearInterval(t);
  }, [qIndex]);

  if (!deck || !Array.isArray(deck.quiz) || !deck.quiz[qIndex]) {
    return <div className="p-8">Question not found.</div>;
  }

  const totalQs = deck.quiz.length;
  const next = () => navigate(`/deck/${deck.id}/quiz/${qIndex + 1}`);
  const prev = () => navigate(`/deck/${deck.id}/quiz/${qIndex - 1}`);
  const handleExit = () => navigate(`/deck/${deck.id}`);
  const isAnswerBlank = answer.trim().length === 0;

  const fmtTime = s => {
    const m = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${m}:${ss}`;
  };

  const fmtSec = n => n.toFixed(2);



  const evaluate = async () => {
    if (isAnswerBlank) {
      textareaRef.current?.focus();
      return;
    }
    setLoadingEval(true);
    const payload = {
      question: deck.quiz[qIndex].question,
      answer: deck.quiz[qIndex].answer,
      key_points: deck.quiz[qIndex].key_points,
      studentAnswer: answer
    };
    try {
      const r = await fetch(`${BASE}/api/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await r.json();
      setResult(data);

      const xp = Math.max(5, Math.round(data.percent / 10));
      setUserXP(prev => prev + xp);
      setXpMessage(`Good job! +${xp} XP`);
      setShowXpMessage(true);
      setTimeout(() => setShowXpMessage(false), 2000);

      setTimeout(() => {
        feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);

      const key = `quiz-${deck.id}-${qIndex}-best`;
      const prevBest = JSON.parse(localStorage.getItem(key) || 'null');



      const record = { ...data, answer: answer.trim(), time: qSeconds };

      if (
        !prevBest ||
        record.percent > (prevBest.percent ?? 0) ||
        (record.percent === prevBest.percent && record.time < (prevBest.time ?? Infinity))
      ) {
        localStorage.setItem(key, JSON.stringify(record));
      }

      if (!prevBest || record.percent > (prevBest.percent ?? 0)) {
        localStorage.setItem(key, JSON.stringify(record));
      }
    } catch (err) {
      console.error('grading failed', err);
      setResult({
        percent: 0,
        positive: [],
        negative: [],
        suggestion: 'An Error Occured, Please Try Again'
      },);
    } finally {
      setLoadingEval(false);
      setQSeconds(0);
    }
  };



  return (
    <div
      className="smartquiz-container flex flex-col items-center w-full min-h-screen bg-gray-50"
    >
      <header className="flex justify-between items-center w-full max-w-6xl px-4 py-6">
        <button
          onClick={handleExit}
          className="flex items-center gap-2 text-blue-600"
        >
          <ArrowLeft size={20} color="blue" />
          Exit
        </button>

        <span className="text-sm text-gray-700">
          Q {qIndex + 1} / {totalQs} | Elapsed Time: {fmtTime(seconds)}
        </span>
      </header>
      <div className="flex items-center gap-2 text-gray-700 text-lg font-semibold">
        <Clock size={22} />
        {fmtSec(qSeconds)} sec
      </div>
      <div className="flex flex-col max-w-3xl w-full mx-auto p-6 gap-6">
        <h2
          className="text-xl lg:text-2xl font-semibold text-blue-700
                    flex items-start"
        >
          {`Q${qIndex + 1} — ${deck.quiz[qIndex].question}`}
        </h2>

        <div className="relative">
          <textarea
            ref={textareaRef}
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="พิมพ์คำตอบของคุณที่นี่…"
            className="w-full h-30 md:h-40 lg:h-40 border rounded-lg p-4
                   focus:ring-2 focus:ring-blue-500 outline-none
                   resize-none overflow-y-auto text-black"
          />
        </div>

        <div
          className="flex flex-col-reverse sm:flex-row
                   items-stretch sm:items-center justify-between gap-3"
        >
          <div className="flex ">
            <button
              onClick={prev}
              disabled={qIndex === 0}
              className="inline-flex items-center justify-center gap-2 px-4 py-2
                     rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200
                     disabled:opacity-40"
            >
              <ArrowLeft size={18} /> Back
            </button>

            <button
              onClick={next}
              disabled={qIndex + 1 >= totalQs}
              className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-blue-100 text-blue-800
                       hover:bg-blue-200 disabled:opacity-40"
            >
              Next <ArrowRight size={18} />
            </button>
          </div>
          <div className="flex gap-2">


            <button
              onClick={evaluate}
              disabled={loadingEval || isAnswerBlank}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md
                       bg-blue-600 text-white hover:bg-blue-700
                       active:scale-[.97] transition disabled:opacity-50"
            >
              <CheckCircle2 size={18} /> Check Answers
            </button>
          </div>
        </div>



        {result && (
          <div
            ref={feedbackRef}
            className="mt-4 p-4 rounded-lg bg-green-50 border border-green-200
               max-h-[25vh] overflow-y-auto"
          >
            <p className="font-semibold text-green-700">Your Score: {result.percent}%</p>
            <p className="text-green-700">✅ What You Did Well: {result.positive.join(', ')}</p>
            <p className="text-red-600">❌ What You Missed: {result.negative.join(', ')}</p>
            <p className="text-blue-700">💡 Suggestions: {result.suggestion}</p>
          </div>
        )}

      </div>
      {loadingEval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center
                  bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 p-6 bg-white rounded shadow">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent
                      animate-spin rounded-full"/>
            <p className="text-black">Evaluating your answer…</p>
          </div>
        </div>
      )}
      {showXpMessage && (
        <div className="xp-message">{xpMessage}</div>
      )}
    </div>
  );
}

