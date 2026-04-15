"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { API_BASE, apiHeaders } from "../lib/api";

/* ── Slide components ──────────────────────────────────────────────── */
import {
  SlideIntro,
  SlideArchitecture,
  SlideNonLocal,
  SlideResults,
} from "../components/ArticleSlides";
import {
  SlidePaperWeaknesses,
  SlideCodeWeaknesses,
  SlideWeaknessImpact,
} from "../components/WeaknessSlides";
import {
  SlideImprovements,
  SlideImprovedArch,
} from "../components/ImprovementSlides";
import { generatePPTX } from "../components/ExportPPTX";
import ImageCompare from "../components/ImageCompare";
import Lightbox from "../components/Lightbox";
import Tooltip from "../components/Tooltip";

/* ── Types ───────────────────────────────────────────────────────────── */
interface TaskOption {
  value: string;
  label: string;
  levels: number[];
  level_label: string;
}
interface VariantOption {
  value: string;
  label: string;
}
interface Options {
  tasks: TaskOption[];
  variants: VariantOption[];
}
interface Result {
  original: string;
  degraded: string;
  old_result: string;
  new_result: string;
  degraded_psnr: number;
  old_psnr: number;
  new_psnr: number;
  degraded_ssim: number;
  old_ssim: number;
  new_ssim: number;
  old_time_ms: number;
  new_time_ms: number;
  old_params: number;
  new_params: number;
  old_pretrained: boolean;
  new_pretrained: boolean;
  task: string;
  variant: string;
  level: number;
}

interface TrainingEntry {
  experiment: string;
  has_checkpoint: boolean;
  best_psnr: number | null;
  best_epoch: number | null;
  total_epochs: number | null;
  training_log: Record<string, string>[];
}
interface TrainingInfo {
  device: string;
  trained_models: Record<string, TrainingEntry>;
  gpu_explanation: {
    title: string;
    current_setup: string;
    limitations: string[];
    gpu_benefits: string[];
    expected_improvement: string;
  };
}
interface SampleImage {
  name: string;
  path: string;
  width: number;
  height: number;
}

/* ── History entry ─────────────────────────────────────────────────── */
interface HistoryEntry {
  id: number;
  result: Result;
  timestamp: number;
}

/* ── Tab definition (with icons) ─────────────────────────────────────── */
const TAB_ICONS: Record<string, JSX.Element> = {
  article: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>,
  architecture: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>,
  weaknesses: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>,
  improvements: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>,
  demo: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
};

const TABS = [
  { id: "article", label: "Article" },
  { id: "architecture", label: "Architecture" },
  { id: "weaknesses", label: "Weaknesses" },
  { id: "improvements", label: "Improvements" },
  { id: "demo", label: "Live Demo" },
] as const;
type TabId = (typeof TABS)[number]["id"];

/* ── Processing step labels ──────────────────────────────────────────── */
const PROCESS_STEPS = [
  "Uploading image",
  "Applying degradation",
  "Running old model",
  "Running new model",
  "Computing metrics",
];

/* ── Metric Card with Tooltip ────────────────────────────────────────── */
const METRIC_TOOLTIPS: Record<string, string> = {
  PSNR: "Peak Signal-to-Noise Ratio — higher is better. >30 dB is good, >35 dB is excellent.",
  SSIM: "Structural Similarity Index — 1.0 is perfect. >0.9 is good quality.",
  "Old Params": "Number of parameters in the original model (millions).",
  "New Params": "Number of parameters in the improved model (millions).",
  "Best PSNR": "Highest PSNR achieved during training validation.",
  "Best Epoch": "Training epoch where best PSNR was recorded.",
  "Total Epochs": "Total number of training epochs completed.",
};

