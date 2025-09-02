// Core reminder data models for DailyRemind app

export type RecurrenceType =
  | "interval" // Every X minutes/hours
  | "daily" // Once per day at specific time
  | "multiple" // Multiple times per day (morning, noon, evening)
  | "weekly" // Weekly on specific days

export type ReminderCategory = "posture" | "vision" | "jaw" | "hydration" | "breathing" | "custom"

export type ReminderStatus = "active" | "paused" | "disabled"

export interface TimeSlot {
  hour: number // 0-23
  minute: number // 0-59
}

export interface RecurrenceConfig {
  type: RecurrenceType
  // For interval type
  intervalMinutes?: number
  // For daily type
  dailyTime?: TimeSlot
  // For multiple type
  multipleTimes?: TimeSlot[]
  // For weekly type
  weeklyDays?: number[] // 0=Sunday, 1=Monday, etc.
  weeklyTime?: TimeSlot
}

export interface Reminder {
  id: string
  title: string
  description?: string
  category: ReminderCategory
  recurrence: RecurrenceConfig
  status: ReminderStatus
  isEnabled: boolean
  createdAt: Date
  updatedAt: Date
  // Next scheduled notification time
  nextNotification?: Date
  // Custom icon or use category default
  icon?: string
  // Sound/vibration settings
  soundEnabled: boolean
  vibrationEnabled: boolean
}

export interface ReminderExecution {
  id: string
  reminderId: string
  scheduledTime: Date
  executedTime?: Date
  status: "pending" | "completed" | "dismissed" | "missed"
  userResponse?: "acknowledged" | "snoozed" | "dismissed"
  snoozeUntil?: Date
}

export interface ReminderStats {
  reminderId: string
  totalScheduled: number
  totalCompleted: number
  totalDismissed: number
  totalMissed: number
  completionRate: number // percentage
  streak: number // consecutive days with completed reminders
  lastCompleted?: Date
}

export interface UserPreferences {
  theme: "light" | "dark" | "system"
  notificationsEnabled: boolean
  soundEnabled: boolean
  vibrationEnabled: boolean
  quietHours: {
    enabled: boolean
    startTime: TimeSlot
    endTime: TimeSlot
  }
  snoozeOptions: number[] // minutes: [5, 10, 15, 30]
}

// Predefined reminder templates
export interface ReminderTemplate {
  id: string
  title: string
  description: string
  category: ReminderCategory
  defaultRecurrence: RecurrenceConfig
  icon: string
  isDefault: boolean
}

// App state management
export interface AppState {
  reminders: Reminder[]
  executions: ReminderExecution[]
  stats: Record<string, ReminderStats>
  preferences: UserPreferences
  lastSync: Date
}
