import { redirect } from 'next/navigation';

import { firstQueryValue } from '@/lib/engine/queryParam';
import { shellHref } from '@/lib/navigation/mainTabs';

export default async function PatternsPage(props: PageProps<'/patterns'>) {
  const searchParams = await props.searchParams;
  if (firstQueryValue(searchParams.view) === 'armory') {
    redirect(shellHref('armory'));
  }
  redirect(shellHref('patterns'));
}
