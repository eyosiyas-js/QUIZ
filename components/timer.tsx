"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Clock } from "lucide-react"

interface TimerProps {
  duration: number // in seconds
  onTimeUp: () => void
  isActive: boolean
}

export default function Timer({ duration, onTimeUp, isActive }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration)

  // Reset timer when duration changes or when isActive becomes true
  useEffect(() => {
    if (isActive) {
      setTimeLeft(duration)
    }
  }, [duration, isActive])

  useEffect(() => {
    if (!isActive) return

    const interval = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(interval)
          onTimeUp()
          return 0
        }
        return prevTime - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, onTimeUp])

  // Calculate percentage for visual indicator
  const percentage = (timeLeft / duration) * 100

  // Determine color based on time left
  const getColor = () => {
    if (timeLeft > duration * 0.6) return "bg-green-500"
    if (timeLeft > duration * 0.3) return "bg-yellow-500"
    return "bg-red-500"
  }

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex items-center space-x-2 mb-2 sm:mb-0">
      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white/80 flex-shrink-0" />
      <div className="w-full max-w-[200px] h-5 sm:h-6 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm relative">
        <motion.div
          className={`h-full ${getColor()} transition-colors duration-300`}
          initial={{ width: "100%" }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "linear" }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-xs sm:text-sm font-medium text-white">
          {formatTime(timeLeft)}
        </div>
      </div>
    </div>
  )
}
