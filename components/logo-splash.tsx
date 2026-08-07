"use client"

import { useEffect, useRef, useState } from "react"

const SESSION_KEY = "asl:splashShown"
// Total time the splash stays up before fading to the app.
const DURATION_MS = 2600

export function LogoSplash() {
  const [phase, setPhase] = useState<"init" | "visible" | "hiding" | "done">("init")
  const [progress, setProgress] = useState(0)
  const startedRef = useRef(false)

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

    // Drive the loading bar smoothly across the splash duration.
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const pct = Math.min(100, ((now - start) / DURATION_MS) * 100)
      setProgress(pct)
      if (pct < 100) {
        raf = requestAnimationFrame(tick)
      }
    }
    raf = requestAnimationFrame(tick)

    const hideTimer = setTimeout(() => setPhase("hiding"), DURATION_MS)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(hideTimer)
    }
  }, [])

  if (phase === "init" || phase === "done") return null

  return (
    <div
      role="presentation"
      aria-hidden="true"
      onAnimationEnd={(e) => {
        if (e.animationName === "splash-fade-out") setPhase("done")
      }}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white ${
        phase === "hiding" ? "splash-overlay" : ""
      }`}
    >
      {/* High-resolution logo, rendered crisp on a clean white background */}
      <img
        src="/asl-motors-logo.png"
        alt="ASL Motors"
        className="splash-logo w-[min(58vw,520px)] max-w-[80vw] select-none"
        draggable={false}
      />

      {/* refined loading bar + credit near the bottom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-3.5 pb-[7vh]">
        <div className="h-[3px] w-48 max-w-[60vw] overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[11px] font-medium tracking-[0.12em] text-neutral-400 uppercase">
          Developed by Ahsal | Palm Isle Collectives &copy; 2026
        </p>
      </div>
    </div>
  )
}
