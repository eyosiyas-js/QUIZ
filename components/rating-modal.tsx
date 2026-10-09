"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Star, Sparkles, MessageSquare } from "lucide-react"
import confetti from "canvas-confetti"
import { useSiteConfig } from "@/context/site-config-context"

interface RatingModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (rating: number, comment?: string) => void
  userName: string
}

export default function RatingModal({ isOpen, onClose, onSubmit, userName }: RatingModalProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { config } = useSiteConfig()

  // Config values
  const ratingConfig = config?.pages?.rating
  const theme = config?.theme
  const gradientFrom = theme?.primaryGradientFrom || "#0b1236"
  const gradientVia = theme?.primaryGradientVia || "#0f1a4a"
  const gradientTo = theme?.primaryGradientTo || "#091029"
  const btnFrom = theme?.buttonGradientFrom || "#0284c7"
  const btnTo = theme?.buttonGradientTo || "#2563eb"

  const handleRatingClick = (value: number) => {
    setRating(value)
  }

  const handleSubmit = async () => {
    if (rating === 0) return

    setIsSubmitting(true)

    // Trigger confetti for ratings 4 or 5
    if (rating >= 4) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })
    }

    // Simulate a short delay for submission
    await new Promise((resolve) => setTimeout(resolve, 800))

    onSubmit(rating, comment.trim() || undefined)
  }

  const getRatingMessage = () => {
    if (rating === 0) return "How would you rate your experience?"
    if (rating === 1) return "We're sorry to hear that. We'll do better!"
    if (rating === 2) return "Thanks for your feedback. We'll improve!"
    if (rating === 3) return "Thank you! We appreciate your feedback."
    if (rating === 4) return "Great! We're glad you enjoyed it!"
    if (rating === 5) return "Awesome! Thank you so much!"
    return ""
  }

  const getCommentPlaceholder = () => {
    if (rating === 0) return "Select a rating first..."
    if (rating <= 2) return "What could we improve? (Optional)"
    if (rating === 3) return "Any suggestions for improvement? (Optional)"
    return "What did you enjoy most? (Optional)"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-md border-white/20 text-white max-h-[90vh] overflow-y-auto"
        style={{
          background: `linear-gradient(to bottom right, ${gradientFrom}, ${gradientVia}, ${gradientTo})`,
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white text-center flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-yellow-400" />
            {ratingConfig?.title || "Rate Your Experience"}
            <Sparkles className="h-6 w-6 text-yellow-400" />
          </DialogTitle>
          <DialogDescription className="text-white/70 text-center pt-2">
            {(ratingConfig?.subtitle || "Hi {name}! We'd love to hear your feedback").replace("{name}", userName)}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {/* Stars */}
          <div>
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((value) => (
                <motion.button
                  key={value}
                  type="button"
                  onClick={() => handleRatingClick(value)}
                  onMouseEnter={() => setHoveredRating(value)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={isSubmitting}
                >
                  <Star
                    className={`h-10 w-10 sm:h-12 sm:w-12 transition-all duration-200 ${
                      value <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-transparent text-white/30"
                    }`}
                  />
                </motion.button>
              ))}
            </div>

            {/* Rating Message */}
            <AnimatePresence mode="wait">
              {(rating > 0 || hoveredRating > 0) && (
                <motion.div
                  key={rating || hoveredRating}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center mb-6"
                >
                  <p className="text-white/90 text-lg font-medium">{getRatingMessage()}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Comment Section */}
          <AnimatePresence>
            {rating > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-2"
              >
                <Label htmlFor="comment" className="text-white flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-cyan-400" />
                  Share your thoughts
                </Label>
                <Textarea
                  id="comment"
                  placeholder={getCommentPlaceholder()}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={isSubmitting}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[100px] resize-none focus:border-cyan-400/50 focus:ring-cyan-400/20"
                  maxLength={500}
                />
                <div className="flex justify-between items-center text-xs text-white/50">
                  <span>{comment.length}/500 characters</span>
                  <span className="text-white/40">Optional</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <div className="flex justify-center pt-2">
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              className="disabled:opacity-50 px-8 py-6 text-lg w-full sm:w-auto"
              style={{
                background: `linear-gradient(to right, ${btnFrom}, ${btnTo})`,
              }}
            >
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  Submitting...
                </>
              ) : (
                <>
                  {ratingConfig?.submitButtonText || "Submit Rating"}
                  <Star className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>

          {/* Skip Option */}
          {!isSubmitting && (
            <div className="text-center">
              <button
                onClick={() => onSubmit(0)}
                className="text-white/50 hover:text-white/70 text-sm transition-colors underline"
              >
                {ratingConfig?.skipText || "Skip for now"}
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
