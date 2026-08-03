"use client"

/**
 * Cross-environment PDF printing/downloading.
 *
 * The app runs both as a normal website AND inside a Tauri desktop wrapper
 * (WebView2 on Windows). WebView2 blocks two things we relied on:
 *   1. `window.open(...)` — used for printing (returns null, nothing happens).
 *   2. blob `<a download>` — silently does nothing (native download is disabled).
 *
 * These helpers avoid both: printing uses a hidden same-document iframe, and
 * saving in the desktop app falls back to the print dialog (where the user can
 * pick "Save as PDF" / "Microsoft Print to PDF" to write the file to disk).
 * In a normal browser, saving does a true one-click download.
 */

export function isTauri(): boolean {
  if (typeof window === "undefined") return false
  return "__TAURI_INTERNALS__" in window || "__TAURI__" in window
}

/** Renders the PDF in a hidden iframe and opens the print dialog. */
export function printPdfBlob(blob: Blob): Promise<void> {
  const url = URL.createObjectURL(blob)
  const iframe = document.createElement("iframe")
  iframe.setAttribute("aria-hidden", "true")
  iframe.style.position = "fixed"
  iframe.style.right = "0"
  iframe.style.bottom = "0"
  iframe.style.width = "1px"
  iframe.style.height = "1px"
  iframe.style.border = "0"
  iframe.style.opacity = "0"

  return new Promise<void>((resolve, reject) => {
    iframe.onload = () => {
      // Give WebView2's embedded PDF viewer a moment to paint before printing,
      // otherwise the print can capture a blank page.
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus()
          iframe.contentWindow?.print()
          resolve()
        } catch (err) {
          reject(err as Error)
        }
      }, 400)
    }
    iframe.onerror = () => reject(new Error("Failed to load PDF"))
    iframe.src = url
    document.body.appendChild(iframe)

    // Clean up well after the print dialog has had time to open.
    window.setTimeout(() => {
      URL.revokeObjectURL(url)
      iframe.remove()
    }, 60_000)
  })
}

/**
 * Saves the PDF. Returns `{ viaPrintDialog: true }` when it had to fall back to
 * the print dialog (desktop app) so the caller can show a hint to the user.
 */
export async function savePdfBlob(blob: Blob, filename: string): Promise<{ viaPrintDialog: boolean }> {
  if (isTauri()) {
    // WebView2 blocks blob downloads — use the print dialog's "Save as PDF".
    await printPdfBlob(blob)
    return { viaPrintDialog: true }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.rel = "noopener"
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return { viaPrintDialog: false }
}
