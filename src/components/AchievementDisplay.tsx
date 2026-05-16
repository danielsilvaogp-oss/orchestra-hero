'use client'

import { useState } from 'react'
import { ACHIEVEMENTS, LEVELS, calculateLevel, getUnlockedAchievements, getLockedAchievements, PlayerStats } from '@/lib/achievements'

interface AchievementDisplayProps {
  stats: PlayerStats
  onClose?: () => void
}

const rarityColors = {
  common: 'bg-slate-600 border-slate-400',
  rare: 'bg-blue-600 border-blue-400',
  epic: 'bg-purple-600 border-purple-400',
  legendary: 'bg-amber-500 border-amber-300'
}

const rarityGlow = {
  common: '',
  rare: 'shadow-blue-500/50',
  epic: 'shadow-purple-500/50',
  legendary: 'shadow-amber-400/70'
}

export default function AchievementDisplay({ stats, onClose }: AchievementDisplayProps) {
  const [activeTab, setActiveTab] = useState<'achievements' | 'level'>('achievements')
  const [filterRarity, setFilterRarity] = useState<'all' | 'common' | 'rare' | 'epic' | 'legendary'>('all')

  const unlocked = getUnlockedAchievements(stats)
  const locked = getLockedAchievements(stats)
  const levelInfo = calculateLevel(unlocked.reduce((sum, a) => sum + a.xp, 0))

  const filteredAchievements = (showUnlocked: boolean) => {
    const list = showUnlocked ? unlocked : locked
    if (filterRarity === 'all') return list
    return list.filter(a => a.rarity === filterRarity)
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border-2 border-slate-700">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-3xl font-bold text-white">Logros y Progreso</h2>
          {onClose && (
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white text-2xl"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex-1 py-4 text-lg font-semibold transition-colors ${
              activeTab === 'achievements' 
                ? 'bg-purple-600 text-white' 
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Logros ({unlocked.length}/{ACHIEVEMENTS.length})
          </button>
          <button
            onClick={() => setActiveTab('level')}
            className={`flex-1 py-4 text-lg font-semibold transition-colors ${
              activeTab === 'level' 
                ? 'bg-purple-600 text-white' 
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Nivel {levelInfo.level}
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {activeTab === 'achievements' ? (
            <>
              <div className="flex gap-2 mb-6 flex-wrap">
                {(['all', 'common', 'rare', 'epic', 'legendary'] as const).map(rarity => (
                  <button
                    key={rarity}
                    onClick={() => setFilterRarity(rarity)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      filterRarity === rarity
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {rarity === 'all' ? 'Todos' : rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAchievements(true).map(achievement => (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-xl border-2 ${rarityColors[achievement.rarity]} shadow-lg ${rarityGlow[achievement.rarity]} shadow-md`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-4xl">{achievement.icon}</span>
                      <div>
                        <h3 className="text-white font-bold">{achievement.name}</h3>
                        <span className="text-xs uppercase tracking-wider text-slate-300">{achievement.rarity}</span>
                      </div>
                    </div>
                    <p className="text-slate-300 text-sm">{achievement.description}</p>
                    <div className="mt-3 text-amber-400 font-bold text-sm">
                      +{achievement.xp} XP
                    </div>
                  </div>
                ))}

                {filteredAchievements(false).slice(0, 6).map(achievement => (
                  <div
                    key={achievement.id}
                    className="p-4 rounded-xl border-2 border-slate-700 bg-slate-800/50 opacity-60"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-4xl grayscale">🔒</span>
                      <div>
                        <h3 className="text-slate-400 font-bold">{achievement.name}</h3>
                        <span className="text-xs uppercase tracking-wider text-slate-500">{achievement.rarity}</span>
                      </div>
                    </div>
                    <p className="text-slate-500 text-sm">{achievement.description}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="inline-block p-8 bg-gradient-to-b from-purple-600 to-purple-900 rounded-2xl mb-6">
                <div className="text-8xl mb-4">🎺</div>
                <div className="text-5xl font-bold text-white">{levelInfo.level}</div>
                <div className="text-xl text-purple-200">{levelInfo.title}</div>
              </div>

              <div className="bg-slate-800 rounded-xl p-6 mb-6 max-w-md mx-auto">
                <div className="flex justify-between text-slate-400 mb-2">
                  <span>Progreso</span>
                  <span>{Math.round(levelInfo.progress)}%</span>
                </div>
                <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-amber-500 transition-all duration-500"
                    style={{ width: `${levelInfo.progress}%` }}
                  />
                </div>
                <div className="text-slate-400 mt-2 text-sm">
                  {levelInfo.nextLevelXP - (unlocked.reduce((sum, a) => sum + a.xp, 0))} XP hasta el siguiente nivel
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-2xl mx-auto">
                {LEVELS.map(level => (
                  <div 
                    key={level.level}
                    className={`p-3 rounded-lg ${
                      level.level <= levelInfo.level
                        ? 'bg-purple-600/30 border border-purple-500'
                        : 'bg-slate-800 border border-slate-700'
                    }`}
                  >
                    <div className="text-white font-bold">{level.level}</div>
                    <div className="text-xs text-slate-400">{level.title}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}