import Parser from 'rss-parser';
import { NextResponse } from 'next/server';

// Tip tanımı (isteğe bağlı ama önerilir)
interface NewsItem {
  title?: string;
  link?: string;
  pubDate?: string;
  isoDate?: string;
  imageUrl?: string; // Görsel için potansiyel alanlar
  enclosure?: { url?: string };
  'media:content'?: { $: { url?: string } }; // Bazı feedlerde görsel bu yapıda olabilir
}

// Cache süresi (örneğin 10 dakika) - Vercel/Next.js cache mekanizması için
export const revalidate = 600; // Saniye cinsinden

export async function GET() {
  const parser = new Parser<object, NewsItem>();
  const feedUrl = 'https://cointelegraph.com/rss';
  const maxItems = 5;

  try {
    const feed = await parser.parseURL(feedUrl);

    const newsItems = feed.items.slice(0, maxItems).map((item) => ({
      title: item.title || 'No Title',
      link: item.link || '#',
      pubDate: item.pubDate,
      isoDate: item.isoDate,
      // Görsel URL'sini çeşitli potansiyel alanlardan almaya çalışalım
      imageUrl: item.enclosure?.url || item['media:content']?.$.url || item.imageUrl, // item.imageUrl ekledik
    }));

    return NextResponse.json(newsItems);
  } catch (error) {
    console.error('Failed to fetch or parse RSS feed:', error);
    // Hata durumunda boş bir dizi veya uygun bir hata mesajı döndür
    return NextResponse.json(
      {
        error: 'Failed to fetch news',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
