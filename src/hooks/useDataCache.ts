// src/hooks/useDataCache.ts - Replace polling with efficient caching
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';

interface CacheConfig {
  key: string;
  fetchFn: () => Promise<any>;
  ttl?: number; // Time to live in milliseconds
  realtime?: {
    table: string;
    filter?: string;
  };
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  loading: boolean;
  error: Error | null;
}

class DataCache {
  private cache = new Map<string, CacheEntry<any>>();
  private subscriptions = new Map<string, any>();

  get<T>(key: string): CacheEntry<T> | undefined {
    return this.cache.get(key);
  }

  set<T>(key: string, data: T, error: Error | null = null) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      loading: false,
      error
    });
  }

  setLoading(key: string, loading: boolean) {
    const entry = this.cache.get(key);
    if (entry) {
      entry.loading = loading;
    } else {
      this.cache.set(key, {
        data: null,
        timestamp: Date.now(),
        loading,
        error: null
      });
    }
  }

  isExpired(key: string, ttl: number): boolean {
    const entry = this.cache.get(key);
    if (!entry) return true;
    return Date.now() - entry.timestamp > ttl;
  }

  invalidate(key: string) {
    this.cache.delete(key);
  }

  setupRealtime(key: string, config: NonNullable<CacheConfig['realtime']>) {
    if (this.subscriptions.has(key)) return;

    const subscription = supabase
      .channel(`cache_${key}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: config.table,
        filter: config.filter
      }, () => {
        this.invalidate(key);
      })
      .subscribe();

    this.subscriptions.set(key, subscription);
  }

  cleanup(key: string) {
    const subscription = this.subscriptions.get(key);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(key);
    }
  }
}

const globalCache = new DataCache();

export function useDataCache<T>(config: CacheConfig) {
  const { key, fetchFn, ttl = 5 * 60 * 1000, realtime } = config; // 5 min default TTL
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async (force = false) => {
    const cached = globalCache.get<T>(key);
    
    // Use cache if available and not expired
    if (!force && cached && !globalCache.isExpired(key, ttl)) {
      setData(cached.data);
      setError(cached.error);
      setLoading(cached.loading);
      return;
    }

    if (cached?.loading) {
      // Already loading, just wait
      return;
    }

    try {
      globalCache.setLoading(key, true);
      setLoading(true);
      setError(null);

      const result = await fetchFn();
      
      if (mountedRef.current) {
        globalCache.set(key, result);
        setData(result);
        setLoading(false);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      
      if (mountedRef.current) {
        globalCache.set(key, null, error);
        setError(error);
        setLoading(false);
      }
    }
  }, [key, fetchFn, ttl]);

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  const invalidate = useCallback(() => {
    globalCache.invalidate(key);
    fetchData(true);
  }, [key, fetchData]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    // Setup real-time updates if configured
    if (realtime) {
      globalCache.setupRealtime(key, realtime);
    }

    return () => {
      mountedRef.current = false;
      if (realtime) {
        globalCache.cleanup(key);
      }
    };
  }, [fetchData, key, realtime]);

  return {
    data,
    loading,
    error,
    refetch,
    invalidate
  };
}

// Specialized hooks for common data
export function useQuotes() {
  return useDataCache({
    key: 'quotes',
    fetchFn: async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select(`*, items:quote_items(*)`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    realtime: {
      table: 'quotes'
    }
  });
}

export function useRequests() {
  return useDataCache({
    key: 'requests',
    fetchFn: async () => {
      const { data, error } = await supabase
        .from('requests')
        .select(`*, items:request_items(*)`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    realtime: {
      table: 'requests'
    }
  });
}

export function useOrders() {
  return useDataCache({
    key: 'orders',
    fetchFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`*, items:order_items(*)`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    realtime: {
      table: 'orders'
    }
  });
}