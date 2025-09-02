"use client"

import { useState, useEffect, useCallback } from "react"
import type { UserPreferences } from "../types"
import { storage } from "../storage"
import { DEFAULT_USER_PREFERENCES } from "../constants"

export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES)
  const [loading, setLoading] = useState(true)

  const loadPreferences = useCallback(() => {
    try {
      setLoading(true)
      const storedPreferences = storage.getPreferences()
      setPreferences(storedPreferences)
    } catch (error) {
      console.error("Error loading preferences:", error)
      setPreferences(DEFAULT_USER_PREFERENCES)
    } finally {
      setLoading(false)
    }
  }, [])

  const updatePreferences = useCallback(
    (newPreferences: Partial<UserPreferences>) => {
      try {
        const updated = { ...preferences, ...newPreferences }
        storage.setPreferences(updated)
        setPreferences(updated)
      } catch (error) {
        console.error("Error updating preferences:", error)
      }
    },
    [preferences],
  )

  const updatePreference = useCallback(
    <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      try {
        const updated = { ...preferences, [key]: value }
        storage.setPreferences(updated)
        setPreferences(updated)
      } catch (error) {
        console.error("Error updating preference:", error)
      }
    },
    [preferences],
  )

  useEffect(() => {
    loadPreferences()
  }, [loadPreferences])

  return {
    preferences,
    loading,
    updatePreferences,
    updatePreference,
    refreshPreferences: loadPreferences,
  }
}
