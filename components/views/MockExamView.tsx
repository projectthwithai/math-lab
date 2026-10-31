'use client';

// ==========================================
// Apex Suite: Math Lab - 模試（常駐タブ）
// ==========================================

import { memo } from 'react';

import { useMainTab } from '@/components/layout/MainTabProvider';
import PageBackButton from '@/components/layout/PageBackButton';
import MockExamSetup from '@/components/mock-exam/MockExamSetup';

function MockExamView() {
  const { setActiveTab } = useMainTab();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
      <PageBackButton onBack={() => setActiveTab('patterns')} />
      <h1 className="mb-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
        全国統一 AI実践模試
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        範囲・時間・問題数を選んで、共通テスト型のタイマー模試を開始します。
      </p>
      <MockExamSetup />
    </main>
  );
}

export default memo(MockExamView);
