'use client'

import type React from 'react'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useQuizContext } from '@/context/quiz-context'
import { Brain } from 'lucide-react'
import { useMobile } from '@/hooks/use-mobile'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
export default function AdminLoginForm() {
  const { setUserInfo, setIsLoggedIn } = useQuizContext()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')

  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState({ name: '', phone: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isMobile = useMobile()
  const router = useRouter()

  const validateForm = () => {
    const newErrors = { name: '', phone: '' }
    let isValid = true

    if (!name.trim()) {
      newErrors.name = 'Name is required'
      isValid = false
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required'
      isValid = true
    } else if (!/^\+?\d{10,15}$/.test(phone.replace(/[-()\s]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm() && !isSubmitting) {
      setIsSubmitting(true)

      try {
        const response = await api.post('/auth/admin', {
            name,
            phone_number: phone,
            password: password,
        })

        if (response.status === 200 && response.data?.auth_token) {
          const token = response.data.auth_token

          // Save token (example: localStorage, you can use context instead)
          localStorage.setItem('auth_token', token)
          localStorage.setItem('user_info', JSON.stringify({ name, phone }))

          // Save user info and login state
          setUserInfo({ name, phone })
          setIsLoggedIn(true)

          router.push('/lottery')
          console.log('Login successful, token stored')
        } else {
          console.error('Unexpected login response:', response)
          setErrors((prev) => ({
            ...prev,
            phone: 'Login failed. Invalid response from server.',
          }))
        }
      } catch (error: any) {
        console.error('Error during login:', error)
        setErrors((prev) => ({
          ...prev,
          phone: error.response?.data?.message || 'Login request failed',
        }))
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md px-4 sm:px-0"
    >
      
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader className="space-y-1 text-center p-4 sm:p-6">
          <div className="flex justify-center mb-2">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{
                duration: 0.5,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: 'reverse',
                repeatDelay: 5,
              }}
            >
              {/* <img className='h-14' src="/logo.png" /> */}
            </motion.div>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-white">
            Welcome to Contest
          </CardTitle>
          <CardDescription className="text-white/70 text-sm sm:text-base">
            Enter your details to join the contest
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white text-sm sm:text-base">
                Name
              </Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-sm sm:text-base"
              />
              {errors.name && (
                <p className="text-red-400 text-xs sm:text-sm mt-1">
                  {errors.name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="phone"
                className="text-white text-sm sm:text-base"
              >
                Phone Number
              </Label>
              <Input
                id="phone"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-sm sm:text-base"
              />
              {errors.phone && (
                <p className="text-red-400 text-xs sm:text-sm mt-1">
                  {errors.phone}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white text-sm sm:text-base">
                Password
              </Label>
              <Input
                id="name"
                type="password"
                placeholder="Enter your Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-sm sm:text-base"
              />
            </div>
          </CardContent>
          <CardFooter className="p-4 sm:p-6 pt-0 sm:pt-0">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-sm sm:text-base"
            >
              {isSubmitting ? 'Registering...' : 'Register for Contest'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  )
}
