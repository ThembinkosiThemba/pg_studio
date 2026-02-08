"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MoreVertical, Trash2, Loader, Files } from "lucide-react";
import { toast } from "sonner";

interface MongoCollectionsPanelProps {
  userId: string;
  connectionId: string;
  database: string;
  onSelectCollection: (collection: string) => void;
}

export function MongoCollectionsPanel({
  userId,
  connectionId,
  database,
  onSelectCollection,
}: MongoCollectionsPanelProps) {
  const [collections, setCollections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dropDialog, setDropDialog] = useState<{
    open: boolean;
    collection: string;
  }>({ open: false, collection: "" });
  const [dropping, setDropping] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, [connectionId, database]);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/mongo/explore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          connectionId,
          type: "collections",
          database,
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch collections");
      const data = await response.json();
      setCollections(data.data || []);
    } catch (error) {
      console.error("Error fetching collections:", error);
      toast.error("Failed to load collections");
    } finally {
      setLoading(false);
    }
  };

  const handleDropCollection = async () => {
    if (!dropDialog.collection) return;

    try {
      setDropping(true);
      const response = await fetch("/api/mongo/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          connectionId,
          database,
          collection: dropDialog.collection,
          action: "DROP_COLLECTION",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to drop collection");
      }

      toast.success(`Collection "${dropDialog.collection}" dropped`);
      setDropDialog({ open: false, collection: "" });
      fetchCollections();
    } catch (error: any) {
      console.error("Error dropping collection:", error);
      toast.error(error.message || "Failed to drop collection");
    } finally {
      setDropping(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {collections.map((col) => (
          <Card
            key={col}
            className="p-4 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
            onClick={() => onSelectCollection(col)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg">
                  <Files className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-medium font-mono text-sm">{col}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Collection
                  </p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-100" align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropDialog({ open: true, collection: col });
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Drop Collection
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>
        ))}

        {collections.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No collections found in this database
          </div>
        )}
      </div>

      <Dialog
        open={dropDialog.open}
        onOpenChange={(open) => setDropDialog({ ...dropDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Drop Collection</DialogTitle>
            <DialogDescription>
              Are you sure you want to drop the collection{" "}
              <span className="font-mono font-semibold">
                {dropDialog.collection}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDropDialog({ open: false, collection: "" })}
            >
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
    </>
  );
}
