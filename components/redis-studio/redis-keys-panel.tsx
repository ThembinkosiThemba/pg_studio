"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Plus, Key, RefreshCw, Trash2, Loader } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RedisKeysPanelProps {
  userId: string;
  connectionId: string;
  database: string;
  onSelectKey: (key: string) => void;
}

interface RedisKey {
  key: string;
  type: string;
}

export function RedisKeysPanel({
  userId,
  connectionId,
  database,
  onSelectKey,
}: RedisKeysPanelProps) {
  const [keys, setKeys] = useState<RedisKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [scanCursor, setScanCursor] = useState("0");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newKey, setNewKey] = useState({ key: "", type: "string", value: "" });

  useEffect(() => {
    setScanCursor("0");
    setKeys([]);
    fetchKeys("*", "0");
  }, [connectionId, database]);

  const fetchKeys = async (pattern = "*", cursor = "0") => {
    try {
      setLoading(true);
      const encodedPattern = encodeURIComponent(pattern);
      const response = await fetch(
        `/api/redis/keys?userId=${userId}&connectionId=${connectionId}&database=${database}&pattern=${encodedPattern}&cursor=${cursor}`,
      );
      if (!response.ok) throw new Error("Failed to fetch keys");
      const data = await response.json();
      setKeys(data.keys);
      setScanCursor(data.cursor);
    } catch (error) {
      console.error("Error fetching keys:", error);
      toast.error("Failed to load keys");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchKeys(search || "*");
  };

  const handleAddKey = async () => {
    if (!newKey.key || !newKey.value) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const response = await fetch("/api/redis/value", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          connectionId,
          database,
          key: newKey.key,
          type: newKey.type,
          value: newKey.value,
        }),
      });

      if (!response.ok) throw new Error("Failed to create key");

      toast.success("Key created successfully");
      setDialogOpen(false);
      setNewKey({ key: "", type: "string", value: "" });
      fetchKeys(search || "*", "0");
    } catch (error) {
      console.error("Error creating key:", error);
      toast.error("Failed to create key");
    }
  };

  const handleDeleteKey = async (e: React.MouseEvent, keyToDelete: string) => {
    e.stopPropagation();
    if (
      !window.confirm(`Are you sure you want to delete key "${keyToDelete}"?`)
    )
      return;

    try {
      const encodedKey = encodeURIComponent(keyToDelete);
      const response = await fetch(
        `/api/redis/value?userId=${userId}&connectionId=${connectionId}&database=${database}&key=${encodedKey}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) throw new Error("Failed to delete key");

      toast.success("Key deleted");
      // Optimistic update
      setKeys(keys.filter((k) => k.key !== keyToDelete));
    } catch (error) {
      console.error("Error deleting key:", error);
      toast.error("Failed to delete key");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search keys (e.g., user:*)"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
        <Button
          variant="outline"
          size="icon"
          onClick={() => fetchKeys(search || "*", "0")}
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Key</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Key Name
                </label>
                <Input
                  value={newKey.key}
                  onChange={(e) =>
                    setNewKey({ ...newKey, key: e.target.value })
                  }
                  placeholder="e.g. settings:theme"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <Select
                  value={newKey.type}
                  onValueChange={(val) => setNewKey({ ...newKey, type: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    {/* Only supporting string creation for now for simplicity of the quick-add ui */}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Currently only simple Strings can be created here. Use CLI for
                  complex types.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Value</label>
                <Input
                  value={newKey.value}
                  onChange={(e) =>
                    setNewKey({ ...newKey, value: e.target.value })
                  }
                  placeholder="Value"
                />
              </div>
              <Button onClick={handleAddKey} className="w-full">
                Create Key
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : keys.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <Key className="mx-auto h-12 w-12 opacity-20 mb-4" />
          <p>No keys found matching pattern.</p>
        </Card>
      ) : (
        <div className="border rounded-md divide-y">
          {keys.map((item) => (
            <div
              key={item.key}
              className="p-3 flex items-center justify-between hover:bg-muted/50 cursor-pointer transition-colors group"
              onClick={() => onSelectKey(item.key)}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider 
                            ${
                              item.type === "string"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                : item.type === "hash"
                                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                  : item.type === "list"
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    : item.type === "set"
                                      ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                      : "bg-gray-100 text-gray-700"
                            }`}
                >
                  {item.type}
                </div>
                <span className="font-mono text-sm">{item.key}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition hover:bg-destructive/10 hover:text-destructive"
                onClick={(e) => handleDeleteKey(e, item.key)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
