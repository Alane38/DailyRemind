"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bell, BellOff, Smartphone, AlertTriangle } from "lucide-react"
import { useNotifications } from "@/lib/hooks/use-notifications"

interface NotificationPermissionProps {
  onPermissionGranted?: () => void
  showCard?: boolean
}

export function NotificationPermission({ onPermissionGranted, showCard = true }: NotificationPermissionProps) {
  const { isSupported, isPermissionGranted, loading, reinitialize } = useNotifications()
  const [requesting, setRequesting] = useState(false)

  const handleRequestPermission = async () => {
    setRequesting(true)
    try {
      await reinitialize()
      if (onPermissionGranted) {
        onPermissionGranted()
      }
    } catch (error) {
      console.error("Failed to request permission:", error)
    } finally {
      setRequesting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-pulse" />
          <p className="text-sm text-muted-foreground">Checking notification support...</p>
        </CardContent>
      </Card>
    )
  }

  if (!isSupported) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Notifications are not supported on this device or browser. Reminders will only work while the app is open.
        </AlertDescription>
      </Alert>
    )
  }

  if (isPermissionGranted) {
    return showCard ? (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="p-3 rounded-full bg-primary/10 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
            <Bell className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-medium mb-1">Notifications Enabled</h3>
          <p className="text-sm text-muted-foreground">You'll receive reminders even when the app is closed</p>
        </CardContent>
      </Card>
    ) : null
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="p-3 rounded-full bg-muted w-16 h-16 mx-auto mb-3 flex items-center justify-center">
          <BellOff className="h-8 w-8 text-muted-foreground" />
        </div>
        <CardTitle className="text-lg">Enable Notifications</CardTitle>
        <CardDescription>Allow DailyRemind to send you health reminders even when the app is closed</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-sm">
            <Smartphone className="h-4 w-4 text-primary flex-shrink-0" />
            <span>Receive reminders on your device</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Bell className="h-4 w-4 text-primary flex-shrink-0" />
            <span>Works even when app is closed</span>
          </div>
        </div>

        <Button onClick={handleRequestPermission} disabled={requesting} className="w-full">
          {requesting ? "Requesting Permission..." : "Enable Notifications"}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          You can change this setting later in your device settings
        </p>
      </CardContent>
    </Card>
  )
}
