"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Plus, ChevronRight } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Connection, ConnectionType } from "@/lib/types";

interface ConnectionsListProps {
  userId: string;
  onSelectConnection: (connection: Connection) => void;
  selectedConnectionId?: string | null;
  refreshTrigger?: number;
}

export function ConnectionsList({
  userId,
  onSelectConnection,
  refreshTrigger = 0,
}: ConnectionsListProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [newConnection, setNewConnection] = useState<{
    name: string;
    connectionString: string;
    type: ConnectionType;
  }>({
    name: "",
    connectionString: "",
    type: "postgres",
  });
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchConnections();
  }, [userId, refreshTrigger]);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/connections?userId=${userId}`);
      if (!response.ok) throw new Error("Failed to fetch connections");
      const data = await response.json();
      setConnections(data);
    } catch (error) {
      console.error("Error fetching connections:", error);
      toast.error("Failed to load connections");
    } finally {
      setLoading(false);
    }
  };

  const handleAddConnection = async () => {
    if (!newConnection.name || !newConnection.connectionString) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const response = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          ...newConnection,
        }),
      });

      if (!response.ok) throw new Error("Failed to add connection");
      toast.success("Connection added successfully");
      setNewConnection({ name: "", connectionString: "", type: "postgres" });
      setDialogOpen(false);
      fetchConnections();
    } catch (error) {
      console.error("Error adding connection:", error);
      toast.error("Failed to add connection");
    }
  };

  const handleDeleteConnection = async (
    e: React.MouseEvent,
    connectionId: string,
  ) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this connection?"))
      return;

    try {
      const response = await fetch("/api/connections", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId }),
      });

      if (!response.ok) throw new Error("Failed to delete connection");
      toast.success("Connection deleted");
      fetchConnections();
    } catch (error) {
      console.error("Error deleting connection:", error);
      toast.error("Failed to delete connection");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Your Connections</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Your Connections</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Select a connection to start exploring
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Connection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add PostgreSQL Connection</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Connection Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${newConnection.type === "postgres"
                      ? "bg-primary/10 border-primary text-primary font-medium"
                      : "hover:bg-muted"
                      }`}
                    onClick={() =>
                      setNewConnection({ ...newConnection, type: "postgres" })
                    }
                  >
                    PostgreSQL
                  </div>
                  <div
                    className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${newConnection.type === "mongo"
                      ? "bg-primary/10 border-primary text-primary font-medium"
                      : "hover:bg-muted"
                      }`}
                    onClick={() =>
                      setNewConnection({ ...newConnection, type: "mongo" })
                    }
                  >
                    MongoDB
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Connection Name
                </label>
                <Input
                  placeholder="e.g., Production DB"
                  value={newConnection.name}
                  onChange={(e) =>
                    setNewConnection({ ...newConnection, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Connection String
                </label>
                <Textarea
                  placeholder="postgresql://user:password@host:port/database"
                  value={newConnection.connectionString}
                  onChange={(e) =>
                    setNewConnection({
                      ...newConnection,
                      connectionString: e.target.value,
                    })
                  }
                  className="font-mono text-sm"
                  rows={3}
                />
              </div>
              <Button onClick={handleAddConnection} className="w-full">
                Add Connection
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {connections.length === 0 ? (
        <Card className="p-12 text-center">
          <Image
            src="/logo.png"
            alt="Logo"
            width={64}
            height={64}
            className="mx-auto mb-4 opacity-50"
          />
          <h3 className="text-lg font-medium mb-2">No connections yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Create your first PostgreSQL connection to get started.
          </p>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Connection
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connections.map((conn) => (
            <Card
              key={conn._id}
              className="p-4 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
              onClick={() => onSelectConnection(conn)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Image src="/logo.png" alt="Logo" width={32} height={32} />
                  <div>
                    <h3 className="font-medium">{conn.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                      {conn.type || "postgres"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDeleteConnection(e, conn._id)}
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
