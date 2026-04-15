"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { API_BASE } from "../lib/api";

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

/* ── Tab definition ──────────────────────────────────────────────────── */
const TABS = [
  { id: "article", label: "Article" },
  { id: "architecture", label: "Architecture" },
  { id: "weaknesses", label: "Weaknesses" },
  { id: "improvements", label: "Improvements" },
  { id: "demo", label: "Live Demo" },
] as const;
type TabId = (typeof TABS)[number]["id"];

/* ── Metric Card ─────────────────────────────────────────────────────── */
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
  return (
    <div className="metric-card">
      <div className={`metric-value ${color}`}>
        {value}
        {unit && <span className="text-sm ml-0.5">{unit}</span>}
      </div>
      <div className="metric-label">{label}</div>
    </div>
  );
}

/* ── Image Panel ─────────────────────────────────────────────────────── */
function ImagePanel({
  title,
  src,
  badge,
  badgeColor,
}: {
  title: string;
  src: string;
  badge?: string;
  badgeColor?: "green" | "yellow" | "blue";
}) {
  const badgeCls = badgeColor === "green" ? "badge-green" : badgeColor === "blue" ? "badge-blue" : "badge-yellow";
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{title}</span>
        {badge && (
          <span className={`badge ${badgeCls}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="img-container">
        <img src={`data:image/png;base64,${src}`} alt={title} />
      </div>
    </div>
  );
}

/* ── Slide wrapper for prev/next navigation ──────────────────────────── */
function SlideNav({
  current,
  total,
  onPrev,
  onNext,
}: {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
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
      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
        Slide {current + 1} of {total}
      </span>
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

  useEffect(() => {
    fetch(`${API_BASE}/api/options`)
      .then((r) => r.json())
      .then(setOptions)
      .catch(() => {});
    fetch(`${API_BASE}/api/sample-images`)
      .then((r) => r.json())
      .then((d) => setSamples(d.samples || []))
      .catch(() => {});
    fetch(`${API_BASE}/api/training-info`)
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
      const res = await fetch(`${API_BASE}/api/sample-images/${name}`);
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
    const fd = new FormData();
    fd.append("file", file);
    fd.append("task", task);
    fd.append("variant", variant);
    fd.append("level", String(level));
    try {
      const res = await fetch(`${API_BASE}/api/process`, { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || "Processing failed");
      }
      setResult(await res.json());
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

  /* ── Render current slide for a tab ── */
  function renderSlides(
    slides: React.FC[],
    idx: number,
    setIdx: (n: number) => void
  ) {
    const Slide = slides[idx];
    return (
      <>
        <Slide />
        <SlideNav
          current={idx}
          total={slides.length}
          onPrev={() => setIdx(Math.max(0, idx - 1))}
          onNext={() => setIdx(Math.min(slides.length - 1, idx + 1))}
        />
      </>
    );
  }

  return (
    <main className="min-h-screen p-6 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">COLA-Net</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Collaborative Attention Network for Image Restoration — Analysis, Weaknesses &amp; Improvements
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-lg transition-all"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
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
            className="btn-primary flex items-center gap-2"
          >
          {exporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
              Generating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a2 2 0 002 2h14a2 2 0 002-2v-3" />
              </svg>
              Download PPTX
            </>
          )}
          </button>
        </div>
      </div>

      {/* ── Tab navigation ── */}
      <nav className="flex gap-1 mb-8 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`nav-tab ${tab === t.id ? "nav-tab-active" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* ── Tab content ── */}

      {/* Article slides */}
      {tab === "article" && renderSlides(articleSlides, articleIdx, setArticleIdx)}

      {/* Architecture slides (same as article architecture + non-local detail) */}
      {tab === "architecture" && (
        <>
          <SlideArchitecture />
          <div className="mt-8" />
          <SlideNonLocal />
        </>
      )}

      {/* Weakness slides */}
      {tab === "weaknesses" && renderSlides(weaknessSlides, weakIdx, setWeakIdx)}

      {/* Improvement slides */}
      {tab === "improvements" && renderSlides(improvementSlides, impIdx, setImpIdx)}

      {/* Live Demo */}
      {tab === "demo" && (
        <>
          {/* Controls */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold mb-4">Live Comparison Tool</h2>
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
              Upload an image or pick a sample, choose a task/variant/level, then hit Compare to run both models.
            </p>
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Task</label>
                <select className="select-field" value={task} onChange={(e) => setTask(e.target.value)}>
                  {options?.tasks.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Model Variant</label>
                <select className="select-field" value={variant} onChange={(e) => setVariant(e.target.value)}>
                  {options?.variants.map((v) => (
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
            </div>
          </div>

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
              <div className="grid grid-cols-4 gap-2">
                {samples.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => loadSample(s.name)}
                    className="text-xs px-2 py-1.5 rounded border transition-colors hover:border-blue-500"
                    style={{ background: "var(--sample-btn-bg)", borderColor: "var(--border)", color: "var(--text-muted)" }}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="card mb-6" style={{ borderColor: "var(--red)", background: "var(--red-dim)" }}>
              <p className="hl-red text-sm">{error}</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="card mb-6 flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
              <span className="ml-4 text-sm" style={{ color: "var(--text-muted)" }}>Running both models... may take a moment on CPU</span>
            </div>
          )}

          {/* Results */}
          {result && (
            <>
              <div className="card mb-6">
                <h2 className="text-lg font-semibold mb-4">Metrics Comparison</h2>
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
                      {result.old_pretrained ? <span className="badge badge-green ml-1">pretrained</span> : <span className="badge badge-yellow ml-1">untrained</span>}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Metric label="PSNR" value={result.old_psnr} unit="dB" highlight={result.old_psnr > result.new_psnr ? "green" : "none"} />
                      <Metric label="SSIM" value={result.old_ssim} highlight={result.old_ssim > result.new_ssim ? "green" : "none"} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-medium mb-2 text-center" style={{ color: "var(--text-muted)" }}>
                      New Model{" "}
                      {result.new_pretrained ? <span className="badge badge-blue ml-1">trained (CPU)</span> : <span className="badge badge-yellow ml-1">untrained</span>}
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
                <div className="flex gap-4 mt-2">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "var(--text-muted)" }}>Old inference</span>
                      <span>{result.old_time_ms} ms</span>
                    </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bar-track)" }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, (result.old_time_ms / Math.max(result.old_time_ms, result.new_time_ms)) * 100)}%`, background: "var(--orange)" }} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "var(--text-muted)" }}>New inference</span>
                      <span>{result.new_time_ms} ms</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bar-track)" }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, (result.new_time_ms / Math.max(result.old_time_ms, result.new_time_ms)) * 100)}%`, background: "var(--accent)" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Image grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <ImagePanel title="Original (Clean)" src={result.original} />
                <ImagePanel title={result.task === "dn_gray" ? `Noisy (σ=${result.level})` : `JPEG (q=${result.level})`} src={result.degraded} />
                <ImagePanel title={`Old COLA-${result.variant}`} src={result.old_result} badge={result.old_pretrained ? "pretrained" : "untrained"} badgeColor={result.old_pretrained ? "green" : "yellow"} />
                <ImagePanel title={`New COLA-${result.variant}`} src={result.new_result} badge={result.new_pretrained ? "trained (CPU)" : "untrained"} badgeColor={result.new_pretrained ? "blue" : "yellow"} />
              </div>

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
                          <span className="badge badge-blue">CPU-Trained</span>
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
                            <span style={{ color: "var(--orange)" }}>•</span> {l}
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
            </>
          )}
        </>
      )}
    </main>
  );
}
