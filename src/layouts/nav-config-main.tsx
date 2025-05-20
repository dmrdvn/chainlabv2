import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

import { Iconify } from 'src/components/iconify';

import type { NavMainProps } from './main/nav/types';

// ----------------------------------------------------------------------

export const navData: NavMainProps['data'] = [
  { title: 'Home', path: '/', icon: <Iconify width={22} icon="solar:home-2-bold-duotone" /> },
  {
    title: 'About',
    path: '#about',
    icon: <Iconify width={22} icon="solar:atom-bold-duotone" />,
  },
  {
    title: 'Features',
    path: '#features',
    icon: <Iconify width={22} icon="solar:file-bold-duotone" />,
  },
  {
    title: 'Pricing',
    icon: <Iconify width={22} icon="solar:notebook-bold-duotone" />,
    path: '#pricing',
  },
  {
    title: 'Testimonials',
    icon: <Iconify width={22} icon="solar:notebook-bold-duotone" />,
    path: '#testimonials',
  },
  {
    title: 'FAQs',
    icon: <Iconify width={22} icon="solar:notebook-bold-duotone" />,
    path: '#faqs',
  },
];
