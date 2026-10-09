"use client"

import React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface Contestant {
  id: number
  name: string
  phone: string
}

interface LotteryAnimationProps {
  contestants: Contestant[]
  onComplete: (winningDigits: string) => void
}

export default function LotteryAnimation({ contestants, onComplete }: LotteryAnimationProps) {
  // We'll dynamically determine the number of digits based on the selected contestant
  const [digitCount, setDigitCount] = useState(10) // Default to 10 digits
  const [digitPositions, setDigitPositions] = useState<number[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [finalDigits, setFinalDigits] = useState<string>("")

  // Clean phone numbers to ensure consistent format (digits only)
  const cleanPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    return phone.replace(/\D/g, "")
  }

  useEffect(() => {
    // Randomly select a contestant to be the winner
    const randomContestant = contestants[Math.floor(Math.random() * contestants.length)]
    const winningPhone = cleanPhoneNumber(randomContestant.phone)

    // Set the digit count based on the winning phone number length
    const phoneDigitCount = winningPhone.length
    setDigitCount(phoneDigitCount)

    // Initialize digit positions array with the correct length
    setDigitPositions(Array(phoneDigitCount).fill(0))

    // Store the final digits for when animation completes
    setFinalDigits(winningPhone)

    let completedCount = 0

    // Set up intervals for each digit position
    const intervals = Array(phoneDigitCount)
      .fill(0)
      .map((_, index) => {
        // Each position spins at different speeds and stops at different times
        // First digits stop first, last digits stop last for dramatic effect
        const speed = 80 + index * 20 // First digit is fastest, last is slowest
        const duration = 1000 + index * 500 // First digit stops first, last stops last

        return {
          interval: setInterval(() => {
            setDigitPositions((prev) => {
              const updated = [...prev]
              // Randomly cycle through digits
              updated[index] = Math.floor(Math.random() * 10)
              return updated
            })
          }, speed),

          timeout: setTimeout(() => {
            clearInterval(intervals[index].interval)

            // Set the final digit value
            setDigitPositions((prev) => {
              const updated = [...prev]
              updated[index] = Number.parseInt(winningPhone[index])
              return updated
            })

            completedCount++

            // Check if all digits have stopped
            if (completedCount === phoneDigitCount) {
              setIsComplete(true)
              setTimeout(() => {
                onComplete(winningPhone)
              }, 1000) // Delay before calling onComplete
            }
          }, duration),
        }
      })

    // Cleanup
    return () => {
      intervals.forEach(({ interval, timeout }) => {
        clearInterval(interval)
        clearTimeout(timeout)
      })
    }
  }, [contestants, onComplete])

  // Format phone number for display based on length
  const formatPhoneDisplay = (digits: number[]): React.ReactNode => {
    // For different phone number lengths, we'll use different formatting
    if (digits.length === 0) return null

    // For very short numbers (less than 4 digits)
    if (digits.length < 4) {
      return (
        <div className="flex justify-center items-center">
          <div className="flex gap-1 sm:gap-2">
            {digits.map((digit, index) => (
              <DigitBox key={`digit-${index}`} digit={digit} index={index} isComplete={isComplete} />
            ))}
          </div>
        </div>
      )
    }

    // For medium length numbers (4-7 digits), split into two groups
    if (digits.length < 8) {
      const midpoint = Math.floor(digits.length / 2)
      return (
        <div className="flex justify-center items-center">
          <div className="flex gap-1 sm:gap-2">
            {digits.slice(0, midpoint).map((digit, index) => (
              <DigitBox key={`first-${index}`} digit={digit} index={index} isComplete={isComplete} />
            ))}
          </div>
          <div className="mx-1 sm:mx-2 self-center text-white font-bold">-</div>
          <div className="flex gap-1 sm:gap-2">
            {digits.slice(midpoint).map((digit, index) => (
              <DigitBox key={`second-${index}`} digit={digit} index={index + midpoint} isComplete={isComplete} />
            ))}
          </div>
        </div>
      )
    }

    // For standard phone numbers (8-10 digits), use XXX-XXX-XXXX format
    if (digits.length <= 10) {
      const firstGroup = digits.slice(0, 3)
      const secondGroup = digits.slice(3, 6)
      const thirdGroup = digits.slice(6)

      return (
        <div className="flex justify-center items-center">
          <div className="flex gap-1 sm:gap-2">
            {firstGroup.map((digit, index) => (
              <DigitBox key={`area-${index}`} digit={digit} index={index} isComplete={isComplete} />
            ))}
          </div>
          <div className="mx-1 sm:mx-2 self-center text-white font-bold">-</div>
          <div className="flex gap-1 sm:gap-2">
            {secondGroup.map((digit, index) => (
              <DigitBox key={`prefix-${index}`} digit={digit} index={index + 3} isComplete={isComplete} />
            ))}
          </div>
          <div className="mx-1 sm:mx-2 self-center text-white font-bold">-</div>
          <div className="flex gap-1 sm:gap-2">
            {thirdGroup.map((digit, index) => (
              <DigitBox key={`line-${index}`} digit={digit} index={index + 6} isComplete={isComplete} />
            ))}
          </div>
        </div>
      )
    }

    // For longer numbers (11+ digits), split into appropriate groups
    // For example: +1-XXX-XXX-XXXX or XXX-XXX-XXX-XXX
    const groups = []
    let remaining = [...digits]

    // Create groups of 3 or 4 digits
    while (remaining.length > 0) {
      const groupSize = remaining.length > 4 ? 3 : remaining.length
      groups.push(remaining.slice(0, groupSize))
      remaining = remaining.slice(groupSize)
    }

    return (
      <div className="flex justify-center items-center flex-wrap">
        {groups.map((group, groupIndex) => (
          <React.Fragment key={`group-${groupIndex}`}>
            {groupIndex > 0 && <div className="mx-1 sm:mx-2 self-center text-white font-bold">-</div>}
            <div className="flex gap-1 sm:gap-2">
              {group.map((digit, digitIndex) => (
                <DigitBox
                  key={`group-${groupIndex}-digit-${digitIndex}`}
                  digit={digit}
                  index={groupIndex * 3 + digitIndex}
                  isComplete={isComplete}
                />
              ))}
            </div>
          </React.Fragment>
        ))}
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="mb-6 text-center">
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Lottery Drawing</h3>
        <p className="text-white/70">The winning phone number will be revealed!</p>
      </div>

      {/* Lottery machine */}
      <div className="mb-8 overflow-x-auto w-full max-w-full py-4">
        <div className="min-w-max">{formatPhoneDisplay(digitPositions)}</div>
      </div>

      {/* Decorative elements */}
      <div className="relative w-full max-w-md h-8">
        {/* Lottery machine base */}
        <motion.div
          className="absolute inset-x-0 h-8 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-700 rounded-lg"
          animate={{
            y: [0, -2, 0, -1, 0],
          }}
          transition={{
            duration: 0.5,
            repeat: isComplete ? 0 : Number.POSITIVE_INFINITY,
            repeatType: "loop",
          }}
        />

        {/* Decorative balls */}
        {!isComplete &&
          Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                backgroundColor: ["#FF5E5B", "#39A0ED", "#FFEC5C", "#4AD66D"][i % 4],
                left: `${10 + i * 12}%`,
                bottom: "0px",
              }}
              animate={{
                y: [-10, -30, -10],
                x: [0, i % 2 === 0 ? 10 : -10, 0],
                opacity: [1, 1, 1],
              }}
              transition={{
                duration: 1 + i * 0.2,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
                delay: i * 0.1,
              }}
            />
          ))}
      </div>

      <motion.p
        animate={{
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 1.5,
          repeat: isComplete ? 0 : Number.POSITIVE_INFINITY,
        }}
        className="mt-8 text-white/80 text-lg sm:text-xl"
      >
        {isComplete ? "Drawing complete!" : "Drawing numbers..."}
      </motion.p>
    </div>
  )
}

// Individual digit box component
function DigitBox({ digit, index, isComplete }: { digit: number; index: number; isComplete: boolean }) {
  return (
    <motion.div
      className="w-8 h-12 sm:w-10 sm:h-14 bg-gradient-to-b from-slate-700 to-slate-900 rounded-lg border-2 border-slate-600 flex items-center justify-center relative overflow-hidden"
      initial={{ y: 0 }}
      animate={{
        boxShadow: isComplete ? "0 0 15px rgba(255, 215, 0, 0.5)" : "none",
        borderColor: isComplete ? "#FFD700" : "#64748b",
      }}
    >
      {/* Glass reflection effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent h-1/2 pointer-events-none" />

      {/* Red marker line */}
      <div className="absolute left-0 right-0 h-0.5 bg-red-500 z-10" />

      {/* Digit display */}
      <AnimatePresence mode="wait">
        <motion.span
          key={`digit-${index}-${digit}`}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.1 }}
          className="text-2xl sm:text-3xl font-bold text-white"
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  )
}
