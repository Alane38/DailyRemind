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
      // Cancel existing notifications for this reminder
      await this.cancelReminderNotifications(reminder.id)

      if (!reminder.isEnabled || reminder.status !== "active") {
        return true
      }

      const notifications: ScheduleOptions[] = []
      const now = new Date()

      // Schedule next few notifications (up to 64 due to platform limits)
      for (let i = 0; i < NOTIFICATION_CONFIG.MAX_PENDING_NOTIFICATIONS; i++) {
        const nextTime = calculateNextNotification(reminder, now)
        if (!nextTime) break

        const execution: ReminderExecution = {
          id: generateExecutionId(),
          reminderId: reminder.id,
          scheduledTime: nextTime,
          status: "pending",
        }

        // Store execution for tracking
        storage.addExecution(execution)

        const notification: ScheduleOptions = {
          notifications: [
            {
              id: Number.parseInt(execution.id.replace(/\D/g, "").slice(-8)), // Extract numeric ID
              title: reminder.title,
              body: reminder.description || "Time for your health reminder!",
              schedule: { at: nextTime },
              sound: reminder.soundEnabled ? NOTIFICATION_CONFIG.NOTIFICATION_SOUND : undefined,
              extra: {
                reminderId: reminder.id,
                executionId: execution.id,
                category: reminder.category,
              },
            },
          ],
        }

        notifications.push(notification)

        // Update now for next calculation
        now.setTime(nextTime.getTime() + 1000)
      }

      // Schedule all notifications
      if (notifications.length > 0) {
        if (this.isCapacitorAvailable) {
          for (const notification of notifications) {
            await LocalNotifications.schedule(notification)
          }
        } else {
          // Web fallback - schedule first notification only
          this.scheduleWebNotification(notifications[0].notifications[0])
        }
      }

      console.log(`Scheduled ${notifications.length} notifications for reminder: ${reminder.title}`)
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
        // Get pending notifications
        const pending = await LocalNotifications.getPending()
        const reminderNotifications = pending.notifications.filter((n) => n.extra?.reminderId === reminderId)

        if (reminderNotifications.length > 0) {
          const ids = reminderNotifications.map((n) => n.id)
          await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) })
        }
      }

      // Update executions in storage
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

      // Update all pending executions
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
    const { executionId } = notification.extra || {}
    if (executionId) {
      // Update execution status
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

        // Update reminder stats
        this.updateReminderStats(reminderId)
      }
    }
  }

  /**
   * Schedule web notification (fallback)
   */
  private scheduleWebNotification(notification: any): void {
    const { title, body, schedule } = notification
    const delay = schedule.at.getTime() - Date.now()

    if (delay > 0) {
      setTimeout(() => {
        if (this.permissionGranted) {
          new Notification(title, {
            body,
            icon: "/icon-192x192.png",
            badge: "/icon-192x192.png",
          })
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
