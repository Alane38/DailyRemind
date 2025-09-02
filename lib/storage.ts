import type { Reminder, ReminderExecution, ReminderStats, UserPreferences, AppState } from "./types"
import { DEFAULT_USER_PREFERENCES } from "./constants"

const STORAGE_KEYS = {
  REMINDERS: "dailyremind_reminders",
  EXECUTIONS: "dailyremind_executions",
  STATS: "dailyremind_stats",
  PREFERENCES: "dailyremind_preferences",
  LAST_SYNC: "dailyremind_last_sync",
} as const

/**
 * Local storage service for DailyRemind app
 */
export class StorageService {
  private static instance: StorageService
  private isClient = typeof window !== "undefined"

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService()
    }
    return StorageService.instance
  }

  private getItem<T>(key: string, defaultValue: T): T {
    if (!this.isClient) return defaultValue

    try {
      const item = localStorage.getItem(key)
      if (item === null) return defaultValue
      return JSON.parse(item, this.dateReviver)
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error)
      return defaultValue
    }
  }

  private setItem<T>(key: string, value: T): void {
    if (!this.isClient) return

    try {
      localStorage.setItem(key, JSON.stringify(value, this.dateReplacer))
    } catch (error) {
      console.error(`Error writing ${key} to localStorage:`, error)
    }
  }

  private removeItem(key: string): void {
    if (!this.isClient) return

    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error)
    }
  }

  // JSON serialization helpers for Date objects
  private dateReplacer(key: string, value: any): any {
    if (value instanceof Date) {
      return { __type: "Date", value: value.toISOString() }
    }
    return value
  }

  private dateReviver(key: string, value: any): any {
    if (value && typeof value === "object" && value.__type === "Date") {
      return new Date(value.value)
    }
    return value
  }

  // Reminders
  getReminders(): Reminder[] {
    return this.getItem(STORAGE_KEYS.REMINDERS, [])
  }

  setReminders(reminders: Reminder[]): void {
    this.setItem(STORAGE_KEYS.REMINDERS, reminders)
    this.updateLastSync()
  }

  addReminder(reminder: Reminder): void {
    const reminders = this.getReminders()
    reminders.push(reminder)
    this.setReminders(reminders)
  }

  updateReminder(updatedReminder: Reminder): void {
    const reminders = this.getReminders()
    const index = reminders.findIndex((r) => r.id === updatedReminder.id)
    if (index !== -1) {
      reminders[index] = updatedReminder
      this.setReminders(reminders)
    }
  }

  deleteReminder(id: string): void {
    const reminders = this.getReminders()
    const filtered = reminders.filter((r) => r.id !== id)
    this.setReminders(filtered)

    // Also clean up related executions and stats
    this.deleteReminderExecutions(id)
    this.deleteReminderStats(id)
  }

  // Executions
  getExecutions(): ReminderExecution[] {
    return this.getItem(STORAGE_KEYS.EXECUTIONS, [])
  }

  setExecutions(executions: ReminderExecution[]): void {
    this.setItem(STORAGE_KEYS.EXECUTIONS, executions)
    this.updateLastSync()
  }

  addExecution(execution: ReminderExecution): void {
    const executions = this.getExecutions()
    executions.push(execution)
    this.setExecutions(executions)
  }

  updateExecution(updatedExecution: ReminderExecution): void {
    const executions = this.getExecutions()
    const index = executions.findIndex((e) => e.id === updatedExecution.id)
    if (index !== -1) {
      executions[index] = updatedExecution
      this.setExecutions(executions)
    }
  }

  deleteReminderExecutions(reminderId: string): void {
    const executions = this.getExecutions()
    const filtered = executions.filter((e) => e.reminderId !== reminderId)
    this.setExecutions(filtered)
  }

  // Stats
  getStats(): Record<string, ReminderStats> {
    return this.getItem(STORAGE_KEYS.STATS, {})
  }

  setStats(stats: Record<string, ReminderStats>): void {
    this.setItem(STORAGE_KEYS.STATS, stats)
    this.updateLastSync()
  }

  getReminderStats(reminderId: string): ReminderStats | null {
    const stats = this.getStats()
    return stats[reminderId] || null
  }

  updateReminderStats(reminderId: string, stats: ReminderStats): void {
    const allStats = this.getStats()
    allStats[reminderId] = stats
    this.setStats(allStats)
  }

  deleteReminderStats(reminderId: string): void {
    const stats = this.getStats()
    delete stats[reminderId]
    this.setStats(stats)
  }

  // Preferences
  getPreferences(): UserPreferences {
    return this.getItem(STORAGE_KEYS.PREFERENCES, DEFAULT_USER_PREFERENCES)
  }

  setPreferences(preferences: UserPreferences): void {
    this.setItem(STORAGE_KEYS.PREFERENCES, preferences)
    this.updateLastSync()
  }

  updatePreference<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]): void {
    const preferences = this.getPreferences()
    preferences[key] = value
    this.setPreferences(preferences)
  }

  // App state
  getAppState(): AppState {
    return {
      reminders: this.getReminders(),
      executions: this.getExecutions(),
      stats: this.getStats(),
      preferences: this.getPreferences(),
      lastSync: this.getLastSync(),
    }
  }

  setAppState(state: Partial<AppState>): void {
    if (state.reminders) this.setReminders(state.reminders)
    if (state.executions) this.setExecutions(state.executions)
    if (state.stats) this.setStats(state.stats)
    if (state.preferences) this.setPreferences(state.preferences)
  }

  // Utility
  getLastSync(): Date {
    return this.getItem(STORAGE_KEYS.LAST_SYNC, new Date())
  }

  private updateLastSync(): void {
    this.setItem(STORAGE_KEYS.LAST_SYNC, new Date())
  }

  // Data management
  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach((key) => {
      this.removeItem(key)
    })
  }

  exportData(): string {
    const data = this.getAppState()
    return JSON.stringify(data, this.dateReplacer, 2)
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData, this.dateReviver) as AppState
      this.setAppState(data)
      return true
    } catch (error) {
      console.error("Error importing data:", error)
      return false
    }
  }

  // Statistics calculations
  calculateTodayStats(): { completed: number; total: number; completionRate: number } {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const executions = this.getExecutions()
    const todayExecutions = executions.filter((e) => {
      const executionDate = new Date(e.scheduledTime)
      return executionDate >= today && executionDate < tomorrow
    })

    const completed = todayExecutions.filter((e) => e.status === "completed").length
    const total = todayExecutions.length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return { completed, total, completionRate }
  }

  calculateWeekStats(): { completed: number; total: number; completionRate: number } {
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0)

    const executions = this.getExecutions()
    const weekExecutions = executions.filter((e) => {
      const executionDate = new Date(e.scheduledTime)
      return executionDate >= weekStart
    })

    const completed = weekExecutions.filter((e) => e.status === "completed").length
    const total = weekExecutions.length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return { completed, total, completionRate }
  }
}

// Singleton instance
export const storage = StorageService.getInstance()
