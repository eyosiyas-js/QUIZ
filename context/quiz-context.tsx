"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react"

export interface AnsweredQuestion {
  questionId: number
  question: string
  userAnswer: string | null
  correctAnswer: string
  isCorrect: boolean
  timeSpent?: number
}

export interface UserInfo {
  name: string
  phone: string
}

interface QuizResults {
  score: number
  totalQuestions: number
  answeredQuestions: AnsweredQuestion[]
}

interface QuizContextType {
  userInfo: UserInfo | null
  setUserInfo: (info: UserInfo) => void
  quizResults: QuizResults | null
  setQuizResults: (results: QuizResults) => void
  clearQuizResults: () => void
  isLoggedIn: boolean
  setIsLoggedIn: (value: boolean) => void
  quizCompleted: boolean
  setQuizCompleted: (value: boolean) => void
  logout: () => void
}

const QuizContext = createContext<QuizContextType | undefined>(undefined)

export function QuizProvider({ children }: { children: ReactNode }) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [quizResults, setQuizResults] = useState<QuizResults | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token")
      const savedUserInfo = localStorage.getItem("user_info")

      if (token && savedUserInfo) {
        setIsLoggedIn(true)
        try {
          const parsedUser = JSON.parse(savedUserInfo)
          setUserInfo(parsedUser)
          
          const completed = localStorage.getItem(`quizCompleted_${parsedUser.phone}`) === "true"
          setQuizCompleted(completed)
        } catch (err) {
          console.error("Error parsing user_info:", err)
        }
      }
    }
  }, [])

  const clearQuizResults = () => {
    setQuizResults(null)
  }

  const logout = () => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_info")
    setIsLoggedIn(false)
    setUserInfo(null)
    setQuizResults(null)
    setQuizCompleted(false)
  }

  return (
    <QuizContext.Provider
      value={{
        userInfo,
        setUserInfo,
        quizResults,
        setQuizResults,
        clearQuizResults,
        isLoggedIn,
        setIsLoggedIn,
        quizCompleted,
        setQuizCompleted,
        logout,
      }}
    >
      {children}
    </QuizContext.Provider>
  )
}

export function useQuizContext() {
  const context = useContext(QuizContext)
  if (context === undefined) {
    throw new Error("useQuizContext must be used within a QuizProvider")
  }
  return context
}
