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
import { Table2, MoreVertical, Trash2, Loader } from "lucide-react";
import { toast } from "sonner";

interface TablesPanelProps {
  userId: string;
  connectionId: string;
  database: string;
  onSelectTable: (table: string) => void;
}

export function TablesPanel({
  userId,
  connectionId,
  database,
  onSelectTable,
}: TablesPanelProps) {
  const [tables, setTables] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dropDialog, setDropDialog] = useState<{ open: boolean; table: string }>(
    { open: false, table: "" }
  );
  const [dropping, setDropping] = useState(false);

  useEffect(() => {
    fetchTables();
  }, [connectionId, database]);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/postgres/explore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          connectionId,
          type: "tables",
          database,
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch tables");
      const data = await response.json();
      setTables(data.data || []);
    } catch (error) {
      console.error("Error fetching tables:", error);
      toast.error("Failed to load tables");
    } finally {
      setLoading(false);
    }
  };

  const handleDropTable = async () => {
    if (!dropDialog.table) return;

    try {
      setDropping(true);
      const response = await fetch("/api/postgres/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          connectionId,
          query: `DROP TABLE "${dropDialog.table}"`,
          action: "DROP_TABLE",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to drop table");
      }

      toast.success(`Table "${dropDialog.table}" dropped`);
      setDropDialog({ open: false, table: "" });
      fetchTables();
    } catch (error: any) {
      console.error("Error dropping table:", error);
      toast.error(error.message || "Failed to drop table");
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
        {tables.map((table) => (
          <Card
            key={table}
            className="p-4 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
            onClick={() => onSelectTable(table)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Table2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium font-mono text-sm">{table}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Table</p>
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
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropDialog({ open: true, table });
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Drop Table
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>
        ))}

        {tables.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No tables found in this database
          </div>
        )}
      </div>

      <Dialog
        open={dropDialog.open}
        onOpenChange={(open) => setDropDialog({ ...dropDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Drop Table</DialogTitle>
            <DialogDescription>
              Are you sure you want to drop the table{" "}
              <span className="font-mono font-semibold">{dropDialog.table}</span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDropDialog({ open: false, table: "" })}
            >
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
    </>
  );
}
