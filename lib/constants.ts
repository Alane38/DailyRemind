import type { ReminderTemplate } from "./types"

// Default reminder templates based on requirements
export const DEFAULT_REMINDER_TEMPLATES: ReminderTemplate[] = [
  {
    id: "posture-30min",
    title: "Posture Check",
    description: "Straighten your back and shoulders. Check your sitting position.",
    category: "posture",
    defaultRecurrence: {
      type: "interval",
      intervalMinutes: 30,
    },
    icon: "posture",
    isDefault: true,
  },
  {
    id: "vision-20-20-20",
    title: "20-20-20 Rule",
    description: "Look at something 20 feet away for 20 seconds to rest your eyes.",
    category: "vision",
    defaultRecurrence: {
      type: "interval",
      intervalMinutes: 20,
    },
    icon: "eye",
    isDefault: true,
  },
  {
    id: "jaw-exercises",
    title: "Jaw Exercise",
    description: "Gentle jaw stretches and movements to relieve tension.",
    category: "jaw",
    defaultRecurrence: {
      type: "multiple",
      multipleTimes: [
        { hour: 9, minute: 0 }, // Morning
        { hour: 13, minute: 0 }, // Noon
        { hour: 18, minute: 0 }, // Evening
      ],
    },
    icon: "jaw",
    isDefault: true,
  },
  {
    id: "hydration-hourly",
    title: "Drink Water",
    description: "Stay hydrated! Take a sip of water.",
    category: "hydration",
    defaultRecurrence: {
      type: "interval",
      intervalMinutes: 60,
    },
    icon: "water",
    isDefault: false,
  },
  {
    id: "breathing-exercise",
    title: "Deep Breathing",
    description: "Take 5 deep breaths to reduce stress and improve focus.",
    category: "breathing",
    defaultRecurrence: {
      type: "multiple",
      multipleTimes: [
        { hour: 10, minute: 0 },
        { hour: 15, minute: 0 },
        { hour: 20, minute: 0 },
      ],
    },
    icon: "lungs",
    isDefault: false,
  },
]

// Category metadata
export const REMINDER_CATEGORIES = {
  posture: {
    name: "Posture",
    description: "Maintain good posture throughout the day",
    color: "primary",
    defaultIcon: "posture",
  },
  vision: {
    name: "Vision Care",
    description: "Protect your eyes from digital strain",
    color: "accent",
    defaultIcon: "eye",
  },
  jaw: {
    name: "Jaw Health",
    description: "Relieve jaw tension and TMJ symptoms",
    color: "secondary",
    defaultIcon: "jaw",
  },
  hydration: {
    name: "Hydration",
    description: "Stay properly hydrated",
    color: "blue",
    defaultIcon: "water",
  },
  breathing: {
    name: "Breathing",
    description: "Mindful breathing exercises",
    color: "green",
    defaultIcon: "lungs",
  },
  custom: {
    name: "Custom",
    description: "Your personalized reminders",
    color: "muted",
    defaultIcon: "bell",
  },
} as const

// Default user preferences
export const DEFAULT_USER_PREFERENCES = {
  theme: "system" as const,
  notificationsEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  quietHours: {
    enabled: false,
    startTime: { hour: 22, minute: 0 },
    endTime: { hour: 7, minute: 0 },
  },
  snoozeOptions: [5, 10, 15, 30],
}

// Time utilities
export const TIME_SLOTS = {
  MORNING: { hour: 9, minute: 0 },
  NOON: { hour: 13, minute: 0 },
  AFTERNOON: { hour: 15, minute: 0 },
  EVENING: { hour: 18, minute: 0 },
  NIGHT: { hour: 21, minute: 0 },
} as const

// Notification settings
export const NOTIFICATION_CONFIG = {
  MAX_PENDING_NOTIFICATIONS: 64, // iOS/Android limit
  DEFAULT_SNOOZE_MINUTES: 10,
  MAX_SNOOZE_COUNT: 3,
  NOTIFICATION_SOUND: "default",
  VIBRATION_PATTERN: [0, 250, 250, 250],
} as const
