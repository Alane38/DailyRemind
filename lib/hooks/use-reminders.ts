"use client"

import { useState, useEffect, useCallback } from "react"
import type { Reminder } from "../types"
import { storage } from "../storage"
import { calculateNextNotification } from "../utils/reminder-utils"
import { useNotifications } from "./use-notifications"

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { scheduleReminder, cancelReminder, isInitialized } = useNotifications()

  // Load reminders from storage
  const loadReminders = useCallback(() => {
    try {
      setLoading(true)
      const storedReminders = storage.getReminders()

      // Update next notification times
      const updatedReminders = storedReminders.map((reminder) => ({
        ...reminder,
        nextNotification: calculateNextNotification(reminder),
      }))

      setReminders(updatedReminders)
      setError(null)
    } catch (err) {
      setError("Failed to load reminders")
      console.error("Error loading reminders:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Add new reminder
  const addReminder = useCallback(
    async (reminder: Reminder) => {
      try {
        const reminderWithNotification = {
          ...reminder,
          nextNotification: calculateNextNotification(reminder),
        }

        storage.addReminder(reminderWithNotification)
        setReminders((prev) => [...prev, reminderWithNotification])

        if (isInitialized && reminderWithNotification.isEnabled) {
          await scheduleReminder(reminderWithNotification)
        }

        setError(null)
      } catch (err) {
        setError("Failed to add reminder")
        console.error("Error adding reminder:", err)
      }
    },
    [scheduleReminder, isInitialized],
  )

  // Update existing reminder
  const updateReminder = useCallback(
    async (updatedReminder: Reminder) => {
      try {
        const reminderWithNotification = {
          ...updatedReminder,
          updatedAt: new Date(),
          nextNotification: calculateNextNotification(updatedReminder),
        }

        storage.updateReminder(reminderWithNotification)
        setReminders((prev) => prev.map((r) => (r.id === updatedReminder.id ? reminderWithNotification : r)))

        if (isInitialized) {
          await cancelReminder(updatedReminder.id)
          if (reminderWithNotification.isEnabled) {
            await scheduleReminder(reminderWithNotification)
          }
        }

        setError(null)
      } catch (err) {
        setError("Failed to update reminder")
        console.error("Error updating reminder:", err)
      }
    },
    [scheduleReminder, cancelReminder, isInitialized],
  )

  // Delete reminder
  const deleteReminder = useCallback(
    async (id: string) => {
      try {
        storage.deleteReminder(id)
        setReminders((prev) => prev.filter((r) => r.id !== id))

        if (isInitialized) {
          await cancelReminder(id)
        }

        setError(null)
      } catch (err) {
        setError("Failed to delete reminder")
        console.error("Error deleting reminder:", err)
      }
    },
    [cancelReminder, isInitialized],
  )

  // Toggle reminder enabled state
  const toggleReminder = useCallback(
    async (id: string, enabled: boolean) => {
      const reminder = reminders.find((r) => r.id === id)
      if (reminder) {
        await updateReminder({ ...reminder, isEnabled: enabled })
      }
    },
    [reminders, updateReminder],
  )

  const clearAllReminders = useCallback(async () => {
    try {
      // Cancel all notifications first
      if (isInitialized) {
        for (const reminder of reminders) {
          await cancelReminder(reminder.id)
        }
      }

      // Clear from storage
      storage.setReminders([])
      setReminders([])
      setError(null)
    } catch (err) {
      setError("Failed to clear reminders")
      console.error("Error clearing reminders:", err)
    }
  }, [reminders, cancelReminder, isInitialized])

  // Get active reminders
  const activeReminders = reminders.filter((r) => r.isEnabled && r.status === "active")

  // Get reminders by category
  const getRemindersByCategory = useCallback(
    (category: string) => {
      return reminders.filter((r) => r.category === category)
    },
    [reminders],
  )

  // Load reminders on mount
  useEffect(() => {
    loadReminders()
  }, [loadReminders])

  // Refresh next notification times periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setReminders((prev) =>
        prev.map((reminder) => ({
          ...reminder,
          nextNotification: calculateNextNotification(reminder),
        })),
      )
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  return {
    reminders,
    activeReminders,
    loading,
    error,
    addReminder,
    updateReminder,
    deleteReminder,
    toggleReminder,
    clearAllReminders,
    getRemindersByCategory,
    refreshReminders: loadReminders,
  }
}
