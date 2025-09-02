"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, Plus, Settings, Sparkles, TrendingUp, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ReminderCard } from "@/components/reminder-card"
import { ReminderForm } from "@/components/reminder-form"
import type { Reminder } from "@/lib/types"
import { useReminders } from "@/lib/hooks/use-reminders"
import { useAppStats } from "@/lib/hooks/use-app-stats"
import { useSetup } from "@/lib/hooks/use-setup"

export default function HomePage() {
  const router = useRouter()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)

  const { isSetupCompleted, loading: setupLoading } = useSetup()
  const {
    reminders,
    activeReminders,
    loading: remindersLoading,
    error,
    addReminder,
    updateReminder,
    deleteReminder,
    toggleReminder,
  } = useReminders()

  const { stats, loading: statsLoading } = useAppStats()

  // Redirect to setup if not completed
  useEffect(() => {
    if (!setupLoading && isSetupCompleted === false) {
      router.push("/setup")
    }
  }, [isSetupCompleted, setupLoading, router])

  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder)
  }

  const handleSaveReminder = (reminder: Reminder) => {
    if (editingReminder) {
      updateReminder(reminder)
      setEditingReminder(null)
    } else {
      addReminder(reminder)
      setShowAddForm(false)
    }
  }

  const handleCancelForm = () => {
    setShowAddForm(false)
    setEditingReminder(null)
  }

  // Show loading while checking setup status
  if (setupLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading DailyRemind...</p>
        </div>
      </div>
    )
  }

  // Don't render if setup not completed (will redirect)
  if (isSetupCompleted === false) {
    return null
  }

  if (showAddForm || editingReminder) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <ReminderForm
            reminder={editingReminder || undefined}
            onSave={handleSaveReminder}
            onCancel={handleCancelForm}
          />
        </div>
      </div>
    )
  }

  if (remindersLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading your reminders...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">DailyRemind</h1>
              <p className="text-sm text-muted-foreground">Your wellness companion</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => router.push("/settings")}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.activeReminders}</div>
              <div className="text-sm text-muted-foreground">Active Reminders</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-accent">{stats.today.completed}</div>
              <div className="text-sm text-muted-foreground">Today's Completed</div>
            </CardContent>
          </Card>
        </div>

        {/* Active Reminders */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Your Reminders</h2>
            <Button size="sm" className="gap-2" onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4" />
              Add Reminder
            </Button>
          </div>

          {/* Reminder Cards */}
          <div className="space-y-3">
            {reminders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No reminders yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first reminder to start building healthy habits
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => setShowAddForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Custom Reminder
                    </Button>
                    <Button variant="outline" onClick={() => router.push("/templates")}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Browse Templates
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              reminders.map((reminder) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  onToggle={toggleReminder}
                  onEdit={handleEditReminder}
                  onDelete={deleteReminder}
                  nextNotification={reminder.nextNotification}
                />
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" className="h-16 flex-col gap-2 bg-transparent" onClick={() => setShowAddForm(true)}>
            <Plus className="h-5 w-5" />
            <span className="text-sm">Add Custom</span>
          </Button>
          <Button
            variant="outline"
            className="h-16 flex-col gap-2 bg-transparent"
            onClick={() => router.push("/templates")}
          >
            <Sparkles className="h-5 w-5" />
            <span className="text-sm">Browse Templates</span>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="h-16 flex-col gap-2 bg-transparent"
            onClick={() => router.push("/stats")}
          >
            <TrendingUp className="h-5 w-5" />
            <span className="text-sm">View Statistics</span>
          </Button>
          <Button
            variant="outline"
            className="h-16 flex-col gap-2 bg-transparent"
            onClick={() => router.push("/history")}
          >
            <History className="h-5 w-5" />
            <span className="text-sm">View History</span>
          </Button>
        </div>
      </main>
    </div>
  )
}
