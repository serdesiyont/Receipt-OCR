"use client";
import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDropzone } from "react-dropzone";
import { Upload, X } from "lucide-react";
import Image from "next/image";

interface UploadModalProps {
  onClose: () => void;
  onUpload: (file: File) => void;
}

export function UploadModal({ onClose, onUpload }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [] },
    multiple: false,
  });

  const handleUpload = async () => {
    if (file) {
      setIsUploading(true);
      await onUpload(file);
      setIsUploading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload a Receipt</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {file ? (
            <div className="relative">
              <Image
                src={URL.createObjectURL(file)}
                alt="Receipt preview"
                width={400}
                height={400}
                className="w-full h-auto rounded-md"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => setFile(null)}
              >
                <X size={20} />
              </Button>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-md cursor-pointer
                ${
                  isDragActive
                    ? "border-green-600 bg-green-50"
                    : "border-gray-300"
                }`}
            >
              <input {...getInputProps()} />
              <Upload size={40} className="text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                {isDragActive
                  ? "Drop the file here"
                  : "Drag & drop a receipt image, or click to select"}
              </p>
              <p className="text-xs text-gray-400 mt-1">PNG or JPG</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
