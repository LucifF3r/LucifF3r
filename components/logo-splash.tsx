"use client"

import { useEffect, useRef, useState } from "react"

const SESSION_KEY = "asl:splashShown"
// Safety fallback: if the video never fires an "ended" event, hide anyway.
const MAX_MS = 12000

export function LogoSplash() {
  const [phase, setPhase] = useState<"init" | "visible" | "hiding" | "done">("init")
  const [progress, setProgress] = useState(0)
  const startedRef = useRef(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    // Only show once per app launch / browser session.
    let alreadyShown = false
    try {
      alreadyShown = sessionStorage.getItem(SESSION_KEY) === "1"
    } catch {
      alreadyShown = false
    }

    if (alreadyShown) {
      setPhase("done")
      return
    }

    try {
      sessionStorage.setItem(SESSION_KEY, "1")
    } catch {
      // ignore storage errors (private mode, etc.)
    }

    setPhase("visible")

    // Safety timeout so a stalled/blocked video can't trap the user on the splash.
    const maxTimer = setTimeout(() => setPhase("hiding"), MAX_MS)
    return () => clearTimeout(maxTimer)
  }, [])

  // Kick off playback once the overlay is visible.
  useEffect(() => {
    if (phase !== "visible") return
    const video = videoRef.current
    if (!video) return
    const p = video.play()
    if (p && typeof p.catch === "function") {
      // Autoplay may be blocked; just skip to the app in that case.
      p.catch(() => setPhase("hiding"))
    }
  }, [phase])

  if (phase === "init" || phase === "done") return null

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video || !video.duration || Number.isNaN(video.duration)) return
    setProgress(Math.min(100, (video.currentTime / video.duration) * 100))
  }

  return (
    <div
      role="presentation"
      aria-hidden="true"
      onAnimationEnd={(e) => {
        if (e.animationName === "splash-fade-out") setPhase("done")
      }}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background ${
        phase === "hiding" ? "splash-overlay" : ""
      }`}
    >
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        src="/asl-motors-logo-reel.mp4"
        muted
        playsInline
        autoPlay
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => {
          setProgress(100)
          setPhase("hiding")
        }}
        onError={() => setPhase("hiding")}
      />

      {/* loading bar + credit overlaid near the bottom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 pb-[8vh]">
        <div className="h-1 w-56 max-w-[70vw] overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-150 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs tracking-wide text-white/80 drop-shadow">
          Developed by Ahsal | Palm Isle Collectives &copy; 2026
        </p>
      </div>
    </div>
  )
}
