## Contract Database Schema
{{ ... }}
## ChainLab Backend RPC Fonksiyonları Dokümantasyonu

Bu doküman, ChainLab platformunun backend'inde yer alan ve Supabase üzerinden çağrılabilen PostgreSQL RPC (Remote Procedure Call) fonksiyonlarını detaylandırmaktadır. Bu fonksiyonlar, proje yönetimi, sürüm kontrolü, dosya işlemleri ve akıllı sözleşme/program oluşturma gibi temel backend işlemlerini gerçekleştirir.

### Genel Prensipler

*   **Güvenlik:** Tüm fonksiyonlar `SECURITY DEFINER` olarak tanımlanmıştır, bu da fonksiyonların çağrıldığı kullanıcı (`auth.uid()`) yerine fonksiyonu tanımlayan kullanıcının (genellikle bir süper kullanıcı veya belirli yetkilere sahip bir rol) yetkileriyle çalışmasını sağlar. Fonksiyonların içinde kullanıcı yetkilendirme kontrolleri (örneğin, proje sahipliği) ayrıca yapılır.
*   **Parametreler:** Fonksiyon parametreleri genellikle `p_` ön ekiyle adlandırılır (örn: `p_project_id`).
*   **Dönüş Değerleri:** Fonksiyonlar genellikle işlem sonucunda ilgili kaydın ID'sini veya bir başarı/hata mesajı içeren bir JSON nesnesini döndürür.
*   **Tablo İlişkileri:** Fonksiyonlar `projects`, `project_versions`, `project_files`, `contract_compilation_logs`, `project_members`, `pending_invitations`, `activities`, `tasks` gibi ana tablolarla etkileşimde bulunur.

---

### 1. Proje Yönetimi Fonksiyonları

#### 1.1. `create_new_project`

*   **Açıklama:** Yeni bir proje oluşturur. Proje için bir isim, açıklama, platform (EVM/Solana), ve opsiyonel olarak bir GitHub entegrasyon ID'si alır. Otomatik olarak ilk proje versiyonunu (`v0.1.0`) oluşturur ve bu versiyonu aktif hale getirir. Ardından `populate_initial_project_scaffold` fonksiyonunu çağırarak platforma özgü başlangıç dosya yapısını oluşturur.
*   **İlişkili Tablolar/Fonksiyonlar:**
    *   `public.projects` (INSERT)
    *   `public.project_versions` (INSERT)
    *   `populate_initial_project_scaffold` (ÇAĞRI)
*   **Parametreler:**
    *   `p_name TEXT`: Projenin adı.
    *   `p_description TEXT` (opsiyonel, DEFAULT NULL): Proje açıklaması.
    *   `p_platform TEXT`: Proje platformu ('evm' veya 'solana').
    *   `p_repository_url TEXT` (opsiyonel, DEFAULT NULL): Projenin Git repository URL'si.
    *   `p_thumbnail_url TEXT` (opsiyonel, DEFAULT NULL): Proje için bir thumbnail URL'si.
    *   `p_is_public BOOLEAN` (opsiyonel, DEFAULT FALSE): Projenin herkese açık olup olmadığı.
    *   `p_tags TEXT[]` (opsiyonel, DEFAULT NULL): Proje etiketleri.
    *   `p_category TEXT` (opsiyonel, DEFAULT NULL): Proje kategorisi.
    *   `p_github_integration_id BIGINT` (opsiyonel, DEFAULT NULL): GitHub entegrasyon ID'si.
*   **İç Mantık:**
    1.  Giriş parametrelerini kullanarak `projects` tablosuna yeni bir kayıt ekler. Proje sahibi olarak `auth.uid()` kullanılır.
    2.  Oluşturulan proje ID'si ile `project_versions` tablosuna `v0.1.0` adında bir ilk versiyon kaydı ekler ve `is_active` alanını `TRUE` yapar.
    3.  `populate_initial_project_scaffold` fonksiyonunu çağırarak proje ID'si, ilk versiyon ID'si ve platform bilgisini ileterek başlangıç dosyalarını oluşturur.
*   **Dönüş Değeri:** `JSONB` - `{ "project_id": "uuid", "initial_version_id": "uuid" }`.

#### 1.2. `update_project_details`

*   **Açıklama:** Mevcut bir projenin detaylarını günceller. Proje sahibi olmayan kullanıcıların güncelleme yapmasını engeller. Eğer projenin aktif versiyonunda dosyalar varsa platform değişikliğine izin vermez.
*   **İlişkili Tablolar/Fonksiyonlar:**
    *   `public.projects` (UPDATE)
    *   `public.project_files` (SELECT kontrolü için)
*   **Parametreler:**
    *   `p_project_id UUID`: Güncellenecek projenin ID'si.
    *   `p_name TEXT` (opsiyonel, DEFAULT NULL): Yeni proje adı.
    *   `p_description TEXT` (opsiyonel, DEFAULT NULL): Yeni proje açıklaması.
    *   `p_platform TEXT` (opsiyonel, DEFAULT NULL): Yeni proje platformu.
    *   `p_repository_url TEXT` (opsiyonel, DEFAULT NULL): Yeni repository URL'si.
    *   `p_thumbnail_url TEXT` (opsiyonel, DEFAULT NULL): Yeni thumbnail URL'si.
    *   `p_is_public BOOLEAN` (opsiyonel, DEFAULT NULL): Projenin yeni görünürlük durumu.
    *   `p_tags TEXT[]` (opsiyonel, DEFAULT NULL): Yeni etiketler.
    *   `p_category TEXT` (opsiyonel, DEFAULT NULL): Yeni kategori.
    *   `p_github_integration_id BIGINT` (opsiyonel, DEFAULT NULL): Yeni GitHub entegrasyon ID'si.
