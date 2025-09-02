"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calendar, Filter, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ReminderHistoryItem } from "@/components/reminder-history-item"
import { storage } from "@/lib/storage"
import { useReminders } from "@/lib/hooks/use-reminders"
import type { ReminderExecution } from "@/lib/types"

export default function HistoryPage() {
  const router = useRouter()
  const { reminders } = useReminders()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")

  const executions = storage.getExecutions()

  // Filter and sort executions
  const filteredExecutions = useMemo(() => {
    let filtered = [...executions]

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((execution) => {
        const reminder = reminders.find((r) => r.id === execution.reminderId)
        return (
          reminder?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          reminder?.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((execution) => execution.status === statusFilter)
    }

    // Filter by date
    if (dateFilter !== "all") {
      const now = new Date()
      const filterDate = new Date()

      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          filtered = filtered.filter((execution) => {
            const executionDate = new Date(execution.scheduledTime)
            return executionDate >= filterDate
          })
          break
        case "week":
          filterDate.setDate(now.getDate() - 7)
          filtered = filtered.filter((execution) => {
            const executionDate = new Date(execution.scheduledTime)
            return executionDate >= filterDate
          })
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          filtered = filtered.filter((execution) => {
            const executionDate = new Date(execution.scheduledTime)
            return executionDate >= filterDate
          })
          break
      }
    }

    // Sort by scheduled time (newest first)
    return filtered.sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime())
  }, [executions, reminders, searchQuery, statusFilter, dateFilter])

  // Group executions by date
  const groupedExecutions = useMemo(() => {
    const groups: Record<string, ReminderExecution[]> = {}

    filteredExecutions.forEach((execution) => {
      const date = new Date(execution.scheduledTime).toDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(execution)
    })

    return groups
  }, [filteredExecutions])

  const formatGroupDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else {
      return new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      }).format(date)
    }
  }

  // Calculate summary stats
  const totalExecutions = filteredExecutions.length
  const completedExecutions = filteredExecutions.filter((e) => e.status === "completed").length
  const completionRate = totalExecutions > 0 ? Math.round((completedExecutions / totalExecutions) * 100) : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">History</h1>
            <p className="text-sm text-muted-foreground">Your reminder activity log</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{totalExecutions}</div>
              <div className="text-sm text-muted-foreground">Total Reminders</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{completedExecutions}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-accent">{completionRate}%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search reminders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
                    <SelectItem value="missed">Missed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Time Period</label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History List */}
        <div className="space-y-6">
          {Object.keys(groupedExecutions).length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No history found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== "all" || dateFilter !== "all"
                    ? "Try adjusting your filters to see more results"
                    : "Your reminder history will appear here once you start using the app"}
                </p>
                {(searchQuery || statusFilter !== "all" || dateFilter !== "all") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("")
                      setStatusFilter("all")
                      setDateFilter("all")
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedExecutions).map(([dateString, dayExecutions]) => (
              <div key={dateString} className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground sticky top-20 bg-background/80 backdrop-blur-sm py-2">
                  {formatGroupDate(dateString)}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({dayExecutions.length} reminder{dayExecutions.length !== 1 ? "s" : ""})
                  </span>
                </h3>
                <div className="space-y-2">
                  {dayExecutions.map((execution) => {
                    const reminder = reminders.find((r) => r.id === execution.reminderId)
                    return <ReminderHistoryItem key={execution.id} execution={execution} reminder={reminder} />
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
