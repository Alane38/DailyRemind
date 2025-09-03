import { LocalNotifications, type ScheduleOptions } from "@capacitor/local-notifications"
import { Capacitor } from "@capacitor/core"
import type { Reminder, ReminderExecution } from "../types"
import { calculateNextNotification, generateExecutionId } from "../utils/reminder-utils"
import { storage } from "../storage"
import { NOTIFICATION_CONFIG } from "../constants"

export class NotificationService {
  private static instance: NotificationService
  private isCapacitorAvailable = Capacitor.isNativePlatform()
  private permissionGranted = false
  private scheduledNotifications = new Map<string, number>() // reminderId -> notificationId

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  /**
   * Initialize the notification service
   */
  async initialize(): Promise<boolean> {
    if (!this.isCapacitorAvailable) {
      console.log("Capacitor not available, using web fallback")
      return this.initializeWebNotifications()
    }

    try {
      // Request permissions
      const permission = await LocalNotifications.requestPermissions()
      this.permissionGranted = permission.display === "granted"

      if (!this.permissionGranted) {
        console.warn("Notification permissions not granted")
        return false
      }

      // Set up notification listeners
      await this.setupNotificationListeners()

      console.log("Notification service initialized successfully")
      return true
    } catch (error) {
      console.error("Failed to initialize notification service:", error)
      return false
    }
  }

  /**
   * Initialize web notifications as fallback
   */
  private async initializeWebNotifications(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.warn("Web notifications not supported")
      return false
    }

    if (Notification.permission === "granted") {
      this.permissionGranted = true
      return true
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission()
      this.permissionGranted = permission === "granted"
      return this.permissionGranted
    }