*   **İç Mantık:**
    1.  Projenin sahibinin `auth.uid()` olup olmadığını kontrol eder.
    2.  Eğer `p_platform` parametresi doluysa ve mevcut platformdan farklıysa, projenin aktif versiyonunda herhangi bir dosya olup olmadığını kontrol eder. Dosya varsa platform değişikliğini reddeder.
    3.  `COALESCE` kullanarak sadece dolu gelen parametrelerle `projects` tablosundaki ilgili projeyi günceller.
*   **Dönüş Değeri:** `UUID` - Güncellenen projenin ID'si.

#### 1.3. `delete_project`

*   **Açıklama:** Bir projeyi ve ona bağlı tüm verileri (versiyonlar, dosyalar, derleme günlükleri, üyeler, davetler, aktiviteler, görevler vb.) siler. Sadece proje sahibi bu işlemi yapabilir.
*   **İlişkili Tablolar/Fonksiyonlar:**
    *   `public.projects` (DELETE)
    *   `public.project_versions` (DELETE)
    *   `public.project_files` (DELETE)
    *   `public.contract_compilation_logs` (DELETE)
    *   `public.project_members` (DELETE)
    *   `public.pending_invitations` (DELETE)
    *   `public.activities` (DELETE)
    *   `public.tasks` (DELETE)
*   **Parametreler:**
    *   `p_project_id UUID`: Silinecek projenin ID'si.
*   **İç Mantık:**
    1.  Projenin sahibinin `auth.uid()` olup olmadığını kontrol eder.
    2.  Belirtilen `p_project_id` ile ilişkili tüm kayıtları yukarıda listelenen tablolardan sırayla siler (Foreign Key kısıtlamalarına dikkat ederek).
    3.  Son olarak `projects` tablosundan ana proje kaydını siler.
*   **Dönüş Değeri:** `UUID` - Silinen projenin ID'si.

---

### 2. Proje Versiyon Yönetimi Fonksiyonları

#### 2.1. `create_new_project_version`

*   **Açıklama:** Mevcut bir proje için yeni bir versiyon oluşturur. Genellikle bir `base_version_id` alır ve bu versiyondaki tüm dosyaları yeni oluşturulan versiyona kopyalar. Eğer `base_version_id` verilmezse, projenin o anki aktif versiyonundaki dosyaları kopyalar. Yeni versiyon adı (örn: `v1.2.3`) ve bir açıklama alır. Yeni versiyon oluşturulduktan sonra aktif hale getirilmez.
*   **İlişkili Tablolar/Fonksiyonlar:**
    *   `public.project_versions` (INSERT, SELECT)
    *   `public.project_files` (SELECT, INSERT)
*   **Parametreler:**
    *   `p_project_id UUID`: Yeni versiyonun oluşturulacağı proje ID'si.
    *   `p_version_name TEXT`: Yeni versiyonun adı (örn: "v1.0.1", "feature-branch").
    *   `p_description TEXT` (opsiyonel, DEFAULT NULL): Versiyon için açıklama.
    *   `p_base_version_id UUID` (opsiyonel, DEFAULT NULL): Kopyalanacak dosyaların alınacağı temel versiyon ID'si. Eğer NULL ise, projenin o anki aktif versiyonu kullanılır.
*   **İç Mantık:**
    1.  Projenin sahibinin `auth.uid()` olup olmadığını kontrol eder.
    2.  `project_versions` tablosuna yeni versiyon kaydını ekler (`is_active` = FALSE).
    3.  Belirlenen `base_version_id`'deki (veya aktif versiyondaki) tüm `project_files` kayıtlarını yeni `version_id` ile kopyalar.
*   **Dönüş Değeri:** `UUID` - Oluşturulan yeni proje versiyonunun ID'si.

#### 2.2. `activate_project_version`

*   **Açıklama:** Belirli bir proje için belirtilen versiyonu aktif hale getirir. Proje sahibi olmayan kullanıcıların bu işlemi yapmasını engeller. Aynı anda sadece bir versiyon aktif olabilir; bu fonksiyon, mevcut aktif versiyonu pasif hale getirip yenisini aktif yapar.
*   **İlişkili Tablolar/Fonksiyonlar:**
    *   `public.projects` (UPDATE `active_project_version_id`)
    *   `public.project_versions` (UPDATE `is_active`)
*   **Parametreler:**
    *   `p_project_id UUID`: Proje ID'si.
    *   `p_version_id UUID`: Aktif hale getirilecek versiyon ID'si.
*   **İç Mantık:**
    1.  Projenin sahibinin `auth.uid()` olup olmadığını kontrol eder.
    2.  `project_versions` tablosunda, `p_project_id`'ye ait mevcut aktif versiyonun `is_active` alanını `FALSE` yapar.
    3.  `project_versions` tablosunda, `p_version_id` ile belirtilen versiyonun `is_active` alanını `TRUE` yapar.
    4.  `projects` tablosunda, `p_project_id`'li projenin `active_project_version_id` alanını `p_version_id` ile günceller.
