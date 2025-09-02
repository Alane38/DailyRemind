"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Bell, Sun, Trash2, Download, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { usePreferences } from "@/lib/hooks/use-preferences"
import { useReminders } from "@/lib/hooks/use-reminders"
import { StorageService } from "@/lib/storage"

export default function SettingsPage() {
  const router = useRouter()
  const { preferences, updatePreferences } = usePreferences()
  const { reminders, clearAllReminders } = useReminders()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleExportData = () => {
    const data = {
      reminders,
      preferences,
      exportDate: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `dailyremind-backup-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (data.reminders && data.preferences) {
          // Import data (this would need proper implementation)
          console.log("Import data:", data)
          alert("Import functionality would be implemented here")
        }
      } catch (error) {
        alert("Invalid backup file")
      }
    }
    reader.readAsText(file)
  }

  const handleDeleteAllData = () => {
    if (showDeleteConfirm) {
      clearAllReminders()
      StorageService.clearAll()
      setShowDeleteConfirm(false)
      router.push("/setup")
    } else {
      setShowDeleteConfirm(true)
    }
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
            <h1 className="text-xl font-semibold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your preferences</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6 max-w-2xl">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Configure how you receive reminders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive reminder notifications</p>
              </div>
              <Switch
                checked={preferences.notificationsEnabled}
                onCheckedChange={(checked) => updatePreferences({ notificationsEnabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Sound</Label>
                <p className="text-sm text-muted-foreground">Play sound with notifications</p>
              </div>
              <Switch
                checked={preferences.soundEnabled}
                onCheckedChange={(checked) => updatePreferences({ soundEnabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Vibration</Label>
                <p className="text-sm text-muted-foreground">Vibrate on notifications</p>
              </div>
              <Switch
                checked={preferences.vibrationEnabled}
                onCheckedChange={(checked) => updatePreferences({ vibrationEnabled: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>Customize the app appearance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Dark Mode</Label>
                <p className="text-sm text-muted-foreground">Use dark theme</p>
              </div>
              <Switch
                checked={preferences.theme === "dark"}
                onCheckedChange={(checked) => updatePreferences({ theme: checked ? "dark" : "light" })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>Backup, restore, or reset your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportData} className="flex-1 bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => document.getElementById("import-file")?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Data
              </Button>
              <input id="import-file" type="file" accept=".json" className="hidden" onChange={handleImportData} />
            </div>

            <div className="pt-4 border-t">
              <Button
                variant={showDeleteConfirm ? "destructive" : "outline"}
                onClick={handleDeleteAllData}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {showDeleteConfirm ? "Confirm Delete All Data" : "Delete All Data"}
              </Button>
              {showDeleteConfirm && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Click again to permanently delete all reminders and data
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card>
          <CardHeader>
            <CardTitle>About DailyRemind</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Version: 1.0.0</p>
              <p>Your wellness companion for building healthy habits</p>
              <p>Total reminders: {reminders.length}</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
