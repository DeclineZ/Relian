import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Flame, ThumbsUp, Trophy } from 'lucide-react'
import { useDecks } from './lib/DeckContext'
import profile from './assets/profile.png'

const rankingData = [
  { name: 'Bob', timePlayed: 450, avatar: profile },
  { name: 'You', timePlayed: 100, avatar: profile },
  { name: 'Alice', timePlayed: 320, avatar: profile },
  { name: 'Eve', timePlayed: 290, avatar: profile },
  { name: 'Charlie', timePlayed: 210, avatar: profile },
  { name: 'Dana', timePlayed: 180, avatar: profile },
]

const Ranking = () => {
  const sorted = [...rankingData].sort((a, b) => b.timePlayed - a.timePlayed)
  const youIndex = sorted.findIndex(item => item.name === 'You')
  const you = sorted[youIndex]
  let display = sorted.slice(0, 4)

  if (youIndex >= 4) {
    display[3] = you
  }


  return (
    <div className="bg-white shadow-lg rounded-xl p-4 flex flex-col h-full">
      <div className="flex items-center mb-2">
        <Trophy size={24} className="text-indigo-600 mr-2" />
        <h2 className="text-xl font-semibold text-gray-800">Time Ranking</h2>
      </div>

      {/* Your time summary */}
      <div className="mb-1 text-sm text-indigo-600 font-semibold">
        You studied : {you?.timePlayed ?? 0} mins
      </div>
      <ul className="flex-1 overflow-auto space-y-1">
        {display.map(item => {
          const idx = sorted.findIndex(i => i.name === item.name)
          const isYou = item.name === 'You'
          const rankCls = idx === 0 ? 'text-yellow-500 font-bold' : idx === 1 ? 'text-gray-500 font-semibold' : idx === 2 ? 'text-orange-400 font-semibold' : 'text-gray-700'
          return (
            <li key={item.name} className={`flex items-center justify-between p-2 rounded-lg  ${isYou ? 'bg-indigo-50' : 'hover:bg-gray-100'}`}>
              <div className="flex items-center space-x-3">
                <span className={`text-base ${rankCls}`}>#{idx + 1}</span>
                <img src={item.avatar} alt={item.name} className="w-10 h-10 rounded-full object-cover" />
                <span className="text-sm font-medium text-gray-800">{item.name}</span>
              </div>
              <span className="text-sm font-semibold text-gray-700">{item.timePlayed} mins</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const categories = ['All', 'Science', 'Math', 'History', 'Art']
const topics = {
  "สมุดคำศัพท์ ครูพี่อชิ": { card: 117, image: '/community/4.png', author: "ครูพี่อชิ" },
  "THAI เนื้อเน้นๆ": { card: 170, image: "/community/2.png", author: "PaSit" },
  "สังคม ; เศรษฐศาสตร์ ม.5": { card: 36, image: "/community/8.png", author: "Snowwyprae" },
  "ความหลากหลายทางชีวภาพ": { card: 28, image: "/community/5.png", author: "cholyzm" },
  "ประวัติฯยุคกลาง-ปัจจุบัน​": { card: 65, image: "/community/6.png", author: "SoulfulSmile" },
  "Idioms ที่ออกสอบบ่อย": { card: 46, image: "/community/7.png", author: "สอบติด#dek59" }
};

export default function LearnTogether() {

  return (
    <div className="w-full flex justify-center py-6 px-4 h-full overflow-y-auto">
      <div className="w-full max-w-6xl">
        {/* Poster & Ranking */}
        <div className="flex gap-4 mb-6 h-[330px]">
          <div className="w-3/5 h-full rounded-3xl bg-gradient-to-r from-blue-200 to-indigo-300 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
            เรียนรู้ไปด้วยกัน!
          </div>
          <div className="w-2/5 h-full">
            <Ranking />
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">LearnTogether</h1>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input type="text" placeholder="ค้นหา..." className="border border-gray-300 rounded-2xl px-4 py-2 text-sm text-black w-full sm:w-64" />
            <button className="text-blue-600 text-sm">ค้นหา</button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 text-sm mb-6">
          {categories.map(cat => (
            <span key={cat} className="px-4 py-1 border border-gray-300 rounded-full cursor-pointer hover:bg-gray-100 text-black">
              {cat}
            </span>
          ))}
        </div>

        {/* Topic Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(topics).map(([name, data]) => (
            <div key={name} className="border border-gray-200 rounded-2xl p-5 bg-white hover:shadow-md transition">
              <img src={data.image} alt={name} className="h-[100px] w-full object-cover rounded-xl mb-3" />
              <div className="font-semibold mb-1 text-lg text-black">{name}</div>
              <div className="text-xs text-gray-500 mb-2">Cards: {data.card}</div>
              <div className="flex justify-between items-center">
                <span className="text-blue-400 text-xs">{data.author}</span>
                <div className="flex items-center text-gray-400 text-xs space-x-2">
                  <Heart className="w-4 h-4 animate-pulse" fill="red" color="red" />
                  <Flame className="w-4 h-4 animate-wiggle" fill="orange" color="orange" />
                  <ThumbsUp className="w-4 h-4 animate-wiggle text-blue-500 fill-blue-500" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
