import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { OverviewLabsView } from 'src/sections/overview/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <OverviewLabsView />;
}
