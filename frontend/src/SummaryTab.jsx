import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useDecks } from './lib/DeckContext';
import mermaid from 'mermaid';
import openDiagramInNewTab from './lib/openDiagram';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'strict',
  flowchart: {
    htmlLabels: true
  },
  themeVariables: {
    fontSize: '20px',
  },
});

export default function SummaryTab() {
  const { id } = useParams();
  const { decks } = useDecks();
  const deck = decks.find((d) => String(d.id) === id);
  const containerRef = useRef(null);

  const renderMermaidDiagrams = () => {
    const container = containerRef.current;
    if (!container) return;

    const nodes = Array.from(container.querySelectorAll('.mermaid'));
    nodes.forEach((el) => {
      const dsl = el.textContent.trim();
      try {
        mermaid.parse(dsl);
      } catch (err) {
        console.warn('Mermaid parse failed:', err);
        el.remove();
        return;
      }
    });

    try {
      mermaid.run();
      container.querySelectorAll('.mermaid').forEach((block) => {
        if (block.__relianBound) return;
        block.style.cursor = 'zoom-in';
        block.addEventListener('click', () => {
          const svg = block.querySelector('svg');
          if (svg) openDiagramInNewTab(svg);
        });
        block.__relianBound = true;
      });
    } catch (err) {
      console.warn('Mermaid render failed:', err);
      container.querySelectorAll('.mermaid').forEach((el) => el.remove());
    }
  };

  useEffect(() => {
  if (!containerRef.current) return;

  let timeoutId = null;

  const observer = new MutationObserver((mutations) => {
    let shouldRender = false;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (
          node.nodeType === 1 && // ELEMENT_NODE
          node.matches &&
          node.matches('.mermaid')
        ) {
          shouldRender = true;
        }
      }
    }

    if (shouldRender) {
      // Debounce multiple rapid calls
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        renderMermaidDiagrams();
      }, 50);
    }
  });

  observer.observe(containerRef.current, {
    childList: true,
    subtree: true,
  });

  return () => {
    observer.disconnect();
    clearTimeout(timeoutId);
  };
}, []);

  return !deck ? (
    <p className="p-4 text-gray-500">Deck not found</p>
  ) : (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div
        ref={containerRef}
        className="prose max-w-none text-black"
        dangerouslySetInnerHTML={{ __html: deck.summaryHtml.replace(/ \u0E32/g, '\u0E33').normalize('NFC') }}
      />
    </div>
  );
}
