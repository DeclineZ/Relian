import { useState, useRef, useEffect } from "react";
import {
    Upload,
    Sparkles,
    PenLine,
    Settings,
    Plus,
    Trash2,
    ImagePlus,
} from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";
import { useDecks } from "./lib/DeckContext.jsx";
import "./mobileLandscape.css";


function ModeButton({ children, icon, active, onClick, ...rest }) {
    return (
        <button
            className={`px-4 py-1 rounded-full flex items-center gap-2 text-sm ${active
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
            onClick={onClick}
            {...rest}
        >
            {icon}
            {children}
        </button>
    );
}

export default function CreateFlashcards() {
    const isCapacitor = window?.Capacitor?.isNativePlatform();
    const BASE = isCapacitor
        ? (import.meta.env.VITE_API_URL || 'https://relian-backend.vercel.app')
        : (import.meta.env.VITE_API_URL || '');

    const navigate = useNavigate();
    const { setDecks, learningPrefs } = useDecks();
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    const getLoadingMessage = (p) => {
        if (p < 20) return "Uploading and processing PDF document...";
        if (p < 50) return "Extracting text and identifying key concepts...";
        if (p < 75) return "Generating flashcard definitions and keywords...";
        if (p < 92) return "Synthesizing review questions and summaries...";
        return "Polishing your brand new study deck...";
    };

    useEffect(() => {
        if (!loading) {
            setProgress(0);
            return;
        }

        setProgress(5);
        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 99) return prev;
                let increment = 0;
                if (prev < 30) {
                    increment = Math.random() * 3 + 1; // 1-4%
                } else if (prev < 60) {
                    increment = Math.random() * 1.5 + 0.5; // 0.5-2%
                } else if (prev < 85) {
                    increment = Math.random() * 0.8 + 0.2; // 0.2-1%
                } else {
                    increment = Math.random() * 0.15 + 0.05; // 0.05-0.2%
                }
                return Math.min(prev + increment, 99);
            });
        }, 300);

        return () => clearInterval(timer);
    }, [loading]);

    const [mode, setMode] = useState("ai");
    const [files, setFiles] = useState([]);
    const inputRef = useRef();

    const [activeTab, setActiveTab] = useState("summary");
    const [summary, setSummary] = useState("");
    const blankQuiz = { question: "", answer: "", key_points: [] };
    const [quizzes, setQuizzes] = useState([{ ...blankQuiz }]);

    const updateQuiz = (idx, field, value) =>
        setQuizzes((qs) =>
            qs.map((q, i) => (i === idx ? { ...q, [field]: value } : q))
        );

    const addQuiz = () => setQuizzes((qs) => [...qs, { ...blankQuiz }]);
    const removeQuiz = (idx) =>
        setQuizzes((qs) => qs.filter((_, i) => i !== idx));

    // === PDF Upload ===

    const handleFiles = (fileList) => {
        const accepted = [...fileList].filter(
            (file) => file.type === "application/pdf"
        );
        if (accepted.length) {
            const file = accepted[0];
            if (file.size > 2 * 1024 * 1024) {
                alert("File too large. Maximum allowed size is 2MB.");
                return;
            }
            setFiles([file]);
        }
    };

    const onDrop = (e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
    };

    // === Flashcard Creation ===

    const generateFromPdf = async () => {
        if (!files.length) return alert("Please choose a PDF first");
        setLoading(true);
        const formData = new FormData();
        formData.append("pdf", files[0]);
        formData.append("learningPrefs", JSON.stringify(learningPrefs));

        try {
            const { data: newDeck } = await axios.post(`${BASE}/api/generate-deck`, formData)
            setProgress(100);
            await new Promise((r) => setTimeout(r, 400));
            const sm2Defaults = {
                repetition: 0,
                interval: 0,
                efactor: 2.5,
                nextReview: Date.now(),
            };
            const deckWithSm2 = {
                ...newDeck,
                cards: newDeck.cards.map((c) => ({ ...sm2Defaults, ...c })),
            };
            setDecks((prev) => [...prev, deckWithSm2]);
            navigate(`/deck/${newDeck.id}`);
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.error || err.response?.data?.message || err.message;
            if (err.response?.status === 413 || (errMsg && errMsg.toLowerCase().includes("too large"))) {
                alert("Error: File too large. Maximum allowed size is 2MB.");
            } else if (err.response?.status === 429) {
                alert("Error: Too many requests. Please wait a bit before trying again.");
            } else {
                alert(`Error: ${errMsg || "An unexpected error occurred. Please try again."}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const [deckName, setDeckName] = useState("");
    const [deckDescription, setDeckDescription] = useState("");
    const blankCard = {
        question: "",
        answer: "",
        keyword: "",
        needs_image: false,
        image: "",
        taxonomy: "Manual",
    };
    const [cards, setCards] = useState([{ ...blankCard }]);

    const updateCard = (idx, field, value) => {
        setCards((prev) =>
            prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c))
        );
    };

    const removeCard = (idx) =>
        setCards((prev) => prev.filter((_, i) => i !== idx));

    const addCard = () => setCards((prev) => [...prev, { ...blankCard }]);

    const handleImage = (idx, file) => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        setCards((prev) =>
            prev.map((c, i) =>
                i === idx ? { ...c, image: url, needs_image: true } : c
            )
        );
    };

    const saveManualDeck = () => {
        if (!deckName.trim()) {
            alert("Deck name required");
            return;
        }

        const summaryOk = summary.trim() !== "";

        const cardsOk =
            cards.length > 0 &&
            cards.every((c) => c.question.trim() && c.answer.trim());

        const quizOk =
            quizzes.length > 0 &&
            quizzes.every((q) => q.question.trim() && q.answer.trim());

        if (!summaryOk && !cardsOk && !quizOk) {
            alert("Please add a summary, some flashcards, or quiz questions.");
            return;
        }

        if (!cardsOk && cards.length) {
            alert("Fill in all flashcards or remove the incomplete ones.");
            return;
        }

        if (!quizOk && quizzes.length) {
            alert("Fill in all quiz questions or remove the incomplete ones.");
            return;
        }

        const transformedCards = cardsOk
            ? cards.map((c) => {
                const hasImg = !!c.image;
                return {
                    id: uuid(),
                    question: c.question.trim(),
                    answer: c.answer.trim(),
                    keyword: c.keyword,
                    needs_image: hasImg,
                    image: hasImg ? c.image : "",
                    taxonomy: c.taxonomy || "Manual",
                    repetition: 0,
                    interval: 0,
                    efactor: 2.5,
                    nextReview: Date.now(),
                };
            })
            : [];

        const transformedQuiz = quizOk
            ? quizzes.map((q) => ({
                question: q.question.trim(),
                answer: q.answer.trim(),
                key_points: q.key_points?.length ? q.key_points : [],
            }))
            : [];

        const emojis = [
            "📚",
            "🧠",
            "🎯",
            "⚡",
            "🚀",
            "🌟",
            "🔑",
            "💡",
            "📝",
            "🧩",
        ];
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];

        const newDeck = {
            id: uuid(),
            name: `${emoji} ${deckName.trim()}`,
            description: deckDescription.trim(),
            studied: false,
            total: transformedCards.length,
            learned: 0,
            due: transformedCards.length,
            summaryHtml: summary.trim().replace(/\n/g, "<br/>"),
            cards: transformedCards,
            quiz: transformedQuiz,
        };

        setDecks((prev) => [...prev, newDeck]);
        navigate(`/deck/${newDeck.id}`);
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-md px-4">
                <style>{`
                    @keyframes shimmer {
                        0% { background-position: -200% 0; }
                        100% { background-position: 200% 0; }
                    }
                    .shimmer-bg {
                        background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
                        background-size: 200% 100%;
                        animation: shimmer 1.5s infinite linear;
                    }
                `}</style>
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-150 max-w-md w-full p-8 transform transition-all duration-300">
                    <div className="flex flex-col items-center text-center">


                        {/* Title & Description */}
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Creating Your Deck</h3>
                        <p className="text-sm text-gray-500 min-h-[40px] mb-6 flex items-center justify-center transition-all duration-300">
                            {getLoadingMessage(progress)}
                        </p>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-100 rounded-full h-3.5 overflow-hidden relative shadow-inner mb-4">
                            <div
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-300 ease-out relative"
                                style={{ width: `${progress}%` }}
                            >
                                {/* Shimmering effect */}
                                <div className="absolute inset-0 shimmer-bg"></div>
                            </div>
                        </div>

                        {/* Percentage */}
                        <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                            {Math.round(progress)}%
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-6 bg-gray-50 min-h-full w-full create-flashcards-container">
            <h1 className="text-3xl font-bold text-black">
                Create Study Decks
            </h1>

            <div className="flex gap-2">
                <ModeButton
                    icon={<Sparkles size={20} />}
                    active={mode === "ai"}
                    onClick={() => setMode("ai")}
                >
                    AI
                </ModeButton>
                <ModeButton
                    icon={<PenLine size={20} />}
                    active={mode === "manual"}
                    onClick={() => setMode("manual")}
                >
                    Manual
                </ModeButton>
                <ModeButton icon={<Settings size={20} />} disabled></ModeButton>
            </div>

            {mode === "ai" && (
                <>
                    <div
                        className="border-2 border-dashed border-gray-400/70 rounded-lg h-56 flex flex-col gap-2 items-center justify-center text-gray-500 cursor-pointer"
                        onClick={() => inputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={onDrop}
                    >
                        {files.length === 0 ? (
                            <>
                                <Upload size={32} />
                                <p>
                                    Drag & drop a PDF here, or{" "}
                                    <span className="underline">browse</span>
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Maximum file size: 2MB. Only PDF files are supported.
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="font-medium">{files[0].name}</p>
                                <p className="text-sm text-gray-400">
                                    Ready to upload
                                </p>
                            </>
                        )}
                        <input
                            type="file"
                            accept="application/pdf"
                            hidden
                            ref={inputRef}
                            onChange={(e) => handleFiles(e.target.files)}
                        />
                    </div>

                    <button
                        onClick={generateFromPdf}
                        className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50"
                        disabled={files.length === 0}
                    >
                        Generate
                    </button>
                </>
            )}

            {mode === "manual" && (
                <div className="space-y-6">
                    {/* Deck meta */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Deck name
                        </label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border rounded text-black"
                            value={deckName}
                            onChange={(e) => setDeckName(e.target.value)}
                        />
                        <label className="block text-sm font-medium text-gray-700">
                            Description (optional)
                        </label>
                        <textarea
                            className="w-full px-3 py-2 border rounded text-black"
                            value={deckDescription}
                            rows={1}
                            onChange={(e) => setDeckDescription(e.target.value)}
                        />
                    </div>

                    <nav className="flex gap-4 text-sm font-medium border-b mb-2">
                        {["summary", "cards", "quiz"].map((t) => (
                            <button
                                key={t}
                                onClick={() => setActiveTab(t)}
                                className={`
            pb-2
            ${activeTab === t
                                        ? "border-b-2 border-blue-600 text-blue-600"
                                        : "text-gray-500 hover:text-gray-700"
                                    }
          `}
                            >
                                {t === "summary"
                                    ? "Summary"
                                    : t === "cards"
                                        ? "Flashcards"
                                        : "Quiz"}
                            </button>
                        ))}
                    </nav>

                    {activeTab === "summary" && (
                        <textarea
                            rows={6}
                            placeholder="Write a concise summary here…"
                            className="w-full px-3 py-2 border rounded text-black"
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                        />
                    )}

                    {activeTab === "cards" && (
                        <>
                            <div className="space-y-4 max-h-65 overflow-auto pr-2">
                                {cards.map((card, idx) => (
                                    <div
                                        key={idx}
                                        className="relative space-y-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                                    >
                                        <div className="text-sm font-medium text-gray-500 mb-1">
                                            Card {idx + 1}
                                        </div>
                                        <button
                                            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                                            onClick={() => removeCard(idx)}
                                            title="Delete card"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Question
                                        </label>
                                        <textarea
                                            className="w-full px-3 py-2 border rounded text-black"
                                            rows={1}
                                            value={card.question}
                                            onChange={(e) =>
                                                updateCard(
                                                    idx,
                                                    "question",
                                                    e.target.value
                                                )
                                            }
                                        />
                                        <label className="block text-sm font-medium text-gray-700">
                                            Answer
                                        </label>
                                        <textarea
                                            className="w-full px-3 py-2 border rounded text-black"
                                            rows={1}
                                            value={card.answer}
                                            onChange={(e) =>
                                                updateCard(
                                                    idx,
                                                    "answer",
                                                    e.target.value
                                                )
                                            }
                                        />

                                        <div className="space-y-1">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Image (optional)
                                            </label>

                                            <label
                                                htmlFor={`img-${idx}`}
                                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 cursor-pointer"
                                            >
                                                <ImagePlus size={16} />
                                                {card.image
                                                    ? "Change image"
                                                    : "Add image"}
                                            </label>

                                            <input
                                                id={`img-${idx}`}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) =>
                                                    handleImage(
                                                        idx,
                                                        e.target.files[0]
                                                    )
                                                }
                                            />

                                            {card.image && (
                                                <img
                                                    src={card.image}
                                                    alt=""
                                                    className="mt-2 h-32 w-full rounded object-contain border"
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}

                                <button
                                    onClick={addCard}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-gray-600 transition hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600"
                                >
                                    <Plus size={18} />
                                    Add card
                                </button>
                            </div>
                        </>
                    )}

                    {activeTab === "quiz" && (
                        <div className="space-y-4 max-h-65 overflow-auto pr-2">
                            {quizzes.map((q, idx) => (
                                <div
                                    key={idx}
                                    className="relative space-y-3 rounded-xl border bg-white p-5 shadow-sm"
                                >
                                    <div className="text-sm font-medium text-gray-500 mb-1">
                                        Question {idx + 1}
                                    </div>
                                    <button
                                        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                                        onClick={() => removeQuiz(idx)}
                                        title="Delete question"
                                    >
                                        <Trash2 size={18} />
                                    </button>

                                    <label className="block text-sm font-medium text-gray-700">
                                        Question
                                    </label>
                                    <textarea
                                        rows={1}
                                        className="w-full px-3 py-2 border rounded text-black"
                                        value={q.question}
                                        onChange={(e) =>
                                            updateQuiz(
                                                idx,
                                                "question",
                                                e.target.value
                                            )
                                        }
                                    />
                                    <label className="block text-sm font-medium text-gray-700">
                                        Ideal answer
                                    </label>
                                    <textarea
                                        rows={2}
                                        className="w-full px-3 py-2 border rounded text-black"
                                        value={q.answer}
                                        onChange={(e) =>
                                            updateQuiz(
                                                idx,
                                                "answer",
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>
                            ))}

                            <button
                                onClick={addQuiz}
                                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed
                     border-gray-300 py-3 text-gray-600 transition hover:border-blue-500
                     hover:bg-blue-50 hover:text-blue-600"
                            >
                                <Plus size={18} /> Add question
                            </button>
                        </div>
                    )}

                    <button
                        onClick={saveManualDeck}
                        className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700
                 disabled:opacity-50"
                        disabled={
                            !deckName.trim() ||
                            (summary.trim() === "" &&
                                cards.length === 0 &&
                                quizzes.length === 0)
                        }
                    >
                        Save deck
                    </button>
                </div>
            )}
        </div>
    );
}
