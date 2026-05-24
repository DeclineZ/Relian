import React, { useState, useEffect } from 'react';
import { useDecks } from './lib/DeckContext';
import { useParams } from 'react-router-dom';


import { CreditCard, Edit, Trash2, Check, X, Clock, Plus } from 'lucide-react';

export default function FlashcardView() {
  const { decks, setDecks } = useDecks();
  const { id } = useParams();
  const deck = decks.find(d => String(d.id) === id);

  const [cards, setCards] = useState(deck?.cards || []);

  useEffect(() => {
    if (deck) setCards(deck.cards);
  }, [deck]);

  const persistDecks = updatedCards => {
    setDecks(prev => {
      const updated = prev.map(d =>
        d.id !== deck.id ? d : { ...d, cards: updatedCards }
      );
      localStorage.setItem('decks', JSON.stringify(updated));
      return updated;
    });
  };

  // Add card only to local state; taxonomy set to Manual
  const handleAddCard = () => {
    const newCard = {
      id: Date.now(),
      question: '',
      answer: '',
      image: '',
      taxonomy: 'Manual',
      nextReview: new Date().toISOString(),
    };
    setCards(prev => [newCard, ...prev]);
  };

  const handleUpdateCard = (cardId, updatedFields) => {
    const updatedCards = cards.map(c =>
      c.id === cardId ? { ...c, ...updatedFields } : c
    );
    setCards(updatedCards);
    persistDecks(updatedCards);
  };

  // Delete saved cards without alert
  const handleDeleteCard = cardId => {
    if (!window.confirm('Are you sure you want to delete this card?')) return;
    const updatedCards = cards.filter(c => c.id !== cardId);
    setCards(updatedCards);
    setDecks(prev => {
      const updated = prev.map(d =>
        d.id !== deck.id
          ? d
          : {
            ...d,
            cards: updatedCards,
            total: d.total - 1,
            due: Math.max(0, d.due - 1),
          }
      );
      localStorage.setItem('decks', JSON.stringify(updated));
      return updated;
    });
  };

  // Remove unsaved card silently
  const handleRemoveCardSilent = cardId => {
    setCards(prev => prev.filter(c => c.id !== cardId));
  };

  if (!deck) return <div className="p-8">Deck not found!</div>;

  const now = Date.now();
  const sortedCards = [...cards].sort((a, b) => {
    const dueA = new Date(a.nextReview).getTime() <= now;
    const dueB = new Date(b.nextReview).getTime() <= now;
    return dueA === dueB ? 0 : dueA ? -1 : 1;
  });

  return (
    <div className="space-y-5 p-2">
      <button
        onClick={handleAddCard}
        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold py-6 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center space-x-3 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
      >
        <Plus className="w-6 h-6" />
        <span className="text-lg">Add New Quiz Question</span>
      </button>

      <div className="space-y-3">
        {sortedCards.length > 0 ? (
          sortedCards.map((card, idx) => (
            <FlashcardItem
              key={card.id}
              card={card}
              index={idx + 1}
              onUpdate={fields => handleUpdateCard(card.id, fields)}
              onDelete={() => handleDeleteCard(card.id)}
              onRemove={() => handleRemoveCardSilent(card.id)}
            />
          ))
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No flashcards yet</h3>
            <p className="text-gray-500">Add some cards to get started with your studying!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FlashcardItem({ card, index, onUpdate, onDelete, onRemove }) {
  const [isEditing, setIsEditing] = useState(card.question === '');
  const [editedQuestion, setEditedQuestion] = useState(card.question);
  const [editedAnswer, setEditedAnswer] = useState(card.answer);
  const [editedImageURL, setEditedImageURL] = useState(card.image || '');
  const [editedImageFile, setEditedImageFile] = useState(null);

  const now = Date.now();
  const nextMs = new Date(card.nextReview).getTime();
  const isDue = nextMs <= now;
  const diff = Math.max(0, nextMs - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const countdownText =
    diff === 0 ? 'Due now' : days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h` : `${minutes}m`;

  useEffect(() => {
    return () => {
      if (editedImageURL && editedImageFile) URL.revokeObjectURL(editedImageURL);
    };
  }, [editedImageURL, editedImageFile]);

  const handleFileChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    setEditedImageFile(file);
    setEditedImageURL(URL.createObjectURL(file));
  };

  const handleSave = () => {
    if (!editedQuestion.trim() == "" && !editedAnswer.trim() == "") {
      onUpdate({
        question: editedQuestion.trim(),
        answer: editedAnswer.trim(),
        image: editedImageFile ? null : editedImageURL,
      });
      setIsEditing(false);
      setEditedImageFile(null);
    }
  };

  const handleCancel = () => {
    if (!card.question) {
      onRemove();
    } else {
      setEditedQuestion(card.question);
      setEditedAnswer(card.answer);
      setEditedImageURL(card.image || '');
      setEditedImageFile(null);
      setIsEditing(false);
    }
  };

  const colorClass = taxonomy => {
    const baseMap = {
      Remembering: 'blue',
      Understanding: 'green',
      Applying: 'yellow',
      Manual: 'purple',
    };
    const base = baseMap[taxonomy] || 'gray';
    return isDue ? `text-${base}-600` : `text-${base}-300`;
  };

  return (
    <div
      className={`rounded-2xl shadow-lg overflow-hidden transition-all duration-200 ${isDue
        ? 'bg-white text-black'
        : 'bg-gray-100 text-gray-500 border border-gray-300 opacity-80'
        }`}
    >
      <div className="px-3 py-2 flex flex-col h-full">
        <div className="flex justify-between items-center ">
          <div className="flex items-center space-x-2">
            <span className="inline-flex w-8 h-8 items-center justify-center bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
              {index}
            </span>
            <span className={`${colorClass(card.taxonomy)} font-semibold`}>{card.taxonomy}</span>
          </div>
          <div className="flex space-x-1">
            {!isEditing ? (
              <>
                <button onClick={() => setIsEditing(true)} className="p-2 rounded-lg hover:bg-blue-50 hover:text-blue-500">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={onDelete} className="p-2 rounded-lg hover:bg-red-50 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button onClick={handleSave} className="p-2 rounded-lg hover:bg-green-50 text-green-600 hover:text-green-800">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={handleCancel} className="p-2 rounded-lg hover:bg-gray-100">
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 flex space-x-4 ">
          {(editedImageURL || isEditing) && (
            <div className="w-24 h-24 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
              {!isEditing && editedImageURL ? (
                <img src={editedImageURL} alt="Flashcard" className="w-full h-full object-cover" />
              ) : (
                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer text-gray-500 bg-gray-100">
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  {editedImageURL ? (
                    <img src={editedImageURL} alt="Preview" className="w-full h-full object-cover" />

                  ) : (
                    <span className="text-sm">Upload</span>
                  )}
                </label>
              )}
            </div>
          )}
          <div className="flex-1 space-y-2">
            <div className={`${isDue ? 'bg-gray-50' : 'bg-gray-200'} rounded-xl p-3`}>
              <div className="flex items-start space-x-3">
                <span className="text-blue-900 font-semibold">Q:</span>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={editedQuestion}
                    onChange={e => setEditedQuestion(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 text-blue-800 font-medium"
                  />
                ) : (
                  <p className={`${isDue ? 'text-blue-800' : 'text-gray-700'} font-medium`}>{card.question}</p>
                )}
              </div>
            </div>

            <div className={`${isDue ? 'bg-blue-50' : 'bg-gray-200'} rounded-xl p-3`}>
              <div className="flex items-start space-x-3">
                <span className="text-green-900 font-semibold">A:</span>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={editedAnswer}
                    onChange={e => setEditedAnswer(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 text-gray-800"
                  />
                ) : (
                  <p className={`${isDue ? 'text-gray-800' : 'text-gray-700'} font-medium`}>{card.answer}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {!isEditing && !isDue && (
          <div className="mt-4 flex items-center justify-end space-x-2">
            <Clock className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-500">Next review in {countdownText}</span>
          </div>
        )}
      </div>
    </div>
  );
}
