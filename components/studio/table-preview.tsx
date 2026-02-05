"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader, AlertCircle } from "lucide-react";

interface TablePreviewProps {
  userId: string;
  connectionId: string;
  tableName: string;
  limit?: number;
}

interface PreviewResult {
  rows: Record<string, any>[];
  fields: string[];
  rowCount: number;
}

export function TablePreview({
  userId,
  connectionId,
  tableName,
  limit = 10,
}: TablePreviewProps) {
  const [data, setData] = useState<PreviewResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPreview();
  }, [tableName, connectionId]);

  const fetchPreview = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/postgres/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          connectionId,
          query: `SELECT * FROM "${tableName}" LIMIT ${limit}`,
          action: "PREVIEW",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch preview");
      }

      const result = await response.json();
      setData({
        rows: result.rows || [],
        fields: result.fields || [],
        rowCount: result.rowCount || 0,
      });
    } catch (err: any) {
      console.error("Error fetching preview:", err);
      setError(err.message || "Failed to load preview");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="w-5 h-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading preview...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8 text-destructive">
        <AlertCircle className="w-5 h-5 mr-2" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  if (!data || data.fields.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No data to preview
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="bg-muted/50">
              {data.fields.map((field) => (
                <TableHead
                  key={field}
                  className="font-mono text-xs font-semibold whitespace-nowrap px-4"
                >
                  {field}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.map((row, idx) => (
              <TableRow key={idx}>
                {data.fields.map((field) => (
                  <TableCell
                    key={field}
                    className="font-mono text-xs whitespace-nowrap px-4 max-w-[300px] truncate"
                    title={formatCellValue(row[field])}
                  >
                    {formatCellValue(row[field])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="px-4 py-2 bg-muted/30 border-t text-xs text-muted-foreground">
        Showing {data.rows.length} of {data.rowCount ?? "?"} rows
      </div>
    </div>
  );
}

function formatCellValue(value: any): string {
  if (value === null) return "NULL";
  if (value === undefined) return "";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}
