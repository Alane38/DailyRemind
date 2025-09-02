"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Bell, Edit, Trash2, Clock, Repeat } from "lucide-react"
import type { Reminder } from "@/lib/types"
import { REMINDER_CATEGORIES } from "@/lib/constants"
import { formatTimeSlot } from "@/lib/utils/reminder-utils"

interface ReminderCardProps {
  reminder: Reminder
  onToggle: (id: string, enabled: boolean) => void
  onEdit: (reminder: Reminder) => void
  onDelete: (id: string) => void
  nextNotification?: Date
}

export function ReminderCard({ reminder, onToggle, onEdit, onDelete, nextNotification }: ReminderCardProps) {
  const category = REMINDER_CATEGORIES[reminder.category]

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

  const getNextNotificationText = () => {
    if (!nextNotification || !reminder.isEnabled) return null

    const now = new Date()
    const diff = nextNotification.getTime() - now.getTime()

    if (diff < 0) return "Overdue"

    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `In ${days}d`
    if (hours > 0) return `In ${hours}h ${minutes % 60}m`
    if (minutes > 0) return `In ${minutes}m`
    return "Now"
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

        {nextNotification && reminder.isEnabled && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Next: {getNextNotificationText()}</span>
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
