// Modal for suggested extra flashcards
import { X } from "lucide-react";

export default function AddMoreCardsModal({
  open,
  moreCards = [],
  checked = [],
  loading,
  onCheck,
  onClose,
  onConfirm
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-black">New flashcards</h3>
            <p className="text-gray-600">Cards will be added to the back of the deck</p>
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-gray-100"><X size={18} /></button>
        </div>
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p>Generating…</p>
          </div>
        ) : (
          <div className="max-h-80 space-y-3 overflow-y-auto p-4">
            {moreCards.map((c) => (
              <label key={c.id} className="flex cursor-pointer gap-3 rounded border p-3 hover:bg-gray-50">
                <input type="checkbox" checked={checked.includes(c.id)} onChange={() => onCheck(c.id)} className="mt-1" />
                <div>
                  <p className="font-medium text-black">{c.question}</p>
                  <p className="text-sm text-gray-600">{c.answer}</p>
                </div>
              </label>
            ))}
          </div>
        )}
        <div className="flex justify-end gap-2 border-t px-4 py-3">
          <button onClick={onClose} className="rounded border px-4 py-2 text-gray-700 hover:bg-gray-100">Cancel</button>
          <button onClick={onConfirm} disabled={checked.length === 0} className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50">Add to deck</button>
        </div>
      </div>
    </div>
  );
}