*   **Dönüş Değeri:** `UUID` - Aktif hale getirilen versiyonun ID'si.

#### 2.3. `get_project_versions`

*   **Açıklama:** Belirli bir projeye ait tüm versiyonları listeler.
*   **İlişkili Tablolar/Fonksiyonlar:**
    *   `public.project_versions` (SELECT)
*   **Parametreler:**
    *   `p_project_id UUID`: Versiyonları listelenecek proje ID'si.
*   **İç Mantık:**
    1.  `project_versions` tablosundan `project_id`'si `p_project_id` olan tüm kayıtları seçer.
*   **Dönüş Değeri:** `SETOF project_versions` - Proje versiyon kayıtları kümesi.

---

### 3. Platforma Özgü Oluşturma Fonksiyonları

#### 3.1. `create_new_evm_contract`

*   **Açıklama:** Belirli bir proje ve versiyon için yeni bir EVM (Solidity) akıllı sözleşmesi oluşturur. Bir sözleşme adı alır ve bu ada göre `contracts/ContractName.sol`, `test/ContractName.test.js`, ve `scripts/deploy-ContractName.js` dosyalarını başlangıç içerikleriyle oluşturur.
*   **İlişkili Tablolar/Fonksiyonlar:**
    *   `public.project_files` (INSERT)
    *   `internal_create_project_file_entry` (ÇAĞRI)
*   **Parametreler:**
    *   `p_project_id UUID`: Proje ID'si.
    *   `p_version_id UUID`: Dosyaların ekleneceği versiyon ID'si.
    *   `p_contract_name TEXT`: Oluşturulacak sözleşmenin adı (CamelCase formatında olması önerilir, örn: `MyToken`).
*   **İç Mantık:**
    1.  Projenin sahibinin `auth.uid()` olup olmadığını kontrol eder.
    2.  Projenin platformunun 'evm' olup olmadığını kontrol eder.
    3.  `p_contract_name` kullanarak dosya yollarını ve temel içerikleri oluşturur.
    4.  `contracts/` dizininin var olup olmadığını kontrol eder, yoksa oluşturur (`internal_create_project_file_entry` ile).
    5.  `test/` dizininin var olup olmadığını kontrol eder, yoksa oluşturur.
    6.  `scripts/` dizininin var olup olmadığını kontrol eder, yoksa oluşturur.
    7.  Her bir dosya için (`.sol`, `.test.js`, `.js`) `internal_create_project_file_entry` fonksiyonunu çağırarak `project_files` tablosuna kayıtları ekler.
*   **Dönüş Değeri:** `JSONB` - Oluşturulan dosyaların ID'lerini içeren bir JSON nesnesi: `{ "contract_file_id": "uuid", "test_file_id": "uuid", "deploy_script_id": "uuid" }`.

#### 3.2. `create_new_solana_program`

*   **Açıklama:** Belirli bir proje ve versiyon için yeni bir Solana (Rust/Anchor) programı oluşturur. Program adı (snake_case formatında olması önerilir, örn: `my_program`) alır. `programs/program_name/src/lib.rs`, `programs/program_name/Xargo.toml`, `tests/program_name.ts` gibi dosyaları ve ilgili workspace yapılandırma dosyalarını (`Anchor.toml`, ana `Cargo.toml`) günceller/oluşturur.
*   **İlişkili Tablolar/Fonksiyonlar:**
    *   `public.project_files` (INSERT, UPDATE)
    *   `internal_create_project_file_entry` (ÇAĞRI)
*   **Parametreler:**
    *   `p_project_id UUID`: Proje ID'si.
    *   `p_version_id UUID`: Dosyaların ekleneceği versiyon ID'si.
    *   `p_program_name TEXT`: Oluşturulacak programın adı (snake_case, örn: `my_counter`).
*   **İç Mantık:**
    1.  Projenin sahibinin `auth.uid()` olup olmadığını kontrol eder.
    2.  Projenin platformunun 'solana' olup olmadığını kontrol eder.
    3.  Gerekli dizinleri (`programs/`, `programs/p_program_name/`, `programs/p_program_name/src/`, `tests/`) oluşturur.
    4.  `lib.rs`, `Xargo.toml` (program için), `program_name.ts` (test için) dosyalarını temel içerikleriyle oluşturur.
    5.  Proje kök dizinindeki `Anchor.toml` dosyasını bularak yeni programı ekler veya dosyayı oluşturur.
    6.  Proje kök dizinindeki `Cargo.toml` dosyasını (workspace) bularak yeni programı `[workspace.members]` altına ekler veya dosyayı oluşturur.
*   **Dönüş Değeri:** `JSONB` - Oluşturulan ana dosyaların ID'lerini içeren bir JSON nesnesi: `{ "lib_rs_file_id": "uuid", "xargo_toml_file_id": "uuid", "test_ts_file_id": "uuid" }`.

---

### 4. Dosya ve Dizin Yönetimi Fonksiyonları

Bu fonksiyonlar genellikle projenin aktif versiyonu üzerinde çalışır.

