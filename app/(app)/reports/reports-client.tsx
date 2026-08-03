"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"
import { DownloadIcon } from "lucide-react"
import { formatCurrency } from "@/lib/format"

type MonthlyRevenue = { month: string; billed: number; collected: number }
type TopItem = { name: string; qty: number; revenue: number }
type PaymentMethod = { method: string; amount: number }
type Aging = { range: string; amount: number }

function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function ReportsClient({
  currency,
  monthlyRevenue,
  topItems,
  paymentMethods,
  aging,
  totals,
}: {
  currency: string
  monthlyRevenue: MonthlyRevenue[]
  topItems: TopItem[]
  paymentMethods: PaymentMethod[]
  aging: Aging[]
  totals: { billed: number; collected: number; outstanding: number; invoiceCount: number }
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total billed" value={formatCurrency(totals.billed, currency)} />
        <StatCard label="Total collected" value={formatCurrency(totals.collected, currency)} accent="positive" />
        <StatCard label="Outstanding" value={formatCurrency(totals.outstanding, currency)} accent="negative" />
        <StatCard label="Invoices" value={String(totals.invoiceCount)} />
      </div>

      <Tabs defaultValue="revenue">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="top">Top Sellers</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="aging">Aging</TabsTrigger>
        </TabsList>

        {/* Revenue */}
        <TabsContent value="revenue">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Monthly revenue</CardTitle>
                <CardDescription>Billed vs collected over the last 12 months.</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadCsv(
                    "monthly-revenue.csv",
                    ["Month", "Billed", "Collected"],
                    monthlyRevenue.map((m) => [m.month, m.billed, m.collected]),
                  )
                }
              >
                <DownloadIcon data-icon="inline-start" />
                CSV
              </Button>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  billed: { label: "Billed", color: "var(--chart-1)" },
                  collected: { label: "Collected", color: "var(--chart-2)" },
                }}
                className="aspect-[16/6] w-full"
              >
                <LineChart data={monthlyRevenue} margin={{ left: 12, right: 12, top: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} width={48} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line dataKey="billed" stroke="var(--color-billed)" strokeWidth={2} dot={false} />
                  <Line dataKey="collected" stroke="var(--color-collected)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
              <div className="mt-4 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Billed</TableHead>
                      <TableHead className="text-right">Collected</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyRevenue.map((m) => (
                      <TableRow key={m.month}>
                        <TableCell>{m.month}</TableCell>
                        <TableCell className="text-right">{formatCurrency(m.billed, currency)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(m.collected, currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top sellers */}
        <TabsContent value="top">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Top services &amp; parts</CardTitle>
                <CardDescription>Ranked by total revenue.</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadCsv(
                    "top-sellers.csv",
                    ["Item", "Qty", "Revenue"],
                    topItems.map((i) => [i.name, i.qty, i.revenue]),
                  )
                }
              >
                <DownloadIcon data-icon="inline-start" />
                CSV
              </Button>
            </CardHeader>
            <CardContent>
              {topItems.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No sales data yet.</p>
              ) : (
                <>
                  <ChartContainer
                    config={{ revenue: { label: "Revenue", color: "var(--chart-1)" } }}
                    className="aspect-[16/6] w-full"
                  >
                    <BarChart data={topItems} layout="vertical" margin={{ left: 12, right: 12 }}>
                      <CartesianGrid horizontal={false} />
                      <XAxis type="number" tickLine={false} axisLine={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        width={120}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                  <div className="mt-4 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">Qty sold</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topItems.map((i) => (
                          <TableRow key={i.name}>
                            <TableCell className="font-medium">{i.name}</TableCell>
                            <TableCell className="text-right">{i.qty}</TableCell>
                            <TableCell className="text-right">{formatCurrency(i.revenue, currency)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Collections */}
        <TabsContent value="collections">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Collections by method</CardTitle>
                <CardDescription>How payments were received.</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadCsv(
                    "collections.csv",
                    ["Method", "Amount"],
                    paymentMethods.map((p) => [p.method, p.amount]),
                  )
                }
              >
                <DownloadIcon data-icon="inline-start" />
                CSV
              </Button>
            </CardHeader>
            <CardContent>
              {paymentMethods.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No payments recorded yet.</p>
              ) : (
                <>
                  <ChartContainer
                    config={{ amount: { label: "Amount", color: "var(--chart-3)" } }}
                    className="aspect-[16/6] w-full"
                  >
                    <BarChart data={paymentMethods} margin={{ left: 12, right: 12 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="method" tickLine={false} axisLine={false} tickMargin={8} />
                      <YAxis tickLine={false} axisLine={false} width={48} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                  <div className="mt-4 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Method</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paymentMethods.map((p) => (
                          <TableRow key={p.method}>
                            <TableCell>{p.method}</TableCell>
                            <TableCell className="text-right">{formatCurrency(p.amount, currency)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aging */}
        <TabsContent value="aging">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Receivables aging</CardTitle>
                <CardDescription>Outstanding balance by age bracket.</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadCsv(
                    "aging.csv",
                    ["Bracket (days)", "Outstanding"],
                    aging.map((a) => [a.range, a.amount]),
                  )
                }
              >
                <DownloadIcon data-icon="inline-start" />
                CSV
              </Button>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{ amount: { label: "Outstanding", color: "var(--chart-1)" } }}
                className="aspect-[16/6] w-full"
              >
                <BarChart data={aging} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="range" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} width={48} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
                </BarChart>
              </ChartContainer>
              <div className="mt-4 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Age bracket</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aging.map((a) => (
                      <TableRow key={a.range}>
                        <TableCell>{a.range} days</TableCell>
                        <TableCell className="text-right">{formatCurrency(a.amount, currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: "positive" | "negative"
}) {
  const color =
    accent === "positive" ? "text-emerald-600" : accent === "negative" ? "text-destructive" : ""
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`mt-1 text-2xl font-semibold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  )
}
