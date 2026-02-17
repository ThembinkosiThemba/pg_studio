"use client";

import { useState, useEffect } from "react";
import { StudioNavigation } from "@/lib/use-studio-navigation";
import { StudioBreadcrumb } from "@/components/studio/studio-breadcrumb";
import { RedisKeysPanel } from "./redis-keys-panel";
import { RedisValueDetailPanel } from "./redis-value-detail-panel";
import { Database } from "lucide-react";
import Image from "next/image";

interface RedisStudioViewProps {
  userId: string;
  navigation: StudioNavigation;
}

export function RedisStudioView({ userId, navigation }: RedisStudioViewProps) {
  const { connectionId, connectionName, table, database } = navigation;

  const [databases, setDatabases] = useState<{ id: string; keys: number }[]>(
    [],
  );

  useEffect(() => {
    if (connectionId) {
      fetchDatabases();
    }
  }, [connectionId]);

  const fetchDatabases = async () => {
    try {
      const response = await fetch(
        `/api/redis/databases?userId=${userId}&connectionId=${connectionId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setDatabases(data.databases);
      }
    } catch (error) {
      console.error("Failed to fetch databases", error);
    }
  };

  if (!connectionId) {
    return null;
  }

  const currentDb = database || "0";

  const renderContent = () => {
    // If a key is selected (using 'table' param to store key name for now)
    if (table) {
      return (
        <RedisValueDetailPanel
          userId={userId}
          connectionId={connectionId}
          database={currentDb}
          keyName={table}
          onBack={() => navigation.navigateToConnection()}
        />
      );
    }

    // Default view: Keys list
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Database"
              width={40}
              height={40}
              className=""
            />
            <div>
              <h2 className="text-xl font-semibold">{connectionName}</h2>
              <p className="text-sm text-muted-foreground">
                Manage Redis keys and values
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Database:</span>
            <select
              className="h-9 min-w-24 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={currentDb}
              onChange={(e) => navigation.selectDatabase(e.target.value)}
            >
              {databases.map((db) => (
                <option key={db.id} value={db.id}>
                  DB {db.id} ({db.keys})
                </option>
              ))}
              {databases.length === 0 && <option value="0">DB 0</option>}
            </select>
          </div>
        </div>

        <RedisKeysPanel
          userId={userId}
          connectionId={connectionId}
          database={currentDb}
          onSelectKey={navigation.selectTable}
        />
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0">
      <div className="border-b bg-muted/30 px-6 py-3 flex-shrink-0">
        <StudioBreadcrumb navigation={navigation} />
      </div>

      <div className="flex-1 overflow-auto p-6 min-w-0">{renderContent()}</div>
    </div>
  );
}
