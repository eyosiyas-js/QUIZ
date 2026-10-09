'use client'

import { useQuizContext } from '@/context/quiz-context'
import { User, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function UserInfoDisplay() {
  const { userInfo, isLoggedIn, setIsLoggedIn, logout } = useQuizContext()

  if (!isLoggedIn || !userInfo) {
    return null
  }

  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login') // or wherever you want to redirect
  }

  return (
    <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/10 backdrop-blur-md p-2 rounded-lg">
      <div className="flex items-center">
        <User className="h-4 w-4 text-white/80 mr-2" />
        <span className="text-white/80 text-sm">{userInfo.name}</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        className="h-8 w-8 p-0 rounded-full"
      >
        <LogOut className="h-4 w-4 text-white/80" />
      </Button>
    </div>
  )
}
