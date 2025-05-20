# ChainLab Projesi Backend Geliştirme Talimatları ve Kuralları

Bu doküman, ChainLab projesinin geliştirilmesi sırasında izlenecek temel mimari kararlarını, teknik yaklaşımları ve önemli prensipleri içermektedir. Amaç, profesyonel, ölçeklenebilir ve sürdürülebilir bir Web3 geliştirme platformu oluşturmaktır.

## Proje Vizyonu

ChainLab, kullanıcıların EVM ve Solana gibi ağlarda akıllı kontratlar oluşturmasına, düzenlemesine, derlemesine, test etmesine ve dağıtmasına olanak tanıyan tarayıcı tabanlı bir platformdur. Kullanıcılar, VS Code benzeri bir arayüzde (Monaco Editor tabanlı) çalışacak, Supabase üzerinde proje ve kontratlarını yöneteceklerdir.

## 1. Temel Mimari Kararı: Tarayıcı vs. Sunucu Tabanlı İşlemler

**Karar:** **Kesinlikle sunucu tabanlı mimari** benimsenecektir.

* **Tarayıcı Tabanlı Yaklaşımın (WebAssembly, JS Kütüphaneleri, WebContainer) Reddedilme Nedenleri:**
    * **Performans Düşüklüğü:** Bağımlılıkların (örn: `node_modules`, Rust/Cargo paketleri) tarayıcıda yüklenmesi ve çalıştırılması kullanıcı deneyimini olumsuz etkiler.
    * **Kaynak Limitleri:** Tarayıcıların bellek ve CPU limitleri, büyük projelerin derlenmesi veya karmaşık testler için yetersizdir.
    * **Solana/Anchor Zorlukları:** Rust ve Cargo ekosistemine bağımlı olan Solana/Anchor'ı tarayıcıda güvenilir ve performanslı çalıştırmak pratik değildir. Cargo'nun tam işlevselliği tarayıcıda sağlanamaz.
    * **Güvenlik Riskleri:** Hassas süreçlerin tamamen istemcide yapılması güvenlik açıkları doğurabilir.
    * **Sürdürülebilirlik Güçlüğü:** Farklı zincirler ve diller eklendikçe tarayıcı ortamını yönetmek zorlaşır.

* **Sunucu Tabanlı (Backend İşleme) Yaklaşımın Avantajları:**
    * **Yüksek Performans:** Ağır yük (derleme, test, bağımlılık yönetimi) sunucuda yapılır, kullanıcı tarayıcısı hızlı kalır.
    * **Tam Uyumluluk:** Sunucu ortamında Hardhat, Foundry, Anchor gibi tüm gerekli araçlar (Node.js, Rust, Cargo vb.) sorunsuzca çalıştırılır.
    * **Ölçeklenebilirlik:** Sunucu kaynakları ihtiyaca göre artırılabilir.
    * **Artırılmış Güvenlik:** İşlem mantığı ve hassas adımlar kontrol altındaki sunucuda yönetilir.
    * **Esneklik:** Yeni diller veya blockchain'ler eklemek daha kolaydır.

* **Sunucu Tabanlı Yaklaşımın Dezavantajları (Kabul Edilebilir):**
    * Daha karmaşık bir backend mimarisi gerektirir.
    * Sunucu maliyetleri oluşur.

**Talimat:** Tarayıcı, kullanıcı arayüzü ve sunucu ile iletişimden sorumlu "ince istemci" (thin client) olarak görev yapacaktır. Tüm derleme, test ve karmaşık işlemler sunucuya delege edilecektir. **Web Container KULLANILMAYACAKTIR.**

## 2. Sunucu Tabanlı Mimarinin Detayları

### 2.1. Kullanıcı Kodları Sunucuda Nasıl İşlenecek?

**Karar:** **Framework Kullanımı (Hardhat, Anchor)** zorunludur.

* **Doğrudan Derleyici (solc, rustc) Kullanımının Reddedilme Nedenleri:**
    * Çok zahmetli ve hata yapmaya açık.
    * Bağımlılık, versiyon ve proje yapısı yönetimi karmaşıktır.

* **Framework Kullanımının Gerekçesi:**
    * Hardhat, Foundry (EVM için) ve Anchor (Solana için) standart proje yapıları, bağımlılık yönetimi (npm, Cargo), derleme (`npx hardhat compile`, `anchor build`), test (`npx hardhat test`, `anchor test`) ve dağıtım scriptleri sunar.
    * Kullanıcı kodunu geçici bir framework projesi şablonuna yerleştirip komutları çalıştırmak yönetilebilir ve standart bir yoldur.