#### 4.1. `populate_initial_project_scaffold` (Internal-like, `create_new_project` tarafından kullanılır)

*   **Açıklama:** Yeni bir proje oluşturulduğunda, seçilen platforma (EVM/Solana) göre temel dosya ve dizin yapısını oluşturur. `create_new_project` tarafından otomatik olarak çağrılır.
*   **İlişkili Tablolar/Fonksiyonlar:**
    *   `public.project_files` (INSERT)
    *   `internal_create_project_file_entry` (ÇAĞRI)
*   **Parametreler:**
    *   `p_project_id UUID`: Proje ID'si.
    *   `p_version_id UUID`: Dosyaların ekleneceği versiyon ID'si.
    *   `p_platform TEXT`: Proje platformu ('evm' veya 'solana').
    *   `p_project_name TEXT`: Proje adı (bazı başlangıç dosyalarının içeriğinde kullanılabilir).
*   **İç Mantık:**
    *   **EVM için:**
        *   `contracts/` dizini ve içinde `Greeter.sol` (örnek sözleşme).
        *   `scripts/` dizini ve içinde `deploy.js`.
        *   `test/` dizini ve içinde `sample-test.js`.
        *   `hardhat.config.js`.
        *   `package.json` (temel Hardhat bağımlılıkları ile).
        *   `.gitignore`.
        *   `README.md`.
    *   **Solana için:**
        *   `programs/` dizini.
        *   `tests/` dizini.
        *   `Anchor.toml`.
        *   `Cargo.toml` (workspace için).
        *   `package.json` (temel Anchor/Solana bağımlılıkları ile).
        *   `.gitignore`.
        *   `README.md`.
    Her bir dosya/dizin için `internal_create_project_file_entry` çağrılır.
*   **Dönüş Değeri:** `VOID`.

#### 4.2. `internal_create_project_file_entry` (Internal, diğer fonksiyonlar tarafından kullanılır)

*   **Açıklama:** `project_files` tablosuna yeni bir dosya veya dizin kaydı ekler. Bu fonksiyon genellikle diğer RPC'ler tarafından içsel olarak kullanılır ve doğrudan frontend tarafından çağrılması amaçlanmamıştır.
*   **İlişkili Tablolar/Fonksiyonlar:**
    *   `public.project_files` (INSERT)
*   **Parametreler:**
    *   `p_project_id UUID`: Proje ID'si.
    *   `p_version_id UUID`: Versiyon ID'si.
    *   `p_file_path TEXT`: Dosya veya dizinin tam yolu (örn: `contracts/MyContract.sol`).
    *   `p_file_name TEXT`: Dosya veya dizinin adı (örn: `MyContract.sol`).
    *   `p_content TEXT` (opsiyonel, DEFAULT NULL): Dosyanın içeriği. Dizinler için NULL bırakılır.
    *   `p_is_directory BOOLEAN` (opsiyonel, DEFAULT FALSE): Kaydın bir dizin olup olmadığını belirtir. `p_content` NULL ise bu genellikle TRUE olur.
*   **İç Mantık:**
    1.  Verilen parametrelerle `project_files` tablosuna yeni bir kayıt ekler.
*   **Dönüş Değeri:** `UUID` - Oluşturulan dosya/dizin kaydının ID'si.

#### 4.3. `add_project_file_or_directory`

*   **Açıklama:** Projenin aktif versiyonuna yeni bir dosya veya dizin ekler.
*   **İlişkili Tablolar/Fonksiyonlar:**
    *   `public.projects` (SELECT `active_project_version_id`)
    *   `internal_create_project_file_entry` (ÇAĞRI)
*   **Parametreler:**
    *   `p_project_id UUID`: Proje ID'si.
    *   `p_file_path TEXT`: Oluşturulacak dosya/dizinin tam yolu (örn: `src/utils/helpers.js`).
    *   `p_file_name TEXT`: Dosya/dizin adı.
    *   `p_content TEXT` (opsiyonel, DEFAULT NULL): Dosya ise içeriği.
    *   `p_is_directory BOOLEAN` (opsiyonel, DEFAULT FALSE): Dizin mi oluşturulacak?
*   **İç Mantık:**
    1.  Projenin sahibinin `auth.uid()` olup olmadığını kontrol eder.
    2.  Projenin aktif versiyon ID'sini alır.
    3.  `internal_create_project_file_entry` fonksiyonunu çağırarak dosyayı/dizini oluşturur.
*   **Dönüş Değeri:** `UUID` - Oluşturulan dosya/dizin kaydının ID'si.

#### 4.4. `update_project_file_content` (Kullanıcı listesinde `update_file_content` olarak geçiyordu, ancak bu fonksiyon daha önce `update_project_file_content` olarak adlandırılmış ve implemente edilmişti.)

*   **Açıklama:** Projenin aktif versiyonundaki belirli bir dosyanın içeriğini günceller.
*   **İlişkili Tablolar/Fonksiyonlar:**
    *   `public.projects` (SELECT `active_project_version_id`)
    *   `public.project_files` (UPDATE)
*   **Parametreler:**
    *   `p_project_id UUID`: Proje ID'si.
    *   `p_file_id UUID`: İçeriği güncellenecek dosyanın ID'si.
    *   `p_new_content TEXT`: Dosyanın yeni içeriği.
