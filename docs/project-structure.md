# ChainLab Proje Yapısı

Bu dokümanda ChainLab projesinin dosya yapısı detaylı olarak açıklanmıştır. Windsurf üzerinde çalışırken, hangi dosyanın nerede olduğunu görmek için bu yapıyı referans alabilirsiniz.

```
chainlab-mui/
├── .next/                     # Next.js build çıktıları
├── docs/                      # Proje dokümanları
│   ├── rules.md               # Proje kuralları
│   ├── prd.md                 # Ürün gereksinim dokümanı
│   ├── project-structure.md   # Proje yapısı (bu dosya)
│   └── todo.md                # Yapılacaklar listesi
├── node_modules/              # Bağımlılıklar
├── public/                    # Statik dosyalar
│   ├── assets/                # Resimler, fontlar vb.
│   └── ...
├── src/                       # Kaynak kodları
│   ├── _mock/                 # Mock veriler (geliştirme aşamasında kullanılır)
│   ├── actions/               # Server actions
│   ├── app/                   # Next.js app router sayfaları
│   │   ├── (home)/            # Ana sayfa
│   │   ├── auth/              # Kimlik doğrulama sayfaları
│   │   ├── dashboard/         # Dashboard sayfaları
│   │   │   ├── api/           # API sayfaları
│   │   │   │   ├── project/   # Proje sayfaları
│   │   │   │   │   ├── compile/ # Proje derleme sayfaları
│   │   │   │   │   │   └──  route.ts # Proje derleme sayfası
│   │   │   │   │   └── news/ 
│   │   │   ├── analytics/     # Örnek sayfa (Minimals tema)
│   │   │   ├── banking/       # Örnek sayfa (Minimals tema)
│   │   │   ├── labs/          # Düzenleyeceğimiz Dashboard sayfası
│   │   │   ├── blank/         # Boş sayfa şablonu
│   │   │   ├── calendar/      # Takvim sayfası (Minimals tema)
│   │   │   ├── ...            # Diğer dashboard sayfaları
│   │   │   └── page.tsx       # Dashboard ana sayfası
│   │   ├── layout.tsx         # Ana layout
│   │   ├── loading.tsx        # Yükleme ekranı
│   │   └── not-found.tsx      # Sayfa bulunamadı ekranı
│   ├── assets/                # Varlıklar (içe aktarılacak)
│   │   ├── icons/             # İkonlar
│   │   ├── illustrations/     # İllüstrasyonlar
│   │   └── ...
│   ├── auth/                  # Kimlik doğrulama modülü
│   │   ├── components/        # Auth bileşenleri
│   │   ├── context/           # Auth context
│   │   ├── guard/             # Auth koruma bileşenleri
│   │   ├── hooks/             # Auth hooks
│   │   ├── utils/             # Auth yardımcı fonksiyonları
│   │   ├── views/             # Auth views
│   │   └── types.ts           # Auth tipleri
│   ├── components/            # Ortak bileşenler (MUI özelleştirilmiş)
│   │   ├── animate/           # Animasyon bileşenleri
│   │   ├── carousel/          # Carousel bileşenleri
│   │   ├── chart/             # Grafik bileşenleri
│   │   ├── color-utils/       # Renk yardımcıları
│   │   ├── custom-avatar/     # Özel avatar bileşenleri
│   │   ├── custom-breadcrumbs/# Özel breadcrumb bileşenleri
│   │   ├── custom-table/      # Özel tablo bileşenleri
│   │   ├── date-range-picker/ # Tarih aralığı seçici
│   │   ├── empty/             # Boş durum bileşenleri
│   │   ├── hook-form/         # Form bileşenleri
│   │   ├── iconify/           # İkon bileşenleri
│   │   ├── label/             # Etiket bileşenleri
│   │   ├── loading-screen/    # Yükleme ekranı
│   │   ├── logo/              # Logo bileşeni
│   │   ├── nav-section/       # Navigasyon bölümü
│   │   ├── organizational-chart/ # Organizasyon şeması
│   │   ├── scroll-to-top/     # Yukarı kaydırma bileşeni
│   │   ├── scrollbar/         # Kaydırma çubuğu
│   │   ├── search-not-found/  # Arama sonucu bulunamadı
│   │   ├── settings/          # Ayarlar bileşeni
│   │   └── ...
│   ├── global-config.ts       # Genel yapılandırma
│   ├── global.css             # Global CSS
│   ├── layouts/               # Sayfa layoutları
│   │   ├── auth-centered/     # Kimlik doğrulama layout
│   │   ├── auth-split/        # Kimlik doğrulama layout
│   │   ├── components/        # Layout bileşenleri
│   │   │   ├── account-button.tsx # Hesap butonu
│   │   │   ├── header.tsx     # Başlık
│   │   │   ├── footer.tsx     # Altbilgi
│   │   │   ├── mini-navbar.tsx # Mini navbar
│   │   │   ├── navbar.tsx     # Navbar
│   │   │   ├── options.tsx    # Seçenekler
│   │   │   ├── sidebar.tsx    # Kenar çubuğu
│   │   │   └── ...
│   │   ├── core/              # Core layout
│   │   ├── dashboard/         # Dashboard layout
│   │   ├── main/              # Ana layout
│   │   ├── simple/            # Basit layout
│   │   ├── nav-config-account.tsx      # Dashboard account layot
│   │   ├── nav-config-dashboard.tsx    # Dashboard menü layout
│   │   ├── nav-config-main-demo.tsx    # Dashboard menü demo layout
│   │   ├── nav-config-main.tsx         # Landing Page Menü Layout
│   │   └── nav-config-workspace.tsx    # Dashboard Project Switcher layout
│   ├── lib/                   # Harici kütüphane yapılandırmaları
│   │   ├── supabase.ts        # Supabase istemcisi
│   │   └── ...
│   ├── locales/               # Çoklu dil dosyaları
│   │   ├── langs/             # Diller
│   │   ├── utils/             # Diller
│   │   ├── all-langs.ts       # Tüm diller
│   │   ├── i18n-provider.tsx  # i18n provider
│   │   ├── index.ts           # Dilleri dışarı aktarır
│   │   ├── locales-config.ts  # Dil çevirileri
│   │   ├── localization-provider.tsx # Dil provider
│   │   ├── server.ts          # Dil server
│   │   └── use-locales.ts     # Dil kullanımı için hook
│   ├── routes/                # Rota tanımları
│   │   ├── components/        # Rota bileşenleri
│   │   ├── hooks/             # Rota hooks
│   │   └── paths.ts           # Yol tanımları
│   ├── sections/              # Sayfa bölümleri
│   │   ├── overview/          # Tüm Dashboardlar
│   │   │   ├── labs/          # Düzenlenecek Dashboard Sayfası
│   │   │   │   ├── view/      # Dashboard Sayfası Tasarımı
│   │   │   │   └── ...        # Dashboard Sayfasında Gösterilecek Öğeler
│   │   │   └── ...            # Dashboard Sayfasında Gösterilecek Öğeler
│   │   └── ...                # Dashboard Sayfasında Gösterilecek Öğeler
│   ├── theme/                 # Tema yapılandırması
│   │   ├── core/                     # Tema core özellikleri
│   │   ├── with-settings/            # Tema ayarları
│   │   ├── create-classes.ts         # Tema class oluşturma
│   │   ├── create-theme.ts           # Tema oluşturma yardımcı
│   │   ├── extend-theme-types.d.ts   # Genişletebilir tema desteği
│   │   ├── index.ts                  # Temaları dışarı aktarma
│   │   ├── theme-config.ts           # Tema config
│   │   ├── theme-overrides.ts        # Tema override
│   │   ├── theme-provider.tsx        # Tema provider
│   │   └── types.ts                  # Tema tipleri
│   ├── types/                 # TypeScript tipleri
│   │   ├── user.ts            # Kullanıcı tipleri
│   │   ├── contract.ts        # Kontrat tipleri
│   │   └── ...
│   ├── utils/                 # Yardımcı fonksiyonlar
│   │    ├── format-number.ts   # Sayı biçimlendirme
│   │    └── format-time.ts     # Zaman biçimlendirme
│   ├── global-config.ts       # Genel yapılandırma
│   └── globals.css            # Genel CSS
│
├── .env                       # Ortam değişkenleri
├── .gitignore                 # Git yoksay dosyası
├── next.config.mjs            # Next.js yapılandırması
├── package.json               # Paket bağımlılıkları
├── tsconfig.json              # TypeScript yapılandırması
└── ...
```

