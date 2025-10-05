'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Rocket, Sparkles } from 'lucide-react'

export default function LandingPage() {
  const [isExiting, setIsExiting] = useState(false)
  const router = useRouter()

  const handleEnter = () => {
    setIsExiting(true)
    // Add a slight delay to allow the fade animation to complete
    setTimeout(() => {
      router.push('/app')
    }, 800)
  }

  return (
    <AnimatePresence mode="wait">
      {!isExiting && (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Background Video */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/nasa/Earth_From_Orbit.mp4" type="video/mp4" />
          </video>

          {/* Dark Overlay with Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/60" />

          {/* Animated Stars Overlay */}
          <div className="absolute inset-0">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* Content Container */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8">
            {/* Title Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="mb-16"
            >
              <motion.h1
                className="text-6xl sm:text-7xl lg:text-8xl font-bold text-white mb-4 tracking-wider"
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                Project ClearSkies
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1 }}
                className="text-xl sm:text-2xl text-blue-200 font-light tracking-wide"
              >
                Exploring the past to forecast your perfect day.
              </motion.p>
            </motion.div>

            {/* Enter Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 1.5 }}
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 0 40px rgba(16, 185, 129, 0.6), 0 0 80px rgba(16, 185, 129, 0.4)"
              }}
              whileTap={{ scale: 0.98 }}
              onClick={handleEnter}
              className="group relative px-12 py-6 bg-gradient-to-r from-emerald-500 to-blue-500 
                       text-white font-semibold text-xl rounded-full shadow-2xl
                       hover:from-emerald-400 hover:to-blue-400 transition-all duration-300
                       border border-emerald-400/30 backdrop-blur-sm"
            >
              {/* Glowing Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
              
              {/* Button Content */}
              <div className="relative flex items-center space-x-3">
                <Rocket className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                <span>Enter</span>
                <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
              </div>

              {/* Hover Glow Effect */}
              <motion.div
                className="absolute inset-0 rounded-full"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                style={{
                  background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)'
                }}
              />
            </motion.button>

            {/* Subtle Footer Text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 2 }}
              className="mt-16 text-blue-300/70 text-sm tracking-widest uppercase"
            >
              Powered by NASA Earth Observations
            </motion.div>
          </div>

          {/* Parallax Effect Overlay */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%"],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            style={{
              background: "radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%)",
              backgroundSize: "400% 400%",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
