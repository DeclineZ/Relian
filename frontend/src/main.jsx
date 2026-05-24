import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { DeckProvider } from './lib/DeckContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DeckProvider>
      <App />
    </DeckProvider>
  </StrictMode>
)
