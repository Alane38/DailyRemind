"use client"

import { useState, useEffect, useCallback } from "react"
import { storage } from "../storage"

interface AppStats {
  today: {
    completed: number
    total: number
    completionRate: number
  }
  week: {
    completed: number
    total: number
    completionRate: number
  }
  totalReminders: number
  activeReminders: number
}

export function useAppStats() {
  const [stats, setStats] = useState<AppStats>({
    today: { completed: 0, total: 0, completionRate: 0 },
    week: { completed: 0, total: 0, completionRate: 0 },
    totalReminders: 0,
    activeReminders: 0,
  })
  const [loading, setLoading] = useState(true)

  const calculateStats = useCallback(() => {
    try {
      setLoading(true)

      const todayStats = storage.calculateTodayStats()
      const weekStats = storage.calculateWeekStats()
      const reminders = storage.getReminders()
      const activeReminders = reminders.filter((r) => r.isEnabled && r.status === "active")

      setStats({
        today: todayStats,
        week: weekStats,
        totalReminders: reminders.length,
        activeReminders: activeReminders.length,
      })
    } catch (error) {
      console.error("Error calculating stats:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    calculateStats()

    // Recalculate stats every minute
    const interval = setInterval(calculateStats, 60000)

    return () => clearInterval(interval)
  }, [calculateStats])

  return {
    stats,
    loading,
    refreshStats: calculateStats,
  }
}
