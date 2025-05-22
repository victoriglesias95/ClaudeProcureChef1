// src/hooks/useOptimisticUpdates.ts - Optimistic updates for better UX
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface OptimisticUpdate<T> {
  id: string;
  optimisticData: T;
  rollbackData: T;
  promise: Promise<any>;
}

export function useOptimisticUpdates<T>(
  initialData: T[],
  keyField: keyof T = 'id' as keyof T
) {
  const [data, setData] = useState<T[]>(initialData);
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, OptimisticUpdate<T>>>(new Map());

  const optimisticUpdate = useCallback(async (
    updateFn: (data: T[]) => T[],
    asyncFn: () => Promise<any>,
    errorMessage = 'Operation failed'
  ) => {
    const updateId = Date.now().toString();
    const originalData = [...data];
    
    try {
      // Apply optimistic update immediately
      const newData = updateFn(originalData);
      setData(newData);
      
      // Track the pending update
      const update: OptimisticUpdate<any> = {
        id: updateId,
        optimisticData: newData,
        rollbackData: originalData,
        promise: asyncFn()
      };
      
      setPendingUpdates(prev => new Map(prev).set(updateId, update));
      
      // Execute actual operation
      await update.promise;
      
      // Remove from pending updates on success
      setPendingUpdates(prev => {
        const next = new Map(prev);
        next.delete(updateId);
        return next;
      });
      
    } catch (error) {
      // Rollback on failure
      setData(originalData);
      setPendingUpdates(prev => {
        const next = new Map(prev);
        next.delete(updateId);
        return next;
      });
      
      toast.error(errorMessage);
      throw error;
    }
  }, [data]);

  return {
    data,
    setData,
    optimisticUpdate,
    isPending: pendingUpdates.size > 0
  };
}