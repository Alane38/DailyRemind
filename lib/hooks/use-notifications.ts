"use client"

import { useState, useEffect, useCallback } from "react"
import { notificationService } from "../services/notification-service"
import type { Reminder } from "../types"

export function useNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [isPermissionGranted, setIsPermissionGranted] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [loading, setLoading] = useState(true)

  const initialize = useCallback(async () => {
    try {
      setLoading(true)
      const supported = notificationService.isNotificationSupported()
      setIsSupported(supported)

      if (supported) {
        const initialized = await notificationService.initialize()
        setIsInitialized(initialized)
        setIsPermissionGranted(notificationService.isPermissionGranted())
      }
    } catch (error) {
      console.error("Failed to initialize notifications:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  const scheduleReminder = useCallback(
    async (reminder: Reminder): Promise<boolean> => {
      if (!isInitialized || !isPermissionGranted) {
        console.warn("Cannot schedule reminder: notifications not initialized or permission not granted")
        return false
      }

      return await notificationService.scheduleReminderNotifications(reminder)
    },
    [isInitialized, isPermissionGranted],
  )

  const cancelReminder = useCallback(
    async (reminderId: string): Promise<void> => {
      if (!isInitialized) return
      await notificationService.cancelReminderNotifications(reminderId)
    },
    [isInitialized],
  )

  const scheduleAllReminders = useCallback(async (): Promise<void> => {
    if (!isInitialized || !isPermissionGranted) return
    await notificationService.scheduleAllReminders()
  }, [isInitialized, isPermissionGranted])

  const cancelAllNotifications = useCallback(async (): Promise<void> => {
    if (!isInitialized) return
    await notificationService.cancelAllNotifications()
  }, [isInitialized])

  useEffect(() => {
    initialize()
  }, [initialize])

  return {
    isSupported,
    isPermissionGranted,
    isInitialized,
    loading,
    scheduleReminder,
    cancelReminder,
    scheduleAllReminders,
    cancelAllNotifications,
    reinitialize: initialize,
  }
}
