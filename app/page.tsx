"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuizContext } from "@/context/quiz-context"
import { useSiteConfig } from "@/context/site-config-context"
import Quiz from "@/components/quiz"
import UserInfoDisplay from "@/components/user-info-display"

export default function Home() {
  const { isLoggedIn } = useQuizContext()
  const { config } = useSiteConfig()
  const router = useRouter()

  useEffect(() => {
    // If not logged in, redirect to login page
    if (!isLoggedIn) {
      router.push("/signup")
    }
  }, [isLoggedIn, router])

  const gradientFrom = config?.theme?.primaryGradientFrom || "#0b1236"
  const gradientVia = config?.theme?.primaryGradientVia || "#0f1a4a"
  const gradientTo = config?.theme?.primaryGradientTo || "#091029"

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center p-4 relative"
      style={{
        background: `linear-gradient(to bottom right, ${gradientFrom}, ${gradientVia}, ${gradientTo})`,
      }}
    >
      <UserInfoDisplay />
      <Quiz />
    </main>
  )
}
