export function formatCurrency(amount: number, symbol = "MVR ") {
  const value = (amount ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${symbol}${value}`
}

export function formatDate(date: Date | string, withTime = false) {
  const d = typeof date === "string" ? new Date(date) : date
  const opts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }
  return d.toLocaleDateString("en-US", opts)
}

export function daysBetween(from: Date | string, to: Date | string = new Date()) {
  const a = typeof from === "string" ? new Date(from) : from
  const b = typeof to === "string" ? new Date(to) : to
  const ms = b.getTime() - a.getTime()
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
}

export type InvoiceStatus = "PAID" | "PARTIAL" | "OUTSTANDING"

export function statusLabel(status: string) {
  const map: Record<string, string> = {
    PAID: "Paid",
    PARTIAL: "Partial",
    OUTSTANDING: "Outstanding",
    DRAFT: "Draft",
    SENT: "Sent",
    CONVERTED: "Converted",
    EXPIRED: "Expired",
  }
  return map[status] ?? status
}
