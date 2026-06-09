import { ApiClientError, api } from '../api/client';
import { useCallback, useEffect, useState } from 'react';

export function useFetch<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api<T>(path);
      setData(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}

export async function mutate<T>(path: string, init: RequestInit): Promise<T> {
  return api<T>(path, init);
}
