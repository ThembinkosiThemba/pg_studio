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
import { MoreVertical, Trash2, Loader, Database } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface MongoDatabasesPanelProps {
  userId: string;
  connectionId: string;
  onSelectDatabase: (database: string) => void;
}

export function MongoDatabasesPanel({
  userId,
  connectionId,
  onSelectDatabase,
}: MongoDatabasesPanelProps) {
  const [databases, setDatabases] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dropDialog, setDropDialog] = useState<{
    open: boolean;
    database: string;
  }>({ open: false, database: "" });
  const [dropping, setDropping] = useState(false);

  useEffect(() => {
    fetchDatabases();
  }, [connectionId]);

  const fetchDatabases = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/mongo/explore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          connectionId,
          type: "databases",
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch databases");
      const data = await response.json();
      setDatabases(data.data || []);
    } catch (error) {
      console.error("Error fetching databases:", error);
      toast.error("Failed to load databases");
    } finally {
      setLoading(false);
    }
  };

  const handleDropDatabase = async () => {
    if (!dropDialog.database) return;

    try {
      setDropping(true);
      const response = await fetch("/api/mongo/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          connectionId,
          database: dropDialog.database,
          action: "DROP_DATABASE",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to drop database");
      }

      toast.success(`Database "${dropDialog.database}" dropped`);
      setDropDialog({ open: false, database: "" });
      fetchDatabases();
    } catch (error: any) {
      console.error("Error dropping database:", error);
      toast.error(error.message || "Failed to drop database");
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {databases.map((db) => (
          <Card
            key={db}
            className="p-4 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
            onClick={() => onSelectDatabase(db)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg">
                  <Image
                    src="/logo.png"
                    alt="Database"
                    width={32}
                    height={32}
                  />
                </div>
                <div>
                  <h3 className="font-medium font-mono text-sm">{db}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Database
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
                      setDropDialog({ open: true, database: db });
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Drop Database
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>
        ))}

        {databases.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No databases found
          </div>
        )}
      </div>

      <Dialog
        open={dropDialog.open}
        onOpenChange={(open) => setDropDialog({ ...dropDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Drop Database</DialogTitle>
            <DialogDescription>
              Are you sure you want to drop the database{" "}
              <span className="font-mono font-semibold">
                {dropDialog.database}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDropDialog({ open: false, database: "" })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDropDatabase}
              disabled={dropping}
            >
              {dropping ? (
                <Loader className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Drop Database
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
