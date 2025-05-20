import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ProjectsCreateView } from 'src/sections/projects/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Create a new project | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <ProjectsCreateView />;
}