*   **İç Mantık:**
    1.  Projenin sahibinin `auth.uid()` olup olmadığını kontrol eder.
    2.  Projenin aktif versiyon ID'sini alır.
    3.  `project_files` tablosunda, belirtilen `p_file_id`'ye ve aktif versiyon ID'sine sahip dosyanın `content` alanını `p_new_content` ile günceller.
*   **Dönüş Değeri:** `UUID` - Güncellenen dosyanın ID'si.

#### 4.5. `rename_project_file_or_directory`

*   **Açıklama:** Projenin aktif versiyonundaki bir dosya veya dizini yeniden adlandırır. Eğer bir dizin yeniden adlandırılıyorsa, içindeki tüm dosya ve alt dizinlerin yollarını da günceller.
*   **İlişkili Tablolar/Fonksiyonlar:**
    *   `public.projects` (SELECT `active_project_version_id`)
    *   `public.project_files` (UPDATE)
*   **Parametreler:**
    *   `p_project_id UUID`: Proje ID'si.
    *   `p_file_id UUID`: Yeniden adlandırılacak dosya/dizinin ID'si.
    *   `p_new_name TEXT`: Yeni dosya/dizin adı.
*   **İç Mantık:**
    1.  Projenin sahibinin `auth.uid()` olup olmadığını kontrol eder.
    2.  Projenin aktif versiyon ID'sini alır.
    3.  Belirtilen `p_file_id`'ye sahip kaydı bulur.
    4.  Yeni `file_path` ve `file_name` değerlerini hesaplar.
    5.  Eğer yeniden adlandırılan bir dizinse, bu dizinin altındaki tüm dosya ve dizinlerin `file_path`'larını da yeni yola göre günceller.
    6.  Ana dosya/dizin kaydının `file_path` ve `file_name` alanlarını günceller.
*   **Dönüş Değeri:** `UUID` - Yeniden adlandırılan dosya/dizinin ID'si.

#### 4.6. `delete_project_file_or_directory`

*   **Açıklama:** Projenin aktif versiyonundan bir dosyayı veya dizini (içindekilerle birlikte) siler.
*   **İlişkili Tablolar/Fonksiyonlar:**
    *   `public.projects` (SELECT `active_project_version_id`)
    *   `public.project_files` (DELETE)
*   **Parametreler:**
    *   `p_project_id UUID`: Proje ID'si.
    *   `p_file_id UUID`: Silinecek dosya/dizinin ID'si.
*   **İç Mantık:**
    1.  Projenin sahibinin `auth.uid()` olup olmadığını kontrol eder.
    2.  Projenin aktif versiyon ID'sini alır.
    3.  Belirtilen `p_file_id`'ye sahip kaydı bulur.
    4.  Eğer bir dizinse, bu dizinin altındaki tüm dosya ve dizinleri `project_files` tablosundan siler (rekürsif olarak).
    5.  Ana dosya/dizin kaydını `project_files` tablosundan siler.
*   **Dönüş Değeri:** `UUID` - Silinen dosya/dizinin ID'si.

#### 4.7. `get_project_hierarchy`

*   **Açıklama:** Bir projenin tüm dosya ve dizin hiyerarşisini, platform ve dosya türü gibi zenginleştirilmiş bilgilerle birlikte döndürür. Bu fonksiyon, IDE'de bir dosya ağacı oluşturmak için kullanılır. Dizinler, `project_files` tablosundaki `content` alanı `NULL` olan kayıtlardır. Hiyerarşi, `file_path` alanları analiz edilerek oluşturulur.
*   **Parametreler:**
    *   `p_project_id UUID`: Hiyerarşisi alınacak proje ID'si.
*   **Dönüş Değeri:** `JSONB[]` - Her bir JSON nesnesi aşağıdaki alanları içerir:
    *   `id UUID`: Benzersiz dosya veya dizin ID'si (`project_files.id`).
    *   `name TEXT`: Dosya veya dizin adı (`project_files.file_name`).
    *   `path TEXT`: Proje kök dizininden itibaren tam dosya veya dizin yolu (`project_files.file_path`).
    *   `type TEXT`: `'file'` veya `'directory'` (Eğer `project_files.content` `NULL` ise `'directory'`).
    *   `platform TEXT`: Dosyanın veya dizinin ilişkili olduğu platform (`project_files.platform`).
    *   `file_type TEXT`: Dosya türü (`project_files.file_type`). Dizinler için `null` olur.
    *   `parent_id UUID`: Öğenin üst dizininin `project_files.id`'si. `file_path` analizi ile belirlenir. Kök seviyesindeki öğeler için `null` olabilir.
*   **İç Logika:**
    1.  İstek yapan kullanıcının (`auth.uid()`) projeye (`p_project_id`) erişimi olup olmadığını kontrol eder.
    2.  `p_project_id`'ye ait tüm kayıtları `project_files` tablosundan çeker.
    3.  Her bir kayıt için:
        *   `type` alanını `content` alanının `NULL` olup olmamasına göre belirler.
        *   `parent_id` alanını, `file_path`'i analiz ederek ve bir üst seviyedeki dizinin `project_files` tablosundaki `id`'sini bularak belirler.
    4.  Bu verileri birleştirerek yukarıda belirtilen JSON yapısında bir dizi oluşturur ve yola göre sıralar.

