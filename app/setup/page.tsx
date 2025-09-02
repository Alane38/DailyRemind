"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Bell, ArrowRight, CheckCircle } from "lucide-react"
import { PredefinedReminders } from "@/components/predefined-reminders"
import { NotificationPermission } from "@/components/notification-permission"
import { useSetup } from "@/lib/hooks/use-setup"
import { useNotifications } from "@/lib/hooks/use-notifications"

export default function SetupPage() {
  const router = useRouter()
  const { completeSetup } = useSetup()
  const { scheduleAllReminders } = useNotifications()
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedReminders, setSelectedReminders] = useState<string[]>([])

  const steps = [
    {
      title: "Welcome to DailyRemind",
      description: "Your personal health reminder companion",
      content: (
        <div className="text-center space-y-6">
          <div className="p-6 rounded-full bg-primary/10 w-24 h-24 mx-auto flex items-center justify-center">
            <Bell className="h-12 w-12 text-primary" />
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Build Healthy Habits</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              DailyRemind helps you maintain good posture, protect your vision, and develop wellness habits through
              gentle, timely reminders.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 max-w-sm mx-auto">
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
              <span>Customizable reminder schedules</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
              <span>Health-focused reminder templates</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
              <span>Progress tracking and statistics</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Enable Notifications",
      description: "Get reminders even when the app is closed",
      content: (
        <NotificationPermission
          onPermissionGranted={() => {
            // Auto-advance to next step when permission is granted
            setTimeout(() => setCurrentStep(2), 1000)
          }}
        />
      ),
    },
    {
      title: "Choose Your Reminders",
      description: "Select the health reminders that matter to you",
      content: (
        <PredefinedReminders
          onAddReminders={(templateIds) => setSelectedReminders(templateIds)}
          title="Choose Your Health Reminders"
          description="Select the reminders that will help you build healthy habits"
        />
      ),
    },
  ]

  const currentStepData = steps[currentStep]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleFinish = async () => {
    const success = completeSetup(selectedReminders)
    if (success) {
      // Schedule notifications for selected reminders
      await scheduleAllReminders()
      router.push("/")
    }
  }

  const handleSkip = () => {
    completeSetup([])
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(((currentStep + 1) / steps.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="p-8">{currentStepData.content}</CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button variant="ghost" onClick={handleSkip}>
            Skip setup
          </Button>

          <div className="flex gap-3">
            {currentStep === 0 && (
              <Button onClick={handleNext}>
                Get Started
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {currentStep === 1 && (
              <Button onClick={handleNext}>
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {currentStep === 2 && (
              <Button onClick={handleFinish}>
                Complete Setup
                <CheckCircle className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
