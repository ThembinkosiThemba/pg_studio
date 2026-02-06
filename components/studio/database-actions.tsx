"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Loader } from "lucide-react";
import { toast } from "sonner";

interface DatabaseActionsProps {
  userId: string;
  connectionId: string;
  database: string;
  onTableCreated: () => void;
  onQueryClick: () => void;
}

export function DatabaseActions({
  userId,
  connectionId,
  database,
  onTableCreated,
}: DatabaseActionsProps) {
  const [createTableDialog, setCreateTableDialog] = useState(false);
  const [tableName, setTableName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreateTable = async () => {
    if (!tableName.trim()) {
      toast.error("Please enter a table name");
      return;
    }

    // Basic validation for table name
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      toast.error(
        "Invalid table name. Use letters, numbers, and underscores only.",
      );
      return;
    }

    try {
      setCreating(true);

      // Create a basic table with an id column
      const query = `CREATE TABLE "${tableName}" (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

      const response = await fetch("/api/postgres/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          connectionId,
          database,
          query,
          action: "CREATE_TABLE",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create table");
      }

      toast.success(`Table "${tableName}" created successfully`);
      setCreateTableDialog(false);
      setTableName("");
      onTableCreated();
    } catch (error: any) {
      console.error("Error creating table:", error);
      toast.error(error.message || "Failed to create table");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button onClick={() => setCreateTableDialog(true)} size="sm">
          <Plus className="w-4 h-4" />
          New Table
        </Button>
        {/* <Button onClick={onQueryClick} variant="outline" size="sm">
          <Code className="w-4 h-4 mr-2" />
          Run Query
        </Button> */}
      </div>

      <Dialog open={createTableDialog} onOpenChange={setCreateTableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Table</DialogTitle>
            <DialogDescription>
              Create a new table with a basic structure. You can modify it later
              using SQL queries.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="tableName" className="text-sm font-medium">
                Table Name
              </label>
              <Input
                id="tableName"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="e.g., users, products, orders"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateTable();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                The table will be created with id (SERIAL PRIMARY KEY) and
                created_at (TIMESTAMP) columns.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateTableDialog(false);
                setTableName("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTable}
              disabled={creating || !tableName.trim()}
            >
              {creating ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Table"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
