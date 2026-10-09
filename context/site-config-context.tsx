"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react"
import api from "@/lib/api"

// ============================================================
// Types
// ============================================================
export interface SiteConfig {
  branding: {
    eventName: string
    organizationName: string
    logoUrl: string
    faviconUrl: string
    metaTitle: string
    metaDescription: string
  }
  theme: {
    primaryGradientFrom: string
    primaryGradientVia: string
    primaryGradientTo: string
    accentColor: string
    buttonGradientFrom: string
    buttonGradientTo: string
    selectedAnswerColor: string
    overlayOpacity: number
    fontFamily: string
  }
  media: {
    backgroundVideoUrl: string
    backgroundImageUrl: string
    backgroundType: "video" | "image" | "gradient"
    qrCodeUrl: string
  }
  pages: {
    login: {
      title: string
      subtitle: string
      submitButtonText: string
      submittingText: string
      signupLinkText: string
      signupLinkLabel: string
    }
    signup: {
      title: string
      subtitle: string
      submitButtonText: string
      submittingText: string
      loginLinkText: string
      loginLinkLabel: string
      defaultCountry: string
    }
    contest: {
      successTitle: string
      successMessage: string
      phoneConfirmText: string
      viewWinnersText: string
      viewLotteryText: string
      quizSectionTitle: string
      quizSectionSubtitle: string
      quizInfoTitle: string
      quizInfoSubtitle: string
      quizCompletionBonus: string
      startQuizText: string
      tryNextRoundText: string
      quizCompletedText: string
    }
    quiz: {
      nextButtonText: string
      finishButtonText: string
      loadingText: string
      timerDuration: number
    }
    celebration: {
      perfectTitle: string
      perfectMessage: string
      highTitle: string
      highMessage: string
      mediumTitle: string
      mediumMessage: string
      lowTitle: string
      lowMessage: string
      redirectText: string
      redirectDelay: number
    }
    results: {
      summaryTabLabel: string
      detailsTabLabel: string
      scoreTitle: string
      backButtonText: string
      messages: {
        perfect: string
        excellent: string
        great: string
        good: string
        low: string
      }
    }
    lottery: {
      title: string
      subtitle: string
      startButtonText: string
      drawingTitle: string
      drawingSubtitle: string
      congratsTitle: string
      congratsMessage: string
      claimMessage: string
      countdownDuration: number
    }
    rating: {
      title: string
      subtitle: string
      submitButtonText: string
      skipText: string
    }
    dashboard: {
      heroTitle: string
      statsTitle: string
      eligibleTitle: string
      totalTitle: string
      countdownTitle: string
    }
  }
  prizes: Array<{
    name: string
    description: string
    image: string
    rank: string
  }>
  sections: {
    showLogo: boolean
    showBackgroundVideo: boolean
    showPrizes: boolean
    showLottery: boolean
    showDashboard: boolean
    showQrCode: boolean
    showRatingModal: boolean
  }
}

interface SiteConfigContextType {
  config: SiteConfig | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const SiteConfigContext = createContext<SiteConfigContextType | undefined>(undefined)

// ============================================================
// Provider
// ============================================================
export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SiteConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConfig = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await api.get('/config')
      setConfig(response.data)
    } catch (err: any) {
      console.error('Failed to fetch site config:', err)
      setError(err.message || 'Failed to load configuration')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchConfig()
  }, [])

  return (
    <SiteConfigContext.Provider
      value={{
        config,
        isLoading,
        error,
        refetch: fetchConfig,
      }}
    >
      {children}
    </SiteConfigContext.Provider>
  )
}

// ============================================================
// Hook
// ============================================================
export function useSiteConfig() {
  const context = useContext(SiteConfigContext)
  if (context === undefined) {
    throw new Error("useSiteConfig must be used within a SiteConfigProvider")
  }
  return context
}
