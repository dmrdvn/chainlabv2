'use client';

import type { Frontend } from 'src/types/frontend';

import useSWR, { useSWRConfig } from 'swr';
import { useMemo, useState, useEffect, useCallback } from 'react';

import { getFrontendById, getFrontendsByProjectId } from 'src/actions/frontends';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

/**
 * SWR için cache key oluşturucu
 * @param projectId Proje ID
 * @returns Cache key
 */
const getFrontendsCacheKey = (projectId: string | null) =>
  projectId ? `frontends-${projectId}` : null;

/**
 * Frontend silmek için hook
 * @returns Frontend silme fonksiyonu ve ilgili durumlar
 */
export function useDeleteFrontend() {
  const [isDeleting, setIsDeleting] = useState(false);
  const { mutate } = useSWRConfig();

  const deleteFrontend = useCallback(
    async (frontendId: string, projectId: string) => {
      try {
        setIsDeleting(true);
        console.log('=== HOOK: useDeleteFrontend başladı ===');
        console.log('Frontend ID:', frontendId);
        console.log('Project ID:', projectId);

        // Frontend silme işlemi burada yapılacak
        // Şimdilik mock bir işlem
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Cache'i güncelle
        await mutate(getFrontendsCacheKey(projectId));

        toast.success('Frontend başarıyla silindi');
        console.log('=== HOOK: useDeleteFrontend başarıyla tamamlandı ===');
      } catch (error) {
        console.error('Frontend silinirken hata:', error);
        toast.error('Frontend silinirken bir hata oluştu');
        console.log('=== HOOK: useDeleteFrontend hata ile tamamlandı ===');
        throw error;
      } finally {
        setIsDeleting(false);
      }
    },
    [mutate]
  );

  return {
    deleteFrontend,
    isDeleting,
  };
}

/**
 * Proje ID'sine göre frontend'leri çekmek ve cache'lemek için hook
 * @param projectId Proje ID (UUID)
 * @returns Frontend listesi ve ilgili durumlar
 */
export function useFrontends(projectId: string | null) {
  const { data, isLoading, error, isValidating, mutate } = useSWR(
    getFrontendsCacheKey(projectId),
    async () => {
      if (!projectId) {
        console.log('useFrontends: projectId boş, boş dizi dönülüyor');
        return [];
      }

      console.log("useFrontends: Frontend'ler çekiliyor, projectId:", projectId);
      try {
        const frontends = await getFrontendsByProjectId(projectId);
        console.log("useFrontends: Frontend'ler başarıyla alındı:", frontends);
        return frontends || [];
      } catch (err) {
        console.error("useFrontends: Frontend'ler alınırken hata:", err);
        if (err instanceof Error) {
          console.error('Hata detayı:', err.message);
          console.error('Hata stack:', err.stack);
        }
        return [];
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
      dedupingInterval: 5000,
      onError: (err) => {
        console.error('useFrontends: SWR hata yakaladı:', err);
      },
    }
  );

  // Debug log
  useEffect(() => {
    console.log('useFrontends debug:');
    console.log('- projectId:', projectId);
    console.log('- data:', data);
    console.log('- isLoading:', isLoading);
    console.log('- error:', error);
    console.log('- isValidating:', isValidating);
  }, [projectId, data, isLoading, error, isValidating]);

  const memoizedValue = useMemo(
    () => ({
      frontends: Array.isArray(data) ? data : [],
      frontendsLoading: isLoading,
      frontendsError: error,
      frontendsValidating: isValidating,
      frontendsEmpty: !isLoading && !isValidating && (!data || data.length === 0),
      refreshFrontends: () => {
        if (!projectId) return Promise.resolve();
        console.log("useFrontends: Frontend'ler yenileniyor, projectId:", projectId);
        return mutate();
      },
    }),
    [data, error, isLoading, isValidating, mutate, projectId]
  );

  return memoizedValue;
}

/**
 * Tek bir frontend detayını çekmek için hook
 * @param frontendId Frontend ID
 * @returns Frontend detayı ve ilgili durumlar
 */
export function useFrontendDetails(frontendId: string | null) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [frontend, setFrontend] = useState<Frontend | null>(null);

  // Frontend'i çekmek için kullanılan fonksiyon
  const fetchFrontend = useCallback(async (id: string) => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getFrontendById(id);
      setFrontend(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Frontend detayı alınırken bir hata oluştu'));
    } finally {
      setLoading(false);
    }
  }, []);

  // FrontendId değiştiğinde otomatik olarak çalıştır
  useMemo(() => {
    if (frontendId) {
      fetchFrontend(frontendId);
    } else {
      setFrontend(null);
    }
  }, [frontendId, fetchFrontend]);

  const refreshFrontend = useCallback(async () => {
    if (frontendId) {
      await fetchFrontend(frontendId);
    }
  }, [frontendId, fetchFrontend]);

  const memoizedValue = useMemo(
    () => ({
      frontend,
      frontendLoading: loading,
      frontendError: error,
      refreshFrontend,
    }),
    [frontend, loading, error, refreshFrontend]
  );

  return memoizedValue;
}
