import type { FrontendDeployment } from './frontend-deployment';

export interface Frontend {
  id: string;
  project_id: string | null;
  name: string;
  framework: 'react' | 'nextjs' | 'vanilla';
  status: 'draft' | 'published' | 'error' | 'archived';
  logo_url?: string | null;
  can_edit?: boolean;
  can_deploy?: boolean;
  created_at: string | null;
  updated_at: string | null;
  frontend_deployments?: FrontendDeployment | FrontendDeployment[];
}
