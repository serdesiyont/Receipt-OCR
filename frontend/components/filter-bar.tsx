"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FilterBarProps {
  onFilterChange: (storeName: string, startDate: string, endDate: string) => void
  stores: string[]
}

export function FilterBar({ onFilterChange, stores }: FilterBarProps) {
  const [storeName, setStoreName] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const handleFilterChange = () => {
    onFilterChange(storeName, startDate, endDate)
  }

  const handleReset = () => {
    setStoreName("")
    setStartDate("")
    setEndDate("")
    onFilterChange("", "", "")
  }

  return (
    <div className="bg-gray-50 border-b border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        {/* Store Name Filter */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Store Name</label>
          <select
            value={storeName}
            onChange={(e) => {
              setStoreName(e.target.value)
              onFilterChange(e.target.value, startDate, endDate)
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Stores</option>
            {stores.map((store) => (
              <option key={store} value={store}>
                {store}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date Filter */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value)
              onFilterChange(storeName, e.target.value, endDate)
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* End Date Filter */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value)
              onFilterChange(storeName, startDate, e.target.value)
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Reset Button */}
        {(storeName || startDate || endDate) && (
          <Button onClick={handleReset} variant="outline" className="flex items-center gap-2 bg-transparent">
            <X size={16} />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
