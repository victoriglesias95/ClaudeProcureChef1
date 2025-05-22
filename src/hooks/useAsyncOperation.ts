// src/hooks/useAsyncOperation.ts - Better async state management
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useAsyncOperation<T, Args extends any[]>(
  asyncFn: (...args: Args) => Promise<T>,
  options: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    successMessage?: string;
    errorMessage?: string;
  } = {}
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const execute = useCallback(async (...args: Args) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await asyncFn(...args);
      
      setState({
        data: result,
        loading: false,
        error: null
      });
      
      if (options.successMessage) {
        toast.success(options.successMessage);
      }
      
      options.onSuccess?.(result);
      return result;
      
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorObj
      }));
      
      if (options.errorMessage) {
        toast.error(options.errorMessage);
      }
      
      options.onError?.(errorObj);
      throw errorObj;
    }
  }, [asyncFn, options]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null
    });
  }, []);

  return {
    ...state,
    execute,
    reset
  };
}
