"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Bell, Repeat, Plus } from "lucide-react"
import { DEFAULT_REMINDER_TEMPLATES, REMINDER_CATEGORIES } from "@/lib/constants"
import type { ReminderTemplate } from "@/lib/types"

interface PredefinedRemindersProps {
  onAddReminders: (templateIds: string[]) => void
  showSelectAll?: boolean
  title?: string
  description?: string
}

export function PredefinedReminders({
  onAddReminders,
  showSelectAll = true,
  title = "Choose Your Health Reminders",
  description = "Select the reminders that will help you build healthy habits",
}: PredefinedRemindersProps) {
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([])

  const handleTemplateToggle = (templateId: string, checked: boolean) => {
    setSelectedTemplates((prev) => {
      if (checked) {
        return [...prev, templateId]
      } else {
        return prev.filter((id) => id !== templateId)
      }
    })
  }

  const handleSelectAll = () => {
    if (selectedTemplates.length === DEFAULT_REMINDER_TEMPLATES.length) {
      setSelectedTemplates([])
    } else {
      setSelectedTemplates(DEFAULT_REMINDER_TEMPLATES.map((t) => t.id))
    }
  }

  const handleAddSelected = () => {
    if (selectedTemplates.length > 0) {
      onAddReminders(selectedTemplates)
    }
  }

  const getRecurrenceText = (template: ReminderTemplate) => {
    const { defaultRecurrence } = template
    switch (defaultRecurrence.type) {
      case "interval":
        const hours = Math.floor((defaultRecurrence.intervalMinutes || 0) / 60)
        const minutes = (defaultRecurrence.intervalMinutes || 0) % 60
        if (hours > 0) {
          return minutes > 0 ? `Every ${hours}h ${minutes}m` : `Every ${hours}h`
        }
        return `Every ${defaultRecurrence.intervalMinutes}m`

      case "daily":
        return "Once daily"

      case "multiple":
        return `${defaultRecurrence.multipleTimes?.length || 0}x daily`

      default:
        return "Custom"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {/* Select All */}
      {showSelectAll && (
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={selectedTemplates.length === DEFAULT_REMINDER_TEMPLATES.length}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm font-medium">
              Select all reminders
            </label>
          </div>
          <Badge variant="secondary">{selectedTemplates.length} selected</Badge>
        </div>
      )}

      {/* Template Cards */}
      <div className="grid gap-4">
        {DEFAULT_REMINDER_TEMPLATES.map((template) => {
          const category = REMINDER_CATEGORIES[template.category]
          const isSelected = selectedTemplates.includes(template.id)

          return (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all ${
                isSelected ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"
              }`}
              onClick={() => handleTemplateToggle(template.id, !isSelected)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg bg-${category.color}/10 flex-shrink-0`}>
                      <Bell className={`h-4 w-4 text-${category.color}`} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {template.title}
                        {template.isDefault && <Badge variant="secondary">Recommended</Badge>}
                      </CardTitle>
                      <CardDescription className="mt-1">{template.description}</CardDescription>
                    </div>
                  </div>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => handleTemplateToggle(template.id, !!checked)}
                  />
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      <Repeat className="h-3 w-3 mr-1" />
                      {getRecurrenceText(template)}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {category.name}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Action Button */}
      <div className="flex gap-3">
        <Button onClick={handleAddSelected} disabled={selectedTemplates.length === 0} className="flex-1">
          <Plus className="h-4 w-4 mr-2" />
          Add {selectedTemplates.length} Reminder{selectedTemplates.length !== 1 ? "s" : ""}
        </Button>
      </div>
    </div>
  )
}
