import useSWR from 'swr';

import { getLatestNews, NewsArticle } from 'src/actions/news/rss';

// SWR için benzersiz bir anahtar tanımlıyoruz
const swrKey = 'latestNews';

// Fetcher fonksiyonu, action'ımızı çağıracak
const fetcher = async (): Promise<NewsArticle[]> => getLatestNews();

export function useLatestNews() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<NewsArticle[], Error>(
    swrKey, // Benzersiz anahtar
    fetcher, // Veri çekme fonksiyonu
    {
      // SWR yapılandırma seçenekleri (isteğe bağlı)
      revalidateIfStale: true, // Sekme odağı değiştiğinde vb. yeniden doğrula
      revalidateOnFocus: true, // Pencereye odaklanıldığında yeniden doğrula
      revalidateOnReconnect: true, // İnternet bağlantısı geldiğinde yeniden doğrula
      // refreshInterval: 600000, // İsteğe bağlı: Otomatik yenileme (örn: 10 dakikada bir)
    }
  );

  return {
    news: data || [], // Veri henüz yoksa veya hata varsa boş dizi döndür
    newsLoading: isLoading,
    newsError: error,
    newsValidating: isValidating,
    newsEmpty: !isLoading && !data?.length,
    newsMutate: mutate, // Veriyi manuel olarak tetiklemek/güncellemek için
  };
}

// Tek bir haber için hook (şimdilik gerekli değil ama ileride lazım olabilir)
/*
export function useNewsArticle(articleId: string) {
  // ... ilgili logic ...
}
*/
