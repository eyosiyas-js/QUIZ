"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import confetti from "canvas-confetti"
import { Trophy, Award, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMobile } from "@/hooks/use-mobile"
import { useSiteConfig } from "@/context/site-config-context"

interface CelebrationScreenProps {
  score: number
  totalQuestions: number
}

// Define performance levels
type PerformanceLevel = "perfect" | "high" | "medium" | "low"

export default function CelebrationScreen({ score, totalQuestions }: CelebrationScreenProps) {
  const [countdown, setCountdown] = useState(3)
  const router = useRouter()
  const isMobile = useMobile()
  const { config } = useSiteConfig()

  const celebConfig = config?.pages?.celebration
  const theme = config?.theme
  const gradientFrom = theme?.primaryGradientFrom || "#0b1236"
  const gradientVia = theme?.primaryGradientVia || "#0f1a4a"
  const gradientTo = theme?.primaryGradientTo || "#091029"
  const redirectDelay = celebConfig?.redirectDelay || 3

  // Calculate performance level
  const percentage = (score / totalQuestions) * 100
  const performanceLevel: PerformanceLevel =
    percentage === 100 ? "perfect" : percentage >= 80 ? "high" : percentage >= 50 ? "medium" : "low"

  useEffect(() => {
    setCountdown(redirectDelay)
  }, [redirectDelay])

  useEffect(() => {
    // Trigger confetti celebration based on performance level
    const duration = performanceLevel === "low" ? 1 * 1000 : performanceLevel === "medium" ? 2 * 1000 : 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    // Initial bursts - more intense for better performance
    if (performanceLevel === "perfect" || performanceLevel === "high") {
      confetti({
        particleCount: performanceLevel === "perfect" ? 150 : 100,
        spread: performanceLevel === "perfect" ? 90 : 70,
        origin: { x: 0.1, y: 0.5 },
        colors: performanceLevel === "perfect" ? ["#FFD700", "#FFA500", "#FFFFFF"] : undefined,
      })

      confetti({
        particleCount: performanceLevel === "perfect" ? 150 : 100,
        spread: performanceLevel === "perfect" ? 90 : 70,
        origin: { x: 0.9, y: 0.5 },
        colors: performanceLevel === "perfect" ? ["#FFD700", "#FFA500", "#FFFFFF"] : undefined,
      })
    } else if (performanceLevel === "medium") {
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { x: 0.5, y: 0.5 },
      })
    } else {
      confetti({
        particleCount: 20,
        spread: 30,
        origin: { x: 0.5, y: 0.5 },
      })
    }

    // Continuous confetti during celebration - only for high and perfect performers
    let interval: NodeJS.Timeout | null = null

    if (performanceLevel === "perfect" || performanceLevel === "high") {
      interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          if (interval) clearInterval(interval)
          return
        }

        const particleCount = 50 * (timeLeft / duration)

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: randomInRange(0.1, 0.3) },
          colors: performanceLevel === "perfect" ? ["#FFD700", "#FFA500", "#FFFFFF"] : undefined,
        })

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: randomInRange(0.1, 0.3) },
          colors: performanceLevel === "perfect" ? ["#FFD700", "#FFA500", "#FFFFFF"] : undefined,
        })
      }, 250)
    }

    // Countdown timer to redirect to results
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          router.push("/results", { shallow: true })
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Store quiz completion status in localStorage
    localStorage.setItem("quizCompleted", "true")

    return () => {
      if (interval) clearInterval(interval)
      clearInterval(countdownInterval)
    }
  }, [router, performanceLevel])

  // Get celebration content based on performance level
  const getCelebrationContent = () => {
    switch (performanceLevel) {
      case "perfect":
        return {
          icon: <Trophy className={`${isMobile ? "h-20 w-20" : "h-32 w-32"} text-yellow-400 mx-auto mb-4 sm:mb-6`} />,
          title: celebConfig?.perfectTitle || "Perfect Score!",
          message: celebConfig?.perfectMessage || "Incredible! You've earned maximum contest entries!",
          iconAnimation: {
            scale: [1, 1.3, 1],
            rotate: [0, 10, -10, 0],
            duration: 2,
          },
          titleColor: "text-yellow-300",
        }
      case "high":
        return {
          icon: <Trophy className={`${isMobile ? "h-20 w-20" : "h-32 w-32"} text-yellow-400 mx-auto mb-4 sm:mb-6`} />,
          title: celebConfig?.highTitle || "Excellent Work!",
          message: celebConfig?.highMessage || "Great job on completing the quiz!",
          iconAnimation: {
            scale: [1, 1.2, 1],
            rotate: [0, 5, -5, 0],
            duration: 1.5,
          },
          titleColor: "text-white",
        }
      case "medium":
        return {
          icon: <Award className={`${isMobile ? "h-20 w-20" : "h-32 w-32"} text-blue-400 mx-auto mb-4 sm:mb-6`} />,
          title: celebConfig?.mediumTitle || "Quiz Complete!",
          message: celebConfig?.mediumMessage || "Good effort on the quiz!",
          iconAnimation: {
            scale: [1, 1.1, 1],
            rotate: [0, 3, -3, 0],
            duration: 1.5,
          },
          titleColor: "text-white",
        }
      case "low":
        return {
          icon: (
            <AlertCircle className={`${isMobile ? "h-20 w-20" : "h-32 w-32"} text-blue-300 mx-auto mb-4 sm:mb-6`} />
          ),
          title: celebConfig?.lowTitle || "Quiz Complete",
          message: celebConfig?.lowMessage || "You've completed the quiz. Keep practicing!",
          iconAnimation: {
            scale: [1, 1.05, 1],
            duration: 1.5,
          },
          titleColor: "text-white",
        }
    }
  }

  const celebrationContent = getCelebrationContent()

  return (
    <div
      className={`w-full ${isMobile ? "h-[400px]" : "h-[600px]"} flex flex-col items-center justify-center relative`}
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: `linear-gradient(to bottom right, ${gradientFrom}, ${gradientVia}, ${gradientTo})`,
        }}
      />

      {/* Content */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center z-10 px-4"
      >
        <motion.div
          animate={{
            scale: celebrationContent.iconAnimation.scale,
            rotate: celebrationContent.iconAnimation.rotate || 0,
          }}
          transition={{
            duration: celebrationContent.iconAnimation.duration,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        >
          {celebrationContent.icon}
        </motion.div>

        <motion.h1
          className={`${isMobile ? "text-3xl sm:text-4xl" : "text-5xl sm:text-6xl"} font-bold ${celebrationContent.titleColor} mb-2 sm:mb-4`}
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        >
          {celebrationContent.title}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className={`${isMobile ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"} font-bold mb-2 sm:mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-300`}
        >
          Your Score: {score}/{totalQuestions}
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className={`${isMobile ? "text-base sm:text-lg" : "text-lg sm:text-xl"} text-white/80 mb-4`}
        >
          {celebrationContent.message}
        </motion.p>

        <motion.div
          className={`${isMobile ? "text-xl" : "text-2xl"} text-white/80`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          {celebConfig?.redirectText || "Showing results in"}{" "}
          <span className={`${isMobile ? "text-2xl" : "text-3xl"} font-bold text-white`}>{countdown} seconds</span>
        </motion.div>
      </motion.div>

      {/* Decorative elements - fewer on mobile */}
      {!isMobile && (
        <>
          <div className="absolute top-10 left-10">
            <motion.div
              className="h-8 w-8 rounded-full bg-blue-500"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            />
          </div>

          <div className="absolute bottom-10 right-10">
            <motion.div
              className="h-8 w-8 rounded-full bg-cyan-500"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: 0.5 }}
            />
          </div>
        </>
      )}

      <div className="absolute top-10 right-20">
        <motion.div
          className={`${isMobile ? "h-4 w-4" : "h-6 w-6"} rounded-full bg-cyan-500`}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: 1 }}
        />
      </div>

      <div className="absolute bottom-20 left-20">
        <motion.div
          className={`${isMobile ? "h-4 w-4" : "h-6 w-6"} rounded-full bg-blue-500`}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: 1.5 }}
        />
      </div>
    </div>
  )
}
