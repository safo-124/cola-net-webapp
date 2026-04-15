"use client";

/**
 * Generates a PowerPoint presentation from the COLA-Net analysis.
 * Uses pptxgenjs for browser-side PPTX generation.
 */
import PptxGenJS from "pptxgenjs";
import { getFigBase64 } from "./FigImage";

/* colour constants matching our dark theme */
const BG = "0a0a0a";
const CARD_BG = "141414";
const ACCENT = "2563eb";
const GREEN = "22c55e";
const RED = "ef4444";
const ORANGE = "f97316";
const YELLOW = "eab308";
const WHITE = "f5f5f5";
const MUTED = "a1a1aa";
const PURPLE = "a855f7";

/* helper: add a title bar to a slide */
function addTitle(
  slide: any,
  title: string,
  subtitle?: string
) {
  slide.addText(title, {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 24,
    bold: true,
    color: WHITE,
    fontFace: "Segoe UI",
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.5,
      y: 0.85,
      w: 9,
      h: 0.35,
      fontSize: 12,
      color: MUTED,
      fontFace: "Segoe UI",
    });
  }
}

/* helper: add a text block */
function addBody(
  slide: any,
  text: string,
  opts?: { y?: number; x?: number; w?: number; fontSize?: number }
) {
  slide.addText(text, {
    x: opts?.x ?? 0.5,
    y: opts?.y ?? 1.3,
    w: opts?.w ?? 9,
    h: 0.5,
    fontSize: opts?.fontSize ?? 11,
    color: MUTED,
    fontFace: "Segoe UI",
    valign: "top",
    wrap: true,
  });
}

/* helper: add image from base64 */
async function addFig(
  slide: any,
  name: string,
  opts: { x: number; y: number; w: number; h: number }
) {
  const fig = await getFigBase64(name);
  if (!fig) return;
  slide.addImage({
    data: `data:${fig.mime};base64,${fig.data}`,
    x: opts.x,
    y: opts.y,
    w: opts.w,
    h: opts.h,
  });
}

/* helper: add a table */
function addTable(
  slide: any,
  rows: any[],
  opts: { x: number; y: number; w: number }
) {
  slide.addTable(rows, {
    x: opts.x,
    y: opts.y,
    w: opts.w,
    fontSize: 9,
    color: WHITE,
    fontFace: "Segoe UI",
    border: { type: "solid", color: "333333", pt: 0.5 },
    rowH: 0.3,
    colW: Array(rows[0]?.length || 3).fill(opts.w / (rows[0]?.length || 3)),
    autoPage: false,
  });
}

/* ─────────────────────────────────────────────────────────────────────
   Main export function
   ───────────────────────────────────────────────────────────────────── */
