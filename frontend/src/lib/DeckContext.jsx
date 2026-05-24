import { createContext, useContext, useState, useEffect } from 'react';
import decksJson from '../data/decks.json';

const DeckCtx = createContext();

export const useDecks = () => useContext(DeckCtx);

export function DeckProvider({ children }) {

  const [decks, setDecks] = useState(() => {
    const localDecks = localStorage.getItem('decks');
    return localDecks ? JSON.parse(localDecks) : decksJson;
  });

  const [userXP, setUserXP] = useState(() => {
    const stored = localStorage.getItem('userXP');
    return stored ? Number(stored) : 0;
  });

  useEffect(() => {
    localStorage.setItem('userXP', String(userXP));
  }, [userXP]);

  const level = Math.floor(userXP / 100) + 1;
  const levelXP = (level - 1) * 100;
  const nextLevel = level * 100;
  const progress = Math.floor(((userXP - levelXP) / (nextLevel - levelXP)) * 100);


  useEffect(() => {
    localStorage.setItem('decks', JSON.stringify(decks));
  }, [decks]);

  useEffect(() => {
    setDecks(ds =>
      ds.map(deck => ({
        ...deck,
        cards: deck.cards.map(card => ({
          repetition: card.repetition ?? 0,
          interval: card.interval ?? 0,
          efactor: card.efactor ?? 2.5,
          nextReview: card.nextReview ?? Date.now(),
          ...card,
        }))
      }))
    );
  }, []);

  const [learningPrefs, setLearningPrefs] = useState(() => {
    const stored = localStorage.getItem('learningPrefs');
    return stored
      ? JSON.parse(stored)
      : { visual: 0.25, verbal: 0.25, logical: 0.25, realworld: 0.25 };
  });
  useEffect(() => {
    localStorage.setItem('learningPrefs', JSON.stringify(learningPrefs));
  }, [learningPrefs]);

  return (
    <DeckCtx.Provider value={{
      decks, setDecks,
      userXP, setUserXP,
      level, progress,
      learningPrefs,
      setLearningPrefs,
    }}>
      {children}
    </DeckCtx.Provider>
  );
}
