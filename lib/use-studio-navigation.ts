"use client";

import { useState, useCallback } from "react";

export interface NavigationState {
  connectionId: string | null;
  connectionName: string | null;
  database: string | null;
  table: string | null;
}

export interface NavigationActions {
  selectConnection: (id: string, name: string) => void;
  selectDatabase: (db: string) => void;
  selectTable: (table: string) => void;
  navigateToConnections: () => void;
  navigateToConnection: () => void;
  navigateToDatabase: () => void;
  clearNavigation: () => void;
}

export type StudioNavigation = NavigationState & NavigationActions;

const initialState: NavigationState = {
  connectionId: null,
  connectionName: null,
  database: null,
  table: null,
};

export function useStudioNavigation(): StudioNavigation {
  const [state, setState] = useState<NavigationState>(initialState);

  const selectConnection = useCallback((id: string, name: string) => {
    setState({
      connectionId: id,
      connectionName: name,
      database: null,
      table: null,
    });
  }, []);

  const selectDatabase = useCallback((db: string) => {
    setState((prev) => ({
      ...prev,
      database: db,
      table: null,
    }));
  }, []);

  const selectTable = useCallback((table: string) => {
    setState((prev) => ({
      ...prev,
      table,
    }));
  }, []);

  const navigateToConnections = useCallback(() => {
    setState(initialState);
  }, []);

  const navigateToConnection = useCallback(() => {
    setState((prev) => ({
      ...prev,
      database: null,
      table: null,
    }));
  }, []);

  const navigateToDatabase = useCallback(() => {
    setState((prev) => ({
      ...prev,
      table: null,
    }));
  }, []);

  const clearNavigation = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    ...state,
    selectConnection,
    selectDatabase,
    selectTable,
    navigateToConnections,
    navigateToConnection,
    navigateToDatabase,
    clearNavigation,
  };
}
