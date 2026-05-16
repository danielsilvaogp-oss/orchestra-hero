'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase, Song } from '@/lib/supabase'

interface StudentProgressProps {
  onClose: () => void
}

interface StudentStats {
  name: string
  instrument: string
  total_songs: number
  completed_songs: number
  avg_accuracy: number
  total_practice_time: number
}

interface StudentAttempt {
  id: string
  title: string
  instrument: string
  score: number
  accuracy: number
  grade: string
  max_combo: number
  fail_count: number
  practice_mode: string
  created_at: string
}

export default function StudentProgress({ onClose }: StudentProgressProps) {
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null)
  const [recentAttempts, setRecentAttempts] = useState<StudentAttempt[]>([])
  const [leaderboard, setLeaderboard] = useState<StudentAttempt[]>([])
  const [loading, setLoading] = useState(true)

  // For demo, use a default student ID - in production, this would come from auth
  const DEMO_STUDENT_ID = 'demo-student'

  useEffect(() => {
    loadProgress()
  }, [])

  async function loadProgress() {
    setLoading(true)
    
    // Load recent attempts
    const { data: attemptsData } = await supabase
      .from('student_progress')
      .select(`
        id,
        score,
        accuracy,
        grade,
        max_combo,
        fail_count,
        practice_mode,
        created_at,
        song:songs(title, instrument)
      `)
      .order('created_at', { ascending: false })
      .limit(20)

    if (attemptsData) {
      setRecentAttempts(attemptsData.map((a: any) => ({
        id: a.id,
        title: a.song?.title || 'Unknown',
        instrument: a.song?.instrument || 'unknown',
        score: a.score,
        accuracy: a.accuracy,
        grade: a.grade,
        max_combo: a.max_combo,
        fail_count: a.fail_count,
        practice_mode: a.practice_mode,
        created_at: a.created_at
      })))
    }

    // Load leaderboard (top scores)
    const { data: leaderboardData } = await supabase
      .from('student_progress')
      .select(`
        id,
        score,
        accuracy,
        grade,
        max_combo,
        practice_mode,
        created_at,
        song:songs(title, instrument)
      `)
      .order('score', { ascending: false })
      .limit(10)

    if (leaderboardData) {
      setLeaderboard(leaderboardData.map((l: any) => ({
        id: l.id,
        title: l.song?.title || 'Unknown',
        instrument: l.song?.instrument || 'unknown',
        score: l.score,
        accuracy: l.accuracy,
        grade: l.grade,
        max_combo: l.max_combo,
        fail_count: 0,
        practice_mode: l.practice_mode,
        created_at: l.created_at
      })))
    }

    setLoading(false)
  }

  function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const gradeColors: Record<string, string> = {
    'S': 'text-yellow-400',
    'A': 'text-green-400',
    'B': 'text-blue-400',
    'C': 'text-white',
    'D': 'text-orange-400',
    'F': 'text-red-400'
  }

  return (
    <div className="fixed inset-0 bg-orchestra-dark z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-orchestra-dark-secondary border-b border-white/10 p-4 flex items-center justify-between z-10">
        <h1 className="font-display text-2xl text-orchestra-gold">Progreso de Estudiantes</h1>
        <button onClick={onClose} className="text-white/60 hover:text-white">
          ✕ Cerrar
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="spinner" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="glass rounded-xl p-4 text-center">
                <div className="text-3xl font-display text-orchestra-gold">
                  {recentAttempts.length}
                </div>
                <div className="text-white/50 text-sm">Partidas jugadas</div>
              </div>
              <div className="glass rounded-xl p-4 text-center">
                <div className="text-3xl font-display text-green-400">
                  {recentAttempts.filter(a => a.accuracy >= 70).length}
                </div>
                <div className="text-white/50 text-sm">Completadas</div>
              </div>
              <div className="glass rounded-xl p-4 text-center">
                <div className="text-3xl font-display text-blue-400">
                  {recentAttempts.length > 0 
                    ? Math.round(recentAttempts.reduce((sum, a) => sum + a.accuracy, 0) / recentAttempts.length)
                    : 0}%
                </div>
                <div className="text-white/50 text-sm">Precisión promedio</div>
              </div>
              <div className="glass rounded-xl p-4 text-center">
                <div className="text-3xl font-display text-purple-400">
                  {Math.max(...recentAttempts.map(a => a.max_combo), 0)}x
                </div>
                <div className="text-white/50 text-sm">Mejor combo</div>
              </div>
            </div>

            {/* Leaderboard */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-6 mb-8"
            >
              <h2 className="font-display text-xl text-white mb-4">🏆 Tabla de Posiciones</h2>
              
              {leaderboard.length === 0 ? (
                <div className="text-center text-white/40 py-8">
                  No hay puntuaciones todavía
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((attempt, index) => (
                    <div 
                      key={attempt.id}
                      className="flex items-center justify-between bg-white/5 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-xl font-bold ${
                          index === 0 ? 'text-yellow-400' :
                          index === 1 ? 'text-gray-300' :
                          index === 2 ? 'text-orange-400' :
                          'text-white/40'
                        }`}>
                          #{index + 1}
                        </span>
                        <div>
                          <div className="text-white font-medium">{attempt.title}</div>
                          <div className="text-white/40 text-xs">{attempt.instrument}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`font-display text-xl ${gradeColors[attempt.grade]}`}>
                          {attempt.grade}
                        </span>
                        <span className="text-orchestra-gold font-medium">
                          {attempt.score.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Recent Attempts */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-xl p-6"
            >
              <h2 className="font-display text-xl text-white mb-4">📊 Intentos Recientes</h2>
              
              {recentAttempts.length === 0 ? (
                <div className="text-center text-white/40 py-8">
                  No hay intentos registrados
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-white/40 text-sm border-b border-white/10">
                        <th className="text-left py-3">Canción</th>
                        <th className="text-left py-3">Instrumento</th>
                        <th className="text-center py-3">Modo</th>
                        <th className="text-center py-3">Puntos</th>
                        <th className="text-center py-3">Precisión</th>
                        <th className="text-center py-3">Nota</th>
                        <th className="text-center py-3">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentAttempts.map((attempt) => (
                        <tr key={attempt.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3 text-white">{attempt.title}</td>
                          <td className="py-3 text-white/60">{attempt.instrument}</td>
                          <td className="py-3 text-center">
                            <span className={`text-xs px-2 py-1 rounded ${
                              attempt.practice_mode === 'microphone' 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-orchestra-gold/20 text-orchestra-gold'
                            }`}>
                              {attempt.practice_mode === 'microphone' ? '🎤' : '⌨️'}
                            </span>
                          </td>
                          <td className="py-3 text-center text-orchestra-gold">
                            {attempt.score.toLocaleString()}
                          </td>
                          <td className="py-3 text-center">
                            <span className={attempt.accuracy >= 80 ? 'text-green-400' : 'text-orange-400'}>
                              {attempt.accuracy.toFixed(1)}%
                            </span>
                          </td>
                          <td className={`py-3 text-center font-display text-lg ${gradeColors[attempt.grade]}`}>
                            {attempt.grade}
                          </td>
                          <td className="py-3 text-center text-white/30 text-sm">
                            {new Date(attempt.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}