// src/pages/FlashcardPlayer.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useDecks } from './lib/DeckContext.jsx';
import confetti from 'canvas-confetti';
import { withTimeout } from './lib/aiTimeout.js';
import { calculateNext } from './lib/sm2.js';
import "./mobileLandscape.css";

import FlashcardCard from './components/FlashcardPlayer/FlashcardCard.jsx';
import FlashcardControls from './components/FlashcardPlayer/FlashcardControls.jsx';
import HeaderBar from './components/FlashcardPlayer/HeaderBar.jsx';
import XPMessage from './components/FlashcardPlayer/XPMessage.jsx';
import FinishedModal from './components/FlashcardPlayer/FinishedModal.jsx';
import AIExplanationDrawer from './components/FlashcardPlayer/AIExplanationDrawer.jsx';
import AddMoreCardsModal from './components/FlashcardPlayer/AddMoreCardsModal.jsx';


export default function FlashcardPlayer() {
  const { decks, setDecks } = useDecks();
  const { id } = useParams();
  const navigate = useNavigate();



  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);

  const [isFinished, setFinished] = useState(false);

  const [moreOpen, setMoreOpen] = useState(false);
  const [moreCards, setMoreCards] = useState([]);
  const [checked, setChecked] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);

  const [liked, setLiked] = useState(() => new Set());

  const [cardStartTime, setCardStartTime] = useState(0);
  const [cardElapsedTime, setCardElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const isCapacitor = window?.Capacitor?.isNativePlatform();
  const BASE = isCapacitor
    ? 'http://localhost:5001' // Replace with your dev machine IP address accessible to your device/emulator
    : import.meta.env.VITE_API_URL;


  const deck = decks.find(d => String(d.id) === id);
  const [sessionCards] = useState(() => {
    const now = Date.now();
    return deck.cards.filter(c => new Date(c.nextReview).getTime() <= now);
  });

  const cards = sessionCards;
  const totalDue = cards.length
  const cardsLeft = totalDue - index
  const card = cards[index];



  const { userXP, setUserXP } = useDecks();
  const [xpMessage, setXpMessage] = useState('');
  const [showXpMessage, setShowXpMessage] = useState(false);

  const [sessionStudied, setSessionStudied] = useState(0)

  const { learningPrefs, setLearningPrefs } = useDecks();

  const [appliedLikes, setAppliedLikes] = useState(() => new Set());
  const [styleMessage, setStyleMessage] = useState('');
  const [showStyleMessage, setShowStyleMessage] = useState(false);
  const prevIndexRef = useRef(index);


  const calculateXP = (isCorrect, timeTaken, isFaster) => {
    let xp = 10;

    if (isCorrect) {
      xp += 10;
      if (isFaster) {
        xp += 5;
      }
    } else {
      xp += 2;
    }


    if (isFaster) {
      xp += Math.floor(10 * (1 - (timeTaken / 10)));
    } else if (timeTaken > 20) {
      xp -= 2;
    }

    return xp;
  };


  useEffect(() => {
    const prevIdx = prevIndexRef.current;
    if (prevIdx !== index) {
      const prevCard = deck.cards[prevIdx];
      if (
        prevCard &&
        liked.has(prevCard.id) &&
        !appliedLikes.has(prevCard.id)
      ) {
        const delta = 0.05;
        const p = { ...learningPrefs };
        const text = (prevCard.answer || '').toLowerCase();

        const realWorldKW = ['for example', 'e.g.', 'เช่น', 'ตัวอย่าง', 'อาทิ'];
        const logicalKW = ['because', 'therefore', 'เพราะ', 'ดังนั้น', 'เนื่องจาก'];
        const verbalKW = ['definition', 'summary', 'step', 'explain', 'คำจำกัดความ', 'สรุป', 'ขั้นตอน', 'อธิบาย'];

        if (prevCard.needs_image) p.visual += delta;
        if (realWorldKW.some(kw => text.includes(kw))) p.realworld += delta;
        if (logicalKW.some(kw => text.includes(kw))) p.logical += delta;
        if (verbalKW.some(kw => text.includes(kw))) p.verbal += delta;
        if (
          !prevCard.needs_image &&
          !realWorldKW.some(kw => text.includes(kw)) &&
          !logicalKW.some(kw => text.includes(kw)) &&
          !verbalKW.some(kw => text.includes(kw))
        ) {
          p.verbal += delta;
        }

        const sum = Object.values(p).reduce((a, b) => a + b, 0) || 1;
        Object.keys(p).forEach(k => p[k] = p[k] / sum);
        setLearningPrefs(p);

        const primary =
          prevCard.needs_image ? 'Visual' :
            realWorldKW.some(kw => text.includes(kw)) ? 'Real-World' :
              logicalKW.some(kw => text.includes(kw)) ? 'Logical' : 'Verbal';
        const STYLE_DELAY = 1000; // ms
        setTimeout(() => {
          setStyleMessage(`+${Math.round(delta * 100)}% ${primary}`);
          setShowStyleMessage(true);
          setTimeout(() => setShowStyleMessage(false), 2000);
        }, STYLE_DELAY);

        setAppliedLikes(s => new Set(s).add(prevCard.id));
      }
    }
    prevIndexRef.current = index;
  }, [
    index,
    liked,
    appliedLikes,
    learningPrefs,
    deck.cards,
    setLearningPrefs,
    setAppliedLikes,
    setStyleMessage,
    setShowStyleMessage
  ]);

  useEffect(() => {
    if (!isFinished) return;


    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, [isFinished]);

  useEffect(() => {
    setSessionStudied(0)
  }, [id])

  useEffect(() => {
    setCardStartTime(Date.now());
    setIsTimerRunning(true);
  }, [index]);

  useEffect(() => {
    if (!card) return;
    const storedTime = localStorage.getItem(`card-${card.id}-time`);
    if (storedTime) {
      setCardElapsedTime(storedTime);
    }
  }, [card]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);


  if (index >= cards.length || cards.length === 0) {
    return (
      <div className="p-4 h-full w-full text-black flex items-center justify-center flex-col">
        <h2 className="text-2xl mb-4">🎉 All done for now!</h2>
        <button onClick={() => navigate(-1)} className="btn text-blue-700">
          Back to Deck
        </button>
      </div>
    );
  }


  function handleShowAnswer() {
    setShowAnswer(true);
    if (isTimerRunning) {
      const timeTaken = (Date.now() - cardStartTime) / 1000;
      setCardElapsedTime(timeTaken);

      const previousTime = localStorage.getItem(`card-${card.id}-time`);
      if (!previousTime || timeTaken < previousTime) {
        localStorage.setItem(`card-${card.id}-time`, timeTaken.toFixed(2));
      }

      setIsTimerRunning(false);
    }
  }

  function toggleLike(id) {
    setLiked(prevLiked => {
      const nextLiked = new Set(prevLiked);
      if (nextLiked.has(id)) {
        nextLiked.delete(id);
        setAppliedLikes(prev => {
          const nextApplied = new Set(prev);
          nextApplied.delete(id);
          return nextApplied;
        });
      } else {
        nextLiked.add(id);
      }
      return nextLiked;
    });
  }


  async function handleAiExplanation() {
    setLoadingAi(true);
    try {
      const { data } = await withTimeout(
        axios.post(`${BASE}/api/explanation`, { question: card.question, answer: card.answer }),
        20_000,
        { explanation: 'หินอัคนีพุ คือ หินที่เกิดจากการเย็นตัวและแข็งตัวของแมกมาใต้ผิวโลก โดยแมกมาเหล่านี้ถูกขับพุ่งออกมาจากใต้พื้นโลกผ่านกระบวนการภูเขาไฟระเบิด หรือการปะทุของภูเขาไฟ เมื่อแมกมาเหล่านี้สัมผัสกับอากาศหรือน้ำ อุณหภูมิและความดันที่ลดลงทำให้แร่ธาตุต่างๆ ในแมกมาเริ่มแข็งตัวและตกผลึก กลายเป็นหินอัคนีพุที่มีเนื้อละเอียดและโครงสร้างที่มีลักษณะเฉพาะ หินบะซอลต์ หินไรโอไลต์ และหินแอนดีไซต์ เป็นตัวอย่างของหินอัคนีพุที่พบได้ทั่วไป หินเหล่านี้มีลักษณะเนื้อละเอียดและมักจะมีสีเข้ม หินบะซอลต์มักพบในบริเวณที่มีการปะทุของภูเขาไฟใต้มหาสมุทร หินไรโอไลต์และหินแอนดีไซต์มักพบในบริเวณที่มีภูเขาไฟบนพื้นทวีป การเกิดของหินเหล่านี้จึงเกี่ยวข้องกับกระบวนการเคลื่อนที่ของแผ่นธรณีภาคและกระบวนการภูเขาไฟ ซึ่งทำให้เราเข้าใจถึงการเปลี่ยนแปลงของพื้นโลกและประวัติศาสตร์ของโลกเราได้ดีขึ้น' }
      );

      const xp = calculateXP(true, 0, false, true, false);
      setUserXP(prevXP => prevXP + xp);
      setXpMessage(`+${xp} XP for the explantion!`);
      setShowXpMessage(true);

      setTimeout(() => {
        setShowXpMessage(false);
      }, 2000);

      setAiExplanation(data.explanation);
      setDrawer(true);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch AI explanation');
    } finally {
      setLoadingAi(false);
    }
  }

  function handleNext() {
    if (index < cards.length - 1) {
      setIndex(index + 1);
      setShowAnswer(false);
      setDrawer(false);
    } else {
      setFinished(true);
    }

  }

  async function rate(isCorrect) {
    const timeTaken = (Date.now() - cardStartTime) / 1000;
    const previousTime = localStorage.getItem(`card-${card.id}-time`);
    const isFaster = previousTime ? timeTaken < previousTime : false;

    const xp = calculateXP(isCorrect, timeTaken, isFaster, false, false);
    setUserXP(x => x + xp);
    setXpMessage(`Nice job! +${xp} XP`);
    setShowXpMessage(true);
    setTimeout(() => setShowXpMessage(false), 2000);

    const quality = isCorrect ? 5 : 1;
    const { repetition, interval, efactor, nextReview } =
      calculateNext(card, quality);

    const previousPoint = card.point;
    const newPoint = previousPoint + (isCorrect ? 6 : -2);

    const justLearned = previousPoint <= 5 && newPoint > 5;
    if (justLearned) {
      console.log(`Card ${card.id} just graduated!`);
      setSessionStudied(s => s + 1);
    }

    setDecks(prev =>
      prev.map(d => {
        if (d.id !== deck.id) return d;
        return {
          ...d,
          cards: d.cards.map(c =>
            c.id === card.id ? {
              ...c,
              point: newPoint,
              repetition,
              interval,
              efactor,
              nextReview,
            } : c
          ),
          due: d.cards
            .map(c =>
              c.id === card.id
                ? { ...c, nextReview }
                : c
            )
            .filter(c => c.nextReview <= Date.now())
            .length,
          learned: justLearned ? d.learned + 1 : d.learned,
        };
      })
    );


    setShowAnswer(false);
    setAiExplanation('');
    handleNext();
  }



  async function openAddMore() {
    setLoadingMore(true);
    setMoreOpen(true);
    try {
      const { data } = await withTimeout(
        axios.post(`${BASE}/api/related-cards`, { question: card.question, answer: card.answer }),
        2500_000,
        {
          cards: [
            { id: 'mock1', question: 'หินแอนดีไซต์มีลักษณะอย่างไร', answer: 'เป็นหินอัคนีพุที่มีเนื้อละเอียดและสีเข้ม', keyword: '', needs_image: false },
            { id: 'mock2', question: 'หินอัคนีพุสามารถนำไปใช้ประโยชน์อย่างไร', answer: 'สามารถนำไปใช้เป็นวัสดุก่อสร้างและวัสดุในการทำถนน', keyword: '', needs_image: false },
            { id: 'mock3', question: 'หินอัคนีพุคืออะไร', answer: 'หินที่เกิดจากการเย็นตัวของแมกมาใต้ผิวโลก', keyword: '', needs_image: false }

          ]
        }
      );


      setMoreCards(data.cards);
      setChecked(data.cards.map((c) => c.id));

      const xp = calculateXP(true, 0, false, false, true);
      setUserXP(prevXP => prevXP + xp);
      setXpMessage(`+${xp} XP for exploring more!`);
      setShowXpMessage(true);

      setTimeout(() => {
        setShowXpMessage(false);
      }, 2000);
    } catch {
      alert('AI failed to generate extra cards');
      setMoreOpen(false);
    } finally { setLoadingMore(false); }
  }

  function toggleCheck(id) {
    setChecked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function confirmAdd() {
    if (checked.length === 0) return setMoreOpen(false);
    const defaultSrs = {
      point: 0,
      repetition: 0,
      interval: 1,
      efactor: 2.5,
      nextReview: Date.now(),
    };
    const selected = moreCards
      .filter((c) => checked.includes(c.id))
      .map(c => ({ ...defaultSrs, ...c }));
    setDecks((prev) =>
      prev.map((d) =>
        d.id === deck.id ? { ...d, cards: [...d.cards, ...selected], total: d.cards.length + selected.length } : d,
      ),
    );
    setMoreOpen(false);
  }



  return (

    <div className="flashcardplayer-container flex flex-col items-center min-h-screen bg-gray-50 w-full relative">
      <FinishedModal isFinished={isFinished} onReturn={() => navigate(`/deck/${deck.id}`)} />
      <HeaderBar cardsLeft={cardsLeft} sessionTime={sessionTime} handleExit={() => navigate(`/deck/${deck.id}`)} />
      <section className="flex flex-col items-center gap-8 flex-1 w-full px-4 pb-6 justify-center">
        <XPMessage message={xpMessage} show={showXpMessage} />
        {showStyleMessage && <div className="style-message">{styleMessage}</div>}
        <span className="text-xl text-gray-700 flex justify-center gap-2 font-bold">
          {/* Timer logic */}
          {isTimerRunning ? ((Date.now() - cardStartTime) / 1000).toFixed(2) : cardElapsedTime} sec
        </span>
        <FlashcardCard
          card={card}
          showAnswer={showAnswer}
          onShowAnswer={handleShowAnswer}
          liked={liked.has(card?.id)}
          onLike={toggleLike}
        />
        <FlashcardControls
          showAnswer={showAnswer}
          onShowAnswer={handleShowAnswer}
          onRate={rate}
          onAI={handleAiExplanation}
          onAddMore={openAddMore}
          loadingAi={loadingAi}
        />
      </section>
      {/* Loading Overlay for AI Explanation */}
      {loadingAi && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4 p-6 bg-white rounded shadow ">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent animate-spin rounded-full"></div>
            <p className="text-black">Fetching AI Explanation...</p>
          </div>
        </div>
      )}
      <AIExplanationDrawer
        open={drawer}
        question={card?.question}
        answer={card?.answer}
        explanation={aiExplanation}
        loading={loadingAi}
        onClose={() => setDrawer(false)}
      />
      <AddMoreCardsModal
        open={moreOpen}
        moreCards={moreCards}
        checked={checked}
        loading={loadingMore}
        onCheck={toggleCheck}
        onClose={() => setMoreOpen(false)}
        onConfirm={confirmAdd}
      />
    </div>
  );
}