#### 4.8. `get_project_file_by_id`

*   **Açıklama:** Belirtilen ID'ye sahip bir proje dosyasının tüm detaylarını (içerik dahil) getirir. Sadece `project_files` tablosundaki dosya kayıtları için geçerlidir.
*   **Parametreler:**
    *   `p_file_id UUID`: Detayları alınacak dosyanın ID'si (`project_files.id`).
*   **Dönüş Değeri:** `TABLE` - Aşağıdaki sütunları içeren tek bir satır veya hiç satır:
    *   `id UUID`: Dosyanın ID'si.
    *   `project_id UUID`: Dosyanın ait olduğu proje ID'si.
    *   `version_id UUID`: Dosyanın ait olduğu versiyon ID'si.
    *   `file_name TEXT`: Dosya adı.
    *   `file_path TEXT`: Dosyanın tam yolu.
    *   `file_type TEXT`: Dosya türü (örn: 'solidity', 'typescript').
    *   `platform TEXT`: Dosyanın platformu (örn: 'evm', 'frontend').
    *   `content TEXT`: Dosyanın içeriği.
    *   `created_at TIMESTAMPTZ`: Dosyanın oluşturulma zamanı.
    *   `updated_at TIMESTAMPTZ`: Dosyanın son güncellenme zamanı.
    *   `is_entry_point BOOLEAN`: Dosyanın bir giriş noktası olup olmadığı.
*   **İç Logika:**
    1.  Belirtilen `p_file_id` ile `project_files` tablosundan ilgili dosyayı bulur.
    2.  Eğer dosya bulunamazsa hata döndürür.
    3.  İstek yapan kullanıcının (`auth.uid()`) dosyanın ait olduğu projeye erişimi olup olmadığını kontrol eder.
    4.  Erişim varsa, dosya detaylarını döndürür.

---
---

### 5. Kullanıcı Akış Senaryoları

Bu bölümde, yukarıda detaylandırılan RPC fonksiyonlarının frontend tarafından yaygın kullanıcı etkileşimlerinde nasıl kullanılabileceğine dair örnek senaryolar sunulmaktadır.

#### Senaryo 1: Yeni Bir EVM Projesi Oluşturma ve İlk Akıllı Sözleşmeyi Ekleme

*   **Kullanıcı Amacı:** Yeni bir Ethereum tabanlı (EVM) proje başlatmak ve bu projeye basit bir "Merhaba Dünya" tarzı akıllı sözleşme eklemek.
*   **Adımlar ve RPC Çağrıları:**
    1.  **Proje Oluşturma Formu:** Kullanıcı, arayüzde proje adı (örn: "MyFirstDApp"), açıklaması, platform olarak "EVM" seçer ve "Oluştur" butonuna tıklar.
    2.  **Frontend Çağrısı:** Frontend, `create_new_project` RPC fonksiyonunu çağırır.
        ```javascript
        // Örnek Frontend Kodu (Pseudocode)
        const newProjectData = {
          p_project_name: "MyFirstDApp",
          p_description: "My first decentralized application.",
          p_platform: "evm",
          p_github_repo_url: null, // Opsiyonel
          p_tags: ["defi", "learning"], // Opsiyonel
          p_visibility: "private" // Opsiyonel
        };
        const { project_id, version_id } = await supabase.rpc('create_new_project', newProjectData);
        // project_id ve version_id sonraki adımlar için saklanır.
        ```
    3.  **Proje Başarıyla Oluşturuldu:** RPC çağrısı başarılı olursa, kullanıcı proje çalışma alanına yönlendirilir. `populate_initial_project_scaffold` fonksiyonu arka planda temel EVM dosya yapısını (contracts, tests, scripts klasörleri, hardhat.config.js vb.) zaten oluşturmuştur.
    4.  **Yeni Sözleşme Ekleme:** Kullanıcı, "Yeni Sözleşme" butonuna tıklar, sözleşme adı olarak "HelloWorld" girer.
    5.  **Frontend Çağrısı:** Frontend, `create_new_evm_contract` RPC fonksiyonunu çağırır.
        ```javascript
        // Örnek Frontend Kodu (Pseudocode)
        const contractData = {
          p_project_id: previously_stored_project_id,
          p_version_id: previously_stored_version_id, // Projenin ilk ve aktif versiyonu
          p_contract_name: "HelloWorld"
        };
        const newFileIds = await supabase.rpc('create_new_evm_contract', contractData);
        // newFileIds.contract_file_id, newFileIds.test_file_id vb. kullanılarak arayüz güncellenir.
        ```
    6.  **Dosyalar Oluşturuldu:** `HelloWorld.sol`, `HelloWorld.test.js`, ve `deploy-HelloWorld.js` dosyaları `project_files` tablosuna eklenir ve kullanıcı arayüzünde dosya ağacında görünür hale gelir.
*   **İlgili Fonksiyonlar:**
    *   `create_new_project`
    *   `populate_initial_project_scaffold` (dolaylı olarak `create_new_project` tarafından çağrılır)
    *   `create_new_evm_contract`

#### Senaryo 2: Proje Detaylarını Güncelleme ve Yeni Versiyon Oluşturma

