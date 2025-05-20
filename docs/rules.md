# ChainLab Proje Kuralları 

Bu dokümanda ChainLab projesinin geliştirilmesi sırasında uyulması gereken kurallar ve yönergeler belirtilmiştir. Tüm geliştirme sürecinde bu kurallara uyulması gerekmektedir.

## Temel Kurallar

1. **Gereksiz Özellik Ekleme:** Proje kapsamında belirtilmeyen gereksiz özellikleri eklemeyin. Her özellik ekleme isteği PRD dokümanında belirtilmiş olmalı veya proje sahibi tarafından onaylanmış olmalıdır.

2. **Var Olan Dosyaları Silme:** Proje sahibi onay vermediği sürece var olan hiçbir dosyayı silmeyin. Özellikle Minimals şablonuna ait dosyalarda dikkatli olun.

3. **Çalışan Yapıyı Koruma:** Mümkün olduğunca var olan ve çalışan yapıyı bozmayın. Değişiklikler yaparken mevcut çalışan sistemi korumaya özen gösterin.

4. **Bilgi ve Öneriler:** Bildiğinizden emin olmadığınız konularda öneri vermeyin. Sadece bildiğiniz ve emin olduğunuz konularda öneriler sunun.

5. **PRD ve Doküman Kontrolü:** Bir özellik eklerken mutlaka docs içindeki PRD, rules gibi dosyaları okuduktan sonra geliştirmeye başlayın.

## Mimari Kurallar

1. **Dosya Yapısı Düzeni:** Proje, Minimals şablonu üzerine kurulmuştur ve bu yapıya uygun olarak geliştirilmelidir. Minimals şablonunun mimari yapısı ve dosya organizasyonu korunmalıdır.

2. **Component Kullanımı:** MUI componentleri doğrudan kullanmak yerine, Minimals şablonunda özelleştirilmiş componentleri kullanın. Bu componentler `src/components` dizininde bulunmaktadır.

3. **Tema ve Stil Kuralları:** Tema ve stil değişiklikleri için şablon içinde bulunan tema dosyalarını kullanın. Direkt olarak component üzerinde stil değişiklikleri yapmaktan kaçının.

4. **Dil Desteği:** Çoklu dil desteği için `src/locales` dizinindeki yapıyı kullanın, yeni metinleri bu yapıya entegre edin.

## Teknik Kurallar

1. **Supabase Kullanımı:** Veritabanı operasyonları için Supabase kullanılmaktadır. Auth işlemleri ve veri depolama bu yapı üzerinden gerçekleştirilmelidir.

2. **TypeScript Kullanımı:** Tüm yeni dosyalar TypeScript kullanılarak yazılmalıdır. Tip güvenliği sağlanmalıdır.

3. **Performans Optimizasyonu:** Özellikle frontend tarafında performans optimizasyonlarına dikkat edilmelidir. Gereksiz render'lardan kaçınılmalıdır.

4. **Test ve Hata Ayıklama:** Yeni özelliklerin eklenmesi durumunda gerekli test ve hata ayıklama yapılmalıdır.

5. **Mock Veri Kullanımı:** Geliştirme aşamasında `src/_mock` dizinindeki mock verileri kullanın. Üretim ortamına geçmeden önce gerçek verilerle test edin.

## Güvenlik Kuralları

1. **API Anahtarları:** API anahtarları ve hassas bilgiler doğrudan kod içerisinde saklanmamalıdır. Bu bilgiler environment variables üzerinden yönetilmelidir.

2. **Kullanıcı Doğrulama:** Kullanıcı doğrulama işlemleri için Supabase Auth kullanılmalıdır.

3. **Güvenlik Açıkları:** Bilinen güvenlik açıklarına karşı önlem alınmalı, özellikle web3 güvenlik standartlarına uyulmalıdır.

## Geliştirme Süreci Kuralları

1. **Commit Kuralları:** Commit mesajları anlaşılır ve açıklayıcı olmalıdır. 

2. **Kod İnceleme:** Yapılan değişiklikler proje sahibi tarafından gözden geçirilmelidir.

3. **Dokümantasyon:** Yapılan değişiklikler ve yeni özellikler dokümanlar içerisinde güncellenmelidir.

Bu kurallar, ChainLab projesinin kaliteli ve sürdürülebilir bir şekilde geliştirilmesi için oluşturulmuştur ve tüm geliştirme sürecinde dikkate alınmalıdır.
