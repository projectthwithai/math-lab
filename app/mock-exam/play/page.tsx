import PageBackButton from '@/components/layout/PageBackButton';
import MockExamPlay from '@/components/mock-exam/MockExamPlay';

export default function MockExamPlayPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
      <PageBackButton fallbackHref="/mock-exam" />
      <MockExamPlay />
    </main>
  );
}