*   **Kullanıcı Amacı:** Mevcut bir projenin açıklamasını güncellemek ve ardından mevcut durumu koruyarak geliştirme için yeni bir versiyon oluşturmak.
*   **Adımlar ve RPC Çağrıları:**
    1.  **Proje Ayarları:** Kullanıcı, mevcut bir projenin ("MyFirstDApp") ayarlarına gider ve proje açıklamasını değiştirir.
    2.  **Frontend Çağrısı:** Frontend, `update_project_details` RPC fonksiyonunu çağırır.
        ```javascript
        // Örnek Frontend Kodu (Pseudocode)
        const projectUpdateData = {
          p_project_id: "uuid_of_MyFirstDApp",
          p_new_description: "An updated description for my first DApp."
          // Diğer alanlar (p_new_name, p_new_github_repo_url vb.) güncellenmiyorsa null veya undefined gönderilir.
        };
        const updatedProject = await supabase.rpc('update_project_details', projectUpdateData);
        ```
    3.  **Yeni Versiyon Oluşturma:** Kullanıcı, proje sayfasında "Yeni Versiyon Oluştur" butonuna tıklar. Yeni versiyon için bir ad (örn: "v1.1-feature-branch") ve hangi versiyonu temel alacağını (örn: "v1.0-initial") seçer.
    4.  **Frontend Çağrısı:** Frontend, `create_new_project_version` RPC fonksiyonunu çağırır.
        ```javascript
        // Örnek Frontend Kodu (Pseudocode)
        const versionData = {
          p_project_id: "uuid_of_MyFirstDApp",
          p_version_name: "v1.1-feature-branch",
          p_based_on_version_id: "uuid_of_v1.0_initial_version",
          p_description: "Adding new features"
        };
        const newVersion = await supabase.rpc('create_new_project_version', versionData);
        // newVersion.id ile yeni versiyon ID'si alınır.
        ```
    5.  **Versiyon Oluşturuldu ve Aktif Etme (Opsiyonel):** Yeni versiyon oluşturulur. Kullanıcı isterse bu yeni versiyonu aktif hale getirebilir.
    6.  **Frontend Çağrısı (Aktif Etme):** Eğer kullanıcı yeni versiyonu aktif etmek isterse, frontend `activate_project_version` RPC fonksiyonunu çağırır.
        ```javascript
        // Örnek Frontend Kodu (Pseudocode)
        const activationData = {
          p_project_id: "uuid_of_MyFirstDApp",
          p_version_id_to_activate: newVersion.id
        };
        await supabase.rpc('activate_project_version', activationData);
        ```
*   **İlgili Fonksiyonlar:**
    *   `update_project_details`
    *   `create_new_project_version`
    *   `activate_project_version` (opsiyonel)
    *   `get_project_versions` (versiyon listesini göstermek için öncesinde kullanılabilir)

#### Senaryo 3: Yeni Bir Solana Projesi Oluşturma ve İlk Programı Ekleme

*   **Kullanıcı Amacı:** Yeni bir Solana tabanlı proje başlatmak ve bu projeye basit bir "Sayaç" (Counter) programı eklemek.
*   **Adımlar ve RPC Çağrıları:**
    1.  **Proje Oluşturma Formu:** Kullanıcı, arayüzde proje adı (örn: "MyFirstSolanaApp"), açıklaması, platform olarak "Solana" seçer ve "Oluştur" butonuna tıklar.
    2.  **Frontend Çağrısı:** Frontend, `create_new_project` RPC fonksiyonunu çağırır.
        ```javascript
        // Örnek Frontend Kodu (Pseudocode)
        const newProjectData = {
          p_project_name: "MyFirstSolanaApp",
          p_description: "My first Solana application using Anchor.",
          p_platform: "solana",
          p_github_repo_url: null,
          p_tags: ["anchor", "learning"],
          p_visibility: "public"
        };
        const { project_id, version_id } = await supabase.rpc('create_new_project', newProjectData);
        // project_id ve version_id sonraki adımlar için saklanır.
        ```
    3.  **Proje Başarıyla Oluşturuldu:** RPC çağrısı başarılı olursa, kullanıcı proje çalışma alanına yönlendirilir. `populate_initial_project_scaffold` fonksiyonu arka planda temel Solana dosya yapısını (programs, tests klasörleri, Anchor.toml, Cargo.toml vb.) zaten oluşturmuştur.
    4.  **Yeni Program Ekleme:** Kullanıcı, "Yeni Program" butonuna tıklar, program adı olarak "my_counter" (snake_case) girer.
    5.  **Frontend Çağrısı:** Frontend, `create_new_solana_program` RPC fonksiyonunu çağırır.
        ```javascript
        // Örnek Frontend Kodu (Pseudocode)
        const programData = {
          p_project_id: previously_stored_project_id,
          p_version_id: previously_stored_version_id, // Projenin ilk ve aktif versiyonu
          p_program_name: "my_counter"
        };
        const newFileIds = await supabase.rpc('create_new_solana_program', programData);
        // newFileIds.lib_rs_file_id vb. kullanılarak arayüz güncellenir.
        ```
    6.  **Dosyalar Oluşturuldu:** `programs/my_counter/src/lib.rs`, `programs/my_counter/Xargo.toml`, `tests/my_counter.ts` gibi dosyalar ve ilgili workspace yapılandırma dosyaları güncellenir/oluşturulur. Kullanıcı arayüzünde dosya ağacında görünür hale gelir.
