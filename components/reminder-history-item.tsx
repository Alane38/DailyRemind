"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"
import type { ReminderExecution, Reminder } from "@/lib/types"
import { REMINDER_CATEGORIES } from "@/lib/constants"

interface ReminderHistoryItemProps {
  execution: ReminderExecution
  reminder?: Reminder
}

export function ReminderHistoryItem({ execution, reminder }: ReminderHistoryItemProps) {
  const getStatusIcon = () => {
    switch (execution.status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "dismissed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "missed":
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      default:
        return <Clock className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusColor = () => {
    switch (execution.status) {
      case "completed":
        return "bg-green-50 border-green-200 text-green-800"
      case "dismissed":
        return "bg-red-50 border-red-200 text-red-800"
      case "missed":
        return "bg-orange-50 border-orange-200 text-orange-800"
      default:
        return "bg-blue-50 border-blue-200 text-blue-800"
    }
  }

  const getStatusText = () => {
    switch (execution.status) {
      case "completed":
        return "Completed"
      case "dismissed":
        return "Dismissed"
      case "missed":
        return "Missed"
      default:
        return "Pending"
    }
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date)
  }

  const formatDate = (date: Date) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(date)
    }
  }

  const category = reminder ? REMINDER_CATEGORIES[reminder.category] : null

  return (
    <Card className="transition-all hover:shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-0.5">{getStatusIcon()}</div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm leading-tight">{reminder?.title || "Unknown Reminder"}</h4>
              {reminder?.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{reminder.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className={`text-xs ${getStatusColor()}`}>
                  {getStatusText()}
                </Badge>
                {category && (
                  <Badge variant="secondary" className="text-xs">
                    {category.name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground flex-shrink-0">
            <div>{formatDate(new Date(execution.scheduledTime))}</div>
            <div>{formatTime(new Date(execution.scheduledTime))}</div>
            {execution.executedTime && execution.status === "completed" && (
              <div className="text-green-600 mt-1">Done at {formatTime(new Date(execution.executedTime))}</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