function Metric({
  label,
  value,
  unit,
  highlight,
}: {
  label: string;
  value: string | number;
  unit?: string;
  highlight?: "green" | "yellow" | "none";
}) {
  const color =
    highlight === "green"
      ? "metric-highlight-green"
      : highlight === "yellow"
      ? "metric-highlight-yellow"
      : "metric-highlight-default";
  const tip = METRIC_TOOLTIPS[label];
  const inner = (
    <div className="metric-card">
      <div className={`metric-value ${color}`}>
        {value}
        {unit && <span className="text-sm ml-0.5">{unit}</span>}
      </div>
      <div className="metric-label">
        {label}
        {tip && <span className="ml-1 opacity-50 text-[10px]">ⓘ</span>}
      </div>
    </div>
  );
  return tip ? <Tooltip text={tip}>{inner}</Tooltip> : inner;
}

/* ── Image Panel (with click-to-enlarge) ─────────────────────────────── */
function ImagePanel({
  title,
  src,
  badge,
  badgeColor,
  onZoom,
}: {
  title: string;
  src: string;
  badge?: string;
  badgeColor?: "green" | "yellow" | "blue";
  onZoom?: (src: string, alt: string) => void;
}) {
  const badgeCls = badgeColor === "green" ? "badge-green" : badgeColor === "blue" ? "badge-blue" : "badge-yellow";
  return (
    <div className="flex flex-col gap-2 fade-in">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{title}</span>
        {badge && (
          <span className={`badge ${badgeCls}`}>
            {badgeColor === "green" && <span className="mr-1">✓</span>}
            {badgeColor === "yellow" && <span className="mr-1">✗</span>}
            {badgeColor === "blue" && <span className="mr-1">✓</span>}
            {badge}
          </span>
        )}
      </div>
      <div
        className="img-container cursor-zoom-in group relative"
        onClick={() => onZoom?.(`data:image/png;base64,${src}`, title)}
      >
        <img src={`data:image/png;base64,${src}`} alt={title} />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
          <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-80 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ── Slide wrapper with dot navigation + keyboard support ────────────── */
function SlideNav({
  current,
  total,
  onPrev,
  onNext,
  onGoto,
}: {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onGoto: (idx: number) => void;
}) {
  return (
    <div className="flex items-center justify-between mt-8 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
      <button
        onClick={onPrev}
        disabled={current === 0}
        className="btn-primary text-sm disabled:opacity-30"
      >
        ← Previous
      </button>
      <div className="flex items-center gap-3">
        <div className="flex gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              onClick={() => onGoto(i)}
              className={`slide-dot ${i === current ? "slide-dot-active" : ""}`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
        <span className="text-xs ml-2" style={{ color: "var(--text-muted)" }}>
          {current + 1}/{total}
        </span>
      </div>
      <button
        onClick={onNext}
        disabled={current === total - 1}
        className="btn-primary text-sm disabled:opacity-30"
      >
        Next →
      </button>
    </div>
  );
}

/* ── Skeleton loader ─────────────────────────────────────────────────── */
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

/* ── Download composite helper ───────────────────────────────────────── */
function downloadComposite(result: Result) {
  const canvas = document.createElement("canvas");
  const images = [result.original, result.degraded, result.old_result, result.new_result];
  const labels = [
    "Original",
    result.task === "dn_gray" ? `Noisy σ=${result.level}` : `JPEG q=${result.level}`,
    `Old COLA-${result.variant}`,
    `New COLA-${result.variant}`,
  ];
  const imgs: HTMLImageElement[] = [];
  let loaded = 0;
  images.forEach((b64, i) => {
    const img = new Image();
    img.onload = () => {
      loaded++;
      if (loaded === 4) {
        const w = imgs[0].width;
        const h = imgs[0].height;
        const gap = 4;
        const labelH = 24;
        canvas.width = w * 4 + gap * 3;
        canvas.height = h + labelH;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#09090b";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = "12px Inter, system-ui, sans-serif";
        ctx.fillStyle = "#e5e5e5";
        imgs.forEach((im, j) => {
          const x = j * (w + gap);
          ctx.drawImage(im, x, labelH);
          ctx.fillText(labels[j], x + 4, 16);
        });
        const link = document.createElement("a");
        link.download = `cola-comparison-${result.task}-${result.variant}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      }
    };
    img.src = `data:image/png;base64,${b64}`;
    imgs[i] = img;
  });
}

/* ═══════════════════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const [tab, setTab] = useState<TabId>("article");

  /* ── Theme toggle ── */
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    setIsDark(!document.documentElement.classList.contains("light"));
  }, []);
  const toggleTheme = useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("light", !next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
  }, [isDark]);

  /* ── Article tab: slides 1-4 ── */
  const articleSlides = [SlideIntro, SlideArchitecture, SlideNonLocal, SlideResults];
  const [articleIdx, setArticleIdx] = useState(0);

  /* ── Weakness tab: slides 5-7 ── */
  const weaknessSlides = [SlidePaperWeaknesses, SlideCodeWeaknesses, SlideWeaknessImpact];
  const [weakIdx, setWeakIdx] = useState(0);

  /* ── Improvement tab: slides 8-9 ── */
  const improvementSlides = [SlideImprovements, SlideImprovedArch];
  const [impIdx, setImpIdx] = useState(0);

  /* ── Keyboard navigation for slides ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const dir = e.key === "ArrowLeft" ? -1 : 1;
        if (tab === "article") setArticleIdx((p) => Math.max(0, Math.min(articleSlides.length - 1, p + dir)));
        else if (tab === "weaknesses") setWeakIdx((p) => Math.max(0, Math.min(weaknessSlides.length - 1, p + dir)));
        else if (tab === "improvements") setImpIdx((p) => Math.max(0, Math.min(improvementSlides.length - 1, p + dir)));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [tab, articleSlides.length, weaknessSlides.length, improvementSlides.length]);

  /* ── Demo: comparison tool state ── */
  const [options, setOptions] = useState<Options | null>(null);
  const [task, setTask] = useState("dn_gray");
  const [variant, setVariant] = useState("B");
  const [level, setLevel] = useState(25);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [samples, setSamples] = useState<SampleImage[]>([]);
  const [trainingInfo, setTrainingInfo] = useState<TrainingInfo | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /* ── Processing progress ── */
  const [processStep, setProcessStep] = useState(0);
  useEffect(() => {
    if (!loading) { setProcessStep(0); return; }
    const interval = setInterval(() => {
      setProcessStep((p) => (p < PROCESS_STEPS.length - 1 ? p + 1 : p));
    }, 1500);
    return () => clearInterval(interval);
  }, [loading]);

  /* ── Lightbox state ── */
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  /* ── History ── */
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const nextHistId = useRef(1);

  /* ── Compare view mode ── */
  const [compareMode, setCompareMode] = useState<"grid" | "slider">("grid");

  useEffect(() => {
    fetch(`${API_BASE}/api/options`, { headers: apiHeaders })
      .then((r) => r.json())
      .then(setOptions)
      .catch(() => {});
    fetch(`${API_BASE}/api/sample-images`, { headers: apiHeaders })
      .then((r) => r.json())
      .then((d) => setSamples(d.samples || []))
      .catch(() => {});
    fetch(`${API_BASE}/api/training-info`, { headers: apiHeaders })
      .then((r) => r.json())
      .then(setTrainingInfo)
      .catch(() => {});
  }, []);

  const currentTask = options?.tasks.find((t) => t.value === task);
  const levels = currentTask?.levels || [25];

  useEffect(() => {
    if (currentTask && !currentTask.levels.includes(level)) {
      setLevel(currentTask.levels[0]);
    }
  }, [task, currentTask, level]);

  const onFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (f) onFile(f);
    },
    [onFile]
  );

  const loadSample = useCallback(async (name: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/sample-images/${name}`, { headers: apiHeaders });
      const data = await res.json();
      const b64 = data.image;
      const byteStr = atob(b64);
      const arr = new Uint8Array(byteStr.length);
      for (let i = 0; i < byteStr.length; i++) arr[i] = byteStr.charCodeAt(i);
      const blob = new Blob([arr], { type: "image/png" });
      const f = new File([blob], name, { type: "image/png" });
      setFile(f);
      setPreview(`data:image/png;base64,${b64}`);
      setResult(null);
    } catch {
      setError("Failed to load sample image");
    }
  }, []);

  const process = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setProcessStep(0);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("task", task);
    fd.append("variant", variant);
    fd.append("level", String(level));
    try {
      const res = await fetch(`${API_BASE}/api/process`, { method: "POST", body: fd, headers: apiHeaders });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || "Processing failed");
      }
      const r = await res.json();
      setResult(r);
      setHistory((prev) => [{ id: nextHistId.current++, result: r, timestamp: Date.now() }, ...prev].slice(0, 20));
    } catch (e: any) {
      setError(e.message || "Server error");
    } finally {
      setLoading(false);
    }
  }, [file, task, variant, level]);

  /* ── PPT export ── */
  const [exporting, setExporting] = useState(false);
  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      await generatePPTX();
    } catch (e: any) {
      console.error("PPT export failed:", e);
      alert("Failed to generate PPTX: " + (e.message || "Unknown error"));
    } finally {
      setExporting(false);
    }
  }, []);

  /* ── Winner calculation ── */
  const winner = result
    ? result.new_psnr > result.old_psnr
      ? "new"
      : result.old_psnr > result.new_psnr
      ? "old"
      : "tie"
    : null;
  const psnrDiff = result ? Math.abs(result.new_psnr - result.old_psnr).toFixed(2) : "0";
  const ssimDiff = result ? Math.abs(result.new_ssim - result.old_ssim).toFixed(4) : "0";

  /* ── Render current slide for a tab ── */
  function renderSlides(
    slides: React.FC[],
    idx: number,
    setIdx: (n: number) => void
  ) {
    const Slide = slides[idx];
    return (
      <div className="fade-in" key={`slide-${idx}`}>
        <Slide />
        <SlideNav
          current={idx}
          total={slides.length}
          onPrev={() => setIdx(Math.max(0, idx - 1))}
          onNext={() => setIdx(Math.min(slides.length - 1, idx + 1))}
          onGoto={setIdx}
        />
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-6">
      {/* ── Sticky Header ── */}
      <header className="sticky-header">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="header-logo">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold truncate">COLA-Net</h1>
              <p className="text-xs truncate hidden sm:block" style={{ color: "var(--text-muted)" }}>
                Collaborative Attention Network — Analysis &amp; Improvements
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggleTheme}
              className="icon-btn"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" strokeWidth={2}/><path strokeLinecap="round" strokeWidth={2} d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
              )}
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="btn-primary flex items-center gap-2 text-xs sm:text-sm"
            >
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-b-2 border-white" />
                <span className="hidden sm:inline">Generating...</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a2 2 0 002 2h14a2 2 0 002-2v-3" />
                </svg>
                <span className="hidden sm:inline">Download PPTX</span>
                <span className="sm:hidden">PPTX</span>
              </>
            )}
            </button>
          </div>
        </div>

        {/* ── Tab navigation (inside sticky header) ── */}
        <nav className="max-w-7xl mx-auto px-6 pb-2 flex gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`nav-tab flex items-center gap-1.5 whitespace-nowrap ${tab === t.id ? "nav-tab-active" : ""}`}
            >
              {TAB_ICONS[t.id]}
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {/* ── Tab content ── */}
      <div className="max-w-7xl mx-auto px-6 mt-4">

        {/* Article slides */}
        {tab === "article" && renderSlides(articleSlides, articleIdx, setArticleIdx)}

        {/* Architecture slides */}
        {tab === "architecture" && (
          <div className="fade-in">
            <SlideArchitecture />
            <div className="mt-8" />
            <SlideNonLocal />
          </div>
        )}

        {/* Weakness slides */}
        {tab === "weaknesses" && renderSlides(weaknessSlides, weakIdx, setWeakIdx)}

        {/* Improvement slides */}
        {tab === "improvements" && renderSlides(improvementSlides, impIdx, setImpIdx)}

        {/* Live Demo */}
        {tab === "demo" && (
          <div className="fade-in">
            {/* Controls */}
            <div className="card mb-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" style={{ color: "var(--accent)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                Live Comparison Tool
              </h2>
              <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
                Upload an image or pick a sample, choose a task/variant/level, then hit Compare to run both models. Use ← → to navigate slides.
              </p>
              {!options ? (
                <div className="flex gap-4">
                  <Skeleton className="h-10 w-32 rounded-lg" />
                  <Skeleton className="h-10 w-32 rounded-lg" />
                  <Skeleton className="h-10 w-24 rounded-lg" />
                  <Skeleton className="h-10 w-28 rounded-lg" />
                </div>
              ) : (
                <div className="flex flex-wrap gap-4 items-end">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Task</label>
                    <select className="select-field" value={task} onChange={(e) => setTask(e.target.value)}>
                      {options.tasks.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Model Variant</label>
                    <select className="select-field" value={variant} onChange={(e) => setVariant(e.target.value)}>
                      {options.variants.map((v) => (
                        <option key={v.value} value={v.value}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>{currentTask?.level_label || "Level"}</label>
                    <select className="select-field" value={level} onChange={(e) => setLevel(Number(e.target.value))}>
                      {levels.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <button className="btn-primary" disabled={!file || loading} onClick={process}>
                    {loading ? "Processing..." : "Compare"}
                  </button>
                  {history.length > 0 && (
                    <button
                      className="icon-btn relative"
                      onClick={() => setShowHistory(!showHistory)}
                      title="Show history"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      <span className="history-badge">{history.length}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* History panel */}
            {showHistory && history.length > 0 && (
              <div className="card mb-6 slide-down">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <svg className="w-4 h-4" style={{ color: "var(--accent)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    Comparison History
                  </h3>
                  <button onClick={() => { setHistory([]); setShowHistory(false); }} className="text-xs" style={{ color: "var(--text-muted)" }}>Clear all</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {history.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => { setResult(h.result); setShowHistory(false); }}
                      className="text-left p-2 rounded-lg text-xs hover:scale-[1.02] transition-transform"
                      style={{ background: "var(--bg-alt)", border: "1px solid var(--border)" }}
                    >
                      <div className="font-semibold">{h.result.task === "dn_gray" ? "Denoise" : "CAR"} COLA-{h.result.variant}</div>
                      <div style={{ color: "var(--text-muted)" }}>
                        Old: {h.result.old_psnr} dB → New: {h.result.new_psnr} dB
                        <span className="ml-1" style={{ color: h.result.new_psnr >= h.result.old_psnr ? "var(--green)" : "var(--red)" }}>
                          ({h.result.new_psnr >= h.result.old_psnr ? "+" : ""}{(h.result.new_psnr - h.result.old_psnr).toFixed(2)})
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Upload + Sample selection */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                <div
                  className="card cursor-pointer flex flex-col items-center justify-center min-h-[200px] border-dashed hover:border-blue-500 transition-colors"
                  onDrop={onDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileRef.current?.click()}
                >
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
                  {preview ? (
                    <img src={preview} alt="preview" className="max-h-48 rounded" style={{ imageRendering: "auto" }} />
                  ) : (
                    <>
                      <svg className="w-12 h-12 mb-3" style={{ color: "var(--text-muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16v-8m0 0l-3 3m3-3l3 3M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                      </svg>
                      <p className="text-sm" style={{ color: "var(--text-muted)" }}>Drop an image here or click to upload</p>
                    </>
                  )}
                </div>
              </div>
              <div className="card">
                <h3 className="text-sm font-medium mb-3">Sample Images (Set12)</h3>
                {samples.length === 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 rounded" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {samples.map((s) => (
                      <button
                        key={s.name}
                        onClick={() => loadSample(s.name)}
                        className="text-xs px-2 py-1.5 rounded border transition-all hover:border-blue-500 hover:scale-105"
                        style={{ background: "var(--sample-btn-bg)", borderColor: "var(--border)", color: "var(--text-muted)" }}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="card mb-6 slide-down" style={{ borderColor: "var(--red)", background: "var(--red-dim)" }}>
                <p className="hl-red text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                  {error}
                </p>
              </div>
            )}

            {/* Animated loading with progress steps */}
            {loading && (
              <div className="card mb-6 py-8 fade-in">
                <div className="flex flex-col items-center gap-4">
                  <div className="processing-spinner" />
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-sm font-medium">{PROCESS_STEPS[processStep]}</span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>This may take a moment on CPU</span>
                  </div>
                  <div className="flex gap-1 mt-2">
                    {PROCESS_STEPS.map((step, i) => (
                      <div
                        key={step}
                        className="process-step-dot"
                        style={{
                          background: i <= processStep ? "var(--accent)" : "var(--border)",
                          transform: i === processStep ? "scale(1.3)" : "scale(1)",
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2 mt-1">
                    {PROCESS_STEPS.map((step, i) => (
                      <span
                        key={step}
                        className="text-[9px] w-14 text-center transition-colors"
                        style={{ color: i <= processStep ? "var(--accent)" : "var(--text-dim)" }}
                      >
                        {step.split(" ").slice(-1)[0]}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="fade-in">
                {/* ── Winner banner ── */}
                <div
                  className="winner-banner mb-6"
                  style={{
                    borderColor: winner === "new" ? "var(--green)" : winner === "old" ? "var(--orange)" : "var(--accent)",
                    background: winner === "new" ? "var(--green-dim)" : winner === "old" ? "var(--orange-dim)" : "var(--accent-dim)",
                  }}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    {winner === "new" ? (
                      <>
                        <span className="winner-icon" style={{ background: "var(--green)", color: "white" }}>✓ New wins</span>
                        <span className="text-sm">
                          <strong>New COLA-{result.variant}</strong> beats old by <strong className="hl-green">+{psnrDiff} dB</strong> PSNR and <strong className="hl-green">+{ssimDiff}</strong> SSIM
                        </span>
                      </>
                    ) : winner === "old" ? (
                      <>
                        <span className="winner-icon" style={{ background: "var(--orange)", color: "white" }}>Old leads</span>
                        <span className="text-sm">
                          <strong>Old COLA-{result.variant}</strong> leads by <strong className="hl-orange">+{psnrDiff} dB</strong> PSNR
                          {result.new_pretrained ? " — gap narrows with more GPU training epochs" : " — new model needs training"}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="winner-icon" style={{ background: "var(--accent)", color: "white" }}>Tie</span>
                        <span className="text-sm">Both models produced identical PSNR</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Metrics */}
                <div className="card mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Metrics Comparison</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadComposite(result)}
                        className="icon-btn"
                        title="Download comparison image"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <h3 className="text-xs font-medium mb-2 text-center" style={{ color: "var(--text-muted)" }}>Degraded Input</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <Metric label="PSNR" value={result.degraded_psnr} unit="dB" />
                        <Metric label="SSIM" value={result.degraded_ssim} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium mb-2 text-center" style={{ color: "var(--text-muted)" }}>
                        Old Model{" "}
                        {result.old_pretrained
                          ? <span className="badge badge-green"><span className="mr-0.5">✓</span>pretrained</span>
                          : <span className="badge badge-yellow"><span className="mr-0.5">✗</span>untrained</span>}
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        <Metric label="PSNR" value={result.old_psnr} unit="dB" highlight={result.old_psnr > result.new_psnr ? "green" : "none"} />
                        <Metric label="SSIM" value={result.old_ssim} highlight={result.old_ssim > result.new_ssim ? "green" : "none"} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium mb-2 text-center" style={{ color: "var(--text-muted)" }}>
                        New Model{" "}
                        {result.new_pretrained
                          ? <span className="badge badge-blue"><span className="mr-0.5">✓</span>trained (CPU)</span>
                          : <span className="badge badge-yellow"><span className="mr-0.5">✗</span>untrained</span>}
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        <Metric label="PSNR" value={result.new_psnr} unit="dB" highlight={result.new_psnr > result.old_psnr ? "green" : "none"} />
                        <Metric label="SSIM" value={result.new_ssim} highlight={result.new_ssim > result.old_ssim ? "green" : "none"} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium mb-2 text-center" style={{ color: "var(--text-muted)" }}>Architecture</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <Metric label="Old Params" value={result.old_params} unit="M" />
                        <Metric label="New Params" value={result.new_params} unit="M" />
                      </div>
                    </div>
                  </div>
                  {/* Timing bars */}
                  <div className="flex flex-col sm:flex-row gap-4 mt-2">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: "var(--text-muted)" }}>Old inference</span>
                        <span>{result.old_time_ms} ms</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bar-track)" }}>
                        <div className="h-full rounded-full bar-animate" style={{ width: `${Math.min(100, (result.old_time_ms / Math.max(result.old_time_ms, result.new_time_ms)) * 100)}%`, background: "var(--orange)" }} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: "var(--text-muted)" }}>New inference</span>
                        <span>{result.new_time_ms} ms</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bar-track)" }}>
                        <div className="h-full rounded-full bar-animate" style={{ width: `${Math.min(100, (result.new_time_ms / Math.max(result.old_time_ms, result.new_time_ms)) * 100)}%`, background: "var(--accent)" }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* View mode toggle + image grid */}
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold">Visual Results</h3>
                  <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "var(--bg-alt)", border: "1px solid var(--border)" }}>
                    <button
                      onClick={() => setCompareMode("grid")}
                      className={`px-3 py-1 text-xs rounded-md transition-all ${compareMode === "grid" ? "font-semibold" : ""}`}
                      style={{ background: compareMode === "grid" ? "var(--accent)" : "transparent", color: compareMode === "grid" ? "white" : "var(--text-muted)" }}
                    >
                      Grid
                    </button>
                    <button
                      onClick={() => setCompareMode("slider")}
                      className={`px-3 py-1 text-xs rounded-md transition-all ${compareMode === "slider" ? "font-semibold" : ""}`}
                      style={{ background: compareMode === "slider" ? "var(--accent)" : "transparent", color: compareMode === "slider" ? "white" : "var(--text-muted)" }}
                    >
                      Slider
                    </button>
                  </div>
                </div>

                {compareMode === "grid" ? (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <ImagePanel
                      title="Original (Clean)" src={result.original}
                      onZoom={(s, a) => setLightbox({ src: s, alt: a })}
                    />
                    <ImagePanel
                      title={result.task === "dn_gray" ? `Noisy (σ=${result.level})` : `JPEG (q=${result.level})`}
                      src={result.degraded}
                      onZoom={(s, a) => setLightbox({ src: s, alt: a })}
                    />
                    <ImagePanel
                      title={`Old COLA-${result.variant}`} src={result.old_result}
                      badge={result.old_pretrained ? "pretrained" : "untrained"}
                      badgeColor={result.old_pretrained ? "green" : "yellow"}
                      onZoom={(s, a) => setLightbox({ src: s, alt: a })}
                    />
                    <ImagePanel
                      title={`New COLA-${result.variant}`} src={result.new_result}
                      badge={result.new_pretrained ? "trained (CPU)" : "untrained"}
                      badgeColor={result.new_pretrained ? "blue" : "yellow"}
                      onZoom={(s, a) => setLightbox({ src: s, alt: a })}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ImageCompare
                      leftSrc={result.degraded}
                      rightSrc={result.old_result}
                      leftLabel={result.task === "dn_gray" ? `Noisy σ=${result.level}` : `JPEG q=${result.level}`}
                      rightLabel={`Old COLA-${result.variant}`}
                      rightBadge={result.old_pretrained ? "pretrained" : "untrained"}
                      rightBadgeColor={result.old_pretrained ? "var(--green)" : "var(--yellow)"}
                    />
                    <ImageCompare
                      leftSrc={result.old_result}
                      rightSrc={result.new_result}
                      leftLabel={`Old COLA-${result.variant}`}
                      leftBadge={result.old_pretrained ? "pretrained" : undefined}
                      leftBadgeColor="var(--orange)"
                      rightLabel={`New COLA-${result.variant}`}
                      rightBadge={result.new_pretrained ? "trained (CPU)" : "untrained"}
                      rightBadgeColor={result.new_pretrained ? "var(--accent)" : "var(--yellow)"}
                    />
                  </div>
                )}

                {/* Training Info & GPU Explanation */}
                {trainingInfo && (
                  <div className="card mt-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      Training Details &amp; GPU Explanation
                    </h2>

                    {/* Training stats for matched model */}
                    {(() => {
                      const key = `${result.task}_${result.variant}`;
                      const entry = trainingInfo.trained_models[key];
                      if (!entry?.has_checkpoint) return null;
                      return (
                        <div className="mb-5 p-4 rounded-lg" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <span className="badge badge-blue"><span className="mr-0.5">✓</span>CPU-Trained</span>
                            New COLA-{result.variant} — {entry.experiment}
                          </h3>
                          <div className="grid grid-cols-3 gap-4 mb-3">
                            <Metric label="Best PSNR" value={entry.best_psnr ?? "—"} unit="dB" highlight="green" />
                            <Metric label="Best Epoch" value={entry.best_epoch ?? "—"} />
                            <Metric label="Total Epochs" value={entry.total_epochs ?? "—"} />
                          </div>
                          {entry.training_log.length > 0 && (
                            <details className="mt-2">
                              <summary className="text-xs cursor-pointer" style={{ color: "var(--text-muted)" }}>
                                Show epoch-by-epoch training log ({entry.training_log.length} epochs)
                              </summary>
                              <div className="mt-2 max-h-48 overflow-y-auto text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                                <table className="w-full">
                                  <thead>
                                    <tr className="text-left" style={{ borderBottom: "1px solid var(--border)" }}>
                                      <th className="pr-3 pb-1">Epoch</th>
                                      <th className="pr-3 pb-1">LR</th>
                                      <th className="pr-3 pb-1">Loss</th>
                                      <th className="pr-3 pb-1">TrainPSNR</th>
                                      <th className="pr-3 pb-1">ValPSNR</th>
                                      <th className="pb-1">ValSSIM</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {entry.training_log.map((row, i) => (
                                      <tr key={i} style={{ borderBottom: "1px solid var(--border)", opacity: row["ValPSNR"] === String(entry.best_psnr) ? 1 : 0.7 }}>
                                        <td className="pr-3 py-0.5">{row["Epoch"] || i + 1}</td>
                                        <td className="pr-3 py-0.5">{row["LR"] || "—"}</td>
                                        <td className="pr-3 py-0.5">{row["TrainLoss"] || "—"}</td>
                                        <td className="pr-3 py-0.5">{row["TrainPSNR"] || "—"}</td>
                                        <td className="pr-3 py-0.5 font-semibold">{row["ValPSNR"] || "—"}</td>
                                        <td className="py-0.5">{row["ValSSIM"] || "—"}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </details>
                          )}
                        </div>
                      );
                    })()}

                    {/* GPU vs CPU explanation */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <svg className="w-4 h-4" style={{ color: "var(--orange)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          Current Limitations (CPU Training)
                        </h3>
                        <ul className="space-y-1.5">
                          {trainingInfo.gpu_explanation.limitations.map((l, i) => (
                            <li key={i} className="text-xs flex gap-2" style={{ color: "var(--text-muted)" }}>
                              <span style={{ color: "var(--orange)" }}>⚠</span> {l}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-4 rounded-lg" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <svg className="w-4 h-4" style={{ color: "var(--green)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                          With GPU Training
                        </h3>
                        <ul className="space-y-1.5">
                          {trainingInfo.gpu_explanation.gpu_benefits.map((b, i) => (
                            <li key={i} className="text-xs flex gap-2" style={{ color: "var(--text-muted)" }}>
                              <span style={{ color: "var(--green)" }}>✓</span> {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-4 p-3 rounded-lg text-xs" style={{ background: "var(--accent-dim)", border: "1px solid var(--accent)", color: "var(--text)" }}>
                      <strong>Bottom line:</strong> {trainingInfo.gpu_explanation.expected_improvement}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Lightbox overlay ── */}
      {lightbox && (
        <Lightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />
      )}

      {/* ── Keyboard hint ── */}
      {(tab === "article" || tab === "weaknesses" || tab === "improvements") && (
        <div className="keyboard-hint">
          <kbd>←</kbd> <kbd>→</kbd> Navigate slides
        </div>
      )}
    </main>
  );
}
