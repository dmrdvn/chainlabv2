import { IdeLayout } from 'src/layouts/ide';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return <IdeLayout>{children}</IdeLayout>;
}
