import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ProjectsDetailsView } from 'src/sections/projects/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Project details | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <ProjectsDetailsView />;
}

// ----------------------------------------------------------------------

/**
 * [1] Default
 * Remove [1] and [2] if not using [2]
 * Will remove in Next.js v15
 */
const dynamic = CONFIG.isStaticExport ? 'auto' : 'force-dynamic';
export { dynamic };

/**
 * [2] Static exports
 * https://nextjs.org/docs/app/building-your-application/deploying/static-exports
 */
export async function generateStaticParams() {
  // Artık Supabase'den dinamik olarak veri çektiğimiz için statik parametre oluşturmaya gerek yok
  return [];
}