*   **İlgili Fonksiyonlar:**
    *   `create_new_project`
    *   `populate_initial_project_scaffold` (dolaylı olarak `create_new_project` tarafından çağrılır)
    *   `create_new_solana_program`

#### Senaryo 4: Mevcut Bir Proje Dosyasının İçeriğini Güncelleme ve Bir Dosyayı Yeniden Adlandırma

*   **Kullanıcı Amacı:** Mevcut bir EVM projesindeki bir Solidity sözleşmesinin içeriğini değiştirmek ve ardından bu sözleşmeyle ilişkili test dosyasını yeniden adlandırmak.
*   **Adımlar ve RPC Çağrıları:**
    1.  **Dosya Seçimi ve Düzenleme:** Kullanıcı, "MyFirstDApp" projesindeki `contracts/HelloWorld.sol` dosyasını dosya ağacından seçer. Kod editöründe dosyanın içeriğini (örneğin, selamlama mesajını) değiştirir ve "Kaydet" butonuna tıklar.
    2.  **Frontend Çağrısı (İçerik Güncelleme):** Frontend, `update_project_file_content` RPC fonksiyonunu çağırır.
        ```javascript
        // Örnek Frontend Kodu (Pseudocode)
        const fileUpdateData = {
          p_project_id: "uuid_of_MyFirstDApp",
          p_file_id: "uuid_of_HelloWorld_sol_file", // Bu ID dosya seçildiğinde elde edilir
          p_new_content: "// New Solidity code...\ncontract HelloWorld { ... }"
        };
        const updatedFile = await supabase.rpc('update_project_file_content', fileUpdateData);
        // Başarı mesajı gösterilir.
        ```
    3.  **Dosya Yeniden Adlandırma:** Kullanıcı, aynı projedeki `test/HelloWorld.test.js` dosyasına sağ tıklar ve "Yeniden Adlandır" seçeneğini seçer. Yeni isim olarak `test/HelloWorldV2.test.js` girer.
    4.  **Frontend Çağrısı (Yeniden Adlandırma):** Frontend, `rename_project_file_or_directory` RPC fonksiyonunu çağırır.
        ```javascript
        // Örnek Frontend Kodu (Pseudocode)
        const renameData = {
          p_project_id: "uuid_of_MyFirstDApp",
          p_file_id: "uuid_of_HelloWorld_test_js_file", // Bu ID dosya seçildiğinde elde edilir
          p_new_name: "HelloWorldV2.test.js" // Sadece dosya adı, tam yol değil
        };
        const renamedFile = await supabase.rpc('rename_project_file_or_directory', renameData);
        // Dosya ağacı güncellenir.
        ```
*   **İlgili Fonksiyonlar:**
    *   `update_project_file_content`
    *   `rename_project_file_or_directory`
    *   (Dosya ID'lerini ve yollarını listelemek için `get_project_files_for_version` gibi bir okuma fonksiyonu önceden kullanılabilir.)

#### Senaryo 5: Bir Projeyi ve İlişkili Tüm Verilerini Silme

*   **Kullanıcı Amacı:** Artık ihtiyaç duyulmayan bir projeyi, tüm versiyonları, dosyaları ve ilişkili diğer verileriyle birlikte sistemden tamamen kaldırmak.
*   **Adımlar ve RPC Çağrıları:**
    1.  **Proje Seçimi ve Silme Onayı:** Kullanıcı, proje listesinden silmek istediği projeyi (örn: "OldProjectToDelete") seçer ve "Projeyi Sil" seçeneğine tıklar. Arayüz, bu işlemin geri alınamayacağına dair bir uyarı ve onay mekanizması sunar (örn: proje adını yazarak onaylama).
    2.  **Frontend Çağrısı:** Kullanıcı silme işlemini onayladıktan sonra, frontend `delete_project` RPC fonksiyonunu çağırır.
        ```javascript
        // Örnek Frontend Kodu (Pseudocode)
        const projectToDeleteId = "uuid_of_OldProjectToDelete"; // Bu ID, silinecek proje seçildiğinde elde edilir

        // Kullanıcı onayı alındıktan sonra:
        const deleteConfirmation = await supabase.rpc('delete_project', { p_project_id: projectToDeleteId });

        if (deleteConfirmation && deleteConfirmation.success) {
          // Proje başarıyla silindi, arayüzü güncelle (örn: projeyi listeden kaldır)
          console.log("Proje başarıyla silindi.");
        } else {
          // Silme işlemi sırasında bir hata oluştu, kullanıcıyı bilgilendir
          console.error("Proje silinirken bir hata oluştu:", deleteConfirmation.error_message);
        }
        ```
    3.  **İşlem Sonucu:** RPC çağrısı başarılı olursa, proje ve ilişkili tüm kayıtlar (versiyonlar, dosyalar, derleme logları, üyeler, davetiyeler, aktiviteler, görevler vb.) veritabanından silinir. Kullanıcı arayüzü güncellenerek proje listeden kaldırılır.
*   **İlgili Fonksiyonlar:**
    *   `delete_project`
    *   (Proje listesini göstermek için `get_user_projects` gibi bir okuma fonksiyonu önceden kullanılabilir.)
