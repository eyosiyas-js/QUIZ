'use client'
// @ts-nocheck

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Trophy,
  ArrowLeft,
  Gift,
  Crown,
  Phone,
  Clock,
  AlertCircle,
} from 'lucide-react'
import confetti from 'canvas-confetti'
import LotteryAnimation from '@/components/lottery-animation'
import { useQuizContext } from '@/context/quiz-context'
import { useSiteConfig } from '@/context/site-config-context'
import api from '@/lib/api'
import emailjs from '@emailjs/browser'

type Contestant = {
  id: string
  name: string
  phone: string
}

export default function LotteryPage() {
  const router = useRouter()
  const { userInfo } = useQuizContext()
  const { config } = useSiteConfig()

  const [contestants, setContestants] = useState<Contestant[]>([])
  const [isSelecting, setIsSelecting] = useState(false)
  const [winner, setWinner] = useState<Contestant | null>(null)
  const [showWinner, setShowWinner] = useState(false)
  const [winningDigits, setWinningDigits] = useState('')
  const [error, setError] = useState<string | null>(null)

  // ⏱ Countdown states
  const [countdown, setCountdown] = useState<number | null>(null)
  const [countdownComplete, setCountdownComplete] = useState(false)

  // Config values
  const lotteryConfig = config?.pages?.lottery
  const theme = config?.theme
  const gradientFrom = theme?.primaryGradientFrom || "#0b1236"
  const gradientVia = theme?.primaryGradientVia || "#0f1a4a"
  const gradientTo = theme?.primaryGradientTo || "#091029"
  const countdownDuration = lotteryConfig?.countdownDuration || 30

  /* --------------------------------
     COUNTDOWN EFFECT (SAME LOGIC)
  ---------------------------------*/
  useEffect(() => {
    if (countdown === null) return

    if (countdown > 0 && !countdownComplete) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev! - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }

    if (countdown === 0 && !countdownComplete) {
      setCountdownComplete(true)
      startSelection()
    }
  }, [countdown, countdownComplete])

  /* --------------------------------
     COUNTDOWN HELPERS (SAME UI)
  ---------------------------------*/
  const progressPercentage = countdown !== null ? (countdown / countdownDuration) * 100 : 0

  const getCountdownColor = () => {
    if (countdown > 10) return { ring: '#f59e0b', text: '#fbbf24' }
    return { ring: '#ef4444', text: '#f87171' }
  }

  const countdownColors = countdown !== null ? getCountdownColor() : null

  /* --------------------------------
     AUTH CHECK
  ---------------------------------*/
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) return

    api
      .get(`/auth/verify`)
      .catch(() => router.push('/contest'))
  }, [])

  /* --------------------------------
     START LOTTERY (AFTER COUNTDOWN)
  ---------------------------------*/
  const startSelection = () => {
    const token = localStorage.getItem('auth_token')
    setError(null)

    setCountdown(null)
    setCountdownComplete(false)

    api
      .post(`/lottery/draw/grand`)
      .then((res) => {
        if (!res.data.winner) return

        sendEmail(res.data.email, res.data.winner)

        setContestants([
          {
            id: Math.random().toString(36),
            name: res.data.winner,
            phone: res.data.phone_number,
          },
        ])

        setIsSelecting(true)
        setShowWinner(false)
        setWinner(null)
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Failed to draw lottery')
        setCountdown(null)
      })
  }

  const sendEmail = (email, name) => {
    emailjs.send(
      'service_a9qgnid',
      'template_x71ok73',
      { user_name: name, user_email: email, message: name },
      'oobBCUVi5cpaix--_',
    )
  }

  /* --------------------------------
     PRE-CHECK BEFORE COUNTDOWN
  ---------------------------------*/
  const handleStartClick = async () => {
    setError(null)
    try {
      await api.get('/lottery/check/grand')
      setCountdown(countdownDuration)
      setCountdownComplete(false)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Cannot start lottery at this time.')
    }
  }

  /* --------------------------------
     LOTTERY COMPLETE
  ---------------------------------*/
  const handleLotteryComplete = (digits: string) => {
    setWinningDigits(digits)

    const match = contestants.find(
      (c) => c.phone.replace(/\D/g, '') === digits,
    )

    setWinner(match || contestants[0])
    setIsSelecting(false)

    setTimeout(() => {
      setShowWinner(true)
      triggerConfetti()
    }, 500)
  }

  const triggerConfetti = () => {
    confetti({ particleCount: 150, spread: 100, origin: { x: 0.5, y: 0.3 } })
  }

  /* --------------------------------
     UI
  ---------------------------------*/
  return (
    <main
      className="flex min-h-screen items-center justify-center p-4"
      style={{
        background: `linear-gradient(to bottom right, ${gradientFrom}, ${gradientVia}, ${gradientTo})`,
      }}
    >
      <Card className="w-full max-w-4xl bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader className="text-center">
          <Trophy className="mx-auto h-16 w-16 text-yellow-400" />
          <CardTitle className="text-3xl text-white mt-4">
            {lotteryConfig?.title || "Grand Lottery Prize"}
          </CardTitle>
          <CardDescription className="text-white/70">
            {lotteryConfig?.subtitle || "Countdown starts after clicking the button"}
          </CardDescription>
        </CardHeader>

        <CardContent className="h-80 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {/* ⏱ COUNTDOWN UI */}
            {countdown !== null && countdown > 0 ? (
              <motion.div
                key="countdown"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <div className="relative">
                  <div className="w-56 h-56 rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative">
                    <svg
                      className="absolute inset-0 w-full h-full -rotate-90"
                      viewBox="0 0 100 100"
                    >
                      <circle
                        r="44"
                        cx="50"
                        cy="50"
                        strokeWidth="4"
                        fill="transparent"
                        className="text-white/10"
                        stroke="currentColor"
                      />
                      <motion.circle
                        r="44"
                        cx="50"
                        cy="50"
                        strokeWidth="4"
                        strokeLinecap="round"
                        fill="transparent"
                        stroke="currentColor"
                        className="text-white"
                        initial={{ strokeDasharray: '276.5 276.5' }}
                        animate={{
                          strokeDashoffset:
                            276.5 -
                            (progressPercentage / 100) * 276.5,
                        }}
                      />
                    </svg>

                    <div
                      className="text-6xl font-bold"
                      style={{ color: countdownColors.text }}
                    >
                      {countdown}
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-white/70">
                  Lottery will begin shortly
                </div>
              </motion.div>
            ) : isSelecting ? (
              <LotteryAnimation
                contestants={contestants}
                onComplete={handleLotteryComplete}
              />
            ) : showWinner && winner ? (
           <motion.div
    key="winner"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4 }}
    className="text-center"
  >
    <Crown className="mx-auto h-16 w-16 text-yellow-400 mb-3" />

    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
      {lotteryConfig?.congratsTitle || "🎉 Congratulations!"}
    </h2>

    <p className="text-white/80 mb-4">
      {lotteryConfig?.congratsMessage || "You are the lucky winner of this draw"}
    </p>

    <div className="bg-white/10 backdrop-blur-md rounded-xl px-6 py-4 inline-block">
      <p className="text-xl font-bold text-white">
        {winner.name}
      </p>

      <p className="text-yellow-300 font-mono mt-1">
        {winner.phone}
      </p>
    </div>

    <div className="mt-4 text-green-400 text-sm sm:text-base">
      {lotteryConfig?.claimMessage || "🎁 You can claim your prize shortly. Our team will contact you with the next steps."}
    </div>
  </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center w-full"
              >
                <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  Unable to Draw
                </h3>
                <p className="text-white/80 max-w-md mx-auto text-sm sm:text-base bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                  {error}
                </p>
              </motion.div>
            ) : (
              <div className="text-center">
                <Gift className="mx-auto h-16 w-16 text-white" />
                <p className="text-white/70 mt-4">
                  Click Start to begin countdown
                </p>
              </div>
            )}
          </AnimatePresence>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push('/contest')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>

          <Button
            disabled={countdown !== null || isSelecting}
            onClick={handleStartClick}
          >
            {error ? 'Try Again' : (lotteryConfig?.startButtonText || "Start Lottery")}
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