## Önemli Dosya ve Dizinler

### Konfigürasyon Dosyaları

- `src/global-config.ts`: Projedeki global yapılandırmaları içerir (API anahtarları, auth ayarları vb.)
- `.env`: Ortam değişkenleri
- `next.config.mjs`: Next.js yapılandırması
- `tsconfig.json`: TypeScript yapılandırması

### Sayfalar

- `src/app/`: Tüm sayfaları içerir (Next.js App Router)
- `src/app/dashboard/`: Dashboard sayfalarını içerir

### Bileşenler

- `src/components/`: Ortak ve yeniden kullanılabilir bileşenler
- `src/sections/`: Sayfa bölümleri (birden fazla bileşenden oluşan yapılar)
- `src/layouts/`: Sayfa düzenleri ve layout bileşenleri

### Stil ve Tema

- `src/theme/`: Tema yapılandırması (renkler, tipografi vb.)
- `src/global.css`: Global CSS stilleri

### Auth İşlemleri

- `src/auth/`: Kimlik doğrulama ile ilgili modüller
- `src/app/auth/`: Kimlik doğrulama sayfaları

### Yardımcı Araçlar

- `src/utils/`: Yardımcı fonksiyonlar
- `src/routes/`: Rota tanımları
- `src/lib/`: Harici kütüphane yapılandırmaları (Supabase vb.)

### Dil Desteği

- `src/locales/`: Çoklu dil desteği için dosyalar

### Veri

- `src/_mock/`: Geliştirme aşamasında kullanılan örnek veriler

## Önemli Notlar

1. `_examples` dizini projeyle doğrudan ilişkili değildir, Minimals teması için örnek bileşenleri içerir.
2. Proje geliştirirken mevcut yapıya uygun olarak çalışmak önemlidir.
3. Yeni sayfalar oluştururken `src/app/` dizini altına eklenmeli ve uygun route tanımları yapılmalıdır.
4. Yeni bileşenler oluştururken `src/components/` altına eklenmelidir.
5. Sayfa bölümleri için `src/sections/` altında yeni dosyalar oluşturulmalıdır.
