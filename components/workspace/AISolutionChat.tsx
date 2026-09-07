'use client';

// ==========================================
// Apex Suite: Math Lab - Apexガイド壁打ちチャット
// ==========================================
// 「この別解でも解ける？」に対して、ヒューリスティックなモック応答を返す
// マイクロチャット。APIコストは発生しない（.cursorrules準拠）。

import { useState } from 'react';
import { Send, Bot, User } from 'lucide-react';
import type { GeneratedProblem } from '@/types/mathLab';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

interface AISolutionChatProps {
  problem: GeneratedProblem;
}

function buildMockAiReply(userMessage: string, problem: GeneratedProblem): string {
  const message = userMessage.toLowerCase();

  if (message.includes('別解') || message.includes('他の解き方') || message.includes('違う方法')) {
    return (
      'その別解でも多くの場合は通用するよ！ただし、この問題では ' +
      `${problem.explanation.commonMistakes || '定義域や符号の条件'} に気をつけて。` +
      '答えが同じになるか、最後に必ず検算してみよう。'
    );
  }
  if (message.includes('公式') || message.includes('formula')) {
    return `この問題のキーとなる公式は「${problem.explanation.keyFormula}」だよ。まずこれを式に当てはめてみよう。`;
  }
  if (message.includes('わからない') || message.includes('ヒント') || message.includes('分からない')) {
    return `ヒント: ${problem.hints[0]}`;
  }
  if (message.includes('なぜ') || message.includes('理由')) {
    return 'その通り進めてOK！途中式を1行ずつ確認しながら、なぜその変形が許されるのかを言葉で説明できるようにしておくと本番でも強い。';
  }

  return (
    'いいアプローチだね！その方向で進めても大丈夫そうだよ。' +
    '途中で計算が合わなくなったら、まず符号と定義域の条件を確認してみて。'
  );
}

export default function AISolutionChat({ problem }: AISolutionChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'ai',
      content: '別解を試したい・進め方に自信がないときはここで壁打ちしてみよう。（ゼロコストのモック応答です）',
    },
  ]);
  const [draft, setDraft] = useState('');

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: trimmed };
    const aiMessage: ChatMessage = {
      id: `a-${Date.now()}`,
      role: 'ai',
      content: buildMockAiReply(trimmed, problem),
    };

    setMessages((prev) => [...prev, userMessage, aiMessage]);
    setDraft('');
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 p-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                message.role === 'ai' ? 'bg-cyan-400/15 text-cyan-300' : 'bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {message.role === 'ai' ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
            </span>
            <p
              className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                message.role === 'ai'
                  ? 'bg-slate-200 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                  : 'bg-cyan-400/10 text-cyan-100'
              }`}
            >
              {message.content}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleSend();
          }}
          placeholder="この別解でも解ける？ など気軽に聞いてみよう"
          className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleSend}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-400/40 bg-cyan-400/10 text-cyan-300 transition-colors hover:bg-cyan-400/20"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
