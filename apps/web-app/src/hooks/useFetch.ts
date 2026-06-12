import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

interface UseFetchResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const apiCache = new Map<string, CacheEntry<any>>();
const DEFAULT_TTL = 2 * 60 * 1000; // 2 minutes in ms

export function clearFetchCache() {
  apiCache.clear();
}

/**
 * Hook personalizado para realizar peticiones GET a la API de forma segura y con caché en memoria.
 * @template T - Tipo de datos esperado en la respuesta.
 * @param {string | null} endpoint - Endpoint de la API a consultar (null para evitar petición).
 * @param {object} [options] - Opciones de caché.
 * @param {number} [options.ttl] - Tiempo de vida de la caché en milisegundos.
 * @returns {UseFetchResult<T>} Objeto con los datos, estado de carga, error y función para reintentar la petición.
 */
export function useFetch<T>(
  endpoint: string | null,
  options?: { ttl?: number }
): UseFetchResult<T> {
  const ttl = options?.ttl ?? DEFAULT_TTL;

  // Helper sync logic to get cached value
  const getCachedValue = useCallback(() => {
    if (!endpoint) return null;
    const cached = apiCache.get(endpoint);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data as T;
    }
    return null;
  }, [endpoint, ttl]);

  const [data, setData] = useState<T | null>(getCachedValue);
  const [isLoading, setIsLoading] = useState(() => {
    if (!endpoint) return false;
    const cached = apiCache.get(endpoint);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return false;
    }
    return true;
  });
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  const refetch = useCallback(() => {
    if (endpoint) {
      apiCache.delete(endpoint);
    }
    setTrigger((t) => t + 1);
  }, [endpoint]);

  // Synchronize state if endpoint changes
  useEffect(() => {
    const cachedVal = getCachedValue();
    if (cachedVal !== null) {
      setData(cachedVal);
      setIsLoading(false);
    } else {
      setData(null);
      setIsLoading(!!endpoint);
    }
    setError(null);
  }, [endpoint, getCachedValue]);

  useEffect(() => {
    if (!endpoint) {
      setIsLoading(false);
      return;
    }

    // Double check cache before hitting network
    const cached = apiCache.get(endpoint);
    if (cached && Date.now() - cached.timestamp < ttl) {
      setData(cached.data);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    api
      .get<T>(endpoint)
      .then((result) => {
        if (!cancelled) {
          apiCache.set(endpoint, { data: result, timestamp: Date.now() });
          setData(result);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Error al cargar datos');
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [endpoint, trigger, ttl]);

  return { data, isLoading, error, refetch };
}
