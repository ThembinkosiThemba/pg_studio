"use client";

import { StudioNavigation } from "@/lib/use-studio-navigation";
import { StudioBreadcrumb } from "@/components/studio/studio-breadcrumb";
import { MongoDatabasesPanel } from "./mongo-databases-panel";
import { MongoCollectionsPanel } from "./mongo-collections-panel";
import { MongoCollectionDetailPanel } from "./mongo-collection-detail-panel";
import Image from "next/image";

interface MongoStudioViewProps {
  userId: string;
  navigation: StudioNavigation;
}

export function MongoStudioView({ userId, navigation }: MongoStudioViewProps) {
  const { connectionId, connectionName, database, table } = navigation;

  if (!connectionId) {
    return null;
  }

  const renderContent = () => {
    if (table && database) {
      return (
        <MongoCollectionDetailPanel
          userId={userId}
          connectionId={connectionId}
          database={database}
          collectionName={table} // reusing 'table' for collection name
          onCollectionDropped={() => navigation.navigateToDatabase()}
        />
      );
    }

    if (database) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Database"
              width={40}
              height={40}
              className=""
            />
            <div>
              <h2 className="text-xl font-semibold font-mono">{database}</h2>
              <p className="text-sm text-muted-foreground">
                Manage collections and documents
              </p>
            </div>
          </div>

          <MongoCollectionsPanel
            userId={userId}
            connectionId={connectionId}
            database={database}
            onSelectCollection={navigation.selectTable}
          />
        </div>
      );
    }

    // Level 1: Databases list
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center">
            <Image src="/logo.png" alt="Connection" width={40} height={40} />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{connectionName}</h2>
            <p className="text-sm text-muted-foreground">
              Select a database to explore
            </p>
          </div>
        </div>

        <MongoDatabasesPanel
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
