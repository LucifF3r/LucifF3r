"use client"

import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"

export type PdfLineItem = {
  name: string
  quantity: number
  price: number
  lineTotal: number
}

export type PdfData = {
  docLabel: string // "INVOICE" or "QUOTATION"
  number: string
  date: string
  dueDate?: string | null
  status?: string | null
  garage: {
    name: string
    address?: string | null
    phone?: string | null
    logoUrl?: string | null
  }
  customer: {
    name: string
    phone?: string | null
    address?: string | null
  }
  vehicle?: string | null
  currency: string
  lineItems: PdfLineItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  amountPaid?: number
  balanceDue?: number
  notes?: string | null
}

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: "#1c1917", fontFamily: "Helvetica" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  garageBlock: { flexDirection: "row", gap: 12, alignItems: "center" },
  logo: { width: 48, height: 48, objectFit: "contain" },
  garageName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#0c0a09" },
  muted: { color: "#78716c" },
  docBlock: { alignItems: "flex-end" },
  docLabel: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#ea580c", letterSpacing: 1 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24, gap: 24 },
  sectionTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#a8a29e", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 },
  table: { marginTop: 8, borderTopWidth: 1, borderColor: "#e7e5e4" },
  tHead: { flexDirection: "row", backgroundColor: "#fafaf9", paddingVertical: 6, paddingHorizontal: 8 },
  tRow: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 1, borderColor: "#f5f5f4" },
  cItem: { flex: 1 },
  cQty: { width: 50, textAlign: "right" },
  cPrice: { width: 80, textAlign: "right" },
  cTotal: { width: 80, textAlign: "right" },
  thText: { fontFamily: "Helvetica-Bold", fontSize: 8, color: "#57534e" },
  totalsWrap: { marginTop: 16, alignItems: "flex-end" },
  totalsBox: { width: 220 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  grandRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, marginTop: 4, borderTopWidth: 1, borderColor: "#e7e5e4" },
  grandText: { fontFamily: "Helvetica-Bold", fontSize: 12 },
  statusPill: { marginTop: 10, padding: 8, borderRadius: 4, backgroundColor: "#fafaf9" },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, textAlign: "center", fontSize: 8, color: "#a8a29e" },
})

function money(n: number, c: string) {
  return `${c}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function InvoicePdf({ data }: { data: PdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.garageBlock}>
            {data.garage.logoUrl ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={data.garage.logoUrl} style={styles.logo} />
            ) : null}
            <View>
              <Text style={styles.garageName}>{data.garage.name}</Text>
              {data.garage.address ? <Text style={styles.muted}>{data.garage.address}</Text> : null}
              {data.garage.phone ? <Text style={styles.muted}>{data.garage.phone}</Text> : null}
            </View>
          </View>
          <View style={styles.docBlock}>
            <Text style={styles.docLabel}>{data.docLabel}</Text>
            <Text style={styles.muted}>{data.number}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>{data.customer.name}</Text>
            {data.customer.phone ? <Text style={styles.muted}>{data.customer.phone}</Text> : null}
            {data.customer.address ? <Text style={styles.muted}>{data.customer.address}</Text> : null}
            {data.vehicle ? <Text style={styles.muted}>Vehicle: {data.vehicle}</Text> : null}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.sectionTitle}>Date</Text>
            <Text>{data.date}</Text>
            {data.dueDate ? (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 6 }]}>Due Date</Text>
                <Text>{data.dueDate}</Text>
              </>
            ) : null}
            {data.status ? (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 6 }]}>Status</Text>
                <Text>{data.status}</Text>
              </>
            ) : null}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tHead}>
            <Text style={[styles.cItem, styles.thText]}>Item</Text>
            <Text style={[styles.cQty, styles.thText]}>Qty</Text>
            <Text style={[styles.cPrice, styles.thText]}>Price</Text>
            <Text style={[styles.cTotal, styles.thText]}>Amount</Text>
          </View>
          {data.lineItems.map((li, idx) => (
            <View style={styles.tRow} key={idx}>
              <Text style={styles.cItem}>{li.name}</Text>
              <Text style={styles.cQty}>{li.quantity}</Text>
              <Text style={styles.cPrice}>{money(li.price, data.currency)}</Text>
              <Text style={styles.cTotal}>{money(li.lineTotal, data.currency)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsWrap}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.muted}>Subtotal</Text>
              <Text>{money(data.subtotal, data.currency)}</Text>
            </View>
            {data.discount > 0 ? (
              <View style={styles.totalsRow}>
                <Text style={styles.muted}>Discount</Text>
                <Text>-{money(data.discount, data.currency)}</Text>
              </View>
            ) : null}
            <View style={styles.totalsRow}>
              <Text style={styles.muted}>Tax</Text>
              <Text>{money(data.tax, data.currency)}</Text>
            </View>
            <View style={styles.grandRow}>
              <Text style={styles.grandText}>Total</Text>
              <Text style={styles.grandText}>{money(data.total, data.currency)}</Text>
            </View>
            {typeof data.amountPaid === "number" ? (
              <>
                <View style={styles.totalsRow}>
                  <Text style={styles.muted}>Paid</Text>
                  <Text>{money(data.amountPaid, data.currency)}</Text>
                </View>
                <View style={styles.totalsRow}>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>Balance Due</Text>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>
                    {money(data.balanceDue ?? 0, data.currency)}
                  </Text>
                </View>
              </>
            ) : null}
          </View>
        </View>

        {data.notes ? (
          <View style={styles.statusPill}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.muted}>{data.notes}</Text>
          </View>
        ) : null}

        <Text style={styles.footer}>
          {data.garage.name} — Thank you for your business.
        </Text>
      </Page>
    </Document>
  )
}
