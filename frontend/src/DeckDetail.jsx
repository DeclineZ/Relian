import { useParams, useNavigate } from "react-router-dom";
import { useDecks } from "./lib/DeckContext";
import { v4 as uuid } from "uuid";
import { useState, useRef, useEffect } from "react";
import {
  Play,
  BarChart,
  Share2,
  BookOpen,
  CreditCard,
  Brain,
  Menu,
  Edit,
  Trash2,
  RotateCcw,
  Plus,
  X,
  Settings,
} from "lucide-react";

import SummaryTab from "./SummaryTab";
import StatsPopup from "./StatsPopup";
import FlashcardView from "./FlashcardView";
// import SettingsModal from "./showSettings";
// import SharePopup from "./SharePopup";
import SmartQuizView from "./QuizTab";
import "./mobileLandscape.css";

// Custom Play icon
const PlayIcon = ({ size = 24, color = "#ffffff" }) => {
  const width = size;
  const height = size;
  const points = [
    `${width * 0.3},${height * 0.2}`,
    `${width * 0.7},${height * 0.5}`,
    `${width * 0.3},${height * 0.8}`,
  ].join(" ");
  const strokeWidth = size * 0.08;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <polygon
        points={points}
        fill={color}
        stroke={color}
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </svg>
  );
};

export default function DeckDetail() {
  const { decks, setDecks } = useDecks();
  const { id } = useParams();
  const navigate = useNavigate();

  // Find current deck
  const deck = decks.find((d) => String(d.id) === id);
  if (!deck) {
    return <div className="p-8">Deck not found!</div>;
  }

  // Initialize viewMode from deck property (persisted)
  const viewMode = deck.viewMode || "summary";

  // Helper to change and persist viewMode on deck
  const changeViewMode = (newMode) => {
    setDecks((all) =>
      all.map((d) => (d.id === deck.id ? { ...d, viewMode: newMode } : d))
    );
  };

  // Play handler based on last selected mode
  const handlePlay = () => {
    if (viewMode === "cards") navigate(`/deck/${deck.id}/play`);
    if (viewMode === "quiz") navigate(`/deck/${deck.id}/quiz/0`);
  };

  // Popups, settings, taxonomy counts etc...
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [showPopUp, setShowPopUp] = useState(false);
  const [taxonomyCounts, setTaxonomyCounts] = useState({
    Remembering: 0,
    Understanding: 0,
    Applying: 0,
  });

  useEffect(() => {
    const counts = { Remembering: 0, Understanding: 0, Applying: 0 };
    deck.cards.forEach((card) => {
      counts[card.taxonomy] = (counts[card.taxonomy] || 0) + 1;
    });
    setTaxonomyCounts(counts);
    if (!localStorage.getItem(`deck-${deck.id}-popup-shown`)) {
      setShowPopUp(true);
      localStorage.setItem(`deck-${deck.id}-popup-shown`, "true");
    }
  }, [deck]);


  const shareLink = `https://relian.com/deck/${deck.id}?share=true`;
  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    alert("Link copied to clipboard!");
  };

  function resetDueDates() {
    console.log("AA");
    const nowISO = new Date().toISOString();
    const updatedDecks = decks.map((d) =>
      d.id !== deck.id
        ? d
        : {
          ...d,
          cards: d.cards.map((card) => ({
            ...card,
            nextReview: nowISO,
            repetition: 0,
            interval: 0,
            efactor: 2.5,
          })),
          due: d.cards.length,
        }
    );
    setDecks(updatedDecks);
    localStorage.setItem("decks", JSON.stringify(updatedDecks));
    setShowSettings(false);
  }

  function handleDeleteDeck() {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this deck? This action cannot be undone."
    );
    if (confirmDelete) {
      const updatedDecks = decks.filter((d) => d.id !== deck.id);
      setDecks(updatedDecks);
      localStorage.setItem("decks", JSON.stringify(updatedDecks));
      navigate("/");
    }
    setShowSettings(false);
  }

  function handleEditDetails() {
    const newDescription = prompt(
      "Enter new description for the deck:",
      deck.description
    );
    if (newDescription !== null) {
      const updatedDecks = decks.map((d) =>
        d.id === deck.id ? { ...d, description: newDescription } : d
      );
      setDecks(updatedDecks);
      localStorage.setItem("decks", JSON.stringify(updatedDecks));
    }
    setShowSettings(false);
  }

  function handleRename() {
    const newName = prompt("Enter new name for the deck:", deck.name);
    if (newName) {
      const updatedDecks = decks.map((d) =>
        d.id === deck.id ? { ...d, name: newName } : d
      );
      setDecks(updatedDecks);
      localStorage.setItem("decks", JSON.stringify(updatedDecks));
    }
    setShowSettings(false);
  }

  // Render
  return (
    <div className="deckdetail-container w-full h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col overflow-hidden">
      {/* Header with Play, Stats, Share, Settings */}
      <header className="w-full bg-white/95 backdrop-blur-sm shadow-lg shadow-blue-100  border-b border-gray-200 z-50">
        <div className="px-4 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <h1 className="font-bold text-gray-900">{deck.name}</h1>
            <div className="flex items-center space-x-2">
              {viewMode !== "summary" && (
                <ActionButton
                  icon={PlayIcon}
                  label={viewMode === "cards" ? "Play" : "Quiz"}
                  onClick={handlePlay}
                  variant={viewMode === "cards" ? "primary" : "quiz"}
                />
              )}
              <ActionButton
                icon={BarChart}
                label="Stats"
                onClick={() => setShowStats(true)}
              />
              <ActionButton
                icon={Share2}
                label="Share"
                onClick={() => setShowSharePopup((v) => !v)}
              />
              <ActionButton
                icon={Settings}
                label="Settings"
                onClick={() => setShowSettings((v) => !v)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 z-40">
        <div className="px-4 lg:px-8">
          <div className="flex">
            <TabButton
              label="Summary"
              icon={BookOpen}
              active={viewMode === "summary"}
              onClick={() => changeViewMode("summary")}
            />
            <TabButton
              label="Flashcards"
              icon={CreditCard}
              active={viewMode === "cards"}
              onClick={() => changeViewMode("cards")}
            />
            <TabButton
              label="Smart Quiz"
              icon={Brain}
              active={viewMode === "quiz"}
              onClick={() => changeViewMode("quiz")}
            />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-8">
        {viewMode === "summary" && <SummaryTab />}
        {viewMode === "cards" && <FlashcardView />}
        {viewMode === "quiz" && <SmartQuizView />}
      </main>

      {/* Modals and Popups */}
      {showStats && (
        <StatsPopup deckId={deck.id} onClose={() => setShowStats(false)} />
      )}
      <SettingsModal
        isOpen={showSettings}
        onClose={setShowSettings}
        onRsetDue={resetDueDates}
        onDelete={handleDeleteDeck}
        onRename={handleRename}
        onEditDetails={handleEditDetails}
      /* rename, edit, delete handlers */
      />
      <SharePopup
        showSharePopup={showSharePopup}
        setShowSharePopup={setShowSharePopup}
        copyLink={copyLink}
        shareLink={shareLink}
      />
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  variant = "default",
}) {
  const variants = {
    default: "text-gray-600 hover:text-gray-800 hover:bg-gray-100",
    primary: "bg-emerald-500 hover:bg-emerald-600 animated-gradient text-white",
    quiz: "bg-gradient-to-r from-violet-700 to-violet-500 hover:from-indigo-900 hover:to-indigo-700 text-white",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`flex items-center p-2.5 rounded-xl transition ${variants[variant]
        } ${variant !== "default" ? "px-4 space-x-2" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
    >
      <Icon className="w-7 h-7" />
      {variant !== "default" && (
        <span className="hidden sm:inline font-semibold text-xl">{label}</span>
      )}
    </button>
  );
}

function TabButton({ label, icon: Icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 py-4 px-6 border-b-3 transition font-medium ${active
        ? "border-blue-500 text-blue-600 bg-blue-100/50"
        : "border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-200"
        }`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-2xl font-semibold">{label}</span>
    </button>
  );
}

