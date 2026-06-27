import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, Easing } from "remotion";

/* superlore 0.12 release reel — brand violet, dark, clean type. 24s @ 30fps (720 frames). */

const ACCENT = "#6D5CF0";
const ACCENT2 = "#9385ff";
const BG = "#0a0a0f";
const TEXT = "#f5f5f8";
const MUTED = "#a3a3b8";
const FONT = '"SF Pro Display", "Helvetica Neue", "Segoe UI", Arial, sans-serif';
const MONO = '"SF Mono", "JetBrains Mono", ui-monospace, Menlo, monospace';

const ease = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
  easing: Easing.out(Easing.cubic),
};

/** fade + rise in over [a,b] */
function rise(frame: number, a: number, b: number, dist = 26): React.CSSProperties {
  return {
    opacity: interpolate(frame, [a, b], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    transform: `translateY(${interpolate(frame, [a, b], [dist, 0], ease)}px)`,
  };
}
/** fade in then out, for whole-scene framing */
function holdFade(frame: number, total: number, fin = 12, fout = 14): number {
  return Math.min(
    interpolate(frame, [0, fin], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    interpolate(frame, [total - fout, total], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
}

const FoldMark: React.FC<{ size?: number }> = ({ size = 60 }) => (
  <svg viewBox="0 0 64 64" width={size} height={size}>
    <polygon points="14,20 32,12 32,46 14,54" fill={ACCENT} />
    <polygon points="32,12 50,20 50,54 32,46" fill={ACCENT} opacity={0.5} />
  </svg>
);

const Glow: React.FC = () => {
  const f = useCurrentFrame();
  const x = interpolate(f, [0, 720], [32, 68]);
  const y = interpolate(f, [0, 720], [30, 42]);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(55% 55% at ${x}% ${y}%, ${ACCENT}38, transparent 70%)`,
      }}
    />
  );
};

const Scene: React.FC<{ children: React.ReactNode; total: number }> = ({ children, total }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        opacity: holdFade(f, total),
        justifyContent: "center",
        alignItems: "center",
        padding: "0 110px",
        textAlign: "center",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const Eyebrow: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <div
    style={{
      fontFamily: MONO,
      fontSize: 15,
      letterSpacing: 7,
      color: ACCENT2,
      fontWeight: 600,
      textTransform: "uppercase",
      ...style,
    }}
  >
    {children}
  </div>
);

/* ── Scene A — the thesis ───────────────────────────────────────────── */
const SceneA: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Scene total={150}>
      <div style={rise(f, 4, 26)}>
        <Eyebrow>superlore</Eyebrow>
      </div>
      <div
        style={{
          ...rise(f, 14, 44),
          fontSize: 66,
          fontWeight: 700,
          lineHeight: 1.06,
          letterSpacing: -1.5,
          maxWidth: 1000,
          marginTop: 26,
        }}
      >
        Documentation broke the day <span style={{ color: ACCENT2 }}>AI started writing it.</span>
      </div>
    </Scene>
  );
};

/* ── Scene B — the shift ────────────────────────────────────────────── */
const SceneB: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Scene total={150}>
      <div
        style={{
          ...rise(f, 8, 38),
          fontSize: 46,
          fontWeight: 650,
          lineHeight: 1.18,
          maxWidth: 960,
        }}
      >
        Your docs are read by <span style={{ color: ACCENT2 }}>agents</span> now —
        <br />
        not just people.
      </div>
      <div
        style={{
          ...rise(f, 30, 60),
          fontSize: 23,
          color: MUTED,
          marginTop: 28,
          maxWidth: 760,
          lineHeight: 1.5,
        }}
      >
        Author once in MDX. Humans get a clean site; agents get a typed MCP over the same corpus.
      </div>
    </Scene>
  );
};

/* ── Scene C — superlore 0.12 features ──────────────────────────────── */
const FEATURES = [
  { k: "7-theme system", v: "one flag in superlore.json" },
  { k: "Reimagined releases", v: "media, highlights, a clean timeline" },
  { k: "Runtime safety", v: "a bad token degrades, never blanks" },
];
const SceneC: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Scene total={240}>
      <div style={rise(f, 4, 26)}>
        <Eyebrow style={{ color: MUTED }}>the release</Eyebrow>
      </div>
      <div
        style={{
          ...rise(f, 12, 40),
          fontSize: 92,
          fontWeight: 750,
          letterSpacing: -2,
          marginTop: 14,
        }}
      >
        superlore <span style={{ color: ACCENT }}>0.12</span>
      </div>
      <div style={{ display: "flex", gap: 18, marginTop: 50 }}>
        {FEATURES.map((feat, i) => {
          const a = 56 + i * 22;
          return (
            <div
              key={feat.k}
              style={{
                ...rise(f, a, a + 26, 20),
                width: 300,
                padding: "26px 24px",
                borderRadius: 16,
                background: "#13131c",
                border: `1px solid #24242f`,
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 4,
                  borderRadius: 2,
                  background: ACCENT,
                  marginBottom: 16,
                }}
              />
              <div style={{ fontSize: 23, fontWeight: 650 }}>{feat.k}</div>
              <div style={{ fontSize: 16, color: MUTED, marginTop: 8, lineHeight: 1.45 }}>
                {feat.v}
              </div>
            </div>
          );
        })}
      </div>
    </Scene>
  );
};

/* ── Scene D — logo + install ───────────────────────────────────────── */
const SceneD: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Scene total={180}>
      <div style={{ ...rise(f, 6, 32), display: "flex", alignItems: "center", gap: 20 }}>
        <FoldMark size={68} />
        <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: -1 }}>superlore</div>
      </div>
      <div style={{ ...rise(f, 22, 50), fontSize: 22, color: MUTED, marginTop: 18 }}>
        One corpus. Humans and agents.
      </div>
      <div
        style={{
          ...rise(f, 40, 68),
          fontFamily: MONO,
          fontSize: 20,
          color: TEXT,
          marginTop: 40,
          padding: "14px 26px",
          borderRadius: 12,
          background: "#13131c",
          border: `1px solid #24242f`,
        }}
      >
        <span style={{ color: ACCENT2 }}>$</span> npm i superlore
      </div>
      <div style={{ ...rise(f, 56, 84), fontSize: 17, color: MUTED, marginTop: 26 }}>
        github.com/KrishnanSG/superlore
      </div>
    </Scene>
  );
};

export const Reel: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: BG, color: TEXT, fontFamily: FONT }}>
    <Glow />
    <Sequence durationInFrames={150}>
      <SceneA />
    </Sequence>
    <Sequence from={150} durationInFrames={150}>
      <SceneB />
    </Sequence>
    <Sequence from={300} durationInFrames={240}>
      <SceneC />
    </Sequence>
    <Sequence from={540} durationInFrames={180}>
      <SceneD />
    </Sequence>
  </AbsoluteFill>
);
