import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { QuizProvider } from "@/context/quiz-context"
import { SiteConfigProvider } from "@/context/site-config-context"
import 'react-phone-number-input/style.css'
const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "3D Quiz App",
  description: "Interactive 3D quiz application with animations",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <SiteConfigProvider>
            <QuizProvider>{children}</QuizProvider>
          </SiteConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

