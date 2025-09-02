"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PredefinedReminders } from "@/components/predefined-reminders"
import { useReminders } from "@/lib/hooks/use-reminders"
import { DEFAULT_REMINDER_TEMPLATES } from "@/lib/constants"
import { generateReminderId } from "@/lib/utils/reminder-utils"
import type { Reminder } from "@/lib/types"

export default function TemplatesPage() {
  const router = useRouter()
  const { addReminder } = useReminders()

  const handleAddReminders = (templateIds: string[]) => {
    const selectedTemplates = DEFAULT_REMINDER_TEMPLATES.filter((template) => templateIds.includes(template.id))

    selectedTemplates.forEach((template) => {
      const newReminder: Reminder = {
        id: generateReminderId(),
        title: template.title,
        description: template.description,
        category: template.category,
        recurrence: template.defaultRecurrence,
        status: "active",
        isEnabled: true,
        soundEnabled: true,
        vibrationEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      addReminder(newReminder)
    })

    router.push("/")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Reminder Templates</h1>
            <p className="text-sm text-muted-foreground">Add predefined health reminders</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <PredefinedReminders
          onAddReminders={handleAddReminders}
          title="Add Reminder Templates"
          description="Choose from our collection of health-focused reminder templates"
          showSelectAll={true}
        />
      </main>
    </div>
  )
}
