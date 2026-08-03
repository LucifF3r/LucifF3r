import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const styles: Record<string, string> = {
  Paid: "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  Partial: "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  Outstanding: "border-transparent bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  Draft: "border-transparent bg-muted text-muted-foreground",
  Sent: "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  Converted: "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  Expired: "border-transparent bg-muted text-muted-foreground line-through",
}

export function InvoiceStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn(styles[status] ?? "")}>
      {status}
    </Badge>
  )
}
