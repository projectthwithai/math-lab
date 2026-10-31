import { redirect } from 'next/navigation';

import { shellHref } from '@/lib/navigation/mainTabs';

export default function MockExamPage() {
  redirect(shellHref('mock'));
}
