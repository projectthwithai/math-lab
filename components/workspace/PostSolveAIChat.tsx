'use client';

// ==========================================
// Apex Suite: Math Lab - 解答後コンテキスト把握型AI質問チャット
// ==========================================
// 採点モーダル内で、問題・生徒の解答・公式解説・自分流メモを踏まえて質問できる。

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, ChevronDown, Loader2, MessageCircle, Send, User } from 'lucide-react';

import { requestSolutionTutorReply } from '@/lib/api/askSolutionTutorClient';
import { buildAskSolutionTutorMockReply } from '@/lib/mock/askSolutionTutorMock';
import KaTeXText from '@/components/workspace/KaTeXText';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

interface PostSolveAIChatProps {
  questionText: string;
  userAnswer: string;
  correctAnswer: string | number;
  stepByStep: string[];
  customNote?: string;
  userEmail?: string | null;
  onMemoReviewed?: (feedback: string) => void;
}

const QUICK_QUESTIONS = ['この変形がわからない', '別解はある？', 'もっと分かりやすく'] as const;
export const MEMO_REVIEW_QUESTION = '📝 私の解法メモ、この考え方で合ってる？';

export default function PostSolveAIChat({
  questionText,
  userAnswer,
  correctAnswer,
  stepByStep,
  customNote = '',
  userEmail,
  onMemoReviewed,
}: PostSolveAIChatProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'ai',
      content:
        '解説のどの行でも聞いてください。問題文・あなたの答え・公式解説・自分流メモを踏まえて、かみ砕いて説明します。',
    },
  ]);

  const hasCustomNote = customNote.trim().length > 0;
  const context = useMemo(
    () => ({
      questionText,
      userAnswer,
      correctAnswer,
      stepByStep,
      customNote,
    }),
    [questionText, userAnswer, correctAnswer, stepByStep, customNote]
  );

  const handleSend = async (preset?: string) => {
    const trimmed = (preset ?? draft).trim();
    if (!trimmed || isSending) return;

    const userMessage: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: trimmed };
    setDraft('');
    setIsSending(true);
    setMessages((prev) => [...prev, userMessage]);

    const history = [...messages, userMessage]
      .filter((item) => item.id !== 'welcome')
      .map((item) => ({ role: item.role, content: item.content }));

    let reply: string;
    try {
      reply = await requestSolutionTutorReply({
        ...context,
        userQuestion: trimmed,
        history,
        userEmail,
      });
    } catch (error) {
      console.error('[PostSolveAIChat] チューター応答に失敗したためローカル助言を使います', error);
      reply = buildAskSolutionTutorMockReply({
        ...context,
        userQuestion: trimmed,
        correctAnswer: String(context.correctAnswer),
      });
    }

    setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'ai', content: reply }]);
    if (trimmed === MEMO_REVIEW_QUESTION || trimmed.includes('解法メモ')) {
      onMemoReviewed?.(reply);
    }
    setIsSending(false);
  };

  return (
    <div className="mb-5 overflow-hidden rounded-2xl border border-cyan-400/25 bg-cyan-400/5">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 text-sm font-bold text-cyan-700 dark:text-cyan-200">
          <MessageCircle className="h-4 w-4 text-cyan-400" />
          💬 この解説についてAIに質問する
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-cyan-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-cyan-400/15"
          >
            <div className="flex flex-col gap-3 p-4">
              <div className="flex flex-wrap gap-2">
                {QUICK_QUESTIONS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    disabled={isSending}
                    onClick={() => void handleSend(chip)}
                    className="rounded-full border border-cyan-400/40 bg-white/80 px-3 py-1 text-[11px] font-semibold text-cyan-700 transition hover:bg-cyan-400/15 disabled:opacity-50 dark:bg-slate-950/70 dark:text-cyan-200"
                  >
                    {chip}
                  </button>
                ))}
                {hasCustomNote && (
                  <button
                    type="button"
                    disabled={isSending}
                    onClick={() => void handleSend(MEMO_REVIEW_QUESTION)}
                    className="rounded-full border border-fuchsia-400/50 bg-fuchsia-400/10 px-3 py-1 text-[11px] font-semibold text-fuchsia-700 transition hover:bg-fuchsia-400/20 disabled:opacity-50 dark:text-fuchsia-200"
                  >
                    {MEMO_REVIEW_QUESTION}
                  </button>
                )}
              </div>

              <div className="max-h-56 space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950/60">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        message.role === 'ai'
                          ? 'bg-cyan-400/15 text-cyan-300'
                          : 'bg-slate-700 text-slate-200'
                      }`}
                    >
                      {message.role === 'ai' ? (
                        <Bot className="h-3.5 w-3.5" />
                      ) : (
                        <User className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <div
                      className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                        message.role === 'ai'
                          ? 'bg-slate-100 text-slate-800 dark:bg-slate-800/80 dark:text-slate-200'
                          : 'bg-cyan-400/15 text-cyan-800 dark:text-cyan-100'
                      }`}
                    >
                      <KaTeXText text={message.content} />
                    </div>
                  </div>
                ))}
                {isSending && (
                  <p className="flex items-center gap-1.5 text-[11px] text-cyan-500 dark:text-cyan-300">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    専属チューターが解説とメモを踏まえて考えています...
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') void handleSend();
                  }}
                  disabled={isSending}
                  placeholder="この行の変形がわからない、など自由に質問"
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={isSending}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-400/40 bg-cyan-400/10 text-cyan-300 transition-colors hover:bg-cyan-400/20 disabled:opacity-40"
                  aria-label="質問を送信"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
