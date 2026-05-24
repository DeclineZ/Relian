// FinishedModal.jsx
// Modal/overlay when isFinished is true

export default function FinishedModal({ isFinished, onReturn }) {
  if (!isFinished) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="rounded-xl bg-white p-8 shadow-xl text-center space-y-4">
        <h2 className="text-2xl font-bold text-black">🎉 Great job!</h2>
        <p className="text-gray-600">You've reviewed every card due today!</p>
        <p className="text-gray-600">Check back tomorrow for the next, perfectly-timed round.</p>
        <button
          onClick={onReturn}
          className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
        >
          Back to decks
        </button>
      </div>
    </div>
  );
}