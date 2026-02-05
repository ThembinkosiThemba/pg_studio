"use client";

import type { StudioNavigation } from "@/lib/use-studio-navigation";
import { StudioBreadcrumb } from "./studio-breadcrumb";
import { DatabasesPanel } from "./databases-panel";
import { TablesPanel } from "./tables-panel";
import { TableDetailPanel } from "./table-detail-panel";
import Image from "next/image";

interface StudioViewProps {
  userId: string;
  navigation: StudioNavigation;
}

export function StudioView({ userId, navigation }: StudioViewProps) {
  const { connectionId, connectionName, database, table } = navigation;

  if (!connectionId) {
    return null;
  }

  const renderContent = () => {
    if (table && database) {
      return (
        <TableDetailPanel
          userId={userId}
          connectionId={connectionId}
          database={database}
          tableName={table}
          onTableDropped={() => navigation.navigateToDatabase()}
        />
      );
    }

    if (database) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Database" width={40} height={40} />
            <div>
              <h2 className="text-xl font-semibold font-mono">{database}</h2>
              <p className="text-sm text-muted-foreground">
                Select a table to view data
              </p>
            </div>
          </div>

          <TablesPanel
            userId={userId}
            connectionId={connectionId}
            database={database}
            onSelectTable={navigation.selectTable}
          />
        </div>
      );
    }

    // Level 1: Databases list
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Connection" width={40} height={40} />
          <div>
            <h2 className="text-xl font-semibold">{connectionName}</h2>
            <p className="text-sm text-muted-foreground">
              Select a database to explore
            </p>
          </div>
        </div>

        <DatabasesPanel
          userId={userId}
          connectionId={connectionId}
          onSelectDatabase={navigation.selectDatabase}
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
