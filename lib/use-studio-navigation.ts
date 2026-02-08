"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export interface NavigationState {
  connectionId: string | null;
  connectionName: string | null;
  connectionType: "postgres" | "mongo" | null;
  database: string | null;
  table: string | null;
}

export interface NavigationActions {
  selectConnection: (id: string, name: string, type: "postgres" | "mongo") => void;
  selectDatabase: (db: string) => void;
  selectTable: (table: string) => void;
  navigateToConnections: () => void;
  navigateToConnection: () => void;
  navigateToDatabase: () => void;
  clearNavigation: () => void;
}

export type StudioNavigation = NavigationState & NavigationActions;

export function useStudioNavigation(): StudioNavigation {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Derive state from URL search params
  const connectionId = searchParams.get("connectionId");
  const connectionName = searchParams.get("name");
  const connectionType = searchParams.get("type") as "postgres" | "mongo" | null;
  const database = searchParams.get("database");
  const table = searchParams.get("table") || searchParams.get("collection"); // Support both for backward comaptibility/clarity

  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    router.push(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams]);

  const selectConnection = useCallback((id: string, name: string, type: "postgres" | "mongo") => {
    updateParams({
      connectionId: id,
      name: name,
      type: type,
      database: null,
      table: null,
      collection: null
    });
  }, [updateParams]);

  const selectDatabase = useCallback((db: string) => {
    updateParams({
      database: db,
      table: null,
      collection: null
    });
  }, [updateParams]);

  const selectTable = useCallback((tbl: string) => {
    // For consistency, we'll use 'table' param for both SQL tables and Mongo collections
    // OR distinct params. Let's use 'table' generically or context-aware.
    // Given the state interface has 'table', let's stick to 'table' in param or 'collection' based on type? 
    // Simplified: just update 'table' param.
    // The user requested "add collection.table when viewing those".
    // Let's infer: if type is mongo, maybe use 'collection' param? 
    // To match the existing Interface 'table', we can map it. 
    // But let's check connectionType.

    // NOTE: 'connectionType' comes from URL, so it might be string. 
    const currentType = searchParams.get("type");
    if (currentType === 'mongo') {
      updateParams({ collection: tbl, table: null });
    } else {
      updateParams({ table: tbl, collection: null });
    }
  }, [updateParams, searchParams]);

  const navigateToConnections = useCallback(() => {
    router.push(pathname);
  }, [pathname, router]);

  const navigateToConnection = useCallback(() => {
    updateParams({
      database: null,
      table: null,
      collection: null
    });
  }, [updateParams]);

  const navigateToDatabase = useCallback(() => {
    updateParams({
      table: null,
      collection: null
    });
  }, [updateParams]);

  const clearNavigation = useCallback(() => {
    router.push(pathname);
  }, [pathname, router]);

  return {
    connectionId,
    connectionName,
    connectionType,
    database,
    table: table, // This will be either 'table' or 'collection' param
    selectConnection,
    selectDatabase,
    selectTable,
    navigateToConnections,
    navigateToConnection,
    navigateToDatabase,
    clearNavigation,
  };
}
