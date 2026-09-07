// ==========================================
// Apex Suite: Math Lab - 全国統一 AI実践模試
// ==========================================

import PageBackButton from '@/components/layout/PageBackButton';
import MockExamSetup from '@/components/mock-exam/MockExamSetup';

export default function MockExamPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
      <PageBackButton fallbackHref="/units" />
      <h1 className="mb-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
        全国統一 AI実践模試
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        範囲・時間・問題数を選んで、共通テスト型のタイマー模試を開始します。生成はローカルエンジン（追加APIコストなし）です。
      </p>
      <MockExamSetup />
    </main>
  );
}
