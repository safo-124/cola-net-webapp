"use client";

/**
 * Generates a professional light-mode PowerPoint presentation
 * from the COLA-Net analysis with polished layouts and detail.
 */
import PptxGenJS from "pptxgenjs";
import { getFigBase64 } from "./FigImage";

/* ── Light-mode color palette ──────────────────────────────────────── */
const BG       = "FFFFFF";
const LIGHT_BG = "F8FAFC";  // subtle off-white for content areas
const CARD_BG  = "F1F5F9";  // card/panel background
const ACCENT   = "2563EB";  // blue
const ACCENT2  = "1E40AF";  // darker blue
const GREEN    = "059669";  // emerald
const GREEN_BG = "ECFDF5";
const RED      = "DC2626";
const RED_BG   = "FEF2F2";
const ORANGE   = "EA580C";
const ORANGE_BG= "FFF7ED";
const YELLOW   = "CA8A04";
const YELLOW_BG= "FEFCE8";
const PURPLE   = "7C3AED";
const PURPLE_BG= "F5F3FF";
const TEXT      = "1E293B";  // dark slate
const TEXT_MED  = "475569";  // medium gray
const TEXT_LIGHT= "94A3B8";  // light gray
const BORDER   = "E2E8F0";
const DIVIDER  = "CBD5E1";
const W = 13.33;
const H = 7.5;
const FONT = "Segoe UI";

/* ── Decoration helpers ────────────────────────────────────────────── */
function addAccentBar(s: any, y = 0, h = 0.06) {
  s.addShape("rect" as any, { x: 0, y, w: W, h, fill: { color: ACCENT } });
}
function addFooter(s: any, slideNum: number, total: number) {
  s.addText(`COLA-Net — Analysis, Weaknesses & Improvements`, {
    x: 0.5, y: H - 0.4, w: 8, h: 0.3,
    fontSize: 7, color: TEXT_LIGHT, fontFace: FONT,
  });
  s.addText(`${slideNum} / ${total}`, {
    x: W - 1.5, y: H - 0.4, w: 1, h: 0.3,
    fontSize: 7, color: TEXT_LIGHT, fontFace: FONT, align: "right",
  });
}
function addSectionStripe(s: any, label: string) {
  s.addShape("rect" as any, { x: 0, y: 0, w: W, h: 1.1, fill: { color: ACCENT } });
  s.addText(label, {
    x: 0.6, y: 0.15, w: 10, h: 0.8,
    fontSize: 28, bold: true, color: "FFFFFF", fontFace: FONT,
  });
}
function addTitle(s: any, title: string, subtitle?: string) {
  addAccentBar(s);
  s.addText(title, {
    x: 0.6, y: 0.25, w: 11, h: 0.65,
    fontSize: 24, bold: true, color: TEXT, fontFace: FONT,
  });
  if (subtitle) {
    s.addText(subtitle, {
      x: 0.6, y: 0.85, w: 11, h: 0.35,
      fontSize: 12, color: TEXT_MED, fontFace: FONT, italic: true,
    });
  }
}
function addBullets(s: any, items: string[], opts: { x: number; y: number; w: number; h?: number; fontSize?: number }) {
  s.addText(
    items.map((t) => ({ text: t, options: { bullet: true, breakLine: true } })),
    {
      x: opts.x, y: opts.y, w: opts.w, h: opts.h ?? 4,
      fontSize: opts.fontSize ?? 11, color: TEXT_MED, fontFace: FONT,
      lineSpacing: 22, valign: "top",
    }
  );
}

/* ── Panel (rounded-looking card via filled rect) ────────────────── */
function addPanel(s: any, x: number, y: number, w: number, h: number, opts?: { fill?: string; border?: string }) {
  s.addShape("roundRect" as any, {
    x, y, w, h,
    fill: { color: opts?.fill ?? CARD_BG },
    line: { color: opts?.border ?? BORDER, width: 0.75 },
    rectRadius: 0.1,
  });
}

/* ── Image from base64 ───────────────────────────────────────────── */
async function addFig(
  s: any,
  name: string,
  opts: { x: number; y: number; w: number; h: number; shadow?: boolean }
) {
  const fig = await getFigBase64(name);
  if (!fig) return;
  if (opts.shadow) {
    s.addShape("rect" as any, {
      x: opts.x + 0.04, y: opts.y + 0.04, w: opts.w, h: opts.h,
      fill: { color: "E2E8F0" },
    });
  }
  s.addImage({
    data: `data:${fig.mime};base64,${fig.data}`,
    x: opts.x, y: opts.y, w: opts.w, h: opts.h,
  });
}

/* ── Styled table ────────────────────────────────────────────────── */
function addTable(s: any, rows: any[], opts: { x: number; y: number; w: number; rowH?: number }) {
  s.addTable(rows, {
    x: opts.x, y: opts.y, w: opts.w,
    fontSize: 9, color: TEXT, fontFace: FONT,
    border: { type: "solid", color: BORDER, pt: 0.5 },
    rowH: opts.rowH ?? 0.32,
    colW: Array(rows[0]?.length || 3).fill(opts.w / (rows[0]?.length || 3)),
    autoPage: false,
  });
}

