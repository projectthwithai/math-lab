// FORCE UPDATE: 2026-07-20-11:00
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
// @ts-ignore
import katex from 'katex';
import 'katex/dist/katex.min.css';

// react-katexに依存せず、katex本体から直接HTMLを生成するカスタムコンポーネント
const InlineMath = ({ math }: { math: string }) => {
  try {
    const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  } catch (error) {
    return <span>{math}</span>;
  }
};

const BlockMath = ({ math }: { math: string }) => {
  try {
    const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  } catch (error) {
    return <div>{math}</div>;
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SUPABASE LAYER (GBH互換)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import {
  getSupabase,
  isSupabaseConfigured,
  onAuthStateChange,
  fetchAllData,
  upsertData,
  signInWithGoogle,
} from "../lib/supabase";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// THEME (Black & Gold / White & Gold 継承)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const THEMES = {
  dark: {
    name: "Black & Gold",
    bg: "#050505", bg2: "#0A0A0A", bg3: "#111",
    surface: "#0d0d0d", surfaceHover: "#131313",
    border: "#2a2a2a", borderGold: "#8A683066",
    text: "#F0EAD8", textDim: "#C8C0B0", textMuted: "#888",
    gold: "#C9A84C", goldLight: "#F0D878", goldDark: "#8A6830",
    inputBg: "#0f0f0f", scrollThumb: "#8A6830",
    gridLine: "#C9A84C07",
  },
  light: {
    name: "White & Gold",
    bg: "#F5F0E8", bg2: "#FFFFFF", bg3: "#F0EBE0",
    surface: "#FFFFFF", surfaceHover: "#F8F4ED",
    border: "#E0D8C8", borderGold: "#C9A84C55",
    text: "#1A1208", textDim: "#6B5A30", textMuted: "#B0A080",
    gold: "#B8922A", goldLight: "#D4A83A", goldDark: "#8A6820",
    inputBg: "#F8F4ED", scrollThumb: "#C9A84C",
    gridLine: "#B8922A07",
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// i18n
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const DICT = {
  en: {
    tagline: "RIGOR · INQUIRY · EXCELLENCE",
    greeting_morning: "Good Morning", greeting_afternoon: "Good Afternoon", greeting_evening: "Good Evening",
    settings: "Settings", lang_label: "Language", theme_label: "Theme",
    username_label: "Your Name", username_placeholder: "e.g. Isaac",
    save_settings: "Save Settings",
    export_btn: "↓ Export Hub", import_btn: "↑ Import Hub",
    footer: "Math Lab Engine v2.0 · Built for Thinkers · 2026",
    topic_label: "Theoretical Topic",
    btn_single: "Generate Single",
    btn_practice_10: "🚀 10 Practice Set",
    placeholder_topic: "e.g., Physics (Incline Motion), Quadratic Functions",
    header_steps: "Step-by-Step Solution Debugger",
    helper_latex: "Type using standard mathematical steps. Split steps by newlines.",
    placeholder_textarea: "y = 2x^2 - 4x + 5\ny = 2(x^2 - 2x) + 5\ny = 2(x - 1)^2 + 3",
    final_answer: "Final Answer (Value & Unit)",
    btn_evaluate: "Debug Process",
    debugger_evaluating: "Analyzing logic with RIGOR...",
    overall_advice: "Core Guidance / Overall Feedback",
    no_problems: "No problems active. Choose a topic and generate above.",
    prev_prob: "◀ Previous", next_prob: "Next ▶",
    preset_title: "Quick Select Presets",
    sidebar_title: "Math Lab",
    sidebar_subtitle: "Logical Sandbox",
    stat_total: "Solved",
    stat_accuracy: "Accuracy",
    stat_streak: "Streak",
  },
  ja: {
    tagline: "厳密 · 探究 · 卓越",
    greeting_morning: "おはようございます", greeting_afternoon: "こんにちは", greeting_evening: "こんばんは",
    settings: "設定", lang_label: "言語", theme_label: "テーマ",
    username_label: "お名前", username_placeholder: "例：アイザック",
    save_settings: "設定を保存",
    export_btn: "↓ エクスポート", import_btn: "↑ インポート",
    footer: "Math Lab Engine v2.0 · 深き探究者のために · 2026",
    topic_label: "演習単元・トピック",
    btn_single: "単問生成",
    btn_practice_10: "🚀 類題10問連続演習",
    placeholder_topic: "例: 物理（斜面上の運動）, 二次関数の最大・最小",
    header_steps: "ステップ解答プロセス・デバッガー",
    helper_latex: "改行(Enter)ごとに式変形の論理ステップが自動で分解され、AIがデバッグします。",
    placeholder_textarea: "y = 2x^2 - 4x + 5\ny = 2(x^2 - 2x) + 5\ny = 2(x - 1)^2 + 3",
    final_answer: "最終解答（数値・単位）",
    btn_evaluate: "解答プロセスを添削する",
    debugger_evaluating: "論理の厳密性を検証中...",
    overall_advice: "総合指導アドバイス・方針",
    no_problems: "演習問題がありません。上の入力欄からトピックを指定して生成してください。",
    prev_prob: "◀ 前の問題", next_prob: "次の問題 ▶",
    preset_title: "推奨プリセット単元",
    sidebar_title: "Math Lab",
    sidebar_subtitle: "論理演算サンドボックス",
    stat_total: "解いた総数",
    stat_accuracy: "正答率",
    stat_streak: "連続日数",
  }
};

const QUOTES_EN = [
  "Mathematics is the language in which God has written the universe.",
  "In physics, you don't have to explain, you just have to discover.",
  "Rigor before intuition, but never without beauty.",
  "Truth is ever to be found in simplicity, and not in the multiplicity and confusion of things."
];
const QUOTES_JA = [
  "数学は、宇宙が書かれた神の言語である。",
  "物理とは説明することではなく、発見することだ。",
  "直感の前に厳密さを。しかし、美しさを忘れてはならない。",
  "真理は常に単純さの中にあり、混沌や複雑さの中にはない。"
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STORAGE SYSTEM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
type LSApi = {
  get: <T,>(k: string, fb: T) => T;
  set: (k: string, v: unknown) => void;
};
const LS: LSApi = {
  get: <T,>(k: string, fb: T) => {
    try {
      const v = localStorage.getItem(k);
      return v ? (JSON.parse(v) as T) : fb;
    } catch { return fb; }
  },
  set: (k: string, v: unknown) => {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPE DEFINITIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
interface ProblemParams {
  theta?: number;
  m?: number;
  mu?: number;
  a?: number;
  p?: number;
  q?: number;
}

interface Problem {
  id: string;
  title: string;
  text: string;
  params: ProblemParams;
  correct_steps: string[];
  correct_answer: string;
}

interface StepEvaluation {
  step_index: number;
  formula: string;
  is_correct: boolean;
  feedback: string;
}

interface EvaluationResult {
  steps: StepEvaluation[];
  overall_feedback: string;
  is_fully_correct: boolean;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SSR Hydration Safe LaTeX Renderer Component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const LatexRenderer: React.FC<{ text: string; mounted: boolean }> = ({ text, mounted }) => {
  if (!text) return null;
  if (!mounted) {
    return <span className="font-mono text-xs opacity-75">{text}</span>;
  }

  // $ と $$ で文章をスプリットし、数式と通常テキストを切り分ける
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$.*?\$)/g);

  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith("$$") && part.endsWith("$$")) {
          const formula = part.slice(2, -2);
          return <BlockMath key={i} math={formula} />;
        } else if (part.startsWith("$") && part.endsWith("$")) {
          const formula = part.slice(1, -1);
          return <InlineMath key={i} math={formula} />;
        }
        return <span key={i} className="whitespace-pre-wrap">{part}</span>;
      })}
    </span>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SCIENCE VISUALIZER (SVG - 物理/数学の動的対応)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const ScienceVisualizer: React.FC<{ params: ProblemParams }> = ({ params }) => {
  const width = 320;
  const height = 180;
  const margin = 20;

  // 1) 物理: 斜面パラメーターが存在する場合の描画
  if (params?.theta !== undefined && params?.theta > 0) {
    const theta = params.theta;
    const m = params.m ?? 5;
    const rad = (theta * Math.PI) / 180;
    const slopeLength = 240;
    const x1 = margin;
    const y1 = height - margin;
    const x2 = margin + slopeLength * Math.cos(rad);
    const y2 = height - margin - slopeLength * Math.sin(rad);

    const boxWidth = Math.min(30 + m * 2, 60);
    const boxHeight = Math.min(20 + m * 1.5, 40);
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    return (
      <div className="flex flex-col items-center p-4 bg-black/40 rounded-xl border border-amber-500/20 shadow-inner">
        <span className="text-[10px] text-amber-500/60 mb-2 font-mono tracking-widest">DYNAMIC PHYSICS VISUALIZER (θ: {theta}°, m: {m}kg)</span>
        <svg width={width} height={height} className="overflow-visible">
          <line x1={0} y1={y1} x2={width} y2={y1} stroke="#555" strokeWidth="1" strokeDasharray="4 4" />
          <polygon points={`${x1},${y1} ${x2},${y1} ${x2},${y2}`} fill="rgba(201, 168, 76, 0.05)" stroke="#C9A84C" strokeWidth="2" />
          <path d={`M ${x1 + 30} ${y1} A 30 30 0 0 0 ${x1 + 30 * Math.cos(rad)} ${y1 - 30 * Math.sin(rad)}`} fill="none" stroke="#F0D878" strokeWidth="1.5" />
          <text x={x1 + 35} y={y1 - 8} fill="#F0D878" className="text-xs font-mono">{theta}°</text>
          <g transform={`translate(${midX}, ${midY}) rotate(${-theta})`}>
            <rect x={-boxWidth / 2} y={-boxHeight} width={boxWidth} height={boxHeight} fill="#0d0d0d" stroke="#F0D878" strokeWidth="2" rx="1" />
            <line x1={0} y1={-boxHeight / 2} x2={0} y2={30 + m} stroke="#FF7777" strokeWidth="1.5" markerEnd="url(#arrow)" />
            <text x={5} y={20 + m} fill="#FF7777" className="text-[10px] font-mono">mg</text>
          </g>
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#FF7777" />
            </marker>
          </defs>
        </svg>
      </div>
    );
  }

  // 2) 数学: 二次関数パラメーターが存在する場合の描画 (y = a*(x-p)^2 + q)
  if (params?.a !== undefined) {
    const { a = 0.5, p = 0, q = 0 } = params;

    const scaleX = 20; 
    const scaleY = 15;
    const originX = 160;
    const originY = 100;

    const points: string[] = [];
    for (let sx = -6; sx <= 6; sx += 0.25) {
      const sy = a * Math.pow(sx - p, 2) + q;
      const svgX = originX + sx * scaleX;
      const svgY = originY - sy * scaleY;
      if (svgX >= 0 && svgX <= width && svgY >= 0 && svgY <= height) {
        points.push(`${svgX},${svgY}`);
      }
    }
    const polylinePath = points.join(" ");

    return (
      <div className="flex flex-col items-center p-4 bg-black/40 rounded-xl border border-amber-500/20 shadow-inner">
        <span className="text-[10px] text-amber-500/60 mb-2 font-mono tracking-widest">
          DYNAMIC FUNCTION VISUALIZER (y = {a}(x - {p})² + {q})
        </span>
        <svg width={width} height={height} className="overflow-visible">
          <line x1={0} y1={originY} x2={width} y2={originY} stroke="#333" strokeWidth="1" />
          <line x1={originX} y1={0} x2={originX} y2={height} stroke="#333" strokeWidth="1" />
          <text x={width - 15} y={originY - 5} fill="#666" className="text-[10px] font-mono">x</text>
          <text x={originX + 5} y={15} fill="#666" className="text-[10px] font-mono">y</text>

          <circle cx={originX + p * scaleX} cy={originY - q * scaleY} r="4" fill="#F0D878" />
          <text x={originX + p * scaleX + 6} y={originY - q * scaleY - 6} fill="#F0D878" className="text-[10px] font-mono">
            ({p}, {q})
          </text>

          {points.length > 1 && (
            <polyline points={polylinePath} fill="none" stroke="#C9A84C" strokeWidth="2.5" />
          )}
        </svg>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 h-[180px] bg-black/40 rounded-xl border border-dashed border-amber-500/10">
      <span className="text-[10px] text-slate-600 font-mono">MATH LAB LABELS VISUALIZER READY</span>
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SETTINGS PANEL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function SettingsPanel({ open, onClose, lang, setLang, themeName, setTheme, userName, setUserName, t, TH, user }: any) {
  const [name, setName] = useState(userName);
  useEffect(() => { setName(userName); }, [userName]);
  const save = () => {
    setUserName(name);
    localStorage.setItem("apx7_uname", name);
    onClose();
  };

  return (
    <>
      {open && <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", backdropFilter: "blur(4px)", zIndex: 1500 }} />}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: "min(400px,95vw)",
        background: TH.surface, borderLeft: `1px solid ${TH.goldDark}55`, zIndex: 1600,
        transform: open ? "translateX(0)" : "translateX(100%)", transition: "transform .38s",
        display: "flex", flexDirection: "column", overflowY: "auto"
      }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${TH.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 12, color: TH.gold, textTransform: "uppercase" }}>{t.settings}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: TH.textMuted, fontSize: 20, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ padding: "22px", display: "flex", flexDirection: "column", gap: 22 }}>
          <div>
            <label style={{ fontSize: 11, color: TH.textMuted, textTransform: "uppercase", display: "block", marginBottom: 10 }}>Account</label>
            {user ? (
              <div style={{ padding: 12, background: `${TH.gold}0a`, border: `1px solid ${TH.goldDark}55`, borderRadius: 3 }}>
                <p style={{ fontSize: 13, color: TH.text }}>{user.email}</p>
                <button onClick={() => getSupabase().auth.signOut()} style={{ marginTop: 8, fontSize: 10, background: "transparent", border: `1px solid ${TH.border}`, color: TH.textMuted, cursor: "pointer", padding: "4px 8px" }}>Sign Out</button>
              </div>
            ) : (
              <button onClick={signInWithGoogle} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", padding: 12, background: "#fff", border: `1px solid ${TH.border}`, color: "#333", borderRadius: 4, cursor: "pointer" }}>
                <img src="https://www.google.com/favicon.ico" style={{ width: 16 }} alt="" /> Continue with Google
              </button>
            )}
          </div>
          <div>
            <label style={{ fontSize: 11, color: TH.textMuted, textTransform: "uppercase", display: "block", marginBottom: 10 }}>{t.username_label}</label>
            <input value={name} onChange={e => setName(e.target.value)} style={{ width: "100%", background: TH.inputBg, border: `1px solid ${TH.border}`, color: TH.text, padding: 10 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: TH.textMuted, textTransform: "uppercase", display: "block", marginBottom: 10 }}>{t.lang_label}</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["en", "ja"].map(l => (
                <button key={l} onClick={() => setLang(l)} style={{ flex: 1, padding: 8, background: lang === l ? `${TH.gold}22` : "transparent", border: `1px solid ${lang === l ? TH.gold : TH.border}`, color: lang === l ? TH.gold : TH.textDim, cursor: "pointer" }}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, color: TH.textMuted, textTransform: "uppercase", display: "block", marginBottom: 10 }}>{t.theme_label}</label>
            <div style={{ display: "flex", gap: 8 }}>
              {(Object.keys(THEMES) as Array<keyof typeof THEMES>).map((th) => (
                <button key={th} onClick={() => setTheme(th)} style={{ flex: 1, padding: 8, background: themeName === th ? `${THEMES[th].gold}22` : "transparent", border: `1px solid ${themeName === th ? THEMES[th].gold : THEMES[th].border}`, color: themeName === th ? THEMES[th].gold : THEMES[th].textDim, cursor: "pointer" }}>
                  {THEMES[th].name}
                </button>
              ))}
            </div>
          </div>
          <button onClick={save} style={{ background: TH.goldDark, color: TH.goldLight, padding: 13, border: "none", borderRadius: 2, cursor: "pointer", letterSpacing: 4 }}>
            {t.save_settings}
          </button>
        </div>
      </div>
    </>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN WORKSPACE COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function Dashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [syncStatus, setSyncStatus] = useState("idle");
  const [mounted, setMounted] = useState(false);
  const syncTimerRef = useRef<any>(null);

  const user: User | null = session?.user ?? null;
  const isOnline = !!user && isSupabaseConfigured();

  const showSync = useCallback((status: string) => {
    setSyncStatus(status);
    clearTimeout(syncTimerRef.current);
    if (status === "saved" || status === "error") {
      syncTimerRef.current = setTimeout(() => setSyncStatus("idle"), 2500);
    }
  }, []);

  // Hydration protection
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auth Listener
  useEffect(() => {
    const checkSession = async () => {
      const sb = getSupabase();
      if (sb) {
        const { data: { session } } = await sb.auth.getSession();
        setSession(session);
      }
    };
    checkSession();
    const unsub = onAuthStateChange(sess => setSession(sess));
    return unsub;
  }, []);

  // Cloud Save Helper
  const cloudSave = useCallback(async (key: string, value: unknown) => {
    if (!isOnline) return;
    try {
      showSync("syncing");
      await upsertData(user!.id, key, value);
      showSync("saved");
    } catch (e) {
      console.error("Sync error:", e);
      showSync("error");
    }
  }, [isOnline, user, showSync]);

  // States
  const [lang, setLangRaw] = useState(() => LS.get("apx7_lang", "ja"));
  const [themeName, setThemeRaw] = useState<keyof typeof THEMES>(() => LS.get("apx7_theme", "dark"));
  const [userName, setUserName] = useState(() => LS.get("apx7_uname", ""));

  const setLang = (v: any) => {
    const n = typeof v === "function" ? v(lang) : v;
    setLangRaw(n);
    if (!isOnline) LS.set("apx7_lang", n);
  };
  const setTheme = (v: any) => {
    const n = typeof v === "function" ? v(themeName) : v;
    setThemeRaw(n);
    if (!isOnline) LS.set("apx7_theme", n);
  };

  const TH = THEMES[themeName] || THEMES.dark;
  const t = DICT[lang as keyof typeof DICT] || DICT.en;
  const QUOTES = lang === "ja" ? QUOTES_JA : QUOTES_EN;

  // ── Math Lab Core States ──────────────────────────────────
  const [topic, setTopic] = useState("物理（斜面上の物体の運動）");
  const [problems, setProblems] = useState<Problem[]>(() => LS.get("math_problems", []));
  const [currentIndex, setCurrentIndex] = useState(() => LS.get("math_current_index", 0));
  
  // 計算過程は textarea で一括管理
  const [solutionText, setSolutionText] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  
  // 学習実績用簡易統計
  const [totalSolved, setTotalSolved] = useState(() => LS.get("math_total_solved", 0));
  const [accuracy, setAccuracy] = useState(() => LS.get("math_accuracy", 100));

  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [settingsOpen, setSettings] = useState(false);
  const [time, setTime] = useState(new Date());
  const [quoteIdx, setQI] = useState(0);

  // Local Storage & Cloud Syncs
  useEffect(() => {
    if (!isOnline) LS.set("math_problems", problems);
    cloudSave("math_problems", problems);
  }, [problems, isOnline, cloudSave]);

  useEffect(() => {
    if (!isOnline) LS.set("math_current_index", currentIndex);
    cloudSave("math_current_index", currentIndex);
  }, [currentIndex, isOnline, cloudSave]);

  useEffect(() => {
    if (!isOnline) {
      LS.set("math_total_solved", totalSolved);
      LS.set("math_accuracy", accuracy);
    }
    cloudSave("math_stats", { totalSolved, accuracy });
  }, [totalSolved, accuracy, isOnline, cloudSave]);

  // Load Cloud Data on mount/auth
  useEffect(() => {
    if (!isOnline) return;
    (async () => {
      try {
        showSync("syncing");
        const data = await fetchAllData(user!.id);
        if (data.math_problems) setProblems(data.math_problems);
        if (data.math_current_index !== undefined) setCurrentIndex(data.math_current_index);
        if (data.math_stats) {
          setTotalSolved(data.math_stats.totalSolved ?? 0);
          setAccuracy(data.math_stats.accuracy ?? 100);
        }
        if (data.settings) {
          const s = data.settings;
          if (s.lang) setLangRaw(s.lang);
          if (s.themeName) setThemeRaw(s.themeName);
          if (s.userName) setUserName(s.userName);
        }
        showSync("saved");
      } catch (e) {
        console.error("Cloud load error:", e);
        showSync("error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, user?.id]);

  useEffect(() => {
    const ti = setInterval(() => setTime(new Date()), 1000);
    const q = setInterval(() => setQI(i => (i + 1) % QUOTES.length), 10000);
    return () => { clearInterval(ti); clearInterval(q); };
  }, [QUOTES.length]);

  // API Call: Problem Generation
  const generateProblems = async (count: number) => {
    setLoading(true);
    setEvaluation(null);
    setSolutionText("");
    setUserAnswer("");
    try {
      const response = await fetch("/api/problem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, count }),
      });
      const data = await response.json();
      if (data.problems) {
        setProblems(data.problems);
        setCurrentIndex(0);
      }
    } catch (err) {
      console.error(err);
      alert("Error generating problems.");
    } finally {
      setLoading(false);
    }
  };

  // API Call: Step-by-Step Debug evaluation
  const evaluateSolution = async () => {
    const currentProblem = problems[currentIndex];
    if (!currentProblem) return;
    setEvaluating(true);
    
    // 改行で分割して空行を除外したステップ配列を作成
    const parsedSteps = solutionText.split("\n").filter(line => line.trim() !== "");

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemText: currentProblem.text,
          params: currentProblem.params,
          userSteps: parsedSteps,
          correctAnswer: userAnswer,
        }),
      });
      const result: EvaluationResult = await response.json();
      setEvaluation(result);

      // 統計のリアルタイムアップデート
      const newTotal = totalSolved + 1;
      setTotalSolved(newTotal);
      if (result.is_fully_correct) {
        setAccuracy(Math.round(((totalSolved * (accuracy / 100) + 1) / newTotal) * 100));
      } else {
        setAccuracy(Math.round(((totalSolved * (accuracy / 100)) / newTotal) * 100));
      }

      // Supabase への永続学習履歴書き込み
      if (isOnline) {
        const sb = getSupabase();
        if (sb) {
          await sb.from("learning_logs").insert([
            {
              user_id: user?.id,
              topic,
              problem_title: currentProblem.title,
              is_correct: result.is_fully_correct,
              steps_count: parsedSteps.length,
              overall_feedback: result.overall_feedback,
              created_at: new Date().toISOString()
            }
          ]);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error evaluating steps.");
    } finally {
      setEvaluating(false);
    }
  };

  const exportData = () => {
    const d = {
      problems,
      currentIndex,
      totalSolved,
      accuracy,
      settings: { lang, themeName, userName },
      exportedAt: new Date().toISOString()
    };
    const b = new Blob([JSON.stringify(d, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = `mathlab-hub-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const importData = () => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = ".json";
    inp.onchange = e => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = ev => {
        try {
          const d = JSON.parse(ev.target?.result as string);
          if (d.problems) setProblems(d.problems);
          if (d.currentIndex !== undefined) setCurrentIndex(d.currentIndex);
          if (d.totalSolved !== undefined) setTotalSolved(d.totalSolved);
          if (d.accuracy !== undefined) setAccuracy(d.accuracy);
          if (d.settings) {
            if (d.settings.lang) setLang(d.settings.lang);
            if (d.settings.themeName) setTheme(d.settings.themeName);
            if (d.settings.userName) setUserName(d.settings.userName);
          }
          alert("✦ Data loaded successfully.");
        } catch { alert("Invalid backup schema."); }
      };
      r.readAsText(f);
    };
    inp.click();
  };

  const applyPreset = (presetText: string) => {
    setTopic(presetText);
  };

  const currentProblem = problems[currentIndex] || null;
  const timeStr = time.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = time.toLocaleDateString(lang === "ja" ? "ja-JP" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  
  const greeting = () => {
    const h = time.getHours(), nm = userName ? `, ${userName}` : "";
    if (h < 12) return `${t.greeting_morning}${nm}`;
    if (h < 18) return `${t.greeting_afternoon}${nm}`;
    return `${t.greeting_evening}${nm}`;
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CSS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=Noto+Serif+JP:wght@300;400;600&family=Share+Tech+Mono&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    ::-webkit-scrollbar { width: 3px; }
    ::-webkit-scrollbar-track { background: ${TH.bg}; }
    ::-webkit-scrollbar-thumb { background: ${TH.scrollThumb}; border-radius: 2px; }

    .glow-dot { width: 7px; height: 7px; border-radius: 50%; background: ${TH.gold};
      box-shadow: 0 0 10px ${TH.gold}; animation: pulse 2.5s infinite; flex-shrink: 0; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .3; } }

    .clock { font-family: 'Share Tech Mono', monospace; font-size: clamp(20px, 3.5vw, 36px);
      color: ${TH.gold}; letter-spacing: 5px; text-shadow: 0 0 22px ${TH.gold}44; }

    .quote-text { font-style: italic; font-size: 13px; color: ${TH.goldLight};
      letter-spacing: 2px; animation: fio 10s infinite; }
    @keyframes fio { 0%, 100% { opacity: 0; } 12%, 88% { opacity: 1; } }

    .iodbtn { background: transparent; border: 1px solid ${TH.border}; color: ${TH.textMuted};
      cursor: pointer; font-family: inherit; font-size: 10px; letter-spacing: 2px;
      padding: 5px 11px; border-radius: 1px; text-transform: uppercase; transition: all .2s; }
    .iodbtn:hover { border-color: ${TH.goldDark}; color: ${TH.gold}; }

    .gear { background: transparent; border: 1px solid ${TH.border}; color: ${TH.textMuted};
      cursor: pointer; width: 32px; height: 32px; border-radius: 2px; font-size: 14px;
      display: flex; align-items: center; justify-content: center; transition: all .25s; }
    .gear:hover { border-color: ${TH.goldDark}; color: ${TH.gold}; transform: rotate(30deg); }
  `;

  return (
    <div style={{
      minHeight: "100vh", background: TH.bg,
      fontFamily: "'Cormorant Garamond','Noto Serif JP',serif", color: TH.text, display: "flex", position: "relative"
    }}>
      <style>{css}</style>

      {/* Background Matrix Effects */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `radial-gradient(ellipse at 15% 15%,${TH.gold}09 0%,transparent 45%),radial-gradient(ellipse at 85% 80%,${TH.gold}06 0%,transparent 45%)`
      }} />
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `repeating-linear-gradient(0deg,transparent,transparent 100px,${TH.gridLine} 100px,${TH.gridLine} 101px),repeating-linear-gradient(90deg,transparent,transparent 100px,${TH.gridLine} 100px,${TH.gridLine} 101px)`
      }} />

      {/* Settings Modal Layer */}
      <SettingsPanel open={settingsOpen} onClose={() => setSettings(false)}
        lang={lang} setLang={setLang} themeName={themeName} setTheme={setTheme}
        userName={userName} setUserName={setUserName}
        t={t} TH={TH} user={user} />

      {/* 1. DESKTOP SIDEBAR */}
      <aside style={{
        width: 280,
        background: TH.bg2,
        borderRight: `1px solid ${TH.borderGold}`,
        position: "relative",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "24px 20px"
      }} className="hidden lg:flex shrink-0">
        <div className="space-y-8">
          {/* Logo & Subtitle */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="glow-dot" />
              <span className="text-[10px] tracking-widest text-amber-500/80 font-mono">MATH LAB SECURE</span>
            </div>
            <h2 style={{ fontSize: 28, color: TH.gold, fontWeight: 300, letterSpacing: "0.15em" }}>
              MATH<span className="font-semibold text-white">LAB</span>
            </h2>
            <p className="text-[11px] text-slate-500 font-mono tracking-widest uppercase">{t.sidebar_subtitle}</p>
          </div>

          {/* Quick Predefined Presets */}
          <div className="space-y-3">
            <h4 className="text-[10px] text-slate-500 uppercase font-mono tracking-widest">{t.preset_title}</h4>
            <div className="flex flex-col gap-2">
              {[
                { name: "斜面の物理力学", query: "物理（斜面上の物体の運動）" },
                { name: "二次関数の極値", query: "数学（二次関数の最大・最小）" },
                { name: "単振動の物理", query: "物理（単振動のエネルギー）" },
                { name: "三角関数の合成", query: "数学（三角関数の合成）" },
              ].map((p) => (
                <button
                  key={p.name}
                  onClick={() => applyPreset(p.query)}
                  style={{
                    background: topic === p.query ? `${TH.gold}15` : "transparent",
                    border: `1px solid ${topic === p.query ? TH.gold : TH.border}`,
                    color: topic === p.query ? TH.gold : TH.textDim,
                    textAlign: "left", fontSize: 12, padding: "8px 12px", transition: "all .2s"
                  }}
                  className="rounded hover:bg-white/5"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* User Progress Stats */}
          <div className="border-t border-slate-800/80 pt-6 space-y-4">
            <h4 className="text-[10px] text-slate-500 uppercase font-mono tracking-widest">Progress Stats</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/30 p-3 rounded border border-slate-800">
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">{t.stat_total}</p>
                <p style={{ color: TH.gold }} className="text-xl font-bold font-mono">{totalSolved}</p>
              </div>
              <div className="bg-black/30 p-3 rounded border border-slate-800">
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">{t.stat_accuracy}</p>
                <p style={{ color: TH.gold }} className="text-xl font-bold font-mono">{accuracy}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info panel at bottom */}
        <div className="text-[10px] text-slate-600 font-mono border-t border-slate-900 pt-4">
          SYSTEM_OS: NEXT_FULLSTACK<br />
          GEMINI: 1.5_PRO_SECURE
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, zIndex: 1 }}>
        <div style={{ maxWidth: 1040, width: "100%", margin: "0 auto", padding: "24px 16px" }} className="space-y-6">
          
          {/* TOP ACTION HEADER */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-light tracking-wide text-slate-100">
                <span style={{ color: TH.gold, fontWeight: 600 }}>THEORETICAL</span> DESK
              </h1>
              <p style={{ fontSize: 13, color: TH.goldLight, letterSpacing: 2, marginTop: 4, fontStyle: "italic" }}>{greeting()}</p>
              <p style={{ fontSize: 9, color: TH.textMuted, letterSpacing: 4, marginTop: 2 }}>{t.tagline}</p>
            </div>

            <div className="flex flex-col items-end gap-2 w-full md:w-auto">
              <div className="flex items-center gap-2">
                {syncStatus !== "idle" && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 2, fontSize: 10, letterSpacing: 2,
                    border: `1px solid ${syncStatus === "error" ? "#FF444466" : syncStatus === "syncing" ? TH.borderGold : TH.goldDark + "66"}`,
                    color: syncStatus === "error" ? "#FF7777" : syncStatus === "syncing" ? TH.textDim : TH.gold,
                    background: syncStatus === "error" ? "#FF222211" : "transparent"
                  }}>
                    {syncStatus === "syncing" && <span style={{ animation: "pulse 1s infinite" }}>⟳</span>}
                    <span>{syncStatus === "syncing" ? "Sync..." : syncStatus === "saved" ? "Saved" : "Err"}</span>
                  </div>
                )}
                {user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url} alt=""
                    onClick={() => setSettings(true)}
                    style={{
                      width: 32, height: 32, borderRadius: "50%", cursor: "pointer",
                      border: `2px solid ${TH.goldDark}`, boxShadow: `0 0 8px ${TH.gold}44`
                    }}
                  />
                ) : (
                  <button className="gear" onClick={() => setSettings(true)}>⚙️</button>
                )}
                <button className="iodbtn" onClick={exportData}>{t.export_btn}</button>
                <button className="iodbtn" onClick={importData}>{t.import_btn}</button>
              </div>
              <div className="clock">{timeStr}</div>
              <p style={{ fontSize: 10, color: TH.textMuted, letterSpacing: 1 }}>{dateStr}</p>
            </div>
          </div>
          
          <div style={{
            height: 1,
            background: `linear-gradient(90deg,transparent,${TH.goldDark}88,${TH.gold},${TH.goldLight},${TH.gold},${TH.goldDark}88,transparent)`
          }} />

          {/* QUOTE SECTION */}
          <div className="text-center">
            <p className="quote-text" key={`${quoteIdx}-${lang}`}>「 {QUOTES[quoteIdx]} 」</p>
          </div>

          {/* DYNAMIC TOPIC CONTROLLER BAR */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center" style={{
            background: TH.surface, border: `1px solid ${TH.borderGold}`, borderRadius: 3, padding: 16
          }}>
            <div className="md:col-span-6 flex flex-col gap-1">
              <span style={{ fontSize: 10, letterSpacing: 2, color: TH.gold }}>{t.topic_label}</span>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-black/40 border border-[#2a2a2a] rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                placeholder={t.placeholder_topic}
              />
            </div>
            <div className="md:col-span-3">
              <button
                onClick={() => generateProblems(1)}
                disabled={loading || !topic}
                className="w-full h-10 border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-mono text-xs tracking-wider uppercase transition rounded disabled:opacity-30"
              >
                {loading ? "..." : t.btn_single}
              </button>
            </div>
            <div className="md:col-span-3">
              <button
                onClick={() => generateProblems(10)}
                disabled={loading || !topic}
                className="w-full h-10 bg-gradient-to-r from-amber-600/80 to-amber-700/80 text-amber-100 font-mono text-xs tracking-widest uppercase transition rounded hover:opacity-90 disabled:opacity-30"
              >
                {loading ? "..." : t.btn_practice_10}
              </button>
            </div>
          </div>

          {/* MATH LAB MAIN INTERACTIVE WORKSPACE */}
          {currentProblem ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* LEFT COLUMN: VISUALS & STATEMENT */}
              <div className="lg:col-span-7 space-y-6">
                <div style={{
                  background: TH.surface, border: `1px solid ${TH.borderGold}`, borderRadius: 3, padding: 24,
                  position: "relative", boxShadow: `inset 0 1px 0 ${TH.gold}11`
                }}>
                  <div style={{
                    position: "absolute", top: 0, left: "5%", right: "5%", height: 1,
                    background: `linear-gradient(90deg,transparent,${TH.gold}66,transparent)`
                  }} />
                  
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-mono font-bold tracking-widest text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                      QUESTION {currentIndex + 1} / {problems.length}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">LAB_CORE_SECURE</span>
                  </div>

                  <h2 className="text-lg font-semibold text-slate-100 mb-4">{currentProblem.title}</h2>
                  
                  <div className="text-slate-300 leading-relaxed text-base border-l-2 border-amber-500/40 pl-4 py-1">
                    <LatexRenderer text={currentProblem.text} mounted={mounted} />
                  </div>
                </div>

                {/* SVG model mapping */}
                <ScienceVisualizer params={currentProblem.params} />

                {/* Question selector navigation (For Multi-Problem Set) */}
                {problems.length > 1 && (
                  <div className="flex items-center justify-between p-4 bg-black/40 border border-slate-800 rounded-lg">
                    <button
                      disabled={currentIndex === 0}
                      onClick={() => {
                        setCurrentIndex(p => p - 1);
                        setEvaluation(null);
                      }}
                      className="text-xs bg-black/80 hover:bg-black text-amber-500 px-3 py-1.5 rounded border border-amber-500/20 disabled:opacity-30 disabled:pointer-events-none"
                    >
                      {t.prev_prob}
                    </button>
                    <div className="flex gap-1.5 overflow-x-auto px-2">
                      {problems.map((_, idx) => (
                        <span
                          key={idx}
                          className={`w-2 h-2 rounded-full flex-shrink-0 transition-all ${idx === currentIndex ? "bg-amber-500 scale-125" : "bg-slate-800"}`}
                        />
                      ))}
                    </div>
                    <button
                      disabled={currentIndex === problems.length - 1}
                      onClick={() => {
                        setCurrentIndex(p => p + 1);
                        setEvaluation(null);
                      }}
                      className="text-xs bg-black/80 hover:bg-black text-amber-500 px-3 py-1.5 rounded border border-amber-500/20 disabled:opacity-30 disabled:pointer-events-none"
                    >
                      {t.next_prob}
                    </button>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: STEP TEXTAREA & RESULTS */}
              <div className="lg:col-span-5 space-y-6">
                <div style={{
                  background: TH.surface, border: `1px solid ${TH.borderGold}`, borderRadius: 3, padding: 24,
                  boxShadow: `inset 0 1px 0 ${TH.gold}11`
                }}>
                  <div className="border-b border-slate-800/80 pb-3 mb-4">
                    <h3 className="font-semibold text-xs tracking-widest text-slate-300 uppercase">{t.header_steps}</h3>
                    <p className="text-[10px] text-slate-500 mt-1">{t.helper_latex}</p>
                  </div>

                  {/* Calculations Textarea Input */}
                  <div className="space-y-3">
                    <textarea
                      value={solutionText}
                      onChange={(e) => setSolutionText(e.target.value)}
                      placeholder={t.placeholder_textarea}
                      style={{ background: TH.inputBg, border: `1px solid ${TH.border}`, color: TH.text }}
                      rows={8}
                      className="w-full rounded p-3 text-sm font-mono focus:outline-none focus:border-amber-500 resize-y"
                    />
                  </div>

                  <div className="space-y-1 pt-4">
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      {t.final_answer}
                    </label>
                    <input
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      className="w-full bg-black/40 border border-slate-800 focus:border-amber-500 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none font-mono"
                      placeholder="e.g., 9.8 m/s^2"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={evaluateSolution}
                      disabled={evaluating || !solutionText.trim()}
                      className="w-full h-11 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 text-xs font-semibold tracking-widest uppercase transition rounded disabled:opacity-30"
                    >
                      {evaluating ? t.debugger_evaluating : t.btn_evaluate}
                    </button>
                  </div>
                </div>

                {/* AI debugger response container */}
                {evaluation && (
                  <div style={{
                    background: TH.surface, border: `1px solid ${evaluation.is_fully_correct ? "#10b98144" : "#f43f5e44"}`,
                    borderRadius: 3, padding: 20
                  }} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${evaluation.is_fully_correct ? "bg-emerald-500" : "bg-rose-500"}`} />
                      <h4 className="font-semibold text-xs tracking-widest text-slate-200 uppercase">
                        {evaluation.is_fully_correct ? "Process Correct" : "Logical Anomaly Detected"}
                      </h4>
                    </div>

                    <div className="space-y-2">
                      {evaluation.steps.map((step, idx) => (
                        <div key={idx} className="p-3 bg-black/40 border border-slate-800 rounded text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-mono text-amber-500/80 font-semibold">
                              Step {step.step_index + 1}: <LatexRenderer text={`$${step.formula}$`} mounted={mounted} />
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${step.is_correct ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                              {step.is_correct ? "PASS" : "ERR"}
                            </span>
                          </div>
                          <p className="text-slate-400 mt-1 font-sans">{step.feedback}</p>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded">
                      <h5 className="text-[10px] font-bold text-amber-400 mb-1 tracking-wider uppercase">{t.overall_advice}</h5>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">{evaluation.overall_feedback}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-black/20 rounded-lg border border-dashed border-slate-800 text-center">
              <p className="text-slate-400 mb-6 text-sm tracking-wider font-mono">{t.no_problems}</p>
              <button
                onClick={() => generateProblems(1)}
                className="bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500/20 font-mono text-xs tracking-widest uppercase px-6 py-3 transition rounded"
              >
                {t.btn_single}
              </button>
            </div>
          )}

          {/* FOOTER */}
          <div style={{ marginTop: 36, textAlign: "center" }}>
            <div style={{
              height: 1,
              background: `linear-gradient(90deg,transparent,${TH.goldDark}55,${TH.gold}88,${TH.goldDark}55,transparent)`,
              marginBottom: 12
            }} />
            <p style={{ fontSize: 10, color: TH.textMuted, letterSpacing: 5, textTransform: "uppercase" }}>{t.footer}</p>
          </div>

        </div>
      </div>
    </div>
  );
}