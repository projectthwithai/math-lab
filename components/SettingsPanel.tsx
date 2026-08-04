"use client";

import React, { useState, useEffect } from "react";
import { getSupabase, signInWithGoogle } from "../lib/supabase";

// 設定画面専用の配色の参照（テーマの各カラーに対応）
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

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  lang: string;
  setLang: (l: string) => void;
  themeName: string;
  setTheme: (t: string) => void;
  userName: string;
  setUserName: (n: string) => void;
  t: any;
  TH: any;
  user: any;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  open,
  onClose,
  lang,
  setLang,
  themeName,
  setTheme,
  userName,
  setUserName,
  t,
  TH,
  user,
}) => {
  const [name, setName] = useState(userName);

  useEffect(() => {
    setName(userName);
  }, [userName]);

  const save = () => {
    setUserName(name);
    localStorage.setItem("apx7_uname", name);
    onClose();
  };

  return (
    <>
      {/* 背景の薄暗いボカシ幕 */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.55)",
            backdropFilter: "blur(4px)",
            zIndex: 1500,
          }}
        />
      )}
      
      {/* 設定パネル本体（右からスライドイン） */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(400px,95vw)",
          background: TH.surface,
          borderLeft: `1px solid ${TH.goldDark}55`,
          zIndex: 1600,
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform .38s",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: `1px solid ${TH.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ fontSize: 12, color: TH.gold, textTransform: "uppercase" }}>
            {t.settings}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: TH.textMuted,
              fontSize: 20,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>
        
        <div style={{ padding: "22px", display: "flex", flexDirection: "column", gap: 22 }}>
          {/* Supabase 認証セクション */}
          <div>
            <label
              style={{
                fontSize: 11,
                color: TH.textMuted,
                textTransform: "uppercase",
                display: "block",
                marginBottom: 10,
              }}
            >
              Account
            </label>
            {user ? (
              <div
                style={{
                  padding: 12,
                  background: `${TH.gold}0a`,
                  border: `1px solid ${TH.goldDark}55`,
                  borderRadius: 3,
                }}
              >
                <p style={{ fontSize: 13, color: TH.text }}>{user.email}</p>
                <button
                  onClick={() => getSupabase().auth.signOut()}
                  style={{
                    marginTop: 8,
                    fontSize: 10,
                    background: "transparent",
                    border: `1px solid ${TH.border}`,
                    color: TH.textMuted,
                    cursor: "pointer",
                    padding: "4px 8px",
                  }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  width: "100%",
                  padding: 12,
                  background: "#fff",
                  border: `1px solid ${TH.border}`,
                  color: "#333",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                <img
                  src="https://www.google.com/favicon.ico"
                  style={{ width: 16 }}
                  alt=""
                />{" "}
                Continue with Google
              </button>
            )}
          </div>
          
          {/* お名前の設定 */}
          <div>
            <label
              style={{
                fontSize: 11,
                color: TH.textMuted,
                textTransform: "uppercase",
                display: "block",
                marginBottom: 10,
              }}
            >
              {t.username_label}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: "100%",
                background: TH.inputBg,
                border: `1px solid ${TH.border}`,
                color: TH.text,
                padding: 10,
              }}
            />
          </div>
          
          {/* 言語設定 */}
          <div>
            <label
              style={{
                fontSize: 11,
                color: TH.textMuted,
                textTransform: "uppercase",
                display: "block",
                marginBottom: 10,
              }}
            >
              {t.lang_label}
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {["en", "ja"].map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  style={{
                    flex: 1,
                    padding: 8,
                    background: lang === l ? `${TH.gold}22` : "transparent",
                    border: `1px solid ${lang === l ? TH.gold : TH.border}`,
                    color: lang === l ? TH.gold : TH.textDim,
                    cursor: "pointer",
                  }}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          
          {/* テーマ（外観）設定 */}
          <div>
            <label
              style={{
                fontSize: 11,
                color: TH.textMuted,
                textTransform: "uppercase",
                display: "block",
                marginBottom: 10,
              }}
            >
              {t.theme_label}
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {(Object.keys(THEMES) as Array<keyof typeof THEMES>).map((th) => (
                <button
                  key={th}
                  onClick={() => setTheme(th)}
                  style={{
                    flex: 1,
                    padding: 8,
                    background:
                      themeName === th ? `${THEMES[th].gold}22` : "transparent",
                    border: `1px solid ${
                      themeName === th ? THEMES[th].gold : THEMES[th].border
                    }`,
                    color: themeName === th ? THEMES[th].gold : THEMES[th].textDim,
                    cursor: "pointer",
                  }}
                >
                  {THEMES[th].name}
                </button>
              ))}
            </div>
          </div>
          
          <button
            onClick={save}
            style={{
              background: TH.goldDark,
              color: TH.goldLight,
              padding: 13,
              border: "none",
              borderRadius: 2,
              cursor: "pointer",
              letterSpacing: 4,
            }}
          >
            {t.save_settings}
          </button>
        </div>
      </div>
    </>
  );
};