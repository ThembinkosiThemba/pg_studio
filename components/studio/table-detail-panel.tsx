"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table2,
  Columns,
  Code,
  Trash2,
  Play,
  Loader,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { TablePreview } from "./table-preview";

interface Column {
  column_name: string;
  data_type: string;
  is_nullable: string;
}

interface TableDetailPanelProps {
  userId: string;
  connectionId: string;
  database: string;
  tableName: string;
  onTableDropped: () => void;
}

export function TableDetailPanel({
  userId,
  connectionId,
  database,
  tableName,
  onTableDropped,
}: TableDetailPanelProps) {
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [dropDialogOpen, setDropDialogOpen] = useState(false);
  const [dropping, setDropping] = useState(false);

  const [query, setQuery] = useState(`SELECT * FROM "${tableName}" LIMIT 50`);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  useEffect(() => {
    fetchColumns();
    setQuery(`SELECT * FROM "${tableName}" LIMIT 50`);
  }, [tableName, connectionId]);

  const fetchColumns = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/postgres/explore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          connectionId,
          type: "columns",
          tableName,
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch columns");
      const data = await response.json();
      setColumns(data.data || []);
    } catch (error) {
      console.error("Error fetching columns:", error);
      toast.error("Failed to load table schema");
    } finally {
      setLoading(false);
    }
  };

  const handleDropTable = async () => {
    try {
      setDropping(true);
      const response = await fetch("/api/postgres/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          connectionId,
          query: `DROP TABLE "${tableName}"`,
          action: "DROP_TABLE",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to drop table");
      }

      toast.success(`Table "${tableName}" dropped`);
      setDropDialogOpen(false);
      onTableDropped();
    } catch (error: any) {
      console.error("Error dropping table:", error);
      toast.error(error.message || "Failed to drop table");
    } finally {
      setDropping(false);
    }
  };

  const executeQuery = async () => {
    if (!query.trim()) {
      toast.error("Please enter a query");
      return;
    }

    try {
      setQueryLoading(true);
      setQueryError(null);

      const response = await fetch("/api/postgres/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          connectionId,
          query,
          action: "QUERY",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Query failed");
      }

      setQueryResult(data);
      toast.success(`Query executed - ${data.rowCount ?? 0} rows`);
    } catch (error: any) {
      console.error("Error executing query:", error);
      setQueryError(error.message || "Failed to execute query");
      setQueryResult(null);
    } finally {
      setQueryLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2">
            <Table2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold font-mono">{tableName}</h2>
            <p className="text-sm text-muted-foreground">
              {columns.length} columns
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="bg-gray-100"
          onClick={() => setDropDialogOpen(true)}
        >
          <Trash2 className="w-4 h-4" />
          Drop Table
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Table2 className="w-4 h-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="schema" className="flex items-center gap-2">
            <Columns className="w-4 h-4" />
            Schema
          </TabsTrigger>
          <TabsTrigger value="query" className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            Query
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="mt-4">
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-4">Data Preview (10 rows)</h3>
            <TablePreview
              userId={userId}
              connectionId={connectionId}
              tableName={tableName}
            />
          </Card>
        </TabsContent>

        <TabsContent value="schema" className="mt-4">
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-4">Table Schema</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Column</TableHead>
                      <TableHead className="font-semibold">Type</TableHead>
                      <TableHead className="font-semibold">Nullable</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {columns.map((col) => (
                      <TableRow key={col.column_name}>
                        <TableCell className="font-mono text-sm">
                          {col.column_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-mono">
                            {col.data_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              col.is_nullable === "YES"
                                ? "outline"
                                : "secondary"
                            }
                          >
                            {col.is_nullable === "YES" ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="query" className="mt-4">
          <Card className="p-4 space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">SQL Query</h3>
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="font-mono text-sm min-h-[120px]"
                placeholder="Enter your SQL query..."
              />
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={executeQuery} disabled={queryLoading}>
                {queryLoading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Execute
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setQuery(`SELECT * FROM "${tableName}" LIMIT 50`)
                }
              >
                Reset
              </Button>
            </div>

            {queryError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm font-mono">{queryError}</p>
              </div>
            )}

            {queryResult && queryResult.fields && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Results</h3>
                  <span className="text-xs text-muted-foreground">
                    {queryResult.rowCount ?? 0} rows
                  </span>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                    <Table className="w-full">
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          {queryResult.fields.map((field: string) => (
                            <TableHead
                              key={field}
                              className="font-mono text-xs font-semibold whitespace-nowrap px-4 sticky top-0 bg-muted/90"
                            >
                              {field}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {queryResult.rows
                          .slice(0, 100)
                          .map((row: any, idx: number) => (
                            <TableRow key={idx}>
                              {queryResult.fields.map((field: string) => (
                                <TableCell
                                  key={field}
                                  className="font-mono text-xs whitespace-nowrap px-4 max-w-[300px] truncate"
                                  title={formatValue(row[field])}
                                >
                                  {formatValue(row[field])}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Drop Dialog */}
      <Dialog open={dropDialogOpen} onOpenChange={setDropDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Drop Table</DialogTitle>
            <DialogDescription>
              Are you sure you want to drop the table{" "}
              <span className="font-mono font-semibold">{tableName}</span>? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDropDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDropTable}
              disabled={dropping}
            >
              {dropping ? (
                <Loader className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Drop Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatValue(value: any): string {
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
