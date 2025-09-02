"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { X, Plus, Repeat } from "lucide-react"
import type { Reminder, ReminderCategory, RecurrenceType, TimeSlot } from "@/lib/types"
import { REMINDER_CATEGORIES, DEFAULT_REMINDER_TEMPLATES } from "@/lib/constants"
import { generateReminderId } from "@/lib/utils/reminder-utils"

interface ReminderFormProps {
  reminder?: Reminder
  onSave: (reminder: Reminder) => void
  onCancel: () => void
}

export function ReminderForm({ reminder, onSave, onCancel }: ReminderFormProps) {
  const [title, setTitle] = useState(reminder?.title || "")
  const [description, setDescription] = useState(reminder?.description || "")
  const [category, setCategory] = useState<ReminderCategory>(reminder?.category || "custom")
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(reminder?.recurrence.type || "interval")
  const [intervalMinutes, setIntervalMinutes] = useState(reminder?.recurrence.intervalMinutes || 30)
  const [isCustomInterval, setIsCustomInterval] = useState(false)
  const [dailyTime, setDailyTime] = useState(reminder?.recurrence.dailyTime || { hour: 9, minute: 0 })
  const [multipleTimes, setMultipleTimes] = useState<TimeSlot[]>(
    reminder?.recurrence.multipleTimes || [{ hour: 9, minute: 0 }],
  )
  const [isEnabled, setIsEnabled] = useState(reminder?.isEnabled ?? true)
  const [soundEnabled, setSoundEnabled] = useState(reminder?.soundEnabled ?? true)
  const [vibrationEnabled, setVibrationEnabled] = useState(reminder?.vibrationEnabled ?? true)

  const handleSave = () => {
    if (!title.trim()) return

    const newReminder: Reminder = {
      id: reminder?.id || generateReminderId(),
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      recurrence: {
        type: recurrenceType,
        ...(recurrenceType === "interval" && { intervalMinutes }),
        ...(recurrenceType === "daily" && { dailyTime }),
        ...(recurrenceType === "multiple" && { multipleTimes }),
      },
      status: "active",
      isEnabled,
      soundEnabled,
      vibrationEnabled,
      createdAt: reminder?.createdAt || new Date(),
      updatedAt: new Date(),
    }

    onSave(newReminder)
  }

  const addTimeSlot = () => {
    setMultipleTimes([...multipleTimes, { hour: 12, minute: 0 }])
  }

  const removeTimeSlot = (index: number) => {
    setMultipleTimes(multipleTimes.filter((_, i) => i !== index))
  }

  const updateTimeSlot = (index: number, timeSlot: TimeSlot) => {
    const updated = [...multipleTimes]
    updated[index] = timeSlot
    setMultipleTimes(updated)
  }

  const loadTemplate = (templateId: string) => {
    const template = DEFAULT_REMINDER_TEMPLATES.find((t) => t.id === templateId)
    if (template) {
      setTitle(template.title)
      setDescription(template.description)
      setCategory(template.category)
      setRecurrenceType(template.defaultRecurrence.type)
      if (template.defaultRecurrence.intervalMinutes) {
        setIntervalMinutes(template.defaultRecurrence.intervalMinutes)
      }
      if (template.defaultRecurrence.multipleTimes) {
        setMultipleTimes(template.defaultRecurrence.multipleTimes)
      }
    }
  }

  const handleIntervalChange = (value: string) => {
    if (value === "custom") {
      setIsCustomInterval(true)
      setIntervalMinutes(60) // Default to 60 minutes for custom
    } else {
      setIsCustomInterval(false)
      setIntervalMinutes(Number(value))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{reminder ? "Edit Reminder" : "Add New Reminder"}</h2>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Quick Templates */}
      {!reminder && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Templates</CardTitle>
            <CardDescription>Start with a predefined reminder</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
              {DEFAULT_REMINDER_TEMPLATES.filter((t) => t.isDefault).map((template) => (
                <Button
                  key={template.id}
                  variant="outline"
                  className="justify-start h-auto p-3 bg-transparent"
                  onClick={() => loadTemplate(template.id)}
                >
                  <div className="text-left">
                    <div className="font-medium">{template.title}</div>
                    <div className="text-sm text-muted-foreground">{template.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter reminder title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a helpful description"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={(value: ReminderCategory) => setCategory(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(REMINDER_CATEGORIES).map(([key, cat]) => (
                  <SelectItem key={key} value={key}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Recurrence Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Repeat className="h-4 w-4" />
            Recurrence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select value={recurrenceType} onValueChange={(value: RecurrenceType) => setRecurrenceType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="interval">Every X minutes</SelectItem>
                <SelectItem value="daily">Once daily</SelectItem>
                <SelectItem value="multiple">Multiple times daily</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {recurrenceType === "interval" && (
            <div className="space-y-2">
              <Label>Interval (minutes)</Label>
              <Select
                value={isCustomInterval ? "custom" : intervalMinutes.toString()}
                onValueChange={handleIntervalChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">Every 15 minutes</SelectItem>
                  <SelectItem value="20">Every 20 minutes</SelectItem>
                  <SelectItem value="30">Every 30 minutes</SelectItem>
                  <SelectItem value="60">Every hour</SelectItem>
                  <SelectItem value="120">Every 2 hours</SelectItem>
                  <SelectItem value="custom">Custom interval</SelectItem>
                </SelectContent>
              </Select>

              {isCustomInterval && (
                <div className="space-y-2">
                  <Label>Custom interval (minutes)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="1440"
                    value={intervalMinutes}
                    onChange={(e) => setIntervalMinutes(Number(e.target.value) || 1)}
                    placeholder="Enter minutes (1-1440)"
                  />
                </div>
              )}
            </div>
          )}

          {recurrenceType === "daily" && (
            <div className="space-y-2">
              <Label>Time</Label>
              <div className="flex gap-2">
                <Select
                  value={dailyTime.hour.toString()}
                  onValueChange={(value) => setDailyTime({ ...dailyTime, hour: Number(value) })}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i.toString().padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="flex items-center">:</span>
                <Select
                  value={dailyTime.minute.toString()}
                  onValueChange={(value) => setDailyTime({ ...dailyTime, minute: Number(value) })}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 15, 30, 45].map((minute) => (
                      <SelectItem key={minute} value={minute.toString()}>
                        {minute.toString().padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {recurrenceType === "multiple" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Times</Label>
                <Button variant="outline" size="sm" onClick={addTimeSlot}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Time
                </Button>
              </div>
              <div className="space-y-2">
                {multipleTimes.map((timeSlot, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Select
                      value={timeSlot.hour.toString()}
                      onValueChange={(value) => updateTimeSlot(index, { ...timeSlot, hour: Number(value) })}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {i.toString().padStart(2, "0")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span>:</span>
                    <Select
                      value={timeSlot.minute.toString()}
                      onValueChange={(value) => updateTimeSlot(index, { ...timeSlot, minute: Number(value) })}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 15, 30, 45].map((minute) => (
                          <SelectItem key={minute} value={minute.toString()}>
                            {minute.toString().padStart(2, "0")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {multipleTimes.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeTimeSlot(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Reminder</Label>
              <p className="text-sm text-muted-foreground">Turn this reminder on or off</p>
            </div>
            <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Sound</Label>
              <p className="text-sm text-muted-foreground">Play notification sound</p>
            </div>
            <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Vibration</Label>
              <p className="text-sm text-muted-foreground">Vibrate on notification</p>
            </div>
            <Switch checked={vibrationEnabled} onCheckedChange={setVibrationEnabled} />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={!title.trim()} className="flex-1">
          {reminder ? "Update Reminder" : "Create Reminder"}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
