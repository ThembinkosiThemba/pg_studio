"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Play, Loader, Table2 } from "lucide-react";
import { toast } from "sonner";

interface QueryRunnerProps {
  userId: string;
  connectionId: string;
  database: string;
  onTableCreated?: () => void;
}

export function QueryRunner({
  userId,
  connectionId,
  database,
  onTableCreated,
}: QueryRunnerProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    rows?: any[];
    fields?: string[];
    rowCount?: number;
    command?: string;
  } | null>(null);

  const executeQuery = async () => {
    if (!query.trim()) {
      toast.error("Please enter a query");
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const response = await fetch("/api/postgres/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          connectionId,
          database,
          query: query.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to execute query");
      }

      const data = await response.json();
      setResult(data);

      // If a CREATE TABLE command was successful, trigger refresh
      if (data.command === "CREATE" && onTableCreated) {
        onTableCreated();
      }

      toast.success(
        data.rowCount !== undefined
          ? `Query executed (${data.rowCount} rows affected)`
          : "Query executed successfully"
      );
    } catch (error: any) {
      console.error("Error executing query:", error);
      toast.error(error.message || "Failed to execute query");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      executeQuery();
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">SQL Query</h3>
          <span className="text-xs text-muted-foreground">
            Press Cmd/Ctrl + Enter to run
          </span>
        </div>

        <Textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter your SQL query here...&#10;&#10;Example:&#10;CREATE TABLE users (&#10;  id SERIAL PRIMARY KEY,&#10;  name VARCHAR(255) NOT NULL,&#10;  email VARCHAR(255) UNIQUE NOT NULL,&#10;  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP&#10;);"
          className="font-mono text-sm min-h-[120px] resize-y"
        />

        <div className="flex justify-end">
          <Button onClick={executeQuery} disabled={loading || !query.trim()}>
            {loading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run Query
              </>
            )}
          </Button>
        </div>

        {result && (
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center gap-2 mb-3">
              <Table2 className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold">Result</span>
            </div>

            {result.command && (
              <div className="text-sm mb-2">
                <span className="font-mono text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  {result.command}
                </span>
                {result.rowCount !== undefined && (
                  <span className="ml-2 text-muted-foreground">
                    {result.rowCount} row{result.rowCount !== 1 ? "s" : ""}{" "}
                    affected
                  </span>
                )}
              </div>
            )}

            {result.rows && result.rows.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {result.fields?.map((field) => (
                        <th
                          key={field}
                          className="text-left p-2 font-medium text-xs"
                        >
                          {field}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.slice(0, 100).map((row, idx) => (
                      <tr key={idx} className="border-b">
                        {result.fields?.map((field) => (
                          <td key={field} className="p-2 font-mono text-xs">
                            {row[field] !== null && row[field] !== undefined
                              ? String(row[field])
                              : <span className="text-muted-foreground">NULL</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.rows.length > 100 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Showing first 100 rows of {result.rows.length}
                  </p>
                )}
              </div>
            )}

            {result.rows && result.rows.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Query executed successfully (0 rows returned)
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
