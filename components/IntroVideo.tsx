'use client'

import { useEffect, useRef, useState } from 'react'

export default function IntroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [animate, setAnimate] = useState<'none' | 'fadeIn' | 'fadeOut'>('none')
  const [showText, setShowText] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const loopStart = 8
    const loopLength = 7000

    const showSequence = () => {
      setAnimate('fadeIn')
      setShowText(true)

      setTimeout(() => {
        setAnimate('fadeOut')
      }, 4000)

      setTimeout(() => {
        setShowText(false)
        setAnimate('none')
      }, 5500)
    }

    const playLoop = () => {
      if (!video) return
      video.currentTime = loopStart
      video.play().catch(console.error)
      showSequence()
    }

    const handleLoaded = () => {
      if (!video) return

      // Startujemy od losowej klatki między 0–6 sekundą
      const randomStart = Math.floor(Math.random() * 6)
      video.currentTime = randomStart
      video.pause()

      // Odpalamy animację z opóźnieniem 3–5s
      setTimeout(() => {
        playLoop()
        intervalRef.current = setInterval(playLoop, loopLength)
      }, 3000 + Math.random() * 2000)
    }

    if (video.readyState >= 2) {
      // Jeśli dane już są gotowe
      handleLoaded()
    } else {
      video.addEventListener('loadeddata', handleLoaded)
    }

    return () => {
      video.removeEventListener('loadeddata', handleLoaded)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return (
    <div className="relative w-full h-[80vh] overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        src="/intro.mp4"
        autoPlay
        muted
        playsInline
      />
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-center px-4">
        <div className="text-white drop-shadow-xl mt-[-5%]">
          {showText && (
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
              <span
                className={`block transition-opacity duration-1000 ${
                  animate === 'fadeIn'
                    ? 'opacity-100 animate-fadeIn1'
                    : animate === 'fadeOut'
                    ? 'opacity-0 animate-fadeOut'
                    : 'opacity-0'
                }`}
              >
                Podróżuj inaczej
              </span>
              <span
                className={`block mt-2 transition-opacity duration-1000 delay-700 ${
                  animate === 'fadeIn'
                    ? 'opacity-100 animate-fadeIn2'
                    : animate === 'fadeOut'
                    ? 'opacity-0 animate-fadeOut delay-300'
                    : 'opacity-0'
                }`}
              >
                Zwiedzaj&nbsp;Chytrze...
              </span>
            </h1>
          )}
        </div>
      </div>
    </div>
  )
}
