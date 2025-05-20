import type { Metadata } from 'next';

import { HomeView } from 'src/sections/home/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'ChainLab - Online Web3 IDE',
  description:
    'ChainLab is a browser-based online Web3 IDE that allows users to write, deploy, and run smart contracts on all blockchains.',
};

export default function Page() {
  return <HomeView />;
}
