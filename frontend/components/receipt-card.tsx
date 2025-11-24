"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Receipt {
  id: string
  storeName: string
  imageUrl: string
  status: string
}

interface ReceiptCardProps {
  receipt: Receipt
  onClick: () => void
}

export function ReceiptCard({ receipt, onClick }: ReceiptCardProps) {
  const statusColors: Record<string, string> = {
    processed: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    failed: "bg-red-100 text-red-800",
  }

  return (
    <Card
      onClick={onClick}
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow bg-white border border-gray-200"
    >
      <div className="aspect-square bg-gray-100 relative">
        <img
          src={receipt.imageUrl || "/placeholder.svg"}
          alt={receipt.storeName}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{receipt.storeName}</h3>
        <div className="mt-3 flex items-center justify-between">
          <Badge className={statusColors[receipt.status as keyof typeof statusColors] || statusColors.pending}>
            {receipt.status}
          </Badge>
        </div>
      </div>
    </Card>
  )
}
