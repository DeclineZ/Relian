import { useState,useRef } from "react";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

import { Award, BadgePlus, BadgeCheck, Flame, Clock } from 'lucide-react';
import profile from './assets/profile.png';
import { useDecks } from "./lib/DeckContext";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const learningStats = [
  { label: 'Total Flash Card', value: '1245', bg: 'bg-gray-50', text: 'gray-600' },
  { label: 'Learned Flashcard', value: '40', bg: 'bg-blue-50', text: 'blue-600' },
  { label: 'Quiz Passed', value: '79', bg: 'bg-green-50', text: 'green-600' },
  { label: 'Study Time', value: '16h', bg: 'bg-indigo-50', text: 'indigo-600' },
  { label: 'Streak Days', value: '7', bg: 'bg-orange-50', text: 'orange-600' }
];


const ProfilePage = () => {
  const { learningPrefs, userXP, level, progress } = useDecks();
  // User and ranking data
  const [user] = useState({
    name: "NSC2025",
    username: "@NSC2025",
    streak: 7,
  });
  

  const LearningStyleBar = () => {
  const MIN_LABEL_WIDTH = 19; // Minimum width % to show label
  const barRef = useRef(null);

  // Normalize to make total 100%
  // Derive the bar segments from your 4-vector in context
  const total = Object.values(learningPrefs).reduce((a, v) => a + v, 0);
  const meta = {
    visual:    { color: "bg-red-500",    label: "Visual"    },
    verbal:    { color: "bg-blue-500",   label: "Verbal"    },
    logical:   { color: "bg-yellow-500", label: "Logical"   },
    realworld: { color: "bg-green-500",  label: "RealWorld" },
  };
  const learningStyles = Object.entries(learningPrefs).map(
    ([key, value]) => ({
      color:           meta[key].color,
      label:           meta[key].label,
      normalizedValue: (value / total) * 100,
    })
  );

  return (
    <div>
      <div
        ref={barRef}
        className="flex w-full h-8 rounded-full overflow-hidden bg-gray-200 relative"
      >
        {learningStyles.map((style, index) => (
          <div
            key={index}
            className={`${style.color} h-full relative text-white text-x flex items-center justify-center`}
            style={{ width: `${style.normalizedValue}%` }}
          >
            {style.normalizedValue >= MIN_LABEL_WIDTH && <span>{style.label}</span>}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex text-gray-800 flex-wrap mt-2 space-x-4">
        {learningStyles.map((style, index) =>
          style.normalizedValue < MIN_LABEL_WIDTH && (
            <div key={index} className="flex items-center space-x-2">
              <span className={`w-4 h-4 rounded ${style.color}`}></span>
              <span className="text-sm">{style.label}</span>
            </div>
          )
        )}
      </div>

    </div>
  );
};


  const LearningStats = () => {
    return (
      <div className="grid grid-cols-2 gap-4">
        {learningStats.map((stat, i) => (
          <div
            key={i}
            className={`text-center p-4 rounded-xl ${stat.bg}`}
          >
            <div className={`text-2xl font-bold text-${stat.text}`}>{stat.value}</div>
            <div className={`text-sm text-${stat.text}`}>{stat.label}</div>
          </div>
        ))}
      </div>
    );
  };

  // Badge component
  const Badge = ({ badgeName, progress }) => (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full">
        <span className="text-xl">🏅</span>
      </div>
      <p className="text-sm text-center text-gray-800">{badgeName}</p>
      <div className="w-full bg-gray-200 h-1 rounded-full mt-1">
        <div className="bg-indigo-600 h-1 rounded-full" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );

  const BadgeSection = () => (
    <div className="grid grid-cols-3 gap-4 w-full">
      <Badge badgeName="Top Learner" progress={80} />
      <Badge badgeName="Streak Master" progress={60} />
      <Badge badgeName="Quiz Winner" progress={90} />
      <Badge badgeName="Flashcard Pro" progress={70} />
      <Badge badgeName="Discussion Leader" progress={40} />
      <Badge badgeName="Daily Visitor" progress={100} />
      <Badge badgeName="Speed Solver" progress={55} />
      <Badge badgeName="Knowledge Sharer" progress={85} />
      <Badge badgeName="Early Bird" progress={75} />
    </div>
  );

  return (
    <div className="w-full max-w-full sm:max-w-full lg:max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-6 space-y-6 overflow-x-auto ">
      {/* Profile Header */}
      <div className="flex items-center bg-white p-6 rounded-lg shadow">
        <img src={profile} alt="User" className="w-20 h-20 rounded-full object-cover" />
        <div className="ml-6 flex-1">
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
            <Award size={24} className="text-indigo-600" />
            <BadgePlus size={24} className="text-gray-400" />
            <BadgeCheck size={24} className="text-yellow-500" />
          </div>
          <div className="flex items-center space-x-4 mt-2">
            <span className="text-gray-600">Level {level}</span>
            <div className="flex items-center text-gray-600">
              <Flame size={20} className="text-red-500 mr-1" />
              Streak: {user.streak} days
            </div>
          </div>
        </div>
        <div className="w-1/4">
          <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-2" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-right text-gray-600 mt-1">{progress}% Complete</p>
        </div>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 ">
          <div className="bg-white text-gray-900 rounded-lg p-6 shadow">
            <h3 h3 className="text-2xl font-semibold mb-4">Learning Dashboard</h3>
            <LearningStats/>
          </div>
        
        <div className="col-span-1 flex flex-col "> 
          {/* Learning Style */}
          <div className="col-span-2 bg-white rounded-lg shadow p-6 flex-1 ">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">My Learning Style</h2>
            <LearningStyleBar/>
          </div>

          {/* Badges */}
          <div className="col-span-2 bg-white rounded-lg shadow p-6 flex-1 mt-4 ">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Badges</h2>
            <div className="flex-1  overflow-auto">
              <BadgeSection />
            </div>
          </div>
          
        </div>
        
      </div>
    </div>
  );
};

export default ProfilePage;