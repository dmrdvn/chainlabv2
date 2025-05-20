# ChainLab - Ürün Gereksinim Dokümanı (PRD)

## Ürün Tanımı

ChainLab, Web3 geliştirme sürecini tek bir platformda birleştiren, AI destekli, tarayıcı tabanlı bir tam kapsamlı geliştirme ortamıdır. Kullanıcılar, akıllı kontrat yazımından frontend entegrasyonuna, testten canlıya almaya kadar tüm adımları kod yazmadan veya minimum kodla tamamlayabilir. Ayrıca collabration özelliği ile iş verenlerle veya diğer geliştiricilerle ortak olarak iş birliği yapabilir.

## Hedef Kitle

- Web3 geliştiricileri
- Blockchain ve dApp geliştirme yapan ekipler
- Smart contract audit yapan uzmanlar
- Web3 ile yeni tanışan yazılım geliştiricileri
- Web3 projesi yürüten işverenler

## Temel Özellikler

### A) WebContainer Tabanlı IDE

#### Tarayıcıda Tam Stack Geliştirme:
- **Backend:** Solidity kodunu derleme ve test yapma imkanı.
- **Frontend:** React, Next.js desteği ile frontend geliştirme.
- **Entegre Terminal:** `npm`, `hardhat` gibi komutları tarayıcıda çalıştırma.

#### Performans Optimizasyonu:
- **Önbellekleme:** `node_modules` IndexedDB'ye kaydedilerek performans artışı.

### B) AI Destekli Kod Üretimi ve Optimizasyon

#### Çoklu LLM Entegrasyonu:
- **Seçenekler:** Claude, Chat GPT 01, DeepSeek, özel fine-tune modeller.
- **Sistem Prompt'ları:** Özelleştirilmiş yapay zeka prompt'ları.

#### Akıllı Debugger:
- Hataları doğal dilde açıklama ve otomatik düzeltme önerme.
- **Örnek:** `Unsafe ERC-20 transfer → Checks-Effects-Interactions pattern öner.`

### C) Tek Tıkla Deploy & Hosting

#### Hosting Seçenekleri:
- **Demo Hosting:** Vercel, Netlify.
- **Merkeziyetsiz:** IPFS, Arweave.

#### Multi-Chain Deploy:
- Ethereum, Polygon, Binance Smart Chain, Solana, Avalanche gibi farklı blokzincirlere deploy yapabilme.

### D) Real-Time Collaboration

#### Google Docs Benzeri İş Birliği:
- Eşzamanlı kod düzenleme ve terminal paylaşımı.
- **Roller:** Geliştirici, Auditor, İşveren.

#### Conflict Çözümü:
- CRDT (Yjs kütüphanesi) ile çakışmasız senkronizasyon.

### Ek Özellikler
- API ile Audit testi
- Git repoya commit ve push işlemleri

## Geliştirme Adımları

### Development Süreci
1. Geliştiriciler agent ile insan dilinde sohbet ederek bir contract yaptırabilir ve ilgili ağa deploy edebilirler.
2. Geliştiriciler daha önce yaptıkları contractlar için bir frontend yaptırabilirler.

### Test Süreci
3. Test bölümünde kullanıcılar kontratları ve frontend arayüzleri için testler oluşturup, test edebilirler.
4. Geliştiriciler ayrıca contract'larını seçecekleri bir audit ile denetleyebilirler.

### Publish Süreci
5. Geliştiriciler dApp'lerini vercel apisini kullanarak canlıya alabilirler.

*Not: Geliştiriciler isterlerse yukarıdaki development adımlarını manuel olarak da editör üzerinde yapabilirler.*

## Kullanılan Teknolojiler

### Frontend
- **Framework:** Next.js (React), TypeScript, MUI
- **Kod Editörü:** Monaco Editor (VSCode altyapısı)