const SharePopup = ({
  showSharePopup,
  setShowSharePopup,
  copyLink,
  shareLink,
}) => {
  return (
    <>
      {showSharePopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm ">
          <div className="bg-white p-6 rounded-xl shadow-xl text-black space-y-4 max-w-sm w-full ">
            <h2 className="text-xl font-bold">Share this Deck</h2>
            <p>Send this link to friends or colleagues:</p>
            <div className="flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700 text-sm ml-1">
                Include PDF file
              </span>
            </div>
            <div className="flex items-center justify-between border rounded px-2 py-1">
              <span className="text-sm text-gray-800 truncate">
                {shareLink}
              </span>
              <button
                onClick={copyLink}
                className="ml-2 px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Copy
              </button>
            </div>
            <button
              onClick={() => setShowSharePopup(false)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
function SettingsModal({
  isOpen,
  onClose,
  onRename,
  onEditDetails,
  onRsetDue,
  onDelete,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl text-black space-y-4 max-w-sm w-full">
        <h2 className="text-xl font-bold">Deck Settings</h2>
        <div className="flex flex-col gap-2">
          <button
            onClick={onRename}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Rename Deck
          </button>
          <button
            onClick={onRsetDue}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Reset Due Dates
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete Deck
          </button>
        </div>
        <button
          onClick={() => onClose(false)}
          className="mt-4 w-full bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
