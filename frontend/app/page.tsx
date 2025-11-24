"use client";
import { useState, useEffect, useCallback } from "react";
import { ReceiptCard } from "@/components/receipt-card";
import { ReceiptDetail } from "@/components/receipt-detail";
import { UploadModal } from "@/components/upload-modal";
import { FilterBar } from "@/components/filter-bar";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { graphqlFetch, graphqlUpload } from "@/lib/graphql";
import { useToast } from "@/hooks/use-toast";

interface Receipt {
  id: string;
  storeName: string;
  purchaseDate: string;
  totalAmount: number;
  imageUrl: string;
  status: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
}

const receiptsQuery = `
  query Receipts {
    receipts {
      id
      storeName
      purchaseDate
      totalAmount
      imageUrl
      status
      items {
        id
        name
        quantity
        price
      }
    }
  }
`;

export default function Home() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState<Receipt[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterStoreName, setFilterStoreName] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const { toast } = useToast();

  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    try {
      const { receipts: data } = await graphqlFetch<{ receipts: Receipt[] }>(
        receiptsQuery
      );
      const fullUrlReceipts = data.map((r) => ({
        ...r,
        imageUrl: r.imageUrl.startsWith("http")
          ? r.imageUrl
          : `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333"}${
              r.imageUrl
            }`,
      }));
      setReceipts(fullUrlReceipts);
      setFilteredReceipts(fullUrlReceipts);
    } catch (error) {
      console.error("Error fetching receipts:", error);
      toast({
        title: "Error fetching receipts",
        description: "Could not load receipts. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchReceipts();
    const interval = setInterval(fetchReceipts, 15000); // Poll for updates
    return () => clearInterval(interval);
  }, [fetchReceipts]);

  useEffect(() => {
    let filtered = receipts;

    if (filterStoreName) {
      filtered = filtered.filter((receipt) =>
        receipt.storeName.toLowerCase().includes(filterStoreName.toLowerCase())
      );
    }

    if (filterStartDate) {
      const startDate = new Date(filterStartDate);
      filtered = filtered.filter(
        (receipt) => new Date(receipt.purchaseDate) >= startDate
      );
    }

    if (filterEndDate) {
      const endDate = new Date(filterEndDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        (receipt) => new Date(receipt.purchaseDate) <= endDate
      );
    }

    setFilteredReceipts(filtered);
  }, [receipts, filterStoreName, filterStartDate, filterEndDate]);

  const handleUpload = async (file: File) => {
    try {
      const newReceipt = await graphqlUpload(file);
      const newReceiptWithUrl = {
        ...newReceipt,
        imageUrl: newReceipt.imageUrl.startsWith("http")
          ? newReceipt.imageUrl
          : `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333"}${
              newReceipt.imageUrl
            }`,
        items: [],
      };
      setReceipts((prev) => [newReceiptWithUrl, ...prev]);
      setShowUploadModal(false);
      toast({
        title: "Upload successful",
        description: "Your receipt is being processed.",
      });
    } catch (error) {
      console.error("Error uploading receipt:", error);
      toast({
        title: "Upload failed",
        description: "Could not upload receipt. Please try again.",
        variant: "destructive",
      });
    }
  };

  const uniqueStores = Array.from(
    new Set(receipts.map((r) => r.storeName))
  ).sort();

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Receipt Manager
            </h1>
          </div>
          <Button
            onClick={() => setShowUploadModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
          >
            <Upload size={20} />
            Upload Receipt
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {!loading && receipts.length > 0 && (
          <FilterBar
            stores={uniqueStores}
            onFilterChange={(storeName, startDate, endDate) => {
              setFilterStoreName(storeName);
              setFilterStartDate(startDate);
              setFilterEndDate(endDate);
            }}
          />
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Loading receipts...</p>
          </div>
        ) : receipts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-gray-500 text-lg">No receipts yet</p>
            <Button
              onClick={() => setShowUploadModal(true)}
              variant="outline"
              className="mt-4"
            >
              Upload your first receipt
            </Button>
          </div>
        ) : filteredReceipts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-gray-500 text-lg">
              No receipts match your filters
            </p>
            <Button
              onClick={() => {
                setFilterStoreName("");
                setFilterStartDate("");
                setFilterEndDate("");
              }}
              variant="outline"
              className="mt-4"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredReceipts.map((receipt) => (
              <ReceiptCard
                key={receipt.id}
                receipt={receipt}
                onClick={() => setSelectedReceipt(receipt)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedReceipt && (
        <ReceiptDetail
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUpload}
        />
      )}
    </main>
  );
}