### Backend
- **Veritabanı:** SupaBase (PostgreSQL)
- **İş Birliği (Real-Time Collaboration):** Yjs + WebSocket
- **WebContainer Tabanlı IDE**
- **AI Altyapısı:** Claude, DeepSeek, O1

### Performans Optimizasyonu
- **Önbellekleme:** `node_modules` IndexedDB'ye kaydedilir.

## Kullanıcı Arayüzü Gereksinimleri

### ChainLab Dashboard

Kullanıcılar landing page'te login olduktan sonra dashboard'a erişmektedirler.

#### Dashboard Widgetları
- **Üst Taraf:** 3 tane özet istatistik kutusu (Proje Sayısı, Contract Sayısı, Frontent UI Sayısı)
- **Alt Taraf:**
  - Kullanıcının oluşturduğu contractların tablosu
  - Kullanıcının oluşturduğu frontend UI'ların tablosu
  - Karşılama bölümü: Kullanıcılar dashboard'a giriş yaptıklarında karşılama mesajı ve proje özeti

#### Sağ Taraf Widgetları
- İş birliği yapılan kullanıcılar listesi
- Activity bölümü: Kullanıcının yaptığı işlemlerin kaydı
- Task'lar: MUI kanban özelliği ile todo'ların gösterimi

*Not: Dashboard'lar rol bazlı olacak. Her rol için farklı dashboard gösterilecek. İleride rol bazlı olarak farklı bileşenler gösterilecek.*

### Contract Yönetimi

Oluşturulan contractlar bölümünde liste halinde:
- Deploy edilme durumu (deploy edildiği chainlerin iconları)
- Test edilme durumu
- Audit durumu
- Action bölümünde contract düzenleme için 2 buton:
  - Agent ile geliştirme
  - Sürükle bırak yöntemi ile açma

### Frontend Arayüzler

Oluşturulan frontend arayüzlerin listesi:
- Kullanılan teknoloji (next.js, vanilla js vb.)
- Publish durumu

## Sayfa Yapıları

### Contract Düzenleme Sayfası
- VS Code benzeri IDE arayüzü
- Otomatik proje dizin yapısı oluşturma
- Sağ tarafta agent bölümü
- Sol tarafta dosya yapısı
- Ortada manuel kodlama alanı
- Web Container IDE'si arkaplanda çalıştırma
- Terminal penceresinde otomatik hata takibi

### Frontend Düzenleme Sayfası
- Hazır template seçimi veya boş taslak oluşturma
- Next.js ile oluşturulmuş web3 frontend boilerplate
- IDE arayüzü
- Publish butonu (Vercel API entegrasyonu)

## Navigasyon Yapısı

### Sol Menü Öğeleri

#### Overview
- Dashboard (Proje özet widgetları)
- Project (Kullanıcı projeleri ve işbirliği projeleri)
- Assets (Kullanıcının yüklediği ortam dosyaları - IPFS depolama)

#### Development
- Contract Editor (Contract oluşturma/düzenleme)
- Frontend Editor (Frontend UI oluşturma/düzenleme)
- Plugins & APIs (Oracle vb. kütüphane entegrasyonu)
- Debugging Tools (Test araçları)

#### Production
- Deployment Contract (Contract deploy)
- Publish UI (UI yayınlama - Vercel API)
- Git Management (Github upload, versiyon yönetimi)
- Health Monitor (Site monitoring)

#### Business
- Analytics (Site analytics verileri)
- Tokenomics Studio (Token yönetimi)
- Dao Governance (DAO yönetimi)
- Partners (Proje ortakları yönetimi)
- Legal Compliance (Ülke kısıtlamaları)

#### Collabration
- Meetings (Ortak meeting)
- Tasks (Proje task yönetimi)

#### Diğer
- Sol üstte project switcher (Projeler arası geçiş)

## Veritabanı Yapısı
- Tüm veriler Supabase üzerinde depolanacak

## Veritabanı Yapısı ve İş Akışları