    return false
  }

  /**
   * Set up notification event listeners
   */
  private async setupNotificationListeners(): Promise<void> {
    if (!this.isCapacitorAvailable) return

    // Handle notification received
    await LocalNotifications.addListener("localNotificationReceived", (notification) => {
      console.log("Notification received:", notification)
      this.handleNotificationReceived(notification)
    })

    // Handle notification action performed
    await LocalNotifications.addListener("localNotificationActionPerformed", (notificationAction) => {
      console.log("Notification action performed:", notificationAction)
      this.handleNotificationAction(notificationAction)
      this.showCompletionPopup(notificationAction.notification)
    })
  }

  /**
   * Schedule notifications for a reminder
   */
  async scheduleReminderNotifications(reminder: Reminder): Promise<boolean> {
    if (!this.permissionGranted) {
      console.warn("Cannot schedule notifications: permissions not granted")
      return false
    }

    try {
      await this.cancelReminderNotifications(reminder.id)

      if (!reminder.isEnabled || reminder.status !== "active") {
        return true
      }

      const nextTime = calculateNextNotification(reminder, new Date())
      if (!nextTime) return false

      const execution: ReminderExecution = {
        id: generateExecutionId(),
        reminderId: reminder.id,
        scheduledTime: nextTime,
        status: "pending",
      }

      storage.addExecution(execution)

      const notificationId = Number.parseInt(execution.id.replace(/\D/g, "").slice(-8))

      const notification: ScheduleOptions = {
        notifications: [
          {
            id: notificationId,
            title: reminder.title,
            body: reminder.description || "Time for your health reminder!",
            schedule: { at: nextTime },
            sound: reminder.soundEnabled ? "default" : undefined,
            extra: {
              reminderId: reminder.id,
              executionId: execution.id,
              category: reminder.category,
            },
          },
        ],
      }

      if (this.isCapacitorAvailable) {
        await LocalNotifications.schedule(notification)
        if (reminder.vibrationEnabled) {
          // Vibration will be handled when notification is received
        }
      } else {
        this.scheduleWebNotification(notification.notifications[0])
      }

      this.scheduledNotifications.set(reminder.id, notificationId)

      console.log(`Scheduled notification for reminder: ${reminder.title} at ${nextTime}`)
      return true
    } catch (error) {
      console.error("Failed to schedule notifications:", error)
      return false
    }
  }

  /**
   * Cancel notifications for a specific reminder
   */
  async cancelReminderNotifications(reminderId: string): Promise<void> {
    try {
      if (this.isCapacitorAvailable) {
        const notificationId = this.scheduledNotifications.get(reminderId)
        if (notificationId) {
          await LocalNotifications.cancel({ notifications: [{ id: notificationId }] })
        }
      }

      this.scheduledNotifications.delete(reminderId)

      const executions = storage.getExecutions()
      const updatedExecutions = executions.map((e) =>
        e.reminderId === reminderId && e.status === "pending" ? { ...e, status: "dismissed" as const } : e,
      )
      storage.setExecutions(updatedExecutions)

      console.log(`Cancelled notifications for reminder: ${reminderId}`)
    } catch (error) {
      console.error("Failed to cancel notifications:", error)
    }
  }

  /**
   * Schedule all active reminders
   */
  async scheduleAllReminders(): Promise<void> {
    const reminders = storage.getReminders()
    const activeReminders = reminders.filter((r) => r.isEnabled && r.status === "active")

    console.log(`Scheduling notifications for ${activeReminders.length} active reminders`)

    for (const reminder of activeReminders) {
      await this.scheduleReminderNotifications(reminder)
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      if (this.isCapacitorAvailable) {
        await LocalNotifications.removeAllDeliveredNotifications()
        const pending = await LocalNotifications.getPending()
        if (pending.notifications.length > 0) {
          const ids = pending.notifications.map((n) => ({ id: n.id }))
          await LocalNotifications.cancel({ notifications: ids })
        }
      }

      this.scheduledNotifications.clear()

      const executions = storage.getExecutions()
      const updatedExecutions = executions.map((e) =>
        e.status === "pending" ? { ...e, status: "dismissed" as const } : e,
      )
      storage.setExecutions(updatedExecutions)

      console.log("Cancelled all notifications")
    } catch (error) {
      console.error("Failed to cancel all notifications:", error)
    }
  }

  /**
   * Handle notification received
   */
  private handleNotificationReceived(notification: any): void {
    const { executionId, reminderId } = notification.extra || {}

    if (this.isCapacitorAvailable) {
      const reminder = storage.getReminders().find((r) => r.id === reminderId)
      if (reminder?.vibrationEnabled) {
        if ("vibrate" in navigator) {
          navigator.vibrate(NOTIFICATION_CONFIG.VIBRATION_PATTERN)
        }
      }
    }

    if (executionId) {
      const executions = storage.getExecutions()
      const execution = executions.find((e) => e.id === executionId)
      if (execution) {
        execution.executedTime = new Date()
        execution.status = "completed"
        storage.setExecutions(executions)
      }
    }
  }

  /**
   * Handle notification action
   */
  private handleNotificationAction(notificationAction: any): void {
    const { notification } = notificationAction
    const { executionId, reminderId } = notification.extra || {}

    if (executionId) {
      const executions = storage.getExecutions()
      const execution = executions.find((e) => e.id === executionId)
      if (execution) {
        execution.executedTime = new Date()
        execution.status = "completed"
        execution.userResponse = "acknowledged"
        storage.setExecutions(executions)

        this.updateReminderStats(reminderId)

        const reminder = storage.getReminders().find((r) => r.id === reminderId)
        if (reminder) {
          setTimeout(() => {
            this.scheduleReminderNotifications(reminder)
          }, 1000)
        }
      }
    }
  }

  private showCompletionPopup(notification: any): void {
    const { reminderId } = notification.extra || {}
    const reminder = storage.getReminders().find((r) => r.id === reminderId)

    if (reminder) {
      const popup = document.createElement("div")
      popup.className = "fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      popup.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 m-4 max-w-sm w-full shadow-xl">
          <h3 class="text-lg font-semibold mb-2 text-gray-900 dark:text-white">${reminder.title}</h3>
          <p class="text-gray-600 dark:text-gray-300 mb-4">Did you complete this reminder?</p>
          <div class="flex gap-2">
            <button id="complete-btn" class="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors">Complete</button>
            <button id="dismiss-btn" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors">Dismiss</button>
          </div>
        </div>
      `

      document.body.appendChild(popup)

      popup.querySelector("#complete-btn")?.addEventListener("click", () => {
        this.markReminderCompleted(reminderId)
        document.body.removeChild(popup)
      })

      popup.querySelector("#dismiss-btn")?.addEventListener("click", () => {
        document.body.removeChild(popup)
      })

      // Auto-dismiss after 10 seconds
      setTimeout(() => {
        if (document.body.contains(popup)) {
          document.body.removeChild(popup)
        }
      }, 10000)
    }
  }

  private markReminderCompleted(reminderId: string): void {
    const executions = storage.getExecutions()
    const latestExecution = executions
      .filter((e) => e.reminderId === reminderId && e.status === "pending")
      .sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime())[0]

    if (latestExecution) {
      latestExecution.status = "completed"
      latestExecution.executedTime = new Date()
      latestExecution.userResponse = "acknowledged"
      storage.setExecutions(executions)
      this.updateReminderStats(reminderId)
    }
  }

  /**
   * Schedule web notification (fallback)
   */
  private scheduleWebNotification(notification: any): void {
    const { title, body, schedule, extra } = notification
    const delay = schedule.at.getTime() - Date.now()

    if (delay > 0) {
      setTimeout(() => {
        if (this.permissionGranted) {
          const webNotification = new Notification(title, {
            body,
            icon: "/icon-192x192.png",
            badge: "/icon-192x192.png",
          })

          webNotification.onclick = () => {
            this.showCompletionPopup({ extra })
            webNotification.close()
          }
        }
      }, delay)
    }
  }

  /**
   * Update reminder statistics
   */
  private updateReminderStats(reminderId: string): void {
    const executions = storage.getExecutions()
    const reminderExecutions = executions.filter((e) => e.reminderId === reminderId)

    const totalScheduled = reminderExecutions.length
    const totalCompleted = reminderExecutions.filter((e) => e.status === "completed").length
    const totalDismissed = reminderExecutions.filter((e) => e.status === "dismissed").length
    const totalMissed = reminderExecutions.filter((e) => e.status === "missed").length

    const completionRate = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0

    const stats = {
      reminderId,
      totalScheduled,
      totalCompleted,
      totalDismissed,
      totalMissed,
      completionRate,
      streak: this.calculateStreak(reminderExecutions),
      lastCompleted: reminderExecutions
        .filter((e) => e.status === "completed")
        .sort((a, b) => new Date(b.executedTime!).getTime() - new Date(a.executedTime!).getTime())[0]?.executedTime,
    }

    storage.updateReminderStats(reminderId, stats)
  }

  /**
   * Calculate completion streak
   */
  private calculateStreak(executions: ReminderExecution[]): number {
    const completedExecutions = executions
      .filter((e) => e.status === "completed" && e.executedTime)
      .sort((a, b) => new Date(b.executedTime!).getTime() - new Date(a.executedTime!).getTime())

    let streak = 0
    const currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    for (const execution of completedExecutions) {
      const executionDate = new Date(execution.executedTime!)
      executionDate.setHours(0, 0, 0, 0)

      if (executionDate.getTime() === currentDate.getTime()) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }

    return streak
  }

  /**
   * Check if notifications are supported and enabled
   */
  isNotificationSupported(): boolean {
    return this.isCapacitorAvailable || "Notification" in window
  }

  /**
   * Check if permission is granted
   */
  isPermissionGranted(): boolean {
    return this.permissionGranted
  }
}

// Singleton instance
export const notificationService = NotificationService.getInstance()
