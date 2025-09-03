"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Bell, Edit, Trash2, Clock, Repeat } from "lucide-react"
import type { Reminder } from "@/lib/types"
import { REMINDER_CATEGORIES } from "@/lib/constants"
import { formatTimeSlot, calculateNextNotification } from "@/lib/utils/reminder-utils"

interface ReminderCardProps {
  reminder: Reminder
  onToggle: (id: string, enabled: boolean) => void
  onEdit: (reminder: Reminder) => void
  onDelete: (id: string) => void
  nextNotification?: Date
}

export function ReminderCard({ reminder, onToggle, onEdit, onDelete, nextNotification }: ReminderCardProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>("")
  const [currentNextNotification, setCurrentNextNotification] = useState<Date | null>(null)

  const category = REMINDER_CATEGORIES[reminder.category]

  useEffect(() => {
    const updateTimeRemaining = () => {
      if (!reminder.isEnabled) {
        setTimeRemaining("")
        setCurrentNextNotification(null)
        return
      }

      const next = calculateNextNotification(reminder, new Date())
      setCurrentNextNotification(next)

      if (!next) {
        setTimeRemaining("")
        return
      }

      const now = new Date()
      const diff = next.getTime() - now.getTime()

      if (diff < 0) {
        setTimeRemaining("Overdue")
        return
      }

      const totalSeconds = Math.floor(diff / 1000)
      const days = Math.floor(totalSeconds / (24 * 3600))
      const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`)
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`)
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`)
      } else if (seconds > 0) {
        setTimeRemaining(`${seconds}s`)
      } else {
        setTimeRemaining("Now!")
      }
    }

    updateTimeRemaining()
    const interval = setInterval(updateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [reminder])

  const getRecurrenceText = () => {
    const { recurrence } = reminder
    switch (recurrence.type) {
      case "interval":
        const hours = Math.floor((recurrence.intervalMinutes || 0) / 60)
        const minutes = (recurrence.intervalMinutes || 0) % 60
        if (hours > 0) {
          return minutes > 0 ? `Every ${hours}h ${minutes}m` : `Every ${hours}h`
        }
        return `Every ${recurrence.intervalMinutes}m`

      case "daily":
        return `Daily at ${formatTimeSlot(recurrence.dailyTime!)}`

      case "multiple":
        const times = recurrence.multipleTimes?.map(formatTimeSlot).join(", ") || ""
        return `${recurrence.multipleTimes?.length}x daily`

      default:
        return "Custom"
    }
  }

  return (
    <Card className={`transition-all ${reminder.isEnabled ? "" : "opacity-60"}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={`p-2 rounded-lg bg-${category.color}/10 flex-shrink-0`}>
              <Bell className={`h-4 w-4 text-${category.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-base leading-tight">{reminder.title}</h3>
              {reminder.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{reminder.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(reminder)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(reminder.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <Repeat className="h-3 w-3 mr-1" />
              {getRecurrenceText()}
            </Badge>
            <Badge variant={category.name === "Custom" ? "outline" : "default"} className="text-xs">
              {category.name}
            </Badge>
          </div>
          <Switch checked={reminder.isEnabled} onCheckedChange={(enabled) => onToggle(reminder.id, enabled)} />
        </div>

        {reminder.isEnabled && timeRemaining && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-3 w-3 text-primary" />
            <span
              className={`font-medium ${timeRemaining === "Now!" ? "text-primary animate-pulse" : timeRemaining === "Overdue" ? "text-destructive" : "text-foreground"}`}
            >
              Next: {timeRemaining}
            </span>
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${reminder.soundEnabled ? "bg-primary" : "bg-muted"}`} />
            Sound
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${reminder.vibrationEnabled ? "bg-primary" : "bg-muted"}`} />
            Vibration
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
