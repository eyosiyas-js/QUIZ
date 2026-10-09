"use client"

import { motion } from "framer-motion"

interface ProgressBarProps {
  progress: number
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
      <motion.div
        className="h-full bg-gradient-to-r from-sky-500 to-blue-500"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />
    </div>
  )
}
