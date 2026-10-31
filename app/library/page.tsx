import { redirect } from 'next/navigation';

import { firstQueryValue } from '@/lib/engine/queryParam';
import { shellHref } from '@/lib/navigation/mainTabs';

export default async function LibraryPage(props: PageProps<'/library'>) {
  const searchParams = await props.searchParams;
  const libraryView = firstQueryValue(searchParams.view) === 'files' ? 'files' : 'history';
  redirect(shellHref('library', { libraryView }));
}
