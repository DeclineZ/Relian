// HeaderBar.jsx
// Top exit button, cards left, session timer

import { ArrowLeft } from "lucide-react";

export default function HeaderBar({ cardsLeft, sessionTime, handleExit }) {
  return (
    <header className="flex justify-between items-center w-full max-w-6xl px-4 py-6">
      <button
        onClick={handleExit}
        className="flex items-center gap-2 text-blue-600"
      >
        <ArrowLeft size={20} color="blue" />
        Exit
      </button>
      <span className="text-sm text-gray-700 ">
        {cardsLeft} Cards left today | Elapsed Time: {sessionTime} sec
      </span>
    </header>
  );
}