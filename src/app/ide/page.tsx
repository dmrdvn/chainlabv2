import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import ContractEditorView from 'src/sections/contract-editor/view/contract-editor-view';
// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Editor | Dashboard - ${CONFIG.appName}` };

export default async function Page() {
  return <ContractEditorView />;
}
