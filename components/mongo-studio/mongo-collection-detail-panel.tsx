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
import {
  Files,
  Code,
  Trash2,
  Play,
  Loader,
  AlertCircle,
  RefreshCw,
  X,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface MongoCollectionDetailPanelProps {
  userId: string;
  connectionId: string;
  database: string;
  collectionName: string;
  onCollectionDropped: () => void;
}

export function MongoCollectionDetailPanel({
  userId,
  connectionId,
  database,
  collectionName,
  onCollectionDropped,
}: MongoCollectionDetailPanelProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dropDialogOpen, setDropDialogOpen] = useState(false);
  const [dropping, setDropping] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewDocument, setViewDocument] = useState<any | null>(null);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);

  const [query, setQuery] = useState("{}");
  const [queryResult, setQueryResult] = useState<any[] | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
    setSelectedIds(new Set());
  }, [collectionName, connectionId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/mongo/explore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          connectionId,
          type: "documents",
          database,
          collection: collectionName,
          limit: 50,
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch documents");
      const data = await response.json();
      setDocuments(data.data || []);
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleDropCollection = async () => {
    try {
      setDropping(true);
      const response = await fetch("/api/mongo/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          connectionId,
          database,
          collection: collectionName,
          action: "DROP_COLLECTION",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to drop collection");
      }

      toast.success(`Collection "${collectionName}" dropped`);
      setDropDialogOpen(false);
      onCollectionDropped();
    } catch (error: any) {
      console.error("Error dropping collection:", error);
      toast.error(error.message || "Failed to drop collection");
    } finally {
      setDropping(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!window.confirm("Are you sure you want to delete this document?"))
      return;

    try {
      setDeletingId(docId);
      const response = await fetch("/api/mongo/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          connectionId,
          database,
          collection: collectionName,
          documentId: docId,
          action: "DELETE_DOCUMENT",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete document");
      }

      toast.success("Document deleted");
      fetchDocuments(); // Refresh list
    } catch (error: any) {
      console.error("Error deleting document:", error);
      toast.error(error.message || "Failed to delete document");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = documents.map((doc) => doc._id).filter(Boolean);
      setSelectedIds(new Set(allIds));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    setSelectedIds(next);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedIds.size} documents?`,
      )
    )
      return;

    try {
      setIsDeletingSelected(true);
      // We'll delete one by one or batch if API supported it.
      // For now, let's assume we loop or send a list. The current API might only support single delete per the code I saw earlier.
      // Let's modify the loop to be safe.
      const idsToDelete = Array.from(selectedIds);

      // Ideally API should support batch delete. Since I haven't changed API yet, I'll loop (slow but works for small batches)
      // Or I can send a custom action. Let's try to stick to what we have or improved it.
      // Actually, let's do parallel requests for now as a quick implementation, capped at some limit.

      const deletePromises = idsToDelete.map((id) =>
        fetch("/api/mongo/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            connectionId,
            database,
            collection: collectionName,
            documentId: id,
            action: "DELETE_DOCUMENT",
          }),
        }),
      );

      await Promise.all(deletePromises);

      toast.success(`Deleted ${selectedIds.size} documents`);
      setSelectedIds(new Set());
      fetchDocuments();
    } catch (error: any) {
      console.error("Error deleting documents:", error);
      toast.error("Failed to delete selection");
    } finally {
      setIsDeletingSelected(false);
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
      setQueryResult(null);

      const response = await fetch("/api/mongo/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          connectionId,
          database,
          collection: collectionName,
          query,
          action: "FIND",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Query failed");
      }

      const data = await response.json();
      // Also update main list if it's a simple find, but primarily set result for query tab
      setQueryResult(data.data || []);
      toast.success(`Query executed - ${data.data?.length ?? 0} documents`);
    } catch (error: any) {
      console.error("Error executing query:", error);
      setQueryError(error.message || "Failed to execute query");
      setQueryResult(null);
    } finally {
      setQueryLoading(false);
    }
  };

  // Flatten keys for table header (simple implementation)
  const getHeaders = () => {
    if (documents.length === 0) return ["_id"];
    const keys = new Set<string>();
    documents.slice(0, 10).forEach((doc) => {
      Object.keys(doc).forEach((k) => keys.add(k));
    });
    return Array.from(keys);
  };

  const headers = getHeaders();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg">
            <Files className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold font-mono">
              {collectionName}
            </h2>
            <p className="text-sm text-muted-foreground">
              {documents.length} documents (showing max 50)
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={isDeletingSelected}
            >
              {isDeletingSelected ? (
                <Loader className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete Selected ({selectedIds.size})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={fetchDocuments}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-gray-100"
            onClick={() => setDropDialogOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Drop Collection
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-xs">
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <Files className="w-4 h-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="query" className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            Query
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-4">
          <Card className="p-0 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[40px] px-4">
                        <Checkbox
                          checked={
                            documents.length > 0 &&
                            selectedIds.size === documents.length
                          }
                          onCheckedChange={(checked) =>
                            handleSelectAll(checked as boolean)
                          }
                          aria-label="Select all"
                        />
                      </TableHead>
                      {headers.map((header) => (
                        <TableHead
                          key={header}
                          className="font-mono text-xs font-semibold whitespace-nowrap px-4"
                        >
                          {header}
                        </TableHead>
                      ))}
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc, idx) => (
                      <TableRow
                        key={doc._id || idx}
                        className="cursor-pointer hover:bg-muted/30"
                        onClick={(e) => {
                          // Prevent opening if clicking checkbox or actions
                          if (
                            (e.target as HTMLElement).closest(
                              '[role="checkbox"]',
                            ) ||
                            (e.target as HTMLElement).closest("button")
                          ) {
                            return;
                          }
                          setViewDocument(doc);
                        }}
                      >
                        <TableCell className="px-4">
                          <Checkbox
                            checked={doc._id && selectedIds.has(doc._id)}
                            onCheckedChange={(checked) =>
                              doc._id && handleSelectOne(doc._id, checked as boolean)
                            }
                            aria-label="Select row"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        {headers.map((header) => (
                          <TableCell
                            key={`${doc._id}-${header}`}
                            className="font-mono text-xs whitespace-nowrap px-4 max-w-[200px] truncate"
                            title={formatValue(doc[header])}
                          >
                            {formatValue(doc[header])}
                          </TableCell>
                        ))}
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteDocument(doc._id)}
                            disabled={deletingId === doc._id}
                          >
                            {deletingId === doc._id ? (
                              <Loader className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {documents.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={headers.length + 2}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No documents found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="query" className="mt-4">
          <Card className="p-4 space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Mongo Query (JSON)</h3>
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="font-mono text-sm min-h-[120px]"
                placeholder='{ "field": "value" }'
              />
              <p className="text-xs text-muted-foreground mt-2">
                Enter a JSON query or Aggregation Pipeline (array). Example:{" "}
                <code>{`[{ "$match": { "status": "active" } }]`}</code>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={executeQuery} disabled={queryLoading}>
                {queryLoading ? (
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Find
              </Button>
              <Button variant="outline" onClick={() => setQuery("{}")}>
                Reset
              </Button>
            </div>

            {queryError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm font-mono">{queryError}</p>
              </div>
            )}

            {queryResult && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Results</h3>
                  <span className="text-xs text-muted-foreground">
                    {queryResult.length} documents
                  </span>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          {/* Dynamically generate headers from result keys */}
                          {(() => {
                            if (queryResult.length === 0)
                              return (
                                <TableHead className="font-mono text-xs font-semibold px-4">
                                  Result
                                </TableHead>
                              );
                            const keys = new Set<string>();
                            queryResult
                              .slice(0, 10)
                              .forEach((doc: any) =>
                                Object.keys(doc).forEach((k) => keys.add(k)),
                              );
                            return Array.from(keys).map((key) => (
                              <TableHead
                                key={key}
                                className="font-mono text-xs font-semibold whitespace-nowrap px-4 sticky top-0 bg-muted/90"
                              >
                                {key}
                              </TableHead>
                            ));
                          })()}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {queryResult.length === 0 ? (
                          <TableRow>
                            <TableCell className="text-center py-4 text-muted-foreground">
                              No documents found
                            </TableCell>
                          </TableRow>
                        ) : (
                          queryResult.map((doc: any, idx: number) => {
                            const keys = new Set<string>();
                            queryResult
                              .slice(0, 10)
                              .forEach((d: any) =>
                                Object.keys(d).forEach((k) => keys.add(k)),
                              );
                            const headers = Array.from(keys);

                            return (
                              <TableRow key={idx}>
                                {headers.map((header) => (
                                  <TableCell
                                    key={`${idx}-${header}`}
                                    className="font-mono text-xs whitespace-nowrap px-4 max-w-[300px] truncate"
                                    title={formatValue(doc[header])}
                                  >
                                    {formatValue(doc[header])}
                                  </TableCell>
                                ))}
                              </TableRow>
                            );
                          })
                        )}
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
            <DialogTitle>Drop Collection</DialogTitle>
            <DialogDescription>
              Are you sure you want to drop the collection{" "}
              <span className="font-mono font-semibold">{collectionName}</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDropDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDropCollection}
              disabled={dropping}
            >
              {dropping ? (
                <Loader className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Drop Collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Detail Dialog */}
      <Dialog
        open={!!viewDocument}
        onOpenChange={(open) => !open && setViewDocument(null)}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
            <DialogDescription>
              Viewing document content (JSON)
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto border rounded-md p-4 bg-muted/30">
            <pre className="text-xs font-mono whitespace-pre-wrap break-all">
              {viewDocument ? JSON.stringify(viewDocument, null, 2) : ""}
            </pre>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDocument(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatValue(value: any): string {
  if (value === null) return "null";
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
