import type { Reminder, TimeSlot } from "../types"

/**
 * Calculate the next notification time for a reminder
 */
export function calculateNextNotification(reminder: Reminder, fromTime: Date = new Date()): Date | null {
  if (!reminder.isEnabled || reminder.status !== "active") {
    return null
  }

  const { recurrence } = reminder
  const now = new Date(fromTime)

  switch (recurrence.type) {
    case "interval":
      if (!recurrence.intervalMinutes) return null
      return new Date(now.getTime() + recurrence.intervalMinutes * 60 * 1000)

    case "daily":
      if (!recurrence.dailyTime) return null
      return getNextDailyTime(recurrence.dailyTime, now)

    case "multiple":
      if (!recurrence.multipleTimes?.length) return null
      return getNextMultipleTime(recurrence.multipleTimes, now)

    case "weekly":
      if (!recurrence.weeklyDays?.length || !recurrence.weeklyTime) return null
      return getNextWeeklyTime(recurrence.weeklyDays, recurrence.weeklyTime, now)

    default:
      return null
  }
}

/**
 * Get next daily notification time
 */
function getNextDailyTime(timeSlot: TimeSlot, fromTime: Date): Date {
  const next = new Date(fromTime)
  next.setHours(timeSlot.hour, timeSlot.minute, 0, 0)

  // If time has passed today, schedule for tomorrow
  if (next <= fromTime) {
    next.setDate(next.getDate() + 1)
  }

  return next
}

/**
 * Get next notification time from multiple daily times
 */
function getNextMultipleTime(timeSlots: TimeSlot[], fromTime: Date): Date {
  const today = new Date(fromTime)
  today.setSeconds(0, 0)

  // Find next time slot today
  for (const slot of timeSlots.sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute))) {
    const slotTime = new Date(today)
    slotTime.setHours(slot.hour, slot.minute, 0, 0)

    if (slotTime > fromTime) {
      return slotTime
    }
  }

  // No more times today, get first time tomorrow
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(timeSlots[0].hour, timeSlots[0].minute, 0, 0)

  return tomorrow
}

/**
 * Get next weekly notification time
 */
function getNextWeeklyTime(weekDays: number[], timeSlot: TimeSlot, fromTime: Date): Date {
  const currentDay = fromTime.getDay()
  const currentTime = fromTime.getHours() * 60 + fromTime.getMinutes()
  const targetTime = timeSlot.hour * 60 + timeSlot.minute

  // Sort days and find next occurrence
  const sortedDays = [...weekDays].sort((a, b) => a - b)

  // Check if we can schedule today
  if (sortedDays.includes(currentDay) && targetTime > currentTime) {
    const today = new Date(fromTime)
    today.setHours(timeSlot.hour, timeSlot.minute, 0, 0)
    return today
  }

  // Find next day in the week
  for (const day of sortedDays) {
    if (day > currentDay) {
      const nextDate = new Date(fromTime)
      nextDate.setDate(nextDate.getDate() + (day - currentDay))
      nextDate.setHours(timeSlot.hour, timeSlot.minute, 0, 0)
      return nextDate
    }
  }

  // Next week
  const daysUntilNext = 7 - currentDay + sortedDays[0]
  const nextWeek = new Date(fromTime)
  nextWeek.setDate(nextWeek.getDate() + daysUntilNext)
  nextWeek.setHours(timeSlot.hour, timeSlot.minute, 0, 0)

  return nextWeek
}

/**
 * Generate a unique reminder ID
 */
export function generateReminderId(): string {
  return `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Generate a unique execution ID
 */
export function generateExecutionId(): string {
  return `execution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Check if current time is within quiet hours
 */
export function isQuietHours(currentTime: Date, quietStart: TimeSlot, quietEnd: TimeSlot): boolean {
  const current = currentTime.getHours() * 60 + currentTime.getMinutes()
  const start = quietStart.hour * 60 + quietStart.minute
  const end = quietEnd.hour * 60 + quietEnd.minute

  if (start <= end) {
    // Same day quiet hours (e.g., 22:00 to 07:00 next day)
    return current >= start && current <= end
  } else {
    // Overnight quiet hours (e.g., 22:00 to 07:00 next day)
    return current >= start || current <= end
  }
}

/**
 * Format time slot to readable string
 */
export function formatTimeSlot(timeSlot: TimeSlot): string {
  const hour = timeSlot.hour.toString().padStart(2, "0")
  const minute = timeSlot.minute.toString().padStart(2, "0")
  return `${hour}:${minute}`
}

/**
 * Parse time string to TimeSlot
 */
export function parseTimeString(timeString: string): TimeSlot | null {
  const match = timeString.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null

  const hour = Number.parseInt(match[1], 10)
  const minute = Number.parseInt(match[2], 10)

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null

  return { hour, minute }
}
