"use client"

import { useState, useEffect, useCallback } from "react"
import type { Reminder } from "../types"
import { DEFAULT_REMINDER_TEMPLATES } from "../constants"
import { generateReminderId } from "../utils/reminder-utils"
import { storage } from "../storage"

const SETUP_STORAGE_KEY = "dailyremind_setup_completed"

export function useSetup() {
  const [isSetupCompleted, setIsSetupCompleted] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  const checkSetupStatus = useCallback(() => {
    try {
      setLoading(true)
      const completed = localStorage.getItem(SETUP_STORAGE_KEY) === "true"
      const hasReminders = storage.getReminders().length > 0

      // If user has reminders but setup not marked complete, mark it complete
      if (hasReminders && !completed) {
        localStorage.setItem(SETUP_STORAGE_KEY, "true")
        setIsSetupCompleted(true)
      } else {
        setIsSetupCompleted(completed)
      }
    } catch (error) {
      console.error("Error checking setup status:", error)
      setIsSetupCompleted(false)
    } finally {
      setLoading(false)
    }
  }, [])

  const completeSetup = useCallback((selectedTemplateIds: string[] = []) => {
    try {
      // Add selected predefined reminders
      const selectedTemplates = DEFAULT_REMINDER_TEMPLATES.filter((template) =>
        selectedTemplateIds.includes(template.id),
      )

      const newReminders: Reminder[] = selectedTemplates.map((template) => ({
        id: generateReminderId(),
        title: template.title,
        description: template.description,
        category: template.category,
        recurrence: template.defaultRecurrence,
        status: "active",
        isEnabled: true,
        soundEnabled: true,
        vibrationEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))

      // Save reminders to storage
      const existingReminders = storage.getReminders()
      storage.setReminders([...existingReminders, ...newReminders])

      // Mark setup as completed
      localStorage.setItem(SETUP_STORAGE_KEY, "true")
      setIsSetupCompleted(true)

      return true
    } catch (error) {
      console.error("Error completing setup:", error)
      return false
    }
  }, [])

  const resetSetup = useCallback(() => {
    try {
      localStorage.removeItem(SETUP_STORAGE_KEY)
      setIsSetupCompleted(false)
    } catch (error) {
      console.error("Error resetting setup:", error)
    }
  }, [])

  useEffect(() => {
    checkSetupStatus()
  }, [checkSetupStatus])

  return {
    isSetupCompleted,
    loading,
    completeSetup,
    resetSetup,
    checkSetupStatus,
  }
}
