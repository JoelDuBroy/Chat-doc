"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";

import {
  addSessionToFolder,
  createFolder,
  deleteFolder,
  hydrateLibraryFromStorage,
  loadLibrarySnapshot,
  moveSession,
  removeFile,
  removeSession,
  renameFolder,
  serverLibraryState,
  subscribeLibrary,
  syncLibraryFromDocuments,
  toggleFolderCollapsed,
  upsertFile,
  upsertSession,
} from "@/lib/library/storage";
import type { LibrarySession } from "@/lib/library/types";

export function useLibrary() {
  useEffect(() => {
    hydrateLibraryFromStorage();
  }, []);

  const state = useSyncExternalStore(subscribeLibrary, loadLibrarySnapshot, serverLibraryState);

  const unfiledSessions = useMemo(
    () => state.sessions.filter((session) => !session.folderId),
    [state.sessions],
  );

  const sessionsByFolder = useMemo(() => {
    const map = new Map<string, LibrarySession[]>();
    for (const folder of state.folders) map.set(folder.id, []);
    for (const session of state.sessions) {
      if (!session.folderId) continue;
      const list = map.get(session.folderId);
      if (list) list.push(session);
    }
    return map;
  }, [state.folders, state.sessions]);

  // Module-level storage helpers are already stable; wrapping in useCallback
  // trips react-hooks/use-memo (requires an inline function expression).
  return {
    state,
    unfiledSessions,
    sessionsByFolder,
    upsertFile,
    removeFile,
    upsertSession,
    removeSession,
    moveSession,
    addSessionToFolder,
    createFolder,
    renameFolder,
    deleteFolder,
    toggleFolderCollapsed,
    syncLibraryFromDocuments,
  };
}
