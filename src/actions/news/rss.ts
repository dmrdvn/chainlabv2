import axiosInstance, { endpoints } from 'src/lib/axios';

// Dönen haber öğesi için tip tanımı (API Route'daki ile eşleşmeli)
export interface NewsArticle {
  title: string;
  link: string;
  pubDate?: string;
  isoDate?: string;
  imageUrl?: string;
}

export const getLatestNews = async (): Promise<NewsArticle[]> => {
  try {
    // API route'umuza istek atıyoruz
    const response = await axiosInstance.get<NewsArticle[]>(endpoints.news.list);
    // Veriyi doğrudan döndürüyoruz
    return response.data;
  } catch (error) {
    console.error('Error fetching latest news:', error);
    // Hata durumunda boş dizi döndürebiliriz veya hatayı yukarıya fırlatabiliriz
    // Uygulamanın nasıl davranmasını istediğinize bağlı
    return []; // Şimdilik boş dizi döndürelim
  }
};
