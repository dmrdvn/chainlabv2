export interface User {
  id: string;
  email: string | null;
  fullname: string | null;
  avatar_url: string | null;
}

/* =============== Project Core Types =============== */

export interface Project {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  visibility: ProjectVisibility;
  platform: 'evm' | 'solana' | 'stellar' | null;
  tags: string[];
  logo_url: string | null;
  social_links: ProjectSocialLinks | null;
  github_repo_url?: string | null;
  archived: boolean;
  created_at: string | null;
  updated_at: string | null;
  active_project_version_id?: string | null;
  owner_details?: ProjectOwner;
}

export interface ProjectOwner extends User {}

export type ProjectUpdatePayload = {
  name?: string;
  description?: string | null;
  visibility?: ProjectVisibility;
  platform?: 'evm' | 'solana' | 'stellar';
  tags?: string[];
  logo_url?: string | null;
  social_links?: ProjectSocialLinks | null;
  github_repo_url?: string | null;
  archived?: boolean;
  updated_at?: string;
};

export enum ProjectVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  HIDDEN = 'hidden',
}

export type ProjectSocialLinks = {
  github?: string | null;
  twitter?: string | null;
  linkedin?: string | null;
  discord?: string | null;
  website?: string | null;
};

export type ProjectFilters = {
  tags: string[];
  visibility: string[];
};

/* =============== Project File Types =============== */

export interface ProjectFile {
  id: string;
  project_id: string;
  project_version_id: string;
  parent_id: string | null;
  file_name: string;
  file_path: string;
  is_directory: boolean;
  content: string | null;
  mime_type: string | null;
  created_at: string;
  updated_at: string;

  file_type?: string | null;
  children?: ProjectFile[];
}

/**
 * @interface ProjectFileEntry
 * @description Bir proje dosyasının temel giriş bilgilerini temsil eder.
 * Genellikle bir RPC çağrısı (örneğin, yeni bir sözleşme dosyası oluşturma) sonucunda
 * veya bir dosya listesinde dosyanın sadece kimlik, yol ve ad gibi temel bilgilerine
 * ihtiyaç duyulduğunda kullanılır. `ProjectFile` tipine göre daha az detay içerir.
 *
 * @property {string} id - Dosyanın `project_files` tablosundaki benzersiz kimliği (UUID).
 * @property {string} path - Dosyanın proje içindeki tam yolu (örneğin, `/contracts/MyContract.sol`).
 * @property {string} name - Dosyanın adı (örneğin, `MyContract.sol`).
 */
export interface ProjectFileEntry {
  id: string; // uuid, primary key of the file in project_files table
  path: string; // text, full path of the file within the project (e.g., /contracts/MyContract.sol)
  name: string; // character varying(255), name of the file (e.g., MyContract.sol)
}

/**
 * @interface ProjectHierarchyItem
 * @description Bir projenin dosya ve klasör hiyerarşisindeki bir öğeyi temsil eder.
 * Genellikle dosya gezgini (file explorer) gibi UI bileşenlerinde kullanılır.
 * `ProjectFile` verilerinden türetilerek oluşturulur ve UI'da gösterim için gerekli bilgileri içerir.
 *
 * @property {string} id - Dosya veya klasörün benzersiz kimliği (`ProjectFile.id`).
 * @property {string} name - Dosya veya klasörün adı (`ProjectFile.file_name`).
 * @property {string} path - Dosya veya klasörün proje kök dizininden itibaren tam yolu (`ProjectFile.file_path`).
 * @property {'file' | 'directory'} type - Öğenin dosya mı yoksa klasör mü olduğunu belirtir (`ProjectFile.is_directory`'den türetilir).
 * @property {'evm' | 'solana' | 'stellar' | string} platform - Öğenin ait olduğu projenin platformu (örn: 'evm', 'solana', 'stellar'). Bu bilgi genellikle projenin genel ayarlarından gelir.
 * @property {string | null} file_type - Dosyanın türünü belirten daha kullanıcı dostu bir ifade (örn: 'solidity', 'javascript', 'json'). `ProjectFile.mime_type` veya dosya uzantısından türetilebilir. Klasörler için `null` olabilir.
 * @property {string | null} parent_id - Öğenin içinde bulunduğu üst klasörün kimliği. Kök dizindeki öğeler için `null` olabilir (`ProjectFile.parent_id`).
 * @property {number | null} [children_count] - Eğer öğe bir klasörse, içerdiği doğrudan alt öğe (dosya/klasör) sayısı. Hesaplanması gerekebilir.
 */
