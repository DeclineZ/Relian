import { Suspense, lazy } from 'react';

import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { useDecks }            from './lib/DeckContext.jsx';

const Sidebar            = lazy(() => import('./Sidebar.jsx'));
const FlashcardDeckTable = lazy(() => import('./FlashcardDeckTable.jsx'));
const CreateFlashcards    = lazy(() => import('./CreateFlashcards.jsx'));
const DeckDetail =  lazy(() => import('./DeckDetail.jsx'));
const FlashcardPlayer     = lazy(() => import('./FlashcardPlayer.jsx'));
const CommunityPage       = lazy(() => import('./CommunityPage.jsx'));
const LearnerTypePage     = lazy(() => import('./LearnerTypePage.jsx'));
const Profile             = lazy(() => import('./Profile.jsx'));
const QuizPlayer          = lazy(() => import('./QuizPlayer.jsx'));


function App() {
  const { decks } = useDecks();
  return (
    <BrowserRouter>
    <div className="flex h-screen w-full overflow-hidden">
      
      <Sidebar />   
      <Suspense fallback={<div>Loading…</div>}>          
      <main className="flex h-screen w-full">
        <Routes>
          <Route path="/" element={<FlashcardDeckTable decks={decks}/>} />
          <Route path="/create" element={<CreateFlashcards />} />
          <Route path="/learntogether" element={<CommunityPage />} />
          <Route path="/deck/:id" element={<DeckDetail />} />
          <Route path="/deck/:id/play" element={<FlashcardPlayer />} />
          <Route path="/LTP" element={<LearnerTypePage />} />
          <Route path="/Profile" element={<Profile />} />
          <Route path="/deck/:id/quiz/:idx" element={<QuizPlayer />} />
        </Routes>
      </main>
      </Suspense>   
    </div>
    </BrowserRouter>
  );
}

export default App
