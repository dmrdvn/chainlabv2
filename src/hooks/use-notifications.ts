'use client';

import useSWR from 'swr';
import { useMemo, useEffect } from 'react';

import { getProjectInvitations } from 'src/actions/project';

// ----------------------------------------------------------------------

/**
 * Kullanıcının bildirimlerini çekmek için hook
 * @param pollingInterval Bildirim güncelleme aralığı (ms), varsayılan 30 saniye
 * @returns Bildirimler ve ilgili durumlar
 */
export function useNotifications(pollingInterval = 30000) {
  // Bildirimler için SWR kullanıyoruz
  const { data, isLoading, error, isValidating, mutate } = useSWR(
    'user-notifications',
    async () => {
      try {
        // Gerçek bildirimler - proje davetleri
        const notifications = await getProjectInvitations();
        return notifications;
      } catch (err) {
        console.error('Bildirimler alınırken hata:', err);
        return [];
      }
    },
    {
      revalidateIfStale: true,
      revalidateOnFocus: false, // Odak değişiminde yeniden sorgu yapma
      revalidateOnReconnect: true,
      shouldRetryOnError: true, // Hata durumunda tekrar dene
      errorRetryCount: 3, // Maksimum 3 kez dene
      dedupingInterval: 5000, // 5 saniye içinde tekrar eden istekleri birleştir
      focusThrottleInterval: 10000, // Odak değişiminde en az 10 saniye bekle
    }
  );

  // Düzenli aralıklarla bildirimleri güncelle
  useEffect(() => {
    // Eğer polling interval belirtilmemişse çalışma
    if (!pollingInterval) return undefined;

    // Bildirimleri periyodik olarak güncelle
    const intervalId = setInterval(() => {
      mutate();
    }, pollingInterval);

    // Cleanup
    return () => clearInterval(intervalId);
  }, [mutate, pollingInterval]);

  // Sadece gerçek bildirimleri kullan, mock verileri hiç gösterme
  const notifications = useMemo(() => data || [], [data]);

  return {
    notifications,
    notificationsLoading: isLoading,
    notificationsError: error,
    notificationsValidating: isValidating,
    refreshNotifications: () => mutate(),
  };
}
