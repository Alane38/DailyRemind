"use client"
import { useRouter } from "next/navigation"
import { ReminderForm } from "@/components/reminder-form"
import type { Reminder } from "@/lib/types"
import { useReminders } from "@/lib/hooks/use-reminders"

export default function AddReminderPage() {
  const router = useRouter()
  const { addReminder } = useReminders()

  const handleSave = (reminder: Reminder) => {
    addReminder(reminder)
    router.push("/")
  }

  const handleCancel = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <ReminderForm onSave={handleSave} onCancel={handleCancel} />
      </div>
    </div>
  )
}
