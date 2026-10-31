import { redirect } from 'next/navigation';

import { shellHref } from '@/lib/navigation/mainTabs';

export default function UnitAliasPage() {
  redirect(shellHref('patterns'));
}