export async function generatePPTX(): Promise<void> {
  const pptx = new PptxGenJS();
  pptx.author = "COLA-Net Analysis";
  pptx.title = "COLA-Net: Analysis, Weaknesses & Improvements";
  pptx.layout = "LAYOUT_WIDE"; // 13.33 × 7.5 inches

  const masterOpts: any = {
    title: "COLA_BG",
    background: { color: BG },
  };
  pptx.defineSlideMaster(masterOpts);

  /* ── Slide 1: Title ── */
  {
    const s = pptx.addSlide({ masterName: "COLA_BG" });
    s.addText("COLA-Net", {
      x: 0.5,
      y: 1.5,
      w: 12,
      h: 1.2,
      fontSize: 48,
      bold: true,
      color: ACCENT,
      fontFace: "Segoe UI",
    });
    s.addText("Collaborative Attention Network for Image Restoration", {
      x: 0.5,
      y: 2.7,
      w: 12,
      h: 0.6,
      fontSize: 20,
      color: WHITE,
      fontFace: "Segoe UI",
    });
    s.addText(
      "Paper Analysis  •  Weakness Identification  •  Improvements  •  Live Comparison",
      {
        x: 0.5,
        y: 3.5,
        w: 12,
        h: 0.5,
        fontSize: 14,
        color: MUTED,
        fontFace: "Segoe UI",
      }
    );
    s.addText("Chong Mou et al. — IEEE Trans. Multimedia, 2021", {
      x: 0.5,
      y: 4.3,
      w: 12,
      h: 0.4,
      fontSize: 11,
      color: MUTED,
      fontFace: "Segoe UI",
      italic: true,
    });
  }

  /* ── Slide 2: Paper Overview ── */
  {
    const s = pptx.addSlide({ masterName: "COLA_BG" });
    addTitle(s, "Paper Overview", "What does COLA-Net do?");
    addBody(
      s,
      "Goal: Recover clean image x from degraded y = Ax + n.\n\n" +
        "Key insight: Local attention (SK-Net) handles complex textures, " +
        "non-local attention (patch similarity) handles repetitive patterns. " +
        "COLA-Net combines both via adaptive fusion.\n\n" +
        "Three tasks covered:\n" +
        "  • Grayscale denoising (AWGN, σ = 10–70)\n" +
        "  • JPEG artifact removal (q = 10–40)\n" +
        "  • Real-world denoising (DND benchmark)"
    );
  }

  /* ── Slide 3: Architecture (with figure) ── */
  {
    const s = pptx.addSlide({ masterName: "COLA_BG" });
    addTitle(s, "Network Architecture", "Fig. 1 from the paper");
    await addFig(s, "network.PNG", { x: 0.8, y: 1.4, w: 11.5, h: 4.5 });
    s.addText(
      "COLA-Net cascades Conv → CAB × 4 → Conv with global residual. " +
        "Each CAB contains a DnCNN FEM, SK local branch, patch non-local branch, and adaptive fusion.",
      {
        x: 0.5,
        y: 6.1,
        w: 12,
        h: 0.6,
        fontSize: 10,
        color: MUTED,
        fontFace: "Segoe UI",
        wrap: true,
      }
    );
  }

  /* ── Slide 4: Non-local Attention (with figure) ── */
  {
    const s = pptx.addSlide({ masterName: "COLA_BG" });
    addTitle(s, "Patch-wise Non-local Attention", "Fig. 5 from the paper");
    await addFig(s, "nl.PNG", { x: 0.8, y: 1.4, w: 11.5, h: 4.5 });
    s.addText(
      "Q/K/V via 1×1 conv → unfold to 3D patches → softmax(V·K)·Q → fold back. " +
        "Patches are more noise-robust than individual pixels.",
      {
        x: 0.5,
        y: 6.1,
        w: 12,
        h: 0.6,
        fontSize: 10,
        color: MUTED,
        fontFace: "Segoe UI",
        wrap: true,
      }
    );
  }

  /* ── Slide 5: Attention Heatmap (with figure) ── */
  {
    const s = pptx.addSlide({ masterName: "COLA_BG" });
    addTitle(
      s,
      "Attention Dependence Visualization",
      "Heatmaps show where local vs non-local attention is needed"
    );
    await addFig(s, "heat.PNG", { x: 1.5, y: 1.4, w: 10, h: 4.0 });
    s.addText(
      "Fig. 2: Deeper color = more local operations demanded. " +
        "Flat regions (sky, water) need non-local; textured regions need local.",
      {
        x: 0.5,
        y: 5.8,
        w: 12,
        h: 0.6,
        fontSize: 10,
        color: MUTED,
        fontFace: "Segoe UI",
        wrap: true,
      }
    );
  }

  /* ── Slide 6: Results Table ── */
  {
    const s = pptx.addSlide({ masterName: "COLA_BG" });
    addTitle(s, "Key Results", "State-of-the-art across all three tasks");
    const hdr: any = [
      { text: "Task", options: { bold: true, fill: { color: "1a1a1a" }, color: ACCENT } },
      { text: "Dataset", options: { bold: true, fill: { color: "1a1a1a" }, color: ACCENT } },
      { text: "COLA-B (PSNR/SSIM)", options: { bold: true, fill: { color: "1a1a1a" }, color: ACCENT } },
      { text: "COLA-E (PSNR/SSIM)", options: { bold: true, fill: { color: "1a1a1a" }, color: ACCENT } },
    ];
    const rows: any = [
      hdr,
      [{ text: "Gray (σ=25)" }, { text: "Set12" }, { text: "30.90/0.8716" }, { text: "30.90/0.8716", options: { color: GREEN } }],
      [{ text: "Gray (σ=25)" }, { text: "BSD68" }, { text: "29.42/0.8339" }, { text: "29.46/0.8368", options: { color: GREEN } }],
      [{ text: "Gray (σ=25)" }, { text: "Urban100" }, { text: "31.17/0.9062" }, { text: "31.33/0.9086", options: { color: GREEN } }],
      [{ text: "Real Denoise" }, { text: "DND" }, { text: "39.07/0.949" }, { text: "39.64/0.954", options: { color: GREEN } }],
      [{ text: "CAR (q=10)" }, { text: "LIVE1" }, { text: "29.96/0.8178" }, { text: "30.03/0.8184", options: { color: GREEN } }],
      [{ text: "CAR (q=10)" }, { text: "Classic5" }, { text: "30.41/0.8936" }, { text: "30.41/0.8936", options: { color: GREEN } }],
    ];
    addTable(s, rows, { x: 0.5, y: 1.4, w: 12 });

    s.addText("1.10M params (COLA-B)   |   1.88M params (COLA-E)   |   SOTA at publication", {
      x: 0.5,
      y: 4.0,
      w: 12,
      h: 0.4,
      fontSize: 14,
      bold: true,
      color: GREEN,
      fontFace: "Segoe UI",
      align: "center",
    });
  }

  /* ── Slide 7: Visual Results (with figure) ── */
  {
    const s = pptx.addSlide({ masterName: "COLA_BG" });
    addTitle(s, "Visual Comparison — Gray Denoising", "COLA-Net vs competing methods");
    await addFig(s, "Visual_DN_Gray.PNG", { x: 0.5, y: 1.3, w: 12, h: 5.5 });
  }

  /* ── Slide 8: PSNR Comparison Charts ── */
  {
    const s = pptx.addSlide({ masterName: "COLA_BG" });
    addTitle(s, "PSNR Performance Charts");
    await addFig(s, "PSNR_DN_Gray.PNG", { x: 0.2, y: 1.3, w: 4.2, h: 3.5 });
    await addFig(s, "PSNR_CAR.PNG", { x: 4.6, y: 1.3, w: 4.2, h: 3.5 });
    await addFig(s, "PSNR_DN_Real.PNG", { x: 8.8, y: 1.3, w: 4.2, h: 3.5 });
    s.addText("Gray Denoising               JPEG Artifact Removal               Real Denoising", {
      x: 0.5,
      y: 5.0,
      w: 12,
      h: 0.3,
      fontSize: 11,
      color: MUTED,
      fontFace: "Segoe UI",
      align: "center",
    });
  }

  /* ── Slide 9: Paper Weaknesses ── */
  {
    const s = pptx.addSlide({ masterName: "COLA_BG" });
    addTitle(s, "Paper Weaknesses", "9 identified issues across design, training, and evaluation");

    const weaknesses = [
      ["W1", "Critical", "Per-sample Python for-loop in attention — kills GPU parallelism"],
      ["W2", "High", "O(N²) non-local attention — memory scales quadratically"],
      ["W3", "High", "Only L2 (MSE) loss — produces over-smoothed results"],
      ["W4", "Medium", "Limited degradation models — only AWGN and JPEG"],
      ["W5", "Medium", "Fixed patch hyperparameters — hardcoded 7×7, stride=4"],
      ["W6", "Medium", "No Transformer comparisons (SwinIR, Restormer)"],
      ["W7", "Medium", "Weak ablation — single dataset, single noise level"],
      ["W8", "Low", "Grayscale only for synthetic experiments"],
      ["W9", "Low", "No failure analysis or limitations discussion"],
    ];

    const hdr: any = [
      { text: "ID", options: { bold: true, fill: { color: "1a1a1a" }, color: ACCENT, align: "center" } },
      { text: "Severity", options: { bold: true, fill: { color: "1a1a1a" }, color: ACCENT } },
      { text: "Description", options: { bold: true, fill: { color: "1a1a1a" }, color: ACCENT } },
    ];
    const rows: any = [
      hdr,
      ...weaknesses.map(([id, sev, desc]) => {
        const sevColor =
          sev === "Critical" ? RED : sev === "High" ? ORANGE : sev === "Medium" ? YELLOW : MUTED;
        return [
          { text: id, options: { align: "center" as const } },
          { text: sev, options: { color: sevColor, bold: true } },
          { text: desc },
        ] as any;
      }),
    ];
    addTable(s, rows, { x: 0.5, y: 1.4, w: 12 });
  }

  /* ── Slide 10: Code Weaknesses ── */
  {
    const s = pptx.addSlide({ masterName: "COLA_BG" });
    addTitle(s, "Code Weaknesses", "Critical bugs and code-quality issues");

    const items = [
      ["Per-sample loop", "CA_model.py uses for-loop per batch item. torch.mm on single sample.", "Replace with torch.bmm for batched attention"],
      ["F.fold padding bug", "Asymmetric same_padding fed to F.fold's symmetric padding parameter → shape mismatch on some sizes.", "Fold to (H_pad, W_pad) with padding=0, then crop"],
      ["In-place ops", "unsqueeze_() in merge_unit.py breaks autograd gradient computation.", "Use out-of-place unsqueeze()"],
      ["Shell injection", "os.system('rm -rf ' + path) in utility.py. Arbitrary command execution risk.", "Use shutil.rmtree()"],
      ["Code duplication", "3 near-identical directories (DN_Gray/, DN_Real/, CAR/) with same model files.", "Single unified codebase + YAML configs"],
      ["Deprecated APIs", "6 deprecated PyTorch/scikit-image calls that emit warnings or fail on modern versions.", "Update all to current equivalents"],
    ];

    const hdr: any = [
      { text: "Issue", options: { bold: true, fill: { color: "1a1a1a" }, color: ACCENT } },
      { text: "Problem", options: { bold: true, fill: { color: "1a1a1a" }, color: ACCENT } },
      { text: "Fix", options: { bold: true, fill: { color: "1a1a1a" }, color: ACCENT } },
    ];
    const rows: any = [
      hdr,
      ...items.map(
        ([issue, prob, fix]) =>
          [
            { text: issue, options: { bold: true, color: RED } },
            { text: prob },
            { text: fix, options: { color: GREEN } },
          ] as any
      ),
    ];
    addTable(s, rows, { x: 0.5, y: 1.4, w: 12 });
  }

  /* ── Slide 11: Our Improvements ── */
  {
    const s = pptx.addSlide({ masterName: "COLA_BG" });
    addTitle(s, "Our Improvements", "10 targeted fixes across architecture, training, and code");

    const fixes = [
      ["Vectorized attention", "torch.bmm batched attention, 3-5× speedup"],
      ["Safe fold/unfold", "Fold to padded size → crop, no shape errors"],
      ["Out-of-place ops", "Correct autograd, reliable gradient flow"],
      ["Unified codebase", "Single directory + YAML config per task"],
      ["L1 + VGG loss", "Sharper outputs with perceptual feature matching"],
      ["Cosine LR + warmup", "Smooth schedule instead of step decay"],
      ["Mixed precision (AMP)", "40-60% less memory, ~1.5× training speed"],
      ["Full seed control", "torch + numpy + cudnn.deterministic"],
      ["Safe checkpointing", "shutil.rmtree instead of os.system('rm -rf')"],
      ["Modern APIs", "All 6 deprecated calls replaced"],
    ];

    fixes.forEach((f, i) => {
      const col = i < 5 ? 0.5 : 6.8;
      const row = (i % 5) * 1.0 + 1.5;
      s.addText(f[0], {
        x: col,
        y: row,
        w: 2.5,
        h: 0.3,
        fontSize: 12,
        bold: true,
        color: GREEN,
        fontFace: "Segoe UI",
      });
      s.addText(f[1], {
        x: col,
        y: row + 0.3,
        w: 5.5,
        h: 0.35,
        fontSize: 9,
        color: MUTED,
        fontFace: "Segoe UI",
        wrap: true,
      });
    });
  }

  /* ── Slide 12: Old vs New Comparison Table ── */
  {
    const s = pptx.addSlide({ masterName: "COLA_BG" });
    addTitle(s, "Old vs Improved — Summary");

    const hdr: any = [
      { text: "Aspect", options: { bold: true, fill: { color: "1a1a1a" }, color: ACCENT } },
      { text: "Original Code", options: { bold: true, fill: { color: "1a1a1a" }, color: RED } },
      { text: "Improved Code", options: { bold: true, fill: { color: "1a1a1a" }, color: GREEN } },
    ];
    const cmp = [
      ["Non-local attention", "Python for-loop per sample", "Batched torch.bmm"],
      ["Fold/unfold", "Mismatched padding → crash", "Fold padded → crop"],
      ["Loss function", "MSE only", "L1 + VGG perceptual"],
      ["LR schedule", "Step decay", "Cosine annealing + warmup"],
      ["Precision", "FP32 only", "AMP (FP16/FP32 mixed)"],
      ["Codebase", "3 duplicated directories", "1 unified directory + YAML"],
      ["Safety", "os.system('rm -rf')", "shutil.rmtree()"],
      ["APIs", "6 deprecated calls", "All modern equivalents"],
    ];
    const rows: any = [
      hdr,
      ...cmp.map(
        ([aspect, old, imp]) =>
          [
            { text: aspect, options: { bold: true } },
            { text: old, options: { color: RED } },
            { text: imp, options: { color: GREEN } },
          ] as any
      ),
    ];
    addTable(s, rows, { x: 0.5, y: 1.4, w: 12 });
  }

  /* ── Slide 13: Visual Results — other tasks ── */
  {
    const s = pptx.addSlide({ masterName: "COLA_BG" });
    addTitle(s, "Visual Results — JPEG Artifact Removal & Real Denoising");
    await addFig(s, "Visual_CAR.PNG", { x: 0.3, y: 1.3, w: 6.2, h: 4.5 });
    await addFig(s, "Visual_DN_Real.PNG", { x: 6.8, y: 1.3, w: 6.2, h: 4.5 });
    s.addText("JPEG Artifact Removal (left)        Real-World Denoising (right)", {
      x: 0.5,
      y: 6.0,
      w: 12,
      h: 0.3,
      fontSize: 11,
      color: MUTED,
      fontFace: "Segoe UI",
      align: "center",
    });
  }

  /* ── Slide 14: Thank You ── */
  {
    const s = pptx.addSlide({ masterName: "COLA_BG" });
    s.addText("Thank You", {
      x: 0.5,
      y: 2.0,
      w: 12,
      h: 1.2,
      fontSize: 48,
      bold: true,
      color: ACCENT,
      fontFace: "Segoe UI",
      align: "center",
    });
    s.addText(
      "COLA-Net: Collaborative Attention Network for Image Restoration\n" +
        "Analysis • Weaknesses • Improvements",
      {
        x: 0.5,
        y: 3.5,
        w: 12,
        h: 0.8,
        fontSize: 16,
        color: MUTED,
        fontFace: "Segoe UI",
        align: "center",
      }
    );
  }

  await pptx.writeFile({ fileName: "COLA-Net_Analysis.pptx" });
}
