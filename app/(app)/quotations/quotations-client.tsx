"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { SearchIcon, FileTextIcon } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/format"

type QuotationRow = {
  id: string
  number: string
  customerName: string
  customerPhone: string
  date: string
  total: number
  status: string
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  Draft: "outline",
  Sent: "secondary",
  Converted: "default",
  Expired: "destructive",
}

export function QuotationsClient({
  quotations,
  currency,
}: {
  quotations: QuotationRow[]
  currency: string
}) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return quotations.filter((row) => {
      const matchesSearch =
        !q ||
        row.number.toLowerCase().includes(q) ||
        row.customerName.toLowerCase().includes(q) ||
        row.customerPhone.toLowerCase().includes(q)
      const matchesStatus = status === "all" || row.status === status
      return matchesSearch && matchesStatus
    })
  }, [quotations, search, status])

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search quotations"
              placeholder="Search quotation #, customer, phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={(v) => setStatus(Array.isArray(v) ? v[0] : (v as string))}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Sent">Sent</SelectItem>
                <SelectItem value="Converted">Converted</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileTextIcon />
              </EmptyMedia>
              <EmptyTitle>No quotations found</EmptyTitle>
              <EmptyDescription>
                Create a quotation from the New Sale screen by switching the document type to Quotation.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quotation #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/quotations/${row.id}`)}
                  >
                    <TableCell className="font-medium">{row.number}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{row.customerName}</span>
                        <span className="text-xs text-muted-foreground">{row.customerPhone}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(row.date)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(row.total, currency)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[row.status] ?? "outline"}>{row.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