Bu bölüm, ChainLab platformundaki temel varlıkların (projeler, kontratlar vb.) oluşturulması ve yönetilmesi sırasında Supabase veritabanı tabloları arasındaki ilişkileri ve veri akışını açıklamaktadır.

### 1. Proje Oluşturma Süreci

Bir kullanıcı yeni bir proje oluşturduğunda aşağıdaki adımlar gerçekleşir:

1.  **`projects` Tablosu:**
    *   Yeni bir proje için bu tabloya bir satır eklenir.
    *   Bu satır, projenin temel bilgilerini (ID, isim, logo URL'si, oluşturan kullanıcı vb.) içerir.
    *   `id`: Projenin benzersiz tanımlayıcısıdır (Örn: `6af34b8d-3201-4a5c-ba62-f9d9dc818510`).

2.  **`project_files` Tablosu:**
    *   Aynı `project_id` ile ilişkilendirilmiş birden fazla satır eklenir. Bu satırlar, projenin başlangıçtaki dosya ve dizin yapısını temsil eder:
        *   `contracts/.keep`: `contracts` dizinini temsil eden bir yer tutucu. `file_type: directory`.
        *   `scripts/.keep`: `scripts` dizinini temsil eden bir yer tutucu. `file_type: directory`.
        *   `tests/.keep`: `tests` dizinini temsil eden bir yer tutucu. `file_type: directory`.
        *   `README.md`: Proje açıklama dosyası. `file_type: documentation`, `content` alanında markdown içeriği bulunur.
        *   `.gitignore`: Git tarafından izlenmeyecek dosyaları belirten yapılandırma dosyası. `file_type: config`, `content` alanında ignore kuralları bulunur.
    *   Her satırın kendi benzersiz `id`'si vardır. Bu ID, dosyanın veya dizinin benzersiz tanımlayıcısıdır.
    *   `content` alanı, dosya içeriklerini (metin tabanlı dosyalar için) saklar. Dizinler için genellikle boştur.

**Özet:** Proje oluşturma, `projects` tablosunda tek bir kayıt ve `project_files` tablosunda projenin başlangıç yapısını tanımlayan birden çok kayıt oluşturur.

### 2. Kontrat Oluşturma Süreci (Mevcut Bir Proje İçin)

Kullanıcı, mevcut bir projeye yeni bir akıllı kontrat eklediğinde aşağıdaki adımlar gerçekleşir:

1.  **`contracts` Tablosu:**
    *   Yeni kontrat için bu tabloya bir satır eklenir.
    *   Bu satır, kontratın temel bilgilerini (ID, isim, açıklama vb.) ve ait olduğu projenin ID'sini (`project_id`) içerir.
    *   `id`: Kontratın benzersiz tanımlayıcısıdır (Örn: `a0073f0a-1251-47bd-beca-c392b84da806`).

2.  **`project_files` Tablosu (Yeni Dosya Ekleme):**
    *   Kontratın kaynak kodunu temsil eden **yeni bir satır** bu tabloya eklenir.
    *   `project_id`: Kontratın ait olduğu projenin ID'si.
    *   `file_path`: Kontrat dosyasının projedeki yolu (Örn: `contracts/DenemeKontrat.sol`).
    *   `file_type`: Genellikle `contract` veya `solidity`.
    *   `content`: Kontratın Solidity kaynak kodu bu alanda saklanır.
    *   `id`: Bu yeni eklenen dosya satırının benzersiz tanımlayıcısıdır (Örn: `b2839027-be86-487e-821c-495b7a3d311f`). **Bu ID, `contract_files` tablosunda referans olarak kullanılacaktır.**

3.  **`contract_versions` Tablosu:**
    *   Kontratın ilk versiyonu için bu tabloya bir satır eklenir.
    *   `id`: Kontrat versiyonunun benzersiz tanımlayıcısıdır (Örn: `5e4a4aa3-48ff-4345-bfd1-6bcf9ed67528`).
    *   `contract_id`: Oluşturulan kontratın ID'si (`contracts` tablosundaki ID).
    *   `version_number`: Genellikle `1` olarak başlar.
    *   `is_current`: Bu versiyonun aktif versiyon olduğunu belirtir (`true`).
    *   `commit_message`: Genellikle "Initial commit..." gibi bir mesaj içerir.

4.  **`contract_files` Tablosu:**
    *   Bu tablo, bir kontrat versiyonunu (`contract_version_id`) projedeki gerçek dosyasına (`file_id`) bağlar.
    *   `id`: Bu bağlantı kaydının benzersiz tanımlayıcısı.
    *   `contract_version_id`: Oluşturulan kontrat versiyonunun ID'si (`contract_versions` tablosundaki ID).
    *   `file_id`: Kontrat kodunu içeren `project_files` satırının ID'si (Adım 2'de eklenen dosyanın ID'si).
    *   `is_main_file`: Bu dosyanın kontratın ana dosyası olup olmadığını belirtir (genellikle `true`).

**Özet:** Kontrat oluşturma, `contracts` tablosuna bir kayıt, `project_files` tablosuna kontrat kodunu içeren yeni bir dosya kaydı, `contract_versions` tablosuna ilk versiyon kaydı ve `contract_files` tablosuna versiyon ile dosyayı birbirine bağlayan bir kayıt ekler. Mevcut `project_files` kayıtları (örn: `.keep`) güncellenmez.

### Tablolar Arası İlişkiler (Basitleştirilmiş)

```
+----------+       +-----------------+       +---------------------+       +------------------+
| projects |------>| project_files   |<------| contract_files      |------>| contract_versions|
| (1)      |       | (N)             |       | (N)                 |       | (N)              |
+----------+       +-----------------+       +---------------------+       +------------------+
     |                                                 |
     |                                                 V
     +--------------------------------------------->+ contracts |
                                                    | (N)       |
                                                    +-----------+

(Oklar 'foreign key' ilişkilerini gösterir. 1:N veya N:N ilişkiler belirtilmiştir.)
```

*   Bir projenin (`projects`) birden çok dosyası (`project_files`) olabilir.
*   Bir kontrat (`contracts`) bir projeye aittir.
*   Bir kontratın birden çok versiyonu (`contract_versions`) olabilir.
*   Bir kontrat versiyonu, bir veya daha fazla dosyadan (`contract_files` -> `project_files`) oluşabilir.

Bu dokümantasyon, zamanla yeni özellikler eklendikçe veya mevcut yapıda değişiklikler oldukça güncellenmelidir.



## Teknoloji İskeleti
- **Framework:** Next.js/TypeScript
- **UI Kütüphanesi:** MUI ile yapılmış Minimals tema
- **Dökümantasyon:** [Minimals Docs](https://docs.minimals.cc/introduction)

## Proje Kurulumu

Minimals tema üzerine kurulacak olan projede, temanın mevcut dosya ve dizin yapısı korunacaktır:
- app dizini: Sayfalar ve auth yapısı
- assets dizini: Icons, illustrations vb.
- auth dizini: Auth işlemleri ve guard yapısı (Supabase entegrasyonu)
- components dizini: MUI ile özelleştirilmiş componentler
- lib dizini: Axios, Supabase vb. harici kütüphanelerin kurulumları
- locales dizini: Dil dosyaları
- routes dizini: Sayfa linkleri
- theme dizini: Dark/light temalar ve stil ayarları
- types dizini: TypeScript type tanımlamaları
- utils dizini: Yardımcı araçlar
- layout dizini: Sayfa ve bileşen layoutları
- sections dizini: Component bileşimlerinden oluşan yapılar
- _mock dizini: Mock veriler

*Not: _examples dizini dökümantasyon amacıyla kullanılmaktadır ve proje ile doğrudan ilgili değildir.*
