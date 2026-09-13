'use client';

// ==========================================
// Apex Suite: Math Lab - Apexガイド壁打ちチャット
// ==========================================
// 別解の論理飛躍・反例を Gemini が検証する。失敗時のみ短いローカル応答。

import { useState } from 'react';
import { Loader2, Send, Bot, User } from 'lucide-react';
import type { GeneratedProblem } from '@/types/mathLab';
import { requestSolutionChatReply } from '@/lib/api/chatSolutionClient';
import { buildChatSolutionMockReply } from '@/lib/mock/chatSolutionMock';
import KaTeXText from '@/components/workspace/KaTeXText';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

interface AISolutionChatProps {
  problem: GeneratedProblem;
}

export default function AISolutionChat({ problem }: AISolutionChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'ai',
      content: '別解や途中の方針を書いてください。論理の飛躍や反例がないかを一緒に検証します。',
    },
  ]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    const trimmed = draft.trim();
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
      reply = await requestSolutionChatReply({
        message: trimmed,
        problem,
        history,
      });
    } catch (error) {
      console.error('[AISolutionChat] Gemini 応答に失敗したためローカル助言を使います', error);
      reply = buildChatSolutionMockReply(trimmed, problem);
    }

    setMessages((prev) => [
      ...prev,
      { id: `a-${Date.now()}`, role: 'ai', content: reply },
    ]);
    setIsSending(false);
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950/60">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                message.role === 'ai'
                  ? 'bg-cyan-400/15 text-cyan-300'
                  : 'bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {message.role === 'ai' ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
            </span>
            <div
              className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                message.role === 'ai'
                  ? 'bg-slate-200 text-slate-800 dark:bg-slate-800/80 dark:text-slate-200'
                  : 'bg-cyan-400/10 text-cyan-100'
              }`}
            >
              <KaTeXText text={message.content} />
            </div>
          </div>
        ))}
        {isSending && (
          <p className="flex items-center gap-1.5 text-[11px] text-cyan-300">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            別解の論理を検証しています...
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
          placeholder="この別解でも解ける？ 途中方針を書いて検証してもらおう"
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={isSending}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-400/40 bg-cyan-400/10 text-cyan-300 transition-colors hover:bg-cyan-400/20 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
