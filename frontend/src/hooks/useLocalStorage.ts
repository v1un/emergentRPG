// Custom hook for localStorage with TypeScript support

import { useState, useEffect, useCallback } from 'react';
import { safeJsonParse, safeJsonStringify } from '@/utils/helpers';

type SetValue<T> = T | ((val: T) => T);

interface UseLocalStorageOptions<T> {
  defaultValue: T;
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
  onError?: (error: Error) => void;
}

interface UseLocalStorageReturn<T> {
  value: T;
  setValue: (value: SetValue<T>) => void;
  removeValue: () => void;
  isLoading: boolean;
  error: Error | null;
}

export function useLocalStorage<T>(
  key: string,
  options: UseLocalStorageOptions<T>
): UseLocalStorageReturn<T> {
  const {
    defaultValue,
    serialize = safeJsonStringify,
    deserialize = (value: string) => safeJsonParse(value, defaultValue),
    onError,
  } = options;

  const [storedValue, setStoredValue] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Read from localStorage on mount
  useEffect(() => {
    try {
      setIsLoading(true);
      setError(null);

      if (typeof window === 'undefined') {
        setStoredValue(defaultValue);
        return;
      }

      const item = window.localStorage.getItem(key);
      if (item !== null) {
        const parsedValue = deserialize(item);
        setStoredValue(parsedValue);
      } else {
        setStoredValue(defaultValue);
      }
    } catch (err) {
      const error = err as Error;
      console.error(`Error reading localStorage key "${key}":`, error);
      setError(error);
      setStoredValue(defaultValue);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [key, defaultValue, deserialize, onError]);

  // Set value function
  const setValue = useCallback((value: SetValue<T>) => {
    try {
      setError(null);

      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        const serializedValue = serialize(valueToStore);
        window.localStorage.setItem(key, serializedValue);
      }
    } catch (err) {
      const error = err as Error;
      console.error(`Error setting localStorage key "${key}":`, error);
      setError(error);
      onError?.(error);
    }
  }, [key, storedValue, serialize, onError]);

  // Remove value function
  const removeValue = useCallback(() => {
    try {
      setError(null);
      setStoredValue(defaultValue);
      
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (err) {
      const error = err as Error;
      console.error(`Error removing localStorage key "${key}":`, error);
      setError(error);
      onError?.(error);
    }
  }, [key, defaultValue, onError]);

  return {
    value: storedValue,
    setValue,
    removeValue,
    isLoading,
    error,
  };
}

// Specialized hooks for common use cases
export function useLocalStorageString(key: string, defaultValue = '') {
  return useLocalStorage(key, {
    defaultValue,
    serialize: (value) => value,
    deserialize: (value) => value,
  });
}

export function useLocalStorageNumber(key: string, defaultValue = 0) {
  return useLocalStorage(key, {
    defaultValue,
    serialize: (value) => value.toString(),
    deserialize: (value) => {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? defaultValue : parsed;
    },
  });
}

export function useLocalStorageBoolean(key: string, defaultValue = false) {
  return useLocalStorage(key, {
    defaultValue,
    serialize: (value) => value.toString(),
    deserialize: (value) => value === 'true',
  });
}

export function useLocalStorageArray<T>(key: string, defaultValue: T[] = []) {
  return useLocalStorage(key, {
    defaultValue,
    serialize: (value) => safeJsonStringify(value, '[]'),
    deserialize: (value) => safeJsonParse(value, defaultValue),
  });
}

export function useLocalStorageObject<T extends Record<string, any>>(
  key: string, 
  defaultValue: T
) {
  return useLocalStorage(key, {
    defaultValue,
    serialize: (value) => safeJsonStringify(value, '{}'),
    deserialize: (value) => safeJsonParse(value, defaultValue),
  });
}

// Hook for managing multiple localStorage keys
export function useLocalStorageMultiple<T extends Record<string, any>>(
  keys: Record<keyof T, string>,
  defaultValues: T
) {
  const [values, setValues] = useState<T>(defaultValues);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, Error>>({});

  useEffect(() => {
    setIsLoading(true);
    const newValues = { ...defaultValues };
    const newErrors: Record<string, Error> = {};

    for (const [valueKey, storageKey] of Object.entries(keys)) {
      try {
        if (typeof window !== 'undefined') {
          const item = window.localStorage.getItem(storageKey);
          if (item !== null) {
            newValues[valueKey as keyof T] = safeJsonParse(item, defaultValues[valueKey as keyof T]);
          }
        }
      } catch (err) {
        newErrors[storageKey] = err as Error;
      }
    }

    setValues(newValues);
    setErrors(newErrors);
    setIsLoading(false);
  }, []);

  const updateValue = useCallback(<K extends keyof T>(
    valueKey: K,
    value: SetValue<T[K]>
  ) => {
    const storageKey = keys[valueKey];
    
    try {
      const valueToStore = value instanceof Function ? value(values[valueKey]) : value;
      
      setValues(prev => ({ ...prev, [valueKey]: valueToStore }));
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, safeJsonStringify(valueToStore));
      }
      
      // Clear error for this key
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[storageKey];
        return newErrors;
      });
    } catch (err) {
      setErrors(prev => ({ ...prev, [storageKey]: err as Error }));
    }
  }, [keys, values]);

  const removeValue = useCallback((valueKey: keyof T) => {
    const storageKey = keys[valueKey];
    
    try {
      setValues(prev => ({ ...prev, [valueKey]: defaultValues[valueKey] }));
      
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(storageKey);
      }
      
      // Clear error for this key
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[storageKey];
        return newErrors;
      });
    } catch (err) {
      setErrors(prev => ({ ...prev, [storageKey]: err as Error }));
    }
  }, [keys, defaultValues]);

  const clearAll = useCallback(() => {
    try {
      setValues(defaultValues);
      
      if (typeof window !== 'undefined') {
        Object.values(keys).forEach(storageKey => {
          window.localStorage.removeItem(storageKey);
        });
      }
      
      setErrors({});
    } catch (err) {
      console.error('Error clearing localStorage:', err);
    }
  }, [keys, defaultValues]);

  return {
    values,
    updateValue,
    removeValue,
    clearAll,
    isLoading,
    errors,
    hasErrors: Object.keys(errors).length > 0,
  };
}

export default useLocalStorage;
