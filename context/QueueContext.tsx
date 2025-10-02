'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type QueueContextValue = {
  videoIdQueue: string[];
  addToQueue: (videoId: string) => void;
  removeFromQueue: (videoId: string) => void;
  clearQueue: () => void;
};

const QueueContext = createContext<QueueContextValue | undefined>(undefined);

export function QueueProvider({ children }: { children: React.ReactNode }) {
  const [videoIdQueue, setVideoIdQueue] = useState<string[]>([]);

  const addToQueue = useCallback((videoId: string) => {
    setVideoIdQueue((prev) => (prev.includes(videoId) ? prev : [...prev, videoId]));
  }, []);

  const removeFromQueue = useCallback((videoId: string) => {
    setVideoIdQueue((prev) => prev.filter((id) => id !== videoId));
  }, []);

  const clearQueue = useCallback(() => setVideoIdQueue([]), []);

  const value = useMemo(
    () => ({ videoIdQueue, addToQueue, removeFromQueue, clearQueue }),
    [videoIdQueue, addToQueue, removeFromQueue, clearQueue]
  );

  return <QueueContext.Provider value={value}>{children}</QueueContext.Provider>;
}

export function useQueue() {
  const ctx = useContext(QueueContext);
  if (!ctx) throw new Error('useQueue must be used within QueueProvider');
  return ctx;
}



