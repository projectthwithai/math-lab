'use client';

// ==========================================
// Apex Suite: Math Lab - ファイルに追加モーダル
// ==========================================
// カスタム問題ファイル（プレイリスト）へ問題スナップショットを追加する。

import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Check, FolderPlus, Plus, X } from 'lucide-react';

import type { GeneratedProblem } from '@/types/mathLab';
import { nextCustomFileTitle, useUserStore } from '@/lib/store/userStore';
import { useAppToastStore } from '@/lib/store/appToastStore';

interface AddToFileModalProps {
  problem: GeneratedProblem;
  onClose: () => void;
}

export default function AddToFileModal({ problem, onClose }: AddToFileModalProps) {
  const customFiles = useUserStore((state) => state.customFiles);
  const createCustomFile = useUserStore((state) => state.createCustomFile);
  const addProblemToFile = useUserStore((state) => state.addProblemToFile);
  const showToast = useAppToastStore((state) => state.showToast);

  const defaultTitle = useMemo(() => nextCustomFileTitle(customFiles), [customFiles]);
  const [newTitle, setNewTitle] = useState(defaultTitle);

  const addToFile = (fileId: string) => {
    const file = useUserStore.getState().customFiles.find((item) => item.id === fileId);
    if (!file) return;
    const added = addProblemToFile(fileId, problem);
    showToast(added ? `「${file.title}」に問題を追加しました` : `「${file.title}」にはすでに入っています`);
    onClose();
  };

  const handleCreateAndAdd = () => {
    const fileId = createCustomFile(newTitle);
    const file = useUserStore.getState().customFiles.find((item) => item.id === fileId);
    addProblemToFile(fileId, problem);
    showToast(`「${file?.title ?? (newTitle.trim() || defaultTitle)}」に問題を追加しました`);
    onClose();
  };

  const dialog = (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative max-h-[88vh] w-full max-w-md overflow-y-auto rounded-2xl surface-panel p-5 shadow-xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1.5 text-zinc-400 transition-colors hover:text-zinc-100"
          aria-label="閉じる"
        >
          <X className="h-5 w-5" />
        </button>

        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-300">
          <FolderPlus className="h-3.5 w-3.5" />
          Custom File
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">ファイルに追加</h2>
        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{problem.title}</p>

        <form
          className="mt-4 rounded-xl surface-card p-3"
          onSubmit={(event) => {
            event.preventDefault();
            handleCreateAndAdd();
          }}
        >
          <label className="text-[11px] font-semibold text-slate-500">新規ファイルを作成して追加</label>
          <div className="mt-2 flex gap-2">
            <input
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder={defaultTitle}
              className="min-w-0 flex-1 rounded-lg surface-input px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none dark:text-white"
            />
            <button
              type="submit"
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-cyan-400/50 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-800 dark:text-cyan-100"
            >
              <Plus className="h-3.5 w-3.5" />
              作成
            </button>
          </div>
        </form>

        <ul className="mt-4 flex flex-col gap-2">
          {customFiles.length === 0 ? (
            <li className="rounded-xl border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-500 dark:border-slate-700">
              まだファイルがありません。上から新規作成できます。
            </li>
          ) : (
            customFiles.map((file) => {
              const alreadyIn = file.problems.some((item) => item.id === problem.id);
              return (
                <li key={file.id}>
                  <button
                    type="button"
                    onClick={() => addToFile(file.id)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl surface-card px-3 py-3 text-left transition hover:border-cyan-400/50"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-slate-900 dark:text-white">{file.title}</span>
                      <span className="mt-0.5 block text-[11px] text-slate-500">{file.problems.length}問</span>
                    </span>
                    {alreadyIn ? (
                      <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                    ) : (
                      <Plus className="h-4 w-4 shrink-0 text-cyan-400" />
                    )}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </motion.div>
    </div>
  );

  if (typeof document === 'undefined') return dialog;
  return createPortal(dialog, document.body);
}
