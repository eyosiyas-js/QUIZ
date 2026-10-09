'use client'

import { useState, useEffect } from 'react'
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
  Crown,
  Sparkles,
  Phone,
  Clock,
  AlertCircle,
  Gift,
} from 'lucide-react'
import { useMobile } from '@/hooks/use-mobile'
import confetti from 'canvas-confetti'
import LotteryAnimation from '@/components/lottery-animation'
import { useQuizContext } from '@/context/quiz-context'
import { useSiteConfig } from '@/context/site-config-context'
import api from '@/lib/api'
import emailjs from '@emailjs/browser';

// Mock contestant data - in a real app, this would come from a database
// Now with varied phone number formats and lengths
type Contestant = {
  id: string
  name: string
  phone: string
}

export default function CountdownLotteryPage() {
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [winner, setWinner] = useState<typeof contestants[0] | null>(null)
  const [showWinner, setShowWinner] = useState(false)
  const [winningDigits, setWinningDigits] = useState<string>('')
  const [countdownComplete, setCountdownComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const isMobile = useMobile()
  const { userInfo } = useQuizContext()
  const { config } = useSiteConfig()
  const [contestants, setContestants] = useState<Contestant[]>([])

  const theme = config?.theme
  const gradientFrom = theme?.primaryGradientFrom || "#0b1236"
  const gradientVia = theme?.primaryGradientVia || "#0f1a4a"
  const gradientTo = theme?.primaryGradientTo || "#091029"
  const lotteryConfig = config?.pages?.lottery
  const countdownDuration = lotteryConfig?.countdownDuration || 30

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`
  }

  // Countdown timer effect
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0 && !countdownComplete) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)

      return () => clearTimeout(timer)
    } else if (countdown === 0 && !countdownComplete) {
      setCountdownComplete(true)
      startSelection()
    }
  }, [countdown, countdownComplete])
  const sendEmail = (data,name) => {
      console.log(data)
      
      const templateParams = {
            user_name: name,
            user_email: data,
            message: name,
          };
      
          emailjs.send(
            'service_a9qgnid',
            'template_x71ok73',
            templateParams,
            'oobBCUVi5cpaix--_'  // Or USER_ID
          )
          .then((response) => {
            console.log('SUCCESS!', response.status, response.text);
          }, (err) => {
            console.log('FAILED...', err);
          });
        };


  // Format phone number for display - now handles variable length
  const formatPhoneNumber = (phoneDigits: string): string => {
    // For very short numbers, just return as is
    if (phoneDigits.length < 4) return phoneDigits

    // For medium length (4-7 digits), split in half
    if (phoneDigits.length < 8) {
      const midpoint = Math.floor(phoneDigits.length / 2)
      return `${phoneDigits.slice(0, midpoint)}-${phoneDigits.slice(midpoint)}`
    }

    // For standard US numbers (10 digits)
    if (phoneDigits.length === 10) {
      return `${phoneDigits.slice(0, 3)}-${phoneDigits.slice(
        3,
        6,
      )}-${phoneDigits.slice(6)}`
    }

    // For longer numbers, use groups of 3-4 digits
    const groups = []
    let remaining = phoneDigits

    while (remaining.length > 0) {
      const groupSize = remaining.length > 4 ? 3 : remaining.length
      groups.push(remaining.slice(0, groupSize))
      remaining = remaining.slice(groupSize)
    }

    return groups.join('-')
  }
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if(!token) return;
    api.get(`/auth/verify`).then(res => {
      // good to go
    }).catch(err => {
      console.log(err)
      router.push('/contest')
    })
  },[])

  const handleStartClick = async () => {
    setError(null)
    try {
      await api.get('/lottery/check/mini')
      setCountdown(countdownDuration)
      setCountdownComplete(false)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Cannot start lottery at this time.')
    }
  }

  const startSelection = () => {
    const token = localStorage.getItem('auth_token')

    try {
      api
        .post(`/lottery/draw/mini`)
        .then((res) => {
           if(res.data.winner)
          {
            sendEmail(res.data.email,res.data.winner)

            setContestants([
            {
              id: `${Math.random(12)}`, // or use Math.random().toString(36).substr(2, 9)
              name: res.data.winner,
              phone: res.data.phone_number,
            },
          ])
          setIsSelecting(true)
          setShowWinner(false)
          setWinner(null)
          }
        })
        .catch((err) => {
          setError(err.response?.data?.error || 'Failed to draw mini lottery')
          setCountdown(null)
        })
    } catch (err) {
      console.log(err)
      setError('An unexpected error occurred.')
    }
  }

  const handleLotteryComplete = (digits: string) => {
    setWinningDigits(digits)

    // Find the winner based on the phone number
    const matchingContestants = contestants.filter((contestant) => {
      const cleanPhone = contestant.phone.replace(/\D/g, '')
      return cleanPhone === digits
    })

    // If we have a match, set the winner
    if (matchingContestants.length > 0) {
      // In case multiple people have the same phone number, pick one randomly
      const randomIndex = Math.floor(Math.random() * matchingContestants.length)
      setWinner(matchingContestants[randomIndex])
    } else {
      // Fallback in case no match (shouldn't happen with our implementation)
      const randomIndex = Math.floor(Math.random() * contestants.length)
      setWinner(contestants[randomIndex])
    }

    // Stop the selection animation
    setIsSelecting(false)

    // Show winner with a slight delay for dramatic effect
    setTimeout(() => {
      setShowWinner(true)
      triggerWinnerConfetti()
    }, 500)
  }

  const triggerWinnerConfetti = () => {
    // Create an intense confetti celebration
    const duration = 5 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    // Initial big bursts
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { x: 0.5, y: 0.3 },
    })

    // Continuous confetti during celebration
    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        clearInterval(interval)
        return
      }

      const particleCount = 50 * (timeLeft / duration)

      // Confetti from various positions
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.2, 0.4), y: randomInRange(0.2, 0.4) },
      })

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.6, 0.8), y: randomInRange(0.2, 0.4) },
      })
    }, 250)
  }

  const goBack = () => {
    router.push('/contest')
  }

  // Reset the lottery
  const resetLottery = () => {
    setCountdown(null)
    setCountdownComplete(false)
    setIsSelecting(false)
    setShowWinner(false)
    setWinner(null)
    setError(null)
  }

  // Check if the current user is the winner
  const isUserWinner = winner && userInfo && winner.name === userInfo.name

  // Calculate progress percentage for the countdown
  const progressPercentage = countdown !== null ? (countdown / countdownDuration) * 100 : 0

  // Determine color based on countdown
  const getCountdownColor = () => {
    if (countdown === null) return { ring: '#3b82f6', text: '#60a5fa' }
    if (countdown > 30) return { ring: '#3b82f6', text: '#60a5fa' } // Blue
    if (countdown > 10) return { ring: '#f59e0b', text: '#fbbf24' } // Amber
    return { ring: '#ef4444', text: '#f87171' } // Red
  }

  const countdownColors = getCountdownColor()

  return (
    <main 
      className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ background: `linear-gradient(to bottom right, ${gradientFrom}, ${gradientVia}, ${gradientTo})` }}
    >
      {/* Background decorative elements */}
       <div className="absolute inset-0 bg-[url(/ETX.jpg)] bg-no-repeat bg-cover bg-center blur-sm scale-105 z-0" />

  {/* Gradient Overlay (optional, if you want to keep your gradient) */}
  <div 
    className="absolute inset-0 opacity-60 z-10" 
    style={{ background: `linear-gradient(to bottom right, ${gradientFrom}, ${gradientVia}, ${gradientTo})` }}
  />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />

        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/5"
            style={{
              width: Math.random() * 6 + 2,
              height: Math.random() * 6 + 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -10, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: 'reverse',
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl z-10"
      >
        <Card className="bg-white/10 backdrop-blur-md border-white/20 overflow-hidden">
          <CardHeader className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: 'reverse',
                }}
              >
                <Trophy className="h-12 w-12 sm:h-16 sm:w-16 text-yellow-400" />
              </motion.div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
              Mini Lottery Prize
            </CardTitle>
            <CardDescription className="text-white/70 text-base sm:text-lg">
              The lottery drawing will begin automatically after the countdown!
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 pt-0">
            <div className="w-full flex flex-col items-center">
              {/* Lottery animation container */}
              <div className="w-full h-64 sm:h-80 mb-6 relative flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {countdown !== null && !countdownComplete && !isSelecting && !showWinner ? (
                    <motion.div
                      key="countdown"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center w-full"
                    >
                      <div className="flex flex-col items-center justify-center">
                        {/* Improved countdown timer with circular progress */}
                        <div className="relative">
                          {/* Outer decorative rings */}
                          <motion.div
                            className="absolute inset-0 rounded-full"
                            style={{
                              background: `radial-gradient(circle, ${countdownColors.ring}20 0%, transparent 70%)`,
                            }}
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.3, 0.6, 0.3],
                            }}
                            transition={{
                              duration: 3,
                              repeat: Number.POSITIVE_INFINITY,
                              repeatType: 'reverse',
                            }}
                          />

                          {/* Base circle */}
                          <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center relative">
                            {/* Progress ring */}
                            <svg
                              className="absolute inset-0 w-full h-full -rotate-90"
                              viewBox="0 0 100 100"
                            >
                              {/* Background track */}
                              <circle
                                className="text-white/10"
                                strokeWidth="4"
                                stroke="currentColor"
                                fill="transparent"
                                r="44"
                                cx="50"
                                cy="50"
                              />
                              {/* Progress indicator */}
                              <motion.circle
                                className={`text-${
                                  countdown > 30
                                    ? 'blue'
                                    : countdown > 10
                                    ? 'amber'
                                    : 'red'
                                }-500`}
                                strokeWidth="4"
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="transparent"
                                r="44"
                                cx="50"
                                cy="50"
                                initial={{
                                  strokeDasharray: '276.5 276.5',
                                  strokeDashoffset: 0,
                                }}
                                animate={{
                                  strokeDashoffset:
                                    276.5 - (progressPercentage / 100) * 276.5,
                                }}
                                transition={{ duration: 1, ease: 'linear' }}
                              />
                            </svg>

                            {/* Pulsing background for urgency */}
                            {countdown <= 10 && (
                              <motion.div
                                className="absolute inset-0 rounded-full bg-red-500/10"
                                animate={{
                                  scale: [1, 1.05, 1],
                                  opacity: [0.3, 0.6, 0.3],
                                }}
                                transition={{
                                  duration: 0.5,
                                  repeat: Number.POSITIVE_INFINITY,
                                  repeatType: 'reverse',
                                }}
                              />
                            )}

                            {/* Inner content */}
                            <div className="z-10 flex flex-col items-center">
                              <motion.div
                                animate={{
                                  scale: countdown <= 10 ? [1, 1.1, 1] : 1,
                                }}
                                transition={{
                                  duration: 0.5,
                                  repeat:
                                    countdown <= 10
                                      ? Number.POSITIVE_INFINITY
                                      : 0,
                                  repeatType: 'reverse',
                                }}
                                className="mb-2"
                              >
                                <Clock
                                  className={`h-10 w-10 sm:h-12 sm:w-12 text-${
                                    countdown > 30
                                      ? 'blue'
                                      : countdown > 10
                                      ? 'amber'
                                      : 'red'
                                  }-400`}
                                />
                              </motion.div>

                              <motion.div
                                className="text-5xl sm:text-6xl font-bold"
                                style={{ color: countdownColors.text }}
                                animate={{
                                  scale: countdown <= 5 ? [1, 1.2, 1] : 1,
                                }}
                                transition={{
                                  duration: 0.3,
                                  repeat:
                                    countdown <= 5
                                      ? Number.POSITIVE_INFINITY
                                      : 0,
                                  repeatType: 'reverse',
                                }}
                              >
                                {countdown}
                              </motion.div>

                              <div className="text-white/60 text-sm mt-1">
                                seconds remaining
                              </div>
                            </div>
                          </div>

                          {/* Orbiting particles */}
                          {Array.from({ length: 3 }).map((_, i) => (
                            <motion.div
                              key={`particle-${i}`}
                              className="absolute w-3 h-3 rounded-full"
                              style={{
                                backgroundColor: countdownColors.ring,
                                top: '50%',
                                left: '50%',
                                marginLeft: '-6px',
                                marginTop: '-6px',
                              }}
                              animate={{
                                x: [
                                  Math.cos((i * 2 * Math.PI) / 3) * 120,
                                  Math.cos((i * 2 * Math.PI) / 3 + Math.PI) *
                                    120,
                                  Math.cos((i * 2 * Math.PI) / 3) * 120,
                                ],
                                y: [
                                  Math.sin((i * 2 * Math.PI) / 3) * 120,
                                  Math.sin((i * 2 * Math.PI) / 3 + Math.PI) *
                                    120,
                                  Math.sin((i * 2 * Math.PI) / 3) * 120,
                                ],
                                scale: [1, 1.5, 1],
                                opacity: [0.7, 1, 0.7],
                              }}
                              transition={{
                                duration: 8,
                                repeat: Number.POSITIVE_INFINITY,
                                repeatType: 'loop',
                                delay: i * 0.5,
                              }}
                            />
                          ))}
                        </div>

                        <div className="text-center mt-6">
                          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                            Lottery Drawing Countdown
                          </h3>
                          <p className="text-white/70">
                            {countdown <= 10
                              ? 'Drawing will begin in moments!'
                              : 'Please wait for the drawing to begin'}
                          </p>

                          {countdown <= 10 && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="mt-4 flex items-center justify-center text-red-400"
                            >
                              <AlertCircle className="h-5 w-5 mr-2" />
                              <span className="font-semibold">Get ready!</span>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ) : isSelecting ? (
                    <motion.div
                      key="selecting"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full h-full"
                    >
                      <LotteryAnimation
                        contestants={contestants}
                        onComplete={handleLotteryComplete}
                      />
                    </motion.div>
                  ) : showWinner && winner ? (
                    <motion.div
                      key="winner"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.5,
                        type: 'spring',
                        stiffness: 200,
                        damping: 15,
                      }}
                      className="text-center"
                    >
                      <motion.div
                        animate={{
                          y: [0, -10, 0],
                          scale: [1, 1.05, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                          repeatType: 'reverse',
                        }}
                        className="mb-4"
                      >
                        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center mx-auto">
                          <Crown className="h-12 w-12 sm:h-16 sm:w-16 text-white" />
                        </div>
                      </motion.div>

                      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                        {isUserWinner
                          ? 'And the winner is...'
                          : 'And the winner is...'}
                      </h3>

                      <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 sm:p-6 max-w-md mx-auto">
                        <div className="flex justify-center mb-3">
                          <div className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-yellow-300" />
                            <p className="text-yellow-300 font-mono font-bold">
                              {formatPhoneNumber(winningDigits)}
                            </p>
                          </div>
                        </div>

                        <p className="text-xl sm:text-2xl font-bold text-white mb-1">
                          {winner.name}
                        </p>
                        <p className="text-white/70">Phone: {winner.phone}</p>

                        {/* {isUserWinner && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1 }}
                            className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg"
                          >
                            <p className="text-green-400 flex items-center justify-center">
                              <Sparkles className="h-5 w-5 mr-2" />
                              We'll contact you soon with prize details!
                            </p>
                          </motion.div>
                        )} */}
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
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-6 pt-0 flex flex-col sm:flex-row justify-center sm:justify-between gap-4">
            <Button
              onClick={goBack}
              variant="outline"
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 w-full sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Contest
            </Button>

            {showWinner || error ? (
              <Button
                onClick={resetLottery}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white w-full sm:w-auto"
              >
                {error ? 'Try Again' : 'Draw Again'}
              </Button>
            ) : (
              <Button
                disabled={countdown !== null || isSelecting}
                onClick={handleStartClick}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white w-full sm:w-auto"
              >
                Start Mini Lottery
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </main>
  )
}
