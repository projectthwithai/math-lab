import { redirect } from 'next/navigation';

import { shellHref } from '@/lib/navigation/mainTabs';

export default function UnitsPage() {
  redirect(shellHref('patterns'));
}
