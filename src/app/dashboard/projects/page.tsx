import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ProjectsListView } from 'src/sections/projects/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Projects | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <ProjectsListView />;
}
