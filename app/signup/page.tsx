"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuizContext } from "@/context/quiz-context"
import SignupForm from "@/components/SignupForm"

export default function SignupPage() {
  const { isLoggedIn } = useQuizContext()
  const router = useRouter()

  useEffect(() => {
    // If already logged in, redirect to contest page
    if (isLoggedIn) {
      router.push("/contest")
    }
  }, [isLoggedIn, router])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-[#0b1236] via-[#0f1a4a] to-[#091029]">
      <SignupForm />
    </main>
  )
}
