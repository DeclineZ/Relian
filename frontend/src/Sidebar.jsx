// Sidebar.jsx
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Home, Flame, UsersRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDecks } from './lib/DeckContext.jsx';
import logo from './assets/logo.png';
import profile from './assets/profile.png';
import { useLocation } from 'react-router-dom';
import './mobileLandscape.css'

export default function Sidebar() {
  const { decks, userXP, level, progress } = useDecks(); 
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const validDecks = Array.isArray(decks) ? decks : [];  

  useEffect(() => {
    if (location.pathname.includes('/play')) {
      setCollapsed(true);
    }
  }, [location.pathname]);

  const sidebarWidth = collapsed ? 'w-20' : 'w-72';

  return (
    <aside
     className={`${sidebarWidth} static inset-y-0 left-0 sidebar transition-all duration-300 flex flex-col bg-white border-r border-gray-200 h-screen`}
   >
      {/* Header */}
      <div className={`${collapsed ? 'flex flex-col items-center gap-2 py-4 border-b' : 'flex items-center justify-between px-4 py-4 border-b'}`}>
        <div className={`flex items-center ${collapsed ? 'flex-col gap-2' : 'gap-2'}`}>
          {collapsed && (
            <button onClick={() => {setCollapsed(false)
            }} className="text-black ">
              <ChevronRight size={20} />
            </button>
          )}
          {/* Logo */}
          <div className="w-10 h-10 rounded flex items-center justify-center mt-2">
            <img src={logo} alt="" className="size-full" />
          </div>
          {!collapsed && (
            <p className="font-semibold text-lg text-black whitespace-nowrap mr-2">
              ReLian
            </p>
          )}
        </div>
        {!collapsed && (
          <button onClick={() => {setCollapsed(true);}} className="text-black">
            <ChevronLeft size={20} />
          </button>
        )}
      </div>

      {/* Primary actions */}
      <nav className="space-y-2 p-4 text-black">
        <ActionButton
          icon={<Plus size={20} />}
          label="New"
          collapsed={collapsed}
          onClick={() => navigate('/create')}
          primary
        />
        <ActionButton
          icon={<UsersRound size={20} />}
          label="LearnTogether"
          collapsed={collapsed}
          onClick={() => navigate('/learntogether')}
        />
        <ActionButton
          icon={<Home size={20} />}
          label="Home"
          collapsed={collapsed}
          onClick={() => navigate('/')}
        />
        
      </nav>

      {/* List of decks */}
      <div className="flex-1 overflow-y-auto px-4 space-y-4 text-sm overflow-x-hidden">
        {!collapsed && (
          <Section title="Flashcard Decks" collapsed={collapsed}>
            {validDecks.length === 0 ? (
              <li>No decks available</li>
            ) : (
              validDecks.map((d) => (
                <DeckRow
                  key={d.id}
                  deck={d}
                  collapsed={collapsed}
                  onClick={() => navigate(`/deck/${d.id}`)}
                />
              ))
            )}
         </Section>
       )}
      </div>

      {/* Footer (User info) */}
      <div className={`p-4 border-t flex items-center gap-3 transition-all duration-200 overflow-hidden ${collapsed && 'justify-center'} cursor-pointer`}
      onClick={() => navigate(`/profile`)}>
        <img src={profile} className="w-10 h-10 bg-gray-200 rounded-full shrink-0 overflow-hidden object-cover" />
        {!collapsed && (
          <div className="text-xs leading-tight">
            <p className="font-medium text-black">NSC2025</p>
            <p className="flex items-center gap-1 text-black">
              <Flame size={12} className="text-orange-500 streak-icon" />
              7 Days
            </p>
            <p className="text-black">Level {level}</p>
            <div className="h-1 w-24 bg-gray-200 rounded mt-1">
              <div className="h-full w-3/4 bg-blue-600 rounded " style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}


function ActionButton({ icon, label, collapsed, primary, ...rest }) {
  const base = 'w-full flex items-center gap-2 px-3 py-2 rounded-xl transition';
  const color = primary
    ? 'bg-blue-600 text-white hover:bg-blue-700'
    : 'border hover:bg-gray-50 text-gray-700';

  return (
    <button className={`${base} ${color}`} {...rest}>
      <div className="flex-none w-8 h-8 flex items-center justify-center actionn">
        {icon}
      </div>
      {!collapsed && <span className="whitespace-nowrap">{label}</span>}
    </button>
  );
}

function Section({ title, collapsed, children }) {
  return (
    <div>
      {!collapsed && (
        <h2 className="uppercase text-gray-400 mb-2">{title}</h2>
      )}
      <ul className="space-y-1">{children}</ul>
    </div>
  );
}

function DeckRow({ deck, collapsed, onClick }) {
  return (
    <li onClick={onClick} className="cursor-pointer px-2 py-1 rounded hover:bg-gray-100 flex justify-between">
      <span className="truncate text-gray-600 text-base">{deck.name}</span>
      {!collapsed && (
        
        <span className="text-gray-500 text-base">({deck.total})</span>
      )}
    </li>
  );
}
