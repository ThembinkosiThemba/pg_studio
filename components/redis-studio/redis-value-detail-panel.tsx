"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Trash2, Loader, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface RedisValueDetailPanelProps {
  userId: string;
  connectionId: string;
  database: string;
  keyName: string;
  onBack: () => void;
}

export function RedisValueDetailPanel({
  userId,
  connectionId,
  database,
  keyName,
  onBack,
}: RedisValueDetailPanelProps) {
  const [, setValue] = useState<any>(null);
  const [type, setType] = useState<string>("");
  const [ttl, setTtl] = useState<number>(-1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editValue, setEditValue] = useState<string>("");

  useEffect(() => {
    fetchValue();
  }, [connectionId, keyName]);

  const fetchValue = async () => {
    try {
      setLoading(true);
      const encodedKey = encodeURIComponent(keyName);
      const response = await fetch(
        `/api/redis/value?userId=${userId}&connectionId=${connectionId}&database=${database}&key=${encodedKey}`,
      );

      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Key not found");
          onBack();
          return;
        }
        throw new Error("Failed to fetch value");
      }

      const data = await response.json();
      setValue(data.value);
      setType(data.type);
      setTtl(data.ttl);

      if (typeof data.value === "object") {
        setEditValue(JSON.stringify(data.value, null, 2));
      } else {
        setEditValue(String(data.value));
      }
    } catch (error) {
      console.error("Error fetching value:", error);
      toast.error("Failed to load value");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const encodedKey = encodeURIComponent(keyName);

      // Basic saving for string types for now.
      // Complex types might need more parsing logic or specific UI editors.
      // For now, we assume if it's JSON-like, we try to parse it, otherwise send as string.

      let payloadValue = editValue;

      const response = await fetch("/api/redis/value", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          connectionId,
          database,
          key: keyName,
          type,
          value: payloadValue,
        }),
      });

      if (!response.ok) throw new Error("Failed to update value");

      toast.success("Value updated");
      fetchValue(); // Refresh
    } catch (error) {
      console.error("Error updating value:", error);
      toast.error("Failed to update value");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this key?")) return;

    try {
      const encodedKey = encodeURIComponent(keyName);
      const response = await fetch(
        `/api/redis/value?userId=${userId}&connectionId=${connectionId}&database=${database}&key=${encodedKey}`,
        { method: "DELETE" },
      );

      if (!response.ok) throw new Error("Failed to delete key");

      toast.success("Key deleted");
      onBack();
    } catch (error) {
      console.error("Error deleting key:", error);
      toast.error("Failed to delete key");
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div className="h-6 w-px bg-border mx-2" />
          <h2 className="text-xl font-mono font-semibold">{keyName}</h2>
          <span className="text-xs bg-muted px-2 py-1 rounded border uppercase font-medium text-muted-foreground">
            {type}
          </span>
          {ttl > -1 && (
            <span className="text-xs bg-yellow-500/10 text-yellow-600 px-2 py-1 rounded border border-yellow-200 dark:border-yellow-900 font-medium">
              TTL: {ttl}s
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchValue}
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="py-3 px-4 border-b bg-muted/30">
          <CardTitle className="text-sm font-medium flex justify-between items-center">
            <span>Value</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => {
                navigator.clipboard.writeText(editValue);
                toast.success("Copied to clipboard");
              }}
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0 min-h-0 relative">
          <Textarea
            className="w-full h-full min-h-[400px] resize-none border-0 focus-visible:ring-0 font-mono text-sm p-4 leading-relaxed"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            spellCheck={false}
          />
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground">
        Tip: Values are currently edited as raw text strings.
      </div>
    </div>
  );
}
