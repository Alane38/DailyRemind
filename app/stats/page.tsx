"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Target, Calendar, Flame, TrendingUp, Clock, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsCard } from "@/components/stats-card"
import { useAppStats } from "@/lib/hooks/use-app-stats"
import { useReminders } from "@/lib/hooks/use-reminders"
import { storage } from "@/lib/storage"
import { REMINDER_CATEGORIES } from "@/lib/constants"

export default function StatsPage() {
  const router = useRouter()
  const { stats, loading } = useAppStats()
  const { reminders } = useReminders()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading statistics...</p>
        </div>
      </div>
    )
  }

  // Calculate additional stats
  const allStats = storage.getStats()
  const reminderStats = Object.values(allStats)
  const totalCompletionRate =
    reminderStats.length > 0
      ? Math.round(reminderStats.reduce((sum, stat) => sum + stat.completionRate, 0) / reminderStats.length)
      : 0

  const longestStreak = reminderStats.length > 0 ? Math.max(...reminderStats.map((stat) => stat.streak)) : 0

  const totalRemindersCompleted = reminderStats.reduce((sum, stat) => sum + stat.totalCompleted, 0)

  // Category breakdown
  const categoryStats = reminders.reduce(
    (acc, reminder) => {
      const category = reminder.category
      const reminderStat = allStats[reminder.id]

      if (!acc[category]) {
        acc[category] = {
          name: REMINDER_CATEGORIES[category].name,
          total: 0,
          completed: 0,
          completionRate: 0,
        }
      }

      acc[category].total += reminderStat?.totalScheduled || 0
      acc[category].completed += reminderStat?.totalCompleted || 0

      return acc
    },
    {} as Record<string, any>,
  )

  // Calculate completion rates for categories
  Object.values(categoryStats).forEach((category: any) => {
    category.completionRate = category.total > 0 ? Math.round((category.completed / category.total) * 100) : 0
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Statistics</h1>
            <p className="text-sm text-muted-foreground">Your health reminder progress</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Today's Progress"
            value={`${stats.today.completed}/${stats.today.total}`}
            progress={stats.today.completionRate}
            icon={<Target className="h-4 w-4" />}
          />
          <StatsCard
            title="This Week"
            value={`${stats.week.completed}/${stats.week.total}`}
            progress={stats.week.completionRate}
            icon={<Calendar className="h-4 w-4" />}
          />
          <StatsCard
            title="Longest Streak"
            value={longestStreak}
            description={longestStreak > 0 ? "consecutive days" : "Start your streak!"}
            icon={<Flame className="h-4 w-4" />}
          />
          <StatsCard
            title="Total Completed"
            value={totalRemindersCompleted}
            description="all time reminders"
            icon={<CheckCircle className="h-4 w-4" />}
          />
        </div>

        {/* Overall Completion Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Overall Completion Rate
            </CardTitle>
            <CardDescription>Your average completion rate across all reminders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">{totalCompletionRate}%</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {totalCompletionRate >= 80
                    ? "Excellent!"
                    : totalCompletionRate >= 60
                      ? "Good progress!"
                      : "Keep going!"}
                </p>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full transition-all duration-500"
                  style={{ width: `${totalCompletionRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>Performance by reminder category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(categoryStats).map(([key, category]) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{category.name}</span>
                    <div className="text-sm text-muted-foreground">
                      {category.completed}/{category.total} ({category.completionRate}%)
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${category.completionRate}%` }}
                    />
                  </div>
                </div>
              ))}
              {Object.keys(categoryStats).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No data available yet</p>
                  <p className="text-sm">Complete some reminders to see your stats</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Individual Reminder Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Individual Reminders</CardTitle>
            <CardDescription>Detailed stats for each reminder</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reminders.map((reminder) => {
                const reminderStat = allStats[reminder.id]
                if (!reminderStat) return null

                return (
                  <div key={reminder.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{reminder.title}</h4>
                      <div className="text-sm text-muted-foreground">{reminderStat.completionRate}% completion</div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-green-600">{reminderStat.totalCompleted}</div>
                        <div className="text-muted-foreground">Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-orange-600">{reminderStat.totalDismissed}</div>
                        <div className="text-muted-foreground">Dismissed</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-red-600">{reminderStat.totalMissed}</div>
                        <div className="text-muted-foreground">Missed</div>
                      </div>
                    </div>

                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${reminderStat.completionRate}%` }}
                      />
                    </div>

                    {reminderStat.streak > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <span>{reminderStat.streak} day streak</span>
                      </div>
                    )}
                  </div>
                )
              })}

              {reminders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No reminders found</p>
                  <p className="text-sm">Add some reminders to track your progress</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
