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
import { Loader, AlertCircle, Trash2, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface TablePreviewProps {
  userId: string;
  connectionId: string;
  tableName: string;
  limit?: number;
  primaryKey?: string;
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
  primaryKey,
}: TablePreviewProps) {
  const [data, setData] = useState<PreviewResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(
    new Set(),
  );
  const [viewRow, setViewRow] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchPreview();
    setSelectedRows(new Set());
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

  const handleSelectAll = (checked: boolean) => {
    if (!data || !primaryKey) return;
    if (checked) {
      const allIds = data.rows.map((row) => row[primaryKey]).filter(Boolean);
      setSelectedRows(new Set(allIds));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectOne = (id: string | number, checked: boolean) => {
    const next = new Set(selectedRows);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    setSelectedRows(next);
  };

  const handleDeleteSelected = async () => {
    if (selectedRows.size === 0 || !primaryKey) return;
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedRows.size} rows?`,
      )
    )
      return;

    try {
      setIsDeleting(true);
      const idsToDelete = Array.from(selectedRows);

      // Using the query API to delete. Parallel requests for now.
      const deletePromises = idsToDelete.map((id) =>
        fetch("/api/postgres/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            connectionId,
            action: "QUERY",
            query: `DELETE FROM "${tableName}" WHERE "${primaryKey}" = '${id}'`, // Simple string interpolation for now, should use parameterized if possible but API takes raw query
          }),
        }),
      );

      await Promise.all(deletePromises);

      toast.success(`Deleted ${selectedRows.size} rows`);
      setSelectedRows(new Set());
      fetchPreview();
    } catch (err: any) {
      console.error("Error deleting rows:", err);
      toast.error("Failed to delete selection");
    } finally {
      setIsDeleting(false);
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
    <div className="space-y-2">
      {primaryKey && selectedRows.size > 0 && (
        <div className="flex justify-end">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteSelected}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Delete Selected ({selectedRows.size})
          </Button>
        </div>
      )}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-muted/50">
                {primaryKey && (
                  <TableHead className="w-[40px] px-4">
                    <Checkbox
                      checked={
                        data.rows.length > 0 &&
                        selectedRows.size === data.rows.length
                      }
                      onCheckedChange={(checked) =>
                        handleSelectAll(checked as boolean)
                      }
                      aria-label="Select all"
                    />
                  </TableHead>
                )}
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
                <TableRow
                  key={idx}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={(e) => {
                    if (
                      (e.target as HTMLElement).closest('[role="checkbox"]') ||
                      (e.target as HTMLElement).closest("button")
                    ) {
                      return;
                    }
                    setViewRow(row);
                  }}
                >
                  {primaryKey && (
                    <TableCell className="px-4">
                      <Checkbox
                        checked={
                          row[primaryKey] !== undefined &&
                          selectedRows.has(row[primaryKey])
                        }
                        onCheckedChange={(checked) =>
                          row[primaryKey] !== undefined &&
                          handleSelectOne(row[primaryKey], checked as boolean)
                        }
                        aria-label="Select row"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                  )}
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

      <Dialog
        open={!!viewRow}
        onOpenChange={(open) => !open && setViewRow(null)}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Row Details</DialogTitle>
            <DialogDescription>Viewing row content</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto border rounded-md p-4 bg-muted/30">
            <pre className="text-xs font-mono whitespace-pre-wrap break-all">
              {viewRow ? JSON.stringify(viewRow, null, 2) : ""}
            </pre>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewRow(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
