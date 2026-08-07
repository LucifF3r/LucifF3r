"use client"

import { useEffect, useRef, useState } from "react"

const SESSION_KEY = "asl:splashShown"
const VISIBLE_MS = 1900

export function LogoSplash() {
  // Start hidden; decide synchronously on mount whether to show.
  const [phase, setPhase] = useState<"init" | "visible" | "hiding" | "done">("init")
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

    const hideTimer = setTimeout(() => setPhase("hiding"), VISIBLE_MS)
    return () => clearTimeout(hideTimer)
  }, [])

  if (phase === "init" || phase === "done") return null

  return (
    <div
      role="presentation"
      aria-hidden="true"
      onAnimationEnd={(e) => {
        // When the fade-out completes, unmount.
        if (e.animationName === "splash-fade-out") setPhase("done")
      }}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background ${
        phase === "hiding" ? "splash-overlay" : ""
      }`}
    >
      <div className="splash-logo relative flex w-[min(78vw,420px)] flex-col items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/asl-motors-logo.png" alt="ASL Motors" className="w-full select-none object-contain" draggable={false} />

        {/* light sweep across the logo */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="splash-sweep absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/45 to-transparent"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* loading bar */}
      <div className="mt-8 h-1 w-40 overflow-hidden rounded-full bg-muted">
        <div className="splash-bar h-full w-full rounded-full bg-primary" aria-hidden="true" />
      </div>

      <p className="mt-4 text-xs tracking-wide text-muted-foreground">
        Developed by Ahsal | Palm Isle Collectives &copy; 2026
      </p>
    </div>
  )
}