### 2.2. Sunucuda Kullanıcı İşlemleri Nasıl İzole Edilecek?

**Karar:** **İstek Başına Geçici (Ephemeral) Ortamlar** kullanılacaktır.

* **Kalıcı Dizin veya Ortak Şablon Kullanımının Reddedilme Nedenleri:**
    * Verimsiz, yönetimi zor, güvenlik açıkları ve çakışma riski taşır.

* **İstek Başına Geçici Ortamların Uygulanma Adımları:**
    1.  **İstek Alma:** Backend, kullanıcıdan isteği alır (kullanıcı ID, proje ID, kontrat ID'leri, yapılacak işlem: derle, test et vb.).
    2.  **Veri Çekme:** Supabase'den ilgili projenin kontrat dosyaları ve içerikleri çekilir.
    3.  **Geçici Ortam Oluşturma:** Sunucuda **izole, geçici bir Docker container** oluşturulur. Bu container, ilgili framework (Hardhat veya Anchor) ve gerekli temel bağımlılıkların kurulu olduğu önceden hazırlanmış bir Docker imajını kullanır.
    4.  **Kod Kopyalama:** Çekilen kontrat kodları, bu geçici container içindeki uygun framework proje şablonuna kopyalanır.
    5.  **Komut Çalıştırma:** İstenen komut (örn: `npx hardhat compile`, `anchor test`) container içinde çalıştırılır.
    6.  **Çıktı Yakalama:** Komutun çıktısı (hatalar, loglar, bytecode, ABI, test sonuçları) yakalanır.
    7.  **Ortam Yok Etme:** Docker container **yok edilir**.
    8.  **Yanıt Gönderme:** Yakalanan sonuçlar API yanıtı olarak frontend'e geri gönderilir.

**Talimat:** Supabase'deki proje/kontrat yapısı (proje ID, kontrat ID) bu geçici ortamları oluşturmak için gereken kodları getirmekte anahtar rol oynayacaktır. Her işlem temiz bir ortamda başlamalıdır.

### 2.3. Docker ile Platforma Özel Derleme ve Çalıştırma Ortamları

Projenin farklı blockchain platformlarını (başlangıçta EVM, ileride Solana vb.) desteklemesi hedeflendiğinden, her platform için özelleşmiş ve izole derleme/çalıştırma ortamları Docker kullanılarak yönetilecektir. Bu, "İstek Başına Geçici Ortamlar" prensibiyle birleşerek esnek ve yönetilebilir bir yapı sunar.

*   **Platform Bazlı Docker İmajları:**
    *   **EVM (Hardhat):** `chainlab-hardhat-env` adında bir Docker imajı oluşturulmuştur. Bu imaj, Node.js ve global olarak kurulmuş Hardhat içerir.
    *   **Solana (Anchor):** İlerleyen aşamalarda, Solana projeleri için Anchor ve Rust bağımlılıklarını içeren `chainlab-anchor-env` (veya benzeri) bir Docker imajı oluşturulacaktır.
    *   Her platform için gerekli temel araçlar ve derleyiciler bu imajlara önceden yüklenmiş olacaktır.

*   **Derleme API'si (`/compile` Endpoint) İş Akışı:**
    1.  **İstek Alma:** API, `projectId` ve kontratın hedeflediği `platform` (Supabase'deki `projects` tablosundan gelen 'evm', 'solana' gibi) bilgisiyle çağrılır.
    2.  **Geçici Çalışma Alanı Oluşturma:** Her derleme isteği için sunucuda benzersiz, izole bir geçici klasör oluşturulur (örn: `/tmp/chainlab_jobs/PROJECT_ID_TIMESTAMP/`). Bu, eş zamanlı isteklerin birbirini etkilemesini engeller ve güvenliği artırır.
    3.  **Kontrat Dosyalarının Hazırlanması:**
        *   Kullanıcının Supabase'de kayıtlı olan ilgili `projectId`'ye ait kontrat dosyaları (ve varsa bağımlılık tanımları) bu geçici klasöre indirilir.
        *   `platform` bilgisine göre geçici klasör içinde gerekli proje yapısı oluşturulur:
            *   **EVM (Hardhat) için:** Geçici klasörün köküne minimal bir `hardhat.config.js` dosyası oluşturulur. Kontrat dosyaları (`.sol`) `contracts/` adlı bir alt dizine yerleştirilir. Gerekirse `scripts/`, `test/` gibi diğer dizinler de oluşturulabilir.
            *   **Solana (Anchor) için:** Geçici klasörde standart bir Anchor proje iskeleti (`Anchor.toml`, `programs/PROJE_ADI/src/lib.rs` vb.) oluşturulur. Kullanıcının Rust kontrat dosyaları uygun yerlere kopyalanır.
    4.  **Docker ile Derleme İşlemi:**
        *   Gelen `platform` bilgisine göre uygun Docker imajı seçilir (örn: `chainlab-hardhat-env`).
        *   Oluşturulan geçici çalışma klasörü, seçilen Docker konteynerine bir `volume` olarak bağlanır (mount edilir). Bu sayede konteyner, sunucudaki geçici dosyalara erişebilir ve derleme çıktılarını buraya yazabilir.
        *   Konteyner içinde, platforma özgü derleme komutu çalıştırılır (örn: `docker run --rm -v /tmp/chainlab_jobs/PROJECT_ID_TIMESTAMP/:/usr/src/app chainlab-hardhat-env npx hardhat compile --network hardhat`). `--rm` parametresi konteynerin işi bitince otomatik silinmesini sağlar.
    5.  **Sonuçların Toplanması ve Yanıtlanması:**
        *   Derleme işlemi bittikten sonra, derleme logları, oluşan artefaktlar (EVM için ABI, bytecode; Solana için IDL, `.so` dosyası vb.) geçici klasörden (volume mount sayesinde sunucuda da erişilebilir olan) okunur.
        *   Bu çıktılar (başarı durumu, loglar, artefaktlar) API yanıtı olarak frontend'e geri gönderilir.
    6.  **Temizlik:** İstek başarıyla tamamlansa da tamamlanmasa da, güvenlik ve kaynak yönetimi açısından oluşturulan geçici çalışma klasörü ve ilgili Docker konteyneri (eğer `--rm` ile otomatik silinmediyse) sunucudan temizlenir.

Bu yapı, her platformun kendine özgü bağımlılıklarını ve araç zincirini izole bir şekilde yönetmemizi sağlar, backend uygulamasının ana kod tabanını temiz tutar ve yeni platformların eklenmesini kolaylaştırır.

## 3. IDE ve Gerçek Zamanlı Hata Kontrolü

*   **Editör:** **Monaco Editor** kullanılacaktır.

*   **Syntax Highlighting:**
    *   **Talimat:** Solidity ve Rust (Anchor için) dillerine özel syntax highlighting Monaco Editor'e entegre edilmelidir.

*   **Anlık Hata/Uyarı Gösterme (Linting & Semantic Analysis):**
    *   **Monaco'nun Dahili Desteği:** Gelişmiş dil desteği (anlamsal kontrol) için yetersizdir, ek geliştirme gerektirir.
    *   **Language Server Protocol (LSP):**
        *   *Sunucuda LSP Çalıştırmak:* En ölçeklenebilir ve profesyonel yoldur. Frontend'deki Monaco, WebSocket üzerinden backend'de çalışan ilgili dil sunucusuna (örn: `solidity-language-server`, `rust-analyzer`) bağlanır. **Bu, ileri bir aşama için değerlendirilebilir, başlangıç için şart değildir.**
        *   *Tarayıcıda LSP (Web Worker):* Karmaşık ve performans açısından zorlayıcı olabilir. `solc-js` ile Solidity için temel hatalar yakalanabilir.

*   **Pratik Öneri ve Talimatlar (Hata Kontrolü İçin):**
    1.  **Zorunlu:** Sağlam bir **Syntax Highlighting** eklenmelidir.
    2.  **Önerilir (İyi Olur):** Temel Solidity hatalarını (syntax, basit tip hataları) tarayıcı tarafında, `solc-js` kütüphanesini bir Web Worker'da kullanarak ve `debounce` tekniğiyle (kullanıcı yazmayı bıraktıktan kısa süre sonra) kontrol edin. Bu, anlık geri bildirimi artırır.
    3.  **Çekirdek Çözüm:** Daha derin Solidity hataları ve *tüm* Anchor/Rust hataları için, kullanıcının **"Compile" (Derle) butonuna basması beklenecektir.** Bu istek sunucuya gidecek, Bölüm 2.2'de anlatılan geçici ortamda *gerçek derleyici* (solc, anchor build) çalışacak ve detaylı hatalar/uyarılar frontend'deki terminale geri gönderilecektir.

## 4. Derleme ve Deploy Süreçleri

### 4.1. Derleme (Compilation)

**Talimat:** Derleme işlemleri **kesinlikle sunucu tarafında**, Bölüm 2.2'de tanımlanan geçici Docker ortamlarında Hardhat/Anchor kullanılarak yapılmalıdır. Sunucu, derleme sonucunda elde edilen **Bytecode** ve **ABI** (Application Binary Interface)'yi frontend'e göndermelidir.

### 4.2. Dağıtım (Deployment)

**Karar:** **Client-Side Signing (İstemci Tarafında İmzalama)** yöntemi kullanılacaktır.

*   **Yanlış Yöntem (KESİNLİKLE KAÇINILACAK):**
    *   Kullanıcının özel anahtarını (private key) backend'e göndermesini istemek.
    *   Backend'in kullanıcı adına dağıtım yapması (custodial olmayan bir yapı için).

*   **Doğru Yöntem ve Uygulama Adımları (Client-Side Signing):**
    1.  Kullanıcı IDE'de "Deploy" butonuna basar.
    2.  Frontend, (gerekirse) derleme için sunucuya istek gönderir veya önceden derlenmiş ABI/Bytecode'u kullanır.
    3.  Sunucu, (gerekirse) ABI ve Bytecode'u frontend'e gönderir.
    4.  Frontend, kullanıcının tarayıcı cüzdanını (MetaMask, Phantom vb.) kullanarak:
        *   **EVM için:** Ethers.js veya Web3.js gibi kütüphanelerle ABI ve Bytecode'u kullanarak bir "kontrat dağıtım işlemi" (contract deployment transaction) oluşturur.
        *   **Solana için:** `@solana/web3.js` ve Anchor'un ürettiği client kütüphaneleri/IDL ile bir "program dağıtım işlemi" oluşturur.
    5.  Frontend, bu işlemi imzalaması için kullanıcıdan cüzdanı üzerinden onay ister. **ÖZEL ANAHTAR ASLA TARAYICIDAN ÇIKMAYACAKTIR.**
    6.  Kullanıcı işlemi cüzdanında onaylar ve imzalar.
    7.  Frontend, bu **imzalanmış işlemi** doğrudan ilgili blockchain ağının RPC (Remote Procedure Call) endpoint'ine gönderir.
    8.  İşlemin ağda onaylanması takip edilir ve sonucu kullanıcıya gösterilir.

**Talimat:** Ağır iş (derleme) sunucuda, en hassas kısım olan işlem imzalama ise güvenli bir şekilde kullanıcının kontrolünde (cüzdanında) kalacaktır.

## 5. Test Süreci

**Talimat:** Testler, derleme gibi **sunucu tarafında çalıştırılmalıdır.**

*   **Uygulama Adımları:**
    1.  Kullanıcılar, IDE'de (muhtemelen `tests/` gibi bir klasörde) test dosyalarını (örn: Hardhat için JavaScript/TypeScript'te Chai/Mocha; Anchor için Rust testleri) yazacak ve bu dosyalar Supabase'e kaydedilecektir.
    2.  IDE'de bir "Run Tests" (Testleri Çalıştır) butonu bulunacaktır.
    3.  Bu buton, backend'e bir istek gönderecektir.
    4.  Backend, yine Bölüm 2.2'de tanımlanan geçici Docker ortamlarında test komutunu (`npx hardhat test`, `anchor test`) çalıştıracaktır.
    5.  Testlerin sonuçları (başarılı/başarısız, loglar, hatalar) yakalanacak ve frontend'deki terminal/output paneline gönderilecektir.

## 6. Solana: Raw vs. Anchor

**Karar:** **Anchor framework'ü kullanılacaktır.**

*   **Gerekçe:**
    *   Anchor, Solana programları geliştirmeyi önemli ölçüde basitleştirir (IDL, client kodu üretimi, güvenlik kontrolleri, state yönetimi vb.).
    *   Kullanıcılara doğrudan Rust ile Solana programı yazdırmak yerine Anchor'ı kullandırmak daha verimli ve kullanıcı dostudur. Platformun değeri, bu karmaşıklığı kullanıcı adına yönetmesinde yatar.

## 7. İletişim Protokolü: HTTPS vs. WebSocket

**Karar:** Başlangıçta **HTTPS API** çağrıları, ihtiyaç halinde **WebSocket** ile desteklenecek hibrit bir yaklaşım.

*   **HTTPS (REST veya GraphQL API):**
    *   Standart istek-yanıt modeli için ("Derle", "Testleri Çalıştır", "Dağıtım İçin Veri Getir" gibi tek seferlik komutlar) idealdir.
    *   Yönetimi daha kolaydır, stateless yapısı geçici container'larla uyumludur.

*   **WebSocket:**
    *   Kalıcı, çift yönlü bağlantılar için kullanılır.
    *   Potansiyel Kullanım Alanları:
        *   Uzun süren derleme veya test işlemlerinin loglarını *gerçek zamanlı* olarak terminale akıtmak.
        *   Sunucu tabanlı bir LSP kurulursa, editör ile dil sunucusu arasındaki iletişim için.

*   **Talimat (İletişim Protokolü):**
    1.  **Başlangıç:** Tüm iletişim **HTTPS API** çağrıları üzerinden yapılacaktır. Derleme/test bittiğinde sonuç topluca frontend'e dönecektir. Bu en basit ve sağlam başlangıçtır.
    2.  **Gelişmiş (İhtiyaç Halinde):** Eğer derleme/test süreçleri çok uzun sürüyorsa ve kullanıcıya anlık ilerleme göstermek kritikse, bu işlemler için **WebSocket** kullanımı değerlendirilecektir. Sunucu işleme başlar, bir WebSocket bağlantısı üzerinden logları anlık olarak gönderir ve işlem bitince son sonucu yine WebSocket veya ayrı bir bildirim mekanizmasıyla iletir.

## 8. Ek Düşünceler ve Olası Zorluklar (DİKKAT EDİLECEK NOKTALAR)

*   **Güvenlik:**
    *   **Girdi Doğrulama (Input Sanitization):** Kullanıcıdan gelen hiçbir veriye güvenilmeyecektir. Tüm girdiler titizlikle doğrulanmalıdır.
    *   **Kaynak Kısıtlamaları:** Sunucuda çalıştırılan Docker container'ların kullanabileceği CPU, bellek, ağ erişimi gibi kaynaklar kısıtlanmalıdır.
    *   **Minimum Yetki Prensibi:** Container içinde çalıştırılan işlemlerin mümkün olan en düşük yetkilerle çalışması sağlanmalıdır.
    *   **Arbitrary Code Execution (Rastgele Kod Çalıştırma) Önlemleri:** Bu tür açıklara karşı özellikle dikkatli olunmalıdır.
*   **Ölçeklenebilirlik:**
    *   Backend API ve container yönetim sistemi (örn: Kubernetes, AWS Fargate, Google Cloud Run) artan yükü kaldırabilecek şekilde tasarlanmalıdır.
*   **Maliyet:**
    *   Sunucu işlem gücü, Supabase kullanımı (özellikle sık dosya okuma/yazma ve real-time abonelikler), olası API ağ geçidi maliyetleri bütçelenmeli ve optimize edilmelidir.
*   **Sürüm Yönetimi:**
    *   Kullanıcıların farklı Solidity versiyonları, Node.js versiyonları, Hardhat/Anchor versiyonları kullanma ihtiyacı olabilir.
    *   **Başlangıç Stratejisi:** Belirli, güncel ve stabil framework/dil versiyonları desteklenerek başlanacaktır.
    *   **Gelecek Stratejisi:** Proje bazında versiyon seçimi ve backend'de buna uygun Docker imajlarının yönetimi değerlendirilebilir (Bu, sistem karmaşıklığını artırır).
*   **Supabase Kullanımı:**
    *   Çok sık dosya içeriği okuma/yazma Supabase limitlerini zorlayabilir veya maliyeti artırabilir.
    *   **Optimizasyon:** Anlık kaydetme yerine, kullanıcı belirli bir eylem yaptığında (örn: "Kaydet" butonu, derleme isteği) toplu güncelleme/kaydetme işlemleri tercih edilebilir. Cache mekanizmaları değerlendirilmelidir.

## Özet ve Anahtar Yol Haritası Maddeleri

1.  **Mimari:** Kesinlikle **sunucu tabanlı** işleme.
2.  **Backend:** İstek başına **geçici, izole Docker container'ları**.
3.  **Framework'ler:** Sunucuda **Hardhat (EVM)** ve **Anchor (Solana)**.
4.  **IDE:** **Monaco Editor**. Temel linting tarayıcıda, derin analizler sunucuda.
5.  **Deployment:** Sunucuda derleme, **istemci tarafında (kullanıcı cüzdanı ile) imzalama**.
6.  **İletişim:** Başlangıçta **HTTPS API**, gerekirse **WebSocket** ile log akışı.
7.  **Solana Stratejisi:** **Anchor framework**'ü desteklenecek.
8.  **Temel Prensipler:** **Güvenlik** ve **Ölçeklenebilirlik** tasarımın merkezinde olacak.

Bu talimatlar, ChainLab projesinin sağlam, güvenilir ve kullanıcı dostu bir platform olarak geliştirilmesine rehberlik edecektir.