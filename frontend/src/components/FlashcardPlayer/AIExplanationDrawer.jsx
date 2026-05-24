// Drawer/Sidebar for AI Explanation content

import { ChevronLeft } from "lucide-react";

export default function AIExplanationDrawer({
  open,
  question,
  answer,
  explanation,
  loading,
  onClose
}) {
  if (!open) return null;
  return (
    <aside
      className={`fixed inset-y-0 right-0 w-80 md:w-96 bg-white border-l shadow-lg
        transform transition-transform duration-300
        ${open ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100"
        >
          <ChevronLeft size={20} color="black" />
        </button>
        <h2 className="font-bold text-lg text-black">AI Explanation</h2>
      </div>
      <div className="p-4 overflow-y-auto text-black space-y-4">
        <p><span className="font-semibold">Q:</span> {question}</p>
        <p><span className="font-semibold">A:</span> {answer}</p>
        <hr />
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent animate-spin rounded-full"></div>
            <p>Fetching explanation...</p>
          </div>
        ) : (
          <p className="whitespace-pre-wrap leading-relaxed">{explanation}</p>
        )}
      </div>
    </aside>
  );
}