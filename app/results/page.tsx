"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import ResultsScreen from "@/components/results-screen"
import { useQuizContext } from "@/context/quiz-context"
import { motion } from "framer-motion"

export default function ResultsPage() {
  const { quizResults, clearQuizResults, userInfo, isLoggedIn, setQuizCompleted } = useQuizContext()
  const router = useRouter()

  useEffect(() => {
    // If no quiz results are available or user is not logged in, redirect to the home page
    if (!quizResults || !isLoggedIn) {
      router.push("/")
    }

    // Mark quiz as completed when viewing results
    if (typeof window !== "undefined" && userInfo?.phone) {
      localStorage.setItem(`quizCompleted_${userInfo.phone}`, "true")
      setQuizCompleted(true)
    }
  }, [quizResults, isLoggedIn, router, setQuizCompleted, userInfo])

  const handleRestart = () => {
    clearQuizResults()
    // Keep the user logged in, just clear quiz results
    router.push("/")
  }

  if (!quizResults || !userInfo) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-[#0b1236] via-[#0f1a4a] to-[#091029]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-20 h-20 border-t-4 border-blue-500 border-solid rounded-full animate-spin"
        />
        <p className="mt-4 text-white text-xl">Loading results...</p>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-[#0b1236] via-[#0f1a4a] to-[#091029]">
      <div className="w-full max-w-4xl">
        <ResultsScreen
          score={quizResults.score}
          totalQuestions={quizResults.totalQuestions}
          answeredQuestions={quizResults.answeredQuestions}
          onRestart={handleRestart}
          userName={userInfo.name}
        />
      </div>
    </main>
  )
}
