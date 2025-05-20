export interface FrontendDeployment {
  id: string;
  frontend_id: string | null;
  provider: 'vercel' | 'netlify' | 'ipfs' | 'arweave' | null;
  url: string | null;
  deployed_by: string | null;
  deployed_at: string | null;
}