export interface ProjectHierarchyItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  platform: 'evm' | 'solana' | 'stellar' | string;
  file_type: string | null;
  parent_id: string | null;
  children_count?: number | null;
}

/**
 * @enum CompilationStatus
 * @description Bir dosyanın veya projenin derleme durumunu belirtir.
 */
export enum CompilationStatus {
  NOT_COMPILED = 'not_compiled', // Henüz derlenmemiş
  COMPILING = 'compiling', // Şu anda derleniyor
  COMPILED_SUCCESS = 'compiled_success', // Başarıyla derlendi
  COMPILED_WITH_WARNINGS = 'compiled_with_warnings', // Uyarılarla derlendi
  FAILED_COMPILATION = 'failed_compilation', // Derleme başarısız oldu
}

/**
 * @enum DeploymentStatus
 * @description Bir kontratın veya programın dağıtım (deploy) durumunu belirtir.
 */
export enum DeploymentStatus {
  NOT_DEPLOYED = 'not_deployed', // Henüz deploy edilmemiş
  DEPLOYING = 'deploying', // Şu anda deploy ediliyor
  DEPLOYED_SUCCESS = 'deployed_success', // Başarıyla deploy edildi
  FAILED_DEPLOYMENT = 'failed_deployment', // Deploy başarısız oldu
}

/**
 * @enum AuditProcessStatus
 * @description Bir kontratın veya programın denetim sürecindeki durumunu belirtir.
 * (Eğer denetim süreci hala bir özellikse ve takip ediliyorsa kullanılır.)
 */
export enum AuditProcessStatus {
  NO_AUDIT = 'no_audit', // Denetim yapılmamış/istenmemiş
  PENDING_AUDIT = 'pending_audit', // Denetim bekleniyor
  AUDIT_IN_PROGRESS = 'audit_in_progress', // Denetim devam ediyor
  AUDIT_COMPLETED_PASSED = 'audit_completed_passed', // Denetim tamamlandı (Başarılı)
  AUDIT_COMPLETED_FAILED = 'audit_completed_failed', // Denetim tamamlandı (Başarısız/Bulgular var)
  AUDIT_CANCELLED = 'audit_cancelled', // Denetim iptal edildi
}

/**
 * @interface DisplayableContractInfo
 * @description Dashboard gibi UI katmanlarında bir derlenebilir/dağıtılabilir varlığı
 * (EVM kontratı, Solana programı vb.) göstermek için kullanılan veri yapısıdır.
 * Bu bilgiler genellikle `project_files`, `project_versions` ve potansiyel bir `deployments` tablosundan türetilir.
 */
export interface DisplayableContractInfo {
  id: string; // Genellikle ana kontrat dosyasının `project_files.id`'si
  name: string; // Kontratın/Programın adı (`project_files.file_name`)
  project_id: string; // Ait olduğu projenin ID'si
  project_version_id: string; // Ait olduğu proje versiyonunun ID'si
  file_path: string; // Ana kontrat dosyasının yolu (`project_files.file_path`)
  platform: 'evm' | 'solana' | 'stellar' | string; // Projenin platformu (`projects.platform`)

  compilation_status: CompilationStatus; // Derleme durumu
  last_compiled_at?: string | null; // Son başarılı derleme zamanı

  deployment_status: DeploymentStatus; // Dağıtım durumu
  last_deployed_at?: string | null; // Son başarılı dağıtım zamanı
  deployment_id?: string | null; // Opsiyonel: Ayrı bir 'deployments' tablosuna referans

  audit_status?: AuditProcessStatus; // Denetim durumu (opsiyonel, eğer kullanılıyorsa)
  last_audit_at?: string | null; // Son denetim tamamlanma zamanı

  created_at: string; // Genellikle dosyanın oluşturulma zamanı
  updated_at: string; // Dosyanın son güncellenme zamanı
  tags?: string[] | null; // İlgili etiketler
  description?: string | null; // Kısa açıklama
}

export interface ApiResponse<T> {
  data: T | null;
  success: boolean;
  error?: string;
}

export interface ProjectFrontend {
  id: string;
  project_id: string;
  name: string; // e.g., "Main DApp", "Admin Panel"
  framework: string; // e.g., "React", "Next.js", "Vue", "Static HTML"
  deployment_url?: string;
  repository_url?: string; // Link to the frontend's code repository
  build_command?: string;
  output_directory?: string;
  created_at: string;
  updated_at: string;
}