/* ── Header row helper ────────────────────────────────────────────── */
function hdrCell(text: string, extraOpts: any = {}) {
  return { text, options: { bold: true, fill: { color: ACCENT }, color: "FFFFFF", fontSize: 10, ...extraOpts } };
}
function altRow(i: number) {
  return i % 2 === 0 ? LIGHT_BG : BG;
}

/* ═══════════════════════════════════════════════════════════════════
   Main export
   ═══════════════════════════════════════════════════════════════════ */
const TOTAL_SLIDES = 16;

export async function generatePPTX(): Promise<void> {
  const pptx = new PptxGenJS();
  pptx.author = "Emmanuel Safo Acheampong";
  pptx.title = "COLA-Net: Analysis, Weaknesses & Improvements";
  pptx.subject = "Deep Learning Image Restoration";
  pptx.layout = "LAYOUT_WIDE"; // 13.33 × 7.5

  pptx.defineSlideMaster({
    title: "LIGHT_MASTER",
    background: { color: BG },
  } as any);

  let sn = 0;

  /* ══════════════════════════════════════════════════════════════════
     SLIDE 1 — TITLE
     ══════════════════════════════════════════════════════════════════ */
  {
    sn++;
    const s = pptx.addSlide({ masterName: "LIGHT_MASTER" });
    // Top accent band
    s.addShape("rect" as any, { x: 0, y: 0, w: W, h: 2.8, fill: { color: ACCENT } });
    // Bottom subtle stripe
    s.addShape("rect" as any, { x: 0, y: 2.8, w: W, h: 0.06, fill: { color: ACCENT2 } });
    // Title text
    s.addText("COLA-Net", {
      x: 0.8, y: 0.5, w: 11, h: 1.2,
      fontSize: 52, bold: true, color: "FFFFFF", fontFace: FONT,
    });
    s.addText("Collaborative Attention Network\nfor Image Restoration", {
      x: 0.8, y: 1.5, w: 11, h: 1.0,
      fontSize: 22, color: "FFFFFFCC", fontFace: FONT, lineSpacing: 30,
    });
    // Content below band
    s.addText("Paper Analysis  •  Weakness Identification  •  Improvements  •  Live Comparison", {
      x: 0.8, y: 3.3, w: 11, h: 0.5,
      fontSize: 15, color: TEXT, fontFace: FONT, bold: true,
    });
    s.addText("Chong Mou, Jian Zhang, Zongsheng Yue, and Lei Zhang", {
      x: 0.8, y: 4.0, w: 11, h: 0.4,
      fontSize: 13, color: TEXT_MED, fontFace: FONT,
    });
    s.addText("IEEE Transactions on Multimedia, 2021", {
      x: 0.8, y: 4.35, w: 11, h: 0.35,
      fontSize: 11, color: TEXT_LIGHT, fontFace: FONT, italic: true,
    });
    // Presenter info
    s.addText("Presented by:  Emmanuel Safo Acheampong   |   Student ID: 153058678", {
      x: 0.8, y: 4.75, w: 11, h: 0.35,
      fontSize: 12, color: ACCENT, fontFace: FONT, bold: true,
    });
    // Three task badges
    const badges = [
      { label: "Grayscale Denoising", icon: "σ", bg: PURPLE_BG, c: PURPLE },
      { label: "JPEG Artifact Removal", icon: "Q", bg: ORANGE_BG, c: ORANGE },
      { label: "Real-World Denoising", icon: "R", bg: GREEN_BG, c: GREEN },
    ];
    badges.forEach((b, i) => {
      const bx = 0.8 + i * 3.8;
      addPanel(s, bx, 5.2, 3.4, 0.9, { fill: b.bg, border: b.c });
      s.addText(b.icon, {
        x: bx + 0.2, y: 5.3, w: 0.5, h: 0.5,
        fontSize: 18, bold: true, color: b.c, fontFace: FONT, align: "center",
      });
      s.addText(b.label, {
        x: bx + 0.7, y: 5.35, w: 2.5, h: 0.6,
        fontSize: 11, color: TEXT, fontFace: FONT, bold: true, valign: "middle",
      });
    });
    addFooter(s, sn, TOTAL_SLIDES);
  }

  /* ══════════════════════════════════════════════════════════════════
     SLIDE 2 — TABLE OF CONTENTS
     ══════════════════════════════════════════════════════════════════ */
  {
    sn++;
    const s = pptx.addSlide({ masterName: "LIGHT_MASTER" });
    addTitle(s, "Agenda");
    const sections = [
      { num: "01", title: "Paper Overview", desc: "Problem formulation, key insights, and contributions", color: ACCENT },
      { num: "02", title: "Architecture Deep-Dive", desc: "Network structure, attention mechanisms, and heatmaps", color: PURPLE },
      { num: "03", title: "Results & Visual Comparisons", desc: "Quantitative metrics and qualitative examples", color: GREEN },
      { num: "04", title: "Weaknesses Analysis", desc: "9 paper weaknesses + 6 code bugs identified", color: RED },
      { num: "05", title: "Our Improvements", desc: "10 targeted fixes with before/after comparison", color: ORANGE },
      { num: "06", title: "Summary & Conclusion", desc: "Key takeaways and future directions", color: TEXT },
    ];
    sections.forEach((sec, i) => {
      const sy = 1.35 + i * 0.9;
      addPanel(s, 0.6, sy, 12, 0.75, { fill: LIGHT_BG });
      s.addText(sec.num, {
        x: 0.8, y: sy + 0.1, w: 0.7, h: 0.5,
        fontSize: 20, bold: true, color: sec.color, fontFace: FONT,
      });
      s.addText(sec.title, {
        x: 1.6, y: sy + 0.05, w: 5, h: 0.35,
        fontSize: 14, bold: true, color: TEXT, fontFace: FONT,
      });
      s.addText(sec.desc, {
        x: 1.6, y: sy + 0.37, w: 10, h: 0.3,
        fontSize: 10, color: TEXT_LIGHT, fontFace: FONT,
      });
    });
    addFooter(s, sn, TOTAL_SLIDES);
  }

  /* ══════════════════════════════════════════════════════════════════
     SLIDE 3 — PAPER OVERVIEW
     ══════════════════════════════════════════════════════════════════ */
  {
    sn++;
    const s = pptx.addSlide({ masterName: "LIGHT_MASTER" });
    addSectionStripe(s, "01  Paper Overview");

    // Left column — problem
    addPanel(s, 0.5, 1.3, 6, 5.5);
    s.addText("Problem Formulation", {
      x: 0.7, y: 1.45, w: 5, h: 0.4,
      fontSize: 15, bold: true, color: TEXT, fontFace: FONT,
    });
    s.addText("y  =  A · x  +  n", {
      x: 0.7, y: 2.0, w: 5.5, h: 0.45,
      fontSize: 18, bold: true, color: ACCENT, fontFace: FONT, align: "center",
    });
    s.addText("where y = degraded observation, x = clean image,\nA = degradation operator, n = additive noise", {
      x: 0.7, y: 2.5, w: 5.5, h: 0.6,
      fontSize: 10, color: TEXT_MED, fontFace: FONT, align: "center", lineSpacing: 16,
    });
    addBullets(s, [
      "Grayscale denoising: A = I,  σ ∈ {10, 15, 25, 50, 70}",
      "JPEG artifact removal: q ∈ {10, 20, 30, 40}",
      "Real-world denoising: unknown noise distribution (DND benchmark)",
      "Goal: learn f_θ(y) ≈ x using deep collaborative attention",
    ], { x: 0.7, y: 3.3, w: 5.5, h: 3.2, fontSize: 10 });

    // Right column — key insight
    addPanel(s, 6.8, 1.3, 6, 2.4, { fill: PURPLE_BG, border: PURPLE });
    s.addText("Key Insight", {
      x: 7.0, y: 1.45, w: 5, h: 0.4,
      fontSize: 15, bold: true, color: PURPLE, fontFace: FONT,
    });
    s.addText(
      "Local attention (SK-Net) excels at complex textures.\n" +
      "Non-local attention (patch similarity) excels at repetitive patterns.\n" +
      "COLA-Net adaptively fuses both via a learned merge unit.",
      {
        x: 7.0, y: 1.95, w: 5.5, h: 1.5,
        fontSize: 10, color: TEXT_MED, fontFace: FONT, lineSpacing: 18, valign: "top",
      }
    );

    // Right column — contributions
    addPanel(s, 6.8, 3.95, 6, 2.85, { fill: GREEN_BG, border: GREEN });
    s.addText("Contributions", {
      x: 7.0, y: 4.1, w: 5, h: 0.35,
      fontSize: 15, bold: true, color: GREEN, fontFace: FONT,
    });
    addBullets(s, [
      "First to combine local + non-local attention in a single block (CAB)",
      "Patch-based non-local attention: more noise-robust than pixel-based",
      "Adaptive fusion: merge unit learns per-pixel weighting",
      "SOTA on all 3 tasks with only 1.10M (B) / 1.88M (E) parameters",
    ], { x: 7.0, y: 4.5, w: 5.5, h: 2.2, fontSize: 10 });

    addFooter(s, sn, TOTAL_SLIDES);
  }

  /* ══════════════════════════════════════════════════════════════════
     SLIDE 4 — NETWORK ARCHITECTURE
     ══════════════════════════════════════════════════════════════════ */
  {
    sn++;
    const s = pptx.addSlide({ masterName: "LIGHT_MASTER" });
    addTitle(s, "Network Architecture", "Figure 1 — Overall structure of COLA-Net");

    addPanel(s, 0.4, 1.25, 12.5, 4.9);
    await addFig(s, "network.PNG", { x: 0.6, y: 1.4, w: 12.1, h: 4.5, shadow: true });

    // Caption bar
    addPanel(s, 0.4, 6.3, 12.5, 0.8, { fill: LIGHT_BG });
    s.addText(
      "Input → Conv → 4 × Collaborative Attention Block (CAB) → Conv → + Skip → Output.  " +
      "Each CAB: DnCNN feature extraction → parallel SK (local) + Patch NL (non-local) → Merge unit fusion.",
      {
        x: 0.6, y: 6.35, w: 12, h: 0.65,
        fontSize: 10, color: TEXT_MED, fontFace: FONT, valign: "middle",
      }
    );
    addFooter(s, sn, TOTAL_SLIDES);
  }

  /* ══════════════════════════════════════════════════════════════════
     SLIDE 5 — NON-LOCAL ATTENTION
     ══════════════════════════════════════════════════════════════════ */
  {
    sn++;
    const s = pptx.addSlide({ masterName: "LIGHT_MASTER" });
    addTitle(s, "Patch-wise Non-local Attention", "Figure 5 — Attention computation pipeline");

    addPanel(s, 0.4, 1.25, 12.5, 4.4);
    await addFig(s, "nl.PNG", { x: 0.6, y: 1.4, w: 12.1, h: 4.1, shadow: true });

    // Explanation boxes
    const steps = [
      { label: "1. Project", desc: "Q, K, V via 1×1 convolutions", bg: PURPLE_BG, c: PURPLE },
      { label: "2. Unfold", desc: "Extract overlapping 3D patches", bg: ORANGE_BG, c: ORANGE },
      { label: "3. Attend", desc: "softmax(V·Kᵀ) · Q → weighted", bg: ACCENT, c: "FFFFFF" },
      { label: "4. Fold", desc: "Reconstruct spatial feature map", bg: GREEN_BG, c: GREEN },
    ];
    steps.forEach((st, i) => {
      const sx = 0.5 + i * 3.15;
      addPanel(s, sx, 5.85, 2.95, 0.85, { fill: st.bg, border: st.c });
      s.addText(st.label, {
        x: sx + 0.15, y: 5.9, w: 2.6, h: 0.35,
        fontSize: 11, bold: true, color: st.c, fontFace: FONT,
      });
      s.addText(st.desc, {
        x: sx + 0.15, y: 6.25, w: 2.6, h: 0.35,
        fontSize: 9, color: TEXT_MED, fontFace: FONT,
      });
    });
    addFooter(s, sn, TOTAL_SLIDES);
  }

  /* ══════════════════════════════════════════════════════════════════
     SLIDE 6 — ATTENTION HEATMAPS
     ══════════════════════════════════════════════════════════════════ */
  {
    sn++;
    const s = pptx.addSlide({ masterName: "LIGHT_MASTER" });
    addTitle(s, "Attention Dependence Visualization", "Figure 2 — Local vs non-local attention demand");

    addPanel(s, 0.8, 1.25, 11.7, 4.3);
    await addFig(s, "heat.PNG", { x: 1.2, y: 1.4, w: 10.8, h: 4.0 });

    addPanel(s, 0.8, 5.75, 5.6, 1.1, { fill: ORANGE_BG, border: ORANGE });
    s.addText("Warm regions → Local attention", {
      x: 1.0, y: 5.85, w: 5, h: 0.35,
      fontSize: 11, bold: true, color: ORANGE, fontFace: FONT,
    });
    s.addText("Complex textures, edges, and fine details", {
      x: 1.0, y: 6.2, w: 5, h: 0.3,
      fontSize: 9, color: TEXT_MED, fontFace: FONT,
    });

    addPanel(s, 6.9, 5.75, 5.6, 1.1, { fill: PURPLE_BG, border: PURPLE });
    s.addText("Cool regions → Non-local attention", {
      x: 7.1, y: 5.85, w: 5, h: 0.35,
      fontSize: 11, bold: true, color: PURPLE, fontFace: FONT,
    });
    s.addText("Flat areas, sky, water — repetitive patterns", {
      x: 7.1, y: 6.2, w: 5, h: 0.3,
      fontSize: 9, color: TEXT_MED, fontFace: FONT,
    });
    addFooter(s, sn, TOTAL_SLIDES);
  }

  /* ══════════════════════════════════════════════════════════════════
     SLIDE 7 — KEY RESULTS TABLE
     ══════════════════════════════════════════════════════════════════ */
  {
    sn++;
    const s = pptx.addSlide({ masterName: "LIGHT_MASTER" });
    addSectionStripe(s, "03  Quantitative Results");

    const hdr: any = [
      hdrCell("Task"),
      hdrCell("Dataset"),
      hdrCell("Metric"),
      hdrCell("COLA-B"),
      hdrCell("COLA-E"),
    ];
    const data = [
      ["Gray σ=15", "BSD68", "PSNR/SSIM", "31.49/0.8903", "31.51/0.8910"],
      ["Gray σ=25", "Set12", "PSNR/SSIM", "30.90/0.8716", "30.90/0.8716"],
      ["Gray σ=25", "BSD68", "PSNR/SSIM", "29.42/0.8339", "29.46/0.8368"],
      ["Gray σ=25", "Urban100", "PSNR/SSIM", "31.17/0.9062", "31.33/0.9086"],
      ["Gray σ=50", "BSD68", "PSNR/SSIM", "27.28/0.7487", "27.34/0.7525"],
      ["Real DN", "DND", "PSNR/SSIM", "39.07/0.9490", "39.64/0.9540"],
      ["CAR q=10", "LIVE1", "PSNR/SSIM", "29.96/0.8178", "30.03/0.8184"],
      ["CAR q=10", "Classic5", "PSNR/SSIM", "30.41/0.8936", "30.41/0.8936"],
    ];
    const rows: any = [
      hdr,
      ...data.map((row, i) => row.map((cell, j) => ({
        text: cell,
        options: {
          fill: { color: altRow(i) },
          color: j === 4 ? GREEN : TEXT,
          bold: j === 4,
          fontSize: 9,
        },
      }))),
    ];
    addTable(s, rows, { x: 0.5, y: 1.3, w: 12.3 });

    // Highlight callout
    addPanel(s, 0.5, 4.4, 12.3, 0.7, { fill: GREEN_BG, border: GREEN });
    s.addText("✓  1.10M params (COLA-B)     ✓  1.88M params (COLA-E)     ✓  State-of-the-art at time of publication", {
      x: 0.7, y: 4.45, w: 12, h: 0.55,
      fontSize: 13, bold: true, color: GREEN, fontFace: FONT, align: "center", valign: "middle",
    });

    addFooter(s, sn, TOTAL_SLIDES);
  }

  /* ══════════════════════════════════════════════════════════════════
     SLIDE 8 — PSNR CHARTS
     ══════════════════════════════════════════════════════════════════ */
  {
    sn++;
    const s = pptx.addSlide({ masterName: "LIGHT_MASTER" });
    addTitle(s, "PSNR Performance Comparison", "Across noise levels and tasks");

    await addFig(s, "PSNR_DN_Gray.PNG", { x: 0.3, y: 1.3, w: 4.1, h: 3.4, shadow: true });
    await addFig(s, "PSNR_CAR.PNG", { x: 4.6, y: 1.3, w: 4.1, h: 3.4, shadow: true });
    await addFig(s, "PSNR_DN_Real.PNG", { x: 8.9, y: 1.3, w: 4.1, h: 3.4, shadow: true });

    // Labels
    const chartLabels = ["Gray Denoising\n(σ = 10–70)", "JPEG Artifact Removal\n(q = 10–40)", "Real-World Denoising\n(DND Benchmark)"];
    chartLabels.forEach((l, i) => {
      const cx = 0.3 + i * 4.3;
      addPanel(s, cx, 4.85, 4.1, 0.7);
      s.addText(l, {
        x: cx + 0.1, y: 4.9, w: 3.9, h: 0.6,
        fontSize: 9, color: TEXT_MED, fontFace: FONT, align: "center", lineSpacing: 14,
      });
    });

    s.addText("COLA-Net consistently achieves highest PSNR across all noise levels and tasks, with minimal parameter overhead.", {
      x: 0.5, y: 5.8, w: 12, h: 0.4,
      fontSize: 10, color: TEXT_LIGHT, fontFace: FONT, align: "center", italic: true,
    });
    addFooter(s, sn, TOTAL_SLIDES);
  }

  /* ══════════════════════════════════════════════════════════════════
     SLIDE 9 — VISUAL: GRAY DENOISING
     ══════════════════════════════════════════════════════════════════ */
  {
    sn++;
    const s = pptx.addSlide({ masterName: "LIGHT_MASTER" });
    addTitle(s, "Visual Results — Gray Denoising", "COLA-Net produces sharper edges and fewer artifacts");
    addPanel(s, 0.3, 1.2, 12.7, 5.6);
    await addFig(s, "Visual_DN_Gray.PNG", { x: 0.5, y: 1.35, w: 12.3, h: 5.3 });
    addFooter(s, sn, TOTAL_SLIDES);
  }

  /* ══════════════════════════════════════════════════════════════════
     SLIDE 10 — VISUAL: CAR + REAL
     ══════════════════════════════════════════════════════════════════ */
  {
    sn++;
    const s = pptx.addSlide({ masterName: "LIGHT_MASTER" });
    addTitle(s, "Visual Results — JPEG Artifact Removal & Real Denoising");

    addPanel(s, 0.3, 1.2, 6.35, 5.0);
    await addFig(s, "Visual_CAR.PNG", { x: 0.4, y: 1.35, w: 6.15, h: 4.7 });

    addPanel(s, 6.85, 1.2, 6.15, 5.0);
    await addFig(s, "Visual_DN_Real.PNG", { x: 6.95, y: 1.35, w: 5.95, h: 4.7 });

    s.addText("JPEG Artifact Removal", {
      x: 0.3, y: 6.35, w: 6.35, h: 0.3,
      fontSize: 10, bold: true, color: ORANGE, fontFace: FONT, align: "center",
    });
    s.addText("Real-World Denoising", {
      x: 6.85, y: 6.35, w: 6.15, h: 0.3,
      fontSize: 10, bold: true, color: GREEN, fontFace: FONT, align: "center",
    });
    addFooter(s, sn, TOTAL_SLIDES);
  }

  /* ══════════════════════════════════════════════════════════════════
     SLIDE 11 — PAPER WEAKNESSES
     ══════════════════════════════════════════════════════════════════ */
  {
    sn++;
    const s = pptx.addSlide({ masterName: "LIGHT_MASTER" });
    addSectionStripe(s, "04  Weaknesses — Paper");

    const weaknesses = [
      ["W1", "Critical", "Per-sample Python for-loop in attention — kills GPU parallelism", RED, RED_BG],
      ["W2", "High", "O(N²) non-local attention — memory scales quadratically with spatial size", ORANGE, ORANGE_BG],
      ["W3", "High", "Only L2 (MSE) loss — produces over-smoothed results, loses fine detail", ORANGE, ORANGE_BG],
      ["W4", "Medium", "Limited degradation models — only AWGN/JPEG; no blur, rain, haze", YELLOW, YELLOW_BG],
      ["W5", "Medium", "Fixed patch hyperparams — hardcoded 7×7 patches, stride=4; no adaptive search", YELLOW, YELLOW_BG],
      ["W6", "Medium", "No Transformer comparisons — misses SwinIR, Restormer (2021-era SOTA)", YELLOW, YELLOW_BG],
      ["W7", "Medium", "Weak ablation — single dataset (Set12), single noise level (σ=25)", YELLOW, YELLOW_BG],
      ["W8", "Low", "Grayscale only for synthetic experiments — no RGB evaluation", TEXT_LIGHT, LIGHT_BG],
      ["W9", "Low", "No failure-case analysis or limitations discussion in the paper", TEXT_LIGHT, LIGHT_BG],
    ];

    const hdr: any = [
      hdrCell("ID", { align: "center" }),
      hdrCell("Severity"),
      hdrCell("Description"),
    ];
    const rows: any = [
      hdr,
      ...weaknesses.map(([id, sev, desc, sevColor, rowBg]) => [
        { text: id, options: { align: "center" as const, bold: true, fill: { color: rowBg as string } } },
        { text: sev, options: { color: sevColor, bold: true, fill: { color: rowBg as string } } },
        { text: desc, options: { fill: { color: rowBg as string }, color: TEXT } },
      ] as any),
    ];
    addTable(s, rows, { x: 0.4, y: 1.25, w: 12.5, rowH: 0.42 });

    addFooter(s, sn, TOTAL_SLIDES);
  }

  /* ══════════════════════════════════════════════════════════════════
     SLIDE 12 — CODE WEAKNESSES
     ══════════════════════════════════════════════════════════════════ */
  {
    sn++;
    const s = pptx.addSlide({ masterName: "LIGHT_MASTER" });
    addTitle(s, "Code Weaknesses", "6 critical bugs and code-quality issues in the official repository");

    const items: [string, string, string][] = [
      ["Per-sample loop", "CA_model.py uses Python for-loop per batch item, calling torch.mm on individual matrices. Prevents GPU parallelism.", "Replace with torch.bmm for batched matrix multiply"],
      ["F.fold padding bug", "Asymmetric same_padding values are passed to F.fold's symmetric padding parameter → shape mismatch crashes on certain input sizes.", "Fold to (H_pad, W_pad) with padding=0, then crop to target size"],
      ["In-place ops", "unsqueeze_() in merge_unit.py breaks autograd computational graph, causing silent gradient computation errors.", "Use out-of-place unsqueeze() to preserve gradient chain"],
      ["Shell injection ⚠", "os.system('rm -rf ' + path) in utility.py. User-controllable path allows arbitrary command execution.", "Use shutil.rmtree() — safe, cross-platform deletion"],
      ["Code duplication", "3 near-identical directories (DN_Gray/, DN_Real/, CAR/) with copy-pasted model files and slight divergences.", "Single unified codebase with YAML config per task"],
      ["Deprecated APIs", "6 deprecated PyTorch and scikit-image calls that emit warnings or fail silently on modern versions.", "Update all to current equivalents (torch 2.x, skimage 0.20+)"],
    ];

    const hdr: any = [hdrCell("Issue"), hdrCell("Problem Detail"), hdrCell("Our Fix")];
    const rows: any = [
      hdr,
      ...items.map(([issue, prob, fix], i) => [
        { text: issue, options: { bold: true, color: RED, fill: { color: altRow(i) }, fontSize: 9 } },
        { text: prob, options: { fill: { color: altRow(i) }, color: TEXT, fontSize: 8 } },
        { text: fix, options: { color: GREEN, bold: true, fill: { color: altRow(i) }, fontSize: 8 } },
      ] as any),
    ];
    addTable(s, rows, { x: 0.4, y: 1.2, w: 12.5, rowH: 0.65 });

    addFooter(s, sn, TOTAL_SLIDES);
  }

  /* ══════════════════════════════════════════════════════════════════
     SLIDE 13 — OUR IMPROVEMENTS
     ══════════════════════════════════════════════════════════════════ */
  {
    sn++;
    const s = pptx.addSlide({ masterName: "LIGHT_MASTER" });
    addSectionStripe(s, "05  Our Improvements");

    const fixes: [string, string, string, string][] = [
      ["Vectorized Attention", "torch.bmm batched attention replaces per-sample loop", "3–5× speedup on GPU", GREEN],
      ["Safe Fold/Unfold", "Fold to padded size then crop — no shape mismatch", "Works on any input size", GREEN],
      ["Out-of-place Ops", "Correct autograd graph, reliable gradient flow", "Fixes silent training bugs", GREEN],
      ["Unified Codebase", "Single directory + YAML config per task/variant", "Eliminates code drift", ACCENT],
      ["L1 + VGG Loss", "Perceptual feature matching for sharper outputs", "Better visual quality", ACCENT],
      ["Cosine LR + Warmup", "Smooth annealing instead of abrupt step decay", "More stable convergence", ACCENT],
      ["Mixed Precision (AMP)", "FP16/FP32 training with GradScaler", "40–60% less memory", PURPLE],
      ["Full Seed Control", "torch + numpy + cudnn.deterministic", "Reproducible experiments", PURPLE],
      ["Safe Checkpointing", "shutil.rmtree() instead of os.system('rm -rf')", "No shell injection risk", RED],
      ["Modern API Updates", "All 6 deprecated calls replaced for torch 2.x", "Future-proof codebase", TEXT_MED],
    ];

    fixes.forEach((f, i) => {
      const col = i < 5 ? 0.5 : 6.8;
      const row = (i % 5) * 1.05 + 1.35;
      const isLeft = i < 5;
      addPanel(s, col, row, isLeft ? 6.0 : 6.0, 0.9, { fill: LIGHT_BG });
      // Colored bullet dot
      s.addShape("ellipse" as any, {
        x: col + 0.2, y: row + 0.25, w: 0.25, h: 0.25,
        fill: { color: f[3] },
      });
      s.addText(f[0], {
        x: col + 0.55, y: row + 0.1, w: 5, h: 0.3,
        fontSize: 11, bold: true, color: TEXT, fontFace: FONT,
      });
      s.addText(f[1], {
        x: col + 0.55, y: row + 0.38, w: 5.2, h: 0.22,
        fontSize: 8, color: TEXT_MED, fontFace: FONT,
      });
      s.addText(f[2], {
        x: col + 0.55, y: row + 0.6, w: 5.2, h: 0.2,
        fontSize: 8, bold: true, color: f[3], fontFace: FONT, italic: true,
      });
    });

    addFooter(s, sn, TOTAL_SLIDES);
  }

  /* ══════════════════════════════════════════════════════════════════
     SLIDE 14 — OLD VS NEW COMPARISON TABLE
     ══════════════════════════════════════════════════════════════════ */
  {
    sn++;
    const s = pptx.addSlide({ masterName: "LIGHT_MASTER" });
    addTitle(s, "Side-by-Side Comparison", "Original codebase vs our improved version");

    const hdr: any = [
      hdrCell("Aspect"),
      { text: "Original Code  ✗", options: { bold: true, fill: { color: RED }, color: "FFFFFF", fontSize: 10 } },
      { text: "Improved Code  ✓", options: { bold: true, fill: { color: GREEN }, color: "FFFFFF", fontSize: 10 } },
    ];
    const cmp: [string, string, string][] = [
      ["Non-local Attention", "Python for-loop per batch sample", "Batched torch.bmm — fully vectorized"],
      ["Fold/Unfold", "Padding mismatch → crash on some sizes", "Fold padded → crop — any size works"],
      ["Loss Function", "MSE only — over-smoothed outputs", "L1 + VGG perceptual — sharper details"],
      ["LR Schedule", "Abrupt step decay every N epochs", "Cosine annealing + linear warmup"],
      ["Training Precision", "FP32 only — high memory usage", "AMP mixed precision — 40-60% less VRAM"],
      ["Project Structure", "3 duplicated directories, code drift", "1 unified directory + YAML configs"],
      ["File Operations", "os.system('rm -rf') — shell injection", "shutil.rmtree() — safe and portable"],
      ["API Compatibility", "6 deprecated calls — warnings/failures", "All modern equivalents (torch 2.x)"],
    ];
    const rows: any = [
      hdr,
      ...cmp.map(([aspect, old, imp], i) => [
        { text: aspect, options: { bold: true, fill: { color: altRow(i) }, color: TEXT, fontSize: 9 } },
        { text: old, options: { color: RED, fill: { color: altRow(i) }, fontSize: 9 } },
        { text: imp, options: { color: GREEN, bold: true, fill: { color: altRow(i) }, fontSize: 9 } },
      ] as any),
    ];
    addTable(s, rows, { x: 0.4, y: 1.2, w: 12.5, rowH: 0.45 });

    addFooter(s, sn, TOTAL_SLIDES);
  }

  /* ══════════════════════════════════════════════════════════════════
     SLIDE 15 — SUMMARY & KEY TAKEAWAYS
     ══════════════════════════════════════════════════════════════════ */
  {
    sn++;
    const s = pptx.addSlide({ masterName: "LIGHT_MASTER" });
    addSectionStripe(s, "06  Summary & Key Takeaways");

    // Left: What we found
    addPanel(s, 0.5, 1.35, 6, 5.4, { fill: LIGHT_BG });
    s.addText("What We Found", {
      x: 0.7, y: 1.45, w: 5, h: 0.4,
      fontSize: 16, bold: true, color: TEXT, fontFace: FONT,
    });

    const findings = [
      { label: "Strong concept", desc: "Collaborative attention (local + non-local) is a powerful idea that achieves SOTA with few parameters." },
      { label: "9 paper weaknesses", desc: "Ranging from fundamental (O(N²) attention, MSE-only loss) to presentation (no failure analysis)." },
      { label: "6 code bugs", desc: "Including a security vulnerability (shell injection), silent gradient errors, and padding crashes." },
      { label: "Reproducibility gap", desc: "The triplicated codebase and deprecated APIs make it hard to reproduce and extend." },
    ];
    findings.forEach((f, i) => {
      const fy = 2.0 + i * 1.1;
      s.addText(f.label, {
        x: 0.7, y: fy, w: 5.5, h: 0.3,
        fontSize: 11, bold: true, color: ACCENT, fontFace: FONT,
      });
      s.addText(f.desc, {
        x: 0.7, y: fy + 0.3, w: 5.5, h: 0.5,
        fontSize: 9, color: TEXT_MED, fontFace: FONT, lineSpacing: 14,
      });
    });

    // Right: What we did
    addPanel(s, 6.8, 1.35, 6, 5.4, { fill: GREEN_BG, border: GREEN });
    s.addText("What We Improved", {
      x: 7.0, y: 1.45, w: 5, h: 0.4,
      fontSize: 16, bold: true, color: GREEN, fontFace: FONT,
    });

    const improvements = [
      "Vectorized attention (torch.bmm) — 3-5× speedup",
      "Fixed all fold/unfold padding bugs",
      "Added L1 + VGG perceptual loss",
      "Cosine LR scheduler with warmup",
      "Mixed precision (AMP) training support",
      "Unified single-directory codebase",
      "Eliminated shell injection vulnerability",
      "Updated all 6 deprecated API calls",
      "Full reproducibility via seed control",
      "Trained 4 models on CPU as proof of concept",
    ];
    addBullets(s, improvements, { x: 7.0, y: 1.95, w: 5.5, h: 4.5, fontSize: 9 });

    addFooter(s, sn, TOTAL_SLIDES);
  }

  /* ══════════════════════════════════════════════════════════════════
     SLIDE 16 — THANK YOU
     ══════════════════════════════════════════════════════════════════ */
  {
    sn++;
    const s = pptx.addSlide({ masterName: "LIGHT_MASTER" });

    // Large accent band
    s.addShape("rect" as any, { x: 0, y: 0, w: W, h: 3.2, fill: { color: ACCENT } });
    s.addShape("rect" as any, { x: 0, y: 3.2, w: W, h: 0.06, fill: { color: ACCENT2 } });

    s.addText("Thank You", {
      x: 0.5, y: 0.8, w: 12, h: 1.2,
      fontSize: 52, bold: true, color: "FFFFFF", fontFace: FONT, align: "center",
    });
    s.addText("Questions & Discussion", {
      x: 0.5, y: 1.8, w: 12, h: 0.6,
      fontSize: 20, color: "FFFFFFCC", fontFace: FONT, align: "center",
    });
    s.addText("Emmanuel Safo Acheampong  |  Student ID: 153058678", {
      x: 0.5, y: 2.4, w: 12, h: 0.45,
      fontSize: 14, color: "FFFFFFDD", fontFace: FONT, align: "center",
    });

    // Info cards below
    const cards = [
      { title: "Paper", content: "COLA-Net: Collaborative Attention\nNetwork for Image Restoration\nIEEE Trans. Multimedia, 2021", bg: LIGHT_BG },
      { title: "Our Work", content: "9 paper weaknesses identified\n6 code bugs fixed\n10 architectural improvements", bg: GREEN_BG },
      { title: "Results", content: "4 models trained on CPU\nFull unified codebase\nLive web comparison tool", bg: PURPLE_BG },
    ];
    cards.forEach((c, i) => {
      const cx = 0.8 + i * 4.1;
      addPanel(s, cx, 3.8, 3.7, 2.5, { fill: c.bg });
      s.addText(c.title, {
        x: cx + 0.3, y: 3.95, w: 3.1, h: 0.4,
        fontSize: 14, bold: true, color: TEXT, fontFace: FONT,
      });
      s.addText(c.content, {
        x: cx + 0.3, y: 4.4, w: 3.1, h: 1.6,
        fontSize: 10, color: TEXT_MED, fontFace: FONT, lineSpacing: 18, valign: "top",
      });
    });

    addFooter(s, sn, TOTAL_SLIDES);
  }

  await pptx.writeFile({ fileName: "COLA-Net_Analysis.pptx" });
}
