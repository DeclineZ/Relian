// src/pages/LearnerTypePage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Image, Globe, Cpu, Book, HelpCircle } from "lucide-react";
import { useDecks } from "./lib/DeckContext.jsx";      

const learnerTypes = [
  {
    id: "visual",
    label: "Visual Learner",
    desc: "I grasp concepts fastest with images, diagrams, or videos.",
    Icon: Image,
    color: "bg-purple-100 text-purple-700",
  },
  {
    id: "realworld",
    label: "Real-World Learner",
    desc: "I learn best through hands-on examples and practical cases.",
    Icon: Globe,
    color: "bg-green-100 text-green-700",
  },
  {
    id: "logical",
    label: "Logical Learner",
    desc: "I prefer patterns, numbers, and cause-and-effect reasoning.",
    Icon: Cpu,
    color: "bg-blue-100 text-blue-700",
  },
  {
    id: "verbal",
    label: "Verbal / Text-Based Learner",
    desc: "Give me words—summaries, definitions, or sequenced steps.",
    Icon: Book,
    color: "bg-orange-100 text-orange-700",
  },
  {
    id: "unsure",
    label: "I'm not sure yet",
    desc: "Help me discover a blend that works for me.",
    Icon: HelpCircle,
    color: "bg-gray-100 text-gray-600",
  },
];



export default function LearnerTypePage() {
  const navigate = useNavigate();
  const { setLearningPrefs } = useDecks();

  function choose(type) {
    setLearningPrefs({
      visual:     type === 'visual'    ? 1 : 0,
      verbal:     type === 'verbal'    ? 1 : 0,
      logical:    type === 'logical'   ? 1 : 0,
      realworld:  type === 'realworld' ? 1 : 0,
    });
     navigate('/create');
   }
  

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-6">
      <div className="w-full max-w-3xl space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
            How do <span className="text-indigo-600">you</span> learn best?
          </h1>
          <p className="text-gray-600 max-w-lg mx-auto">
            Pick the style that feels most natural. We'll tailor flashcards and
            explanations to match your preference—no wrong answers here!
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {learnerTypes.map(({ id, label, desc, Icon, color }) => (
            <button
              key={id}
              onClick={() => choose(id)}
              className="group relative flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-200"
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${color}`}
              >
                <Icon size={24} />
              </div>

              <div className="text-left">
                <h3 className="font-semibold text-lg text-gray-900">
                  {label}
                </h3>
                <p className="mt-1 text-sm text-gray-600">{desc}</p>
              </div>

              <span className="absolute inset-0 rounded-xl ring-1 ring-transparent transition group-hover:ring-indigo-300" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
