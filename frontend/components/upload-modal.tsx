"use client"

import type React from "react"

import { useRef, useState } from "react"
import { X, Upload, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UploadModalProps {
  onClose: () => void
  onUpload: (file: File) => void
}

export function UploadModal({ onClose, onUpload }: UploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [error, setError] = useState<string>("")

  const validateFile = (file: File): boolean => {
    const validTypes = ["image/jpeg", "image/jpg", "image/png"]
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes

    if (!validTypes.includes(file.type)) {
      setError("Invalid file format. Please upload a JPG or PNG image.")
      return false
    }

    if (file.size > maxSize) {
      setError("File size exceeds 5MB limit. Please choose a smaller file.")
      return false
    }

    setError("")
    return true
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true)
    } else if (e.type === "dragleave") {
      setIsDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    const files = e.dataTransfer.files
    if (files && files[0]) {
      if (validateFile(files[0])) {
        onUpload(files[0])
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (validateFile(e.target.files[0])) {
        onUpload(e.target.files[0])
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Upload Receipt</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragActive ? "border-green-500 bg-green-50" : "border-gray-300 bg-gray-50"
            }`}
          >
            <Upload size={48} className={`mx-auto mb-4 ${isDragActive ? "text-green-600" : "text-gray-400"}`} />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Drop your receipt here</h3>
            <p className="text-sm text-gray-600 mb-4">or click to select a file</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()} className="bg-green-600 hover:bg-green-700">
              Choose File
            </Button>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <p className="text-xs text-gray-500 text-center mt-4">Supported formats: JPG, PNG (Max 5MB)</p>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
          <Button onClick={onClose} variant="outline" className="w-full bg-transparent">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
