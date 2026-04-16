"use client";

/* ─────────────────────────────────────────────────────────────────────
   Slide 5-7: Weaknesses + Diagrams showing how they arise
   ───────────────────────────────────────────────────────────────────── */
import React from "react";
import {
  Box,
  FlowRow,
  FlowCol,
  ArrowRight,
  ArrowDown,
  Plus,
  DiagramSection,
  BeforeAfter,
} from "./DiagramPrimitives";
import FigImage from "./FigImage";

/* ── Slide 5: Paper Weaknesses ────────────────────────────────────── */
export function SlidePaperWeaknesses() {
  const weaknesses = [
    {
      id: "W1",
      title: "O(N²) Non-local Attention",
      desc: "Full N×N attention matrix between all patches. Memory and compute scale quadratically with image size.",
      severity: "High",
    },
    {
      id: "W2",
      title: "Only L2 (MSE) Loss",
      desc: "MSE loss produces over-smoothed results. No perceptual or adversarial loss despite code supporting it.",
      severity: "High",
    },
    {
      id: "W3",
      title: "Per-sample Python Loop",
      desc: "Non-local module iterates per batch sample in Python, killing GPU parallelism (100× slower).",
      severity: "Critical",
    },
    {
      id: "W4",
      title: "Limited Degradation Models",
      desc: "Only AWGN and JPEG artifacts tested. No blind, mixed, or real-world degradation pipelines.",
      severity: "Medium",
    },
    {
      id: "W5",
      title: "Fixed Patch Hyperparameters",
      desc: "Hardcoded 7×7 patch size and stride=4. Not adapted to content or noise level.",
      severity: "Medium",
    },
    {
      id: "W6",
      title: "No Transformer Comparisons",
      desc: "Published 2021 but no comparison with SwinIR, Restormer, or any vision transformer.",
      severity: "Medium",
    },
    {
      id: "W7",
      title: "Grayscale Only (Synthetic)",
      desc: "Synthetic denoising experiments limited to single-channel images.",
      severity: "Low",
    },
    {
      id: "W8",
      title: "Weak Ablation Study",
      desc: "Ablation on single dataset (Urban100) at single noise level (σ=25).",
      severity: "Medium",
    },
    {
      id: "W9",
      title: "No Failure Analysis",
      desc: "No discussion of when COLA-Net fails or degrades (e.g., σ=70 on Urban100).",
      severity: "Low",
    },
  ];

  const sevColor: Record<string, string> = {
    Critical: "hl-bg-red",
    High: "hl-bg-orange",
    Medium: "hl-bg-yellow",
    Low: "hl-bg-zinc",
  };

  return (
    <div className="slide">
      <div className="flex items-center gap-3 mb-2">
        <span className="weakness-tag">Slide 5</span>
        <span className="text-xs" style={{ color: "var(--text-dim)" }}>
          Paper Weaknesses
        </span>
      </div>
      <h2>Weaknesses in the Paper</h2>
      <p className="mb-6">
        9 identified weaknesses spanning architecture design, training strategy,
        experimental scope, and evaluation methodology.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {weaknesses.map((w) => (
          <div key={w.id} className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold" style={{ color: "var(--text-dim)" }}>
                {w.id}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sevColor[w.severity]}`}
              >
                {w.severity}
              </span>
            </div>
            <div className="font-semibold text-sm mb-1">{w.title}</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              {w.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Slide 6: Code Weaknesses with Diagrams ───────────────────────── */
export function SlideCodeWeaknesses() {
  return (
    <div className="slide">
      <div className="flex items-center gap-3 mb-2">
        <span className="weakness-tag">Slide 6</span>
        <span className="text-xs" style={{ color: "var(--text-dim)" }}>
          Code Weaknesses
        </span>
      </div>
      <h2>Weaknesses in the Codebase</h2>

      {/* W3: The for loop problem — most critical */}
      <h3>Critical: Per-Sample Python Loop in Attention</h3>
      <p className="mb-4">
        The non-local module processes each batch item individually in a Python
        for-loop, completely defeating GPU parallelism.
      </p>

      <BeforeAfter
        before={
          <div>
            <div className="code-block code-bad">
{`# Original CA_model.py — O(B) Python loop
for xii, xi, wi, pi in zip(x_ii, x_i, w_i, p_i):
    yi = F.softmax(yi * scale, dim=2)
    yi = yi.view(l_s, -1)
    yi = torch.mm(yi, pi)        # single-sample mm
    yi = yi.view(b_s, l_s, c, k, k)[0]  # [0] ← batch=1!`}
            </div>
            <div className="mt-3 overflow-x-auto">
              <FlowRow gap="gap-2">
                <Box color="red" small>Sample 1</Box>
                <ArrowRight />
                <Box color="red" small>mm</Box>
                <ArrowRight />
                <Box color="red" small>Sample 2</Box>
                <ArrowRight />
                <Box color="red" small>mm</Box>
                <ArrowRight />
                <Box color="red" small>...</Box>
                <span className="text-xs hl-red font-bold ml-2">Sequential!</span>
              </FlowRow>
            </div>
          </div>
        }
        after={
          <div>
            <div className="code-block code-good">
{`# Improved — Fully batched with torch.bmm
v_patches = v_patches.permute(0, 2, 1)      # (B, N_v, c*k*k)
score_map = torch.bmm(v_patches, k_patches)  # (B, N_v, N_k)
score_map = F.softmax(score_map * scale, dim=2)
out = torch.bmm(score_map, q_patches_t)      # all B at once`}
            </div>
            <div className="mt-3 overflow-x-auto">
              <FlowRow gap="gap-2">
                <Box color="green" small>All B samples</Box>
                <ArrowRight />
                <Box color="green" small>bmm (parallel)</Box>
                <ArrowRight />
                <Box color="green" small>Done!</Box>
                <span className="text-xs hl-green font-bold ml-2">3-5× faster</span>
              </FlowRow>
            </div>
          </div>
        }
      />

      {/* In-place operations */}
      <h3>In-place Operations Break Autograd</h3>
      <BeforeAfter
        before={
          <div className="code-block code-bad">
{`# merge_unit.py — in-place unsqueeze
out1 = self.SKUnit(x).unsqueeze_(dim=1)  # ← in-place!
out2 = self.CAUnit(x).unsqueeze_(dim=1)  # ← in-place!`}
          </div>
        }
        after={
          <div className="code-block code-good">
{`# Fixed — out-of-place operations
out1 = self.SKUnit(x).unsqueeze(1)   # new tensor
out2 = self.CAUnit(x).unsqueeze(1)   # new tensor`}
          </div>
        }
      />

      {/* Shell injection */}
      <h3>Security: Shell Injection Vulnerability</h3>
      <BeforeAfter
        before={
          <div className="code-block code-bad">
{`# utility.py — UNSAFE shell command
os.system('rm -rf ' + self.dir)
# If self.dir = "; rm -rf /" → catastrophic!`}
          </div>
        }
        after={
          <div className="code-block code-good">
{`# Fixed — safe Python API
import shutil
if os.path.exists(self.dir):
    shutil.rmtree(self.dir)`}
          </div>
        }
      />

      {/* Code duplication */}
      <h3>Code Duplication</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
        <DiagramSection label="Original: 3 copies of everything" labelColor="red">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {["DN_Gray/", "DN_Real/", "CAR/"].map((d) => (
              <FlowCol key={d}>
                <Box color="red" small>{d}</Box>
                <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  model/ loss/ data/ train.py test.py ...
                </div>
              </FlowCol>
            ))}
          </div>
          <div className="text-xs hl-red mt-3 text-center font-semibold">
            Bug fix in one copy won&apos;t propagate!
          </div>
        </DiagramSection>
        <DiagramSection label="Improved: Single shared codebase" labelColor="green">
          <FlowCol>
            <Box color="green" small>COLA_Net_Improved/</Box>
            <div className="text-[10px] text-center" style={{ color: "var(--text-muted)" }}>
              models/ data/ losses/ utils/ configs/
            </div>
            <div className="flex gap-2 mt-2">
              <Box color="green" small>train.py</Box>
              <Box color="green" small>test.py</Box>
            </div>
            <div className="text-xs hl-green mt-2 text-center font-semibold">
              One codebase, task selected via YAML config
            </div>
          </FlowCol>
        </DiagramSection>
      </div>

      {/* Deprecated APIs */}
      <h3>Deprecated APIs (6 Issues)</h3>
      <div className="overflow-x-auto mt-3">
        <table className="data-table">
          <thead>
            <tr><th>Issue</th><th>Location</th><th>Fix</th></tr>
          </thead>
          <tbody>
            <tr><td><code className="hl-red">Variable(volatile=True)</code></td><td>trainer.py, test.py</td><td><code className="hl-green">torch.no_grad()</code></td></tr>
            <tr><td><code className="hl-red">skimage.measure.compare_psnr</code></td><td>utils.py</td><td><code className="hl-green">skimage.metrics.peak_signal_noise_ratio</code></td></tr>
            <tr><td><code className="hl-red">scheduler.get_lr()</code></td><td>trainer.py</td><td><code className="hl-green">get_last_lr()</code></td></tr>
            <tr><td><code className="hl-red">size_average=False</code></td><td>trainer.py</td><td><code className="hl-green">reduction=&apos;sum&apos;</code></td></tr>
            <tr><td><code className="hl-red">DataLoaderIter</code></td><td>dataloader.py</td><td><code className="hl-green">Standard DataLoader</code></td></tr>
            <tr><td><code className="hl-red">scipy.misc</code></td><td>utility.py</td><td><code className="hl-green">Pillow / cv2</code></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Slide 7: Weakness Impact Diagram ─────────────────────────────── */
export function SlideWeaknessImpact() {
  return (
    <div className="slide">
      <div className="flex items-center gap-3 mb-2">
        <span className="weakness-tag">Slide 7</span>
        <span className="text-xs" style={{ color: "var(--text-dim)" }}>
          Impact Analysis
        </span>
      </div>
      <h2>How Weaknesses Affect Performance</h2>

      {/* Quadratic attention diagram */}
      <h3>O(N²) Attention Scaling Problem</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <div>
          <div className="text-sm font-semibold mb-3">Memory Usage vs Image Size</div>
          <div className="space-y-3">
            {[
              { size: "64×64", patches: 256, mem: "0.5MB", pct: 5 },
              { size: "128×128", patches: 1024, mem: "8MB", pct: 15 },
              { size: "256×256", patches: 4096, mem: "128MB", pct: 40 },
              { size: "512×512", patches: 16384, mem: "2GB", pct: 75 },
              { size: "1024×1024", patches: 65536, mem: "32GB", pct: 100 },
            ].map((r) => (
              <div key={r.size}>
                <div className="flex justify-between text-xs mb-1">
                  <span>{r.size} ({r.patches} patches)</span>
                  <span className={r.pct > 60 ? "hl-red font-bold" : ""}>{r.mem}</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${r.pct}%`,
                      background: r.pct > 60 ? "var(--red)" : r.pct > 30 ? "var(--yellow)" : "var(--green)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">The Problem</div>
          <div className="code-block">
{`Attention matrix: N_patches × N_patches
N_patches = (H/stride) × (W/stride)

For 512×512 image, stride=4:
  N = 128 × 128 = 16,384
  Matrix = 16,384² = 268M entries
  × 4 bytes = ~1GB per sample!`}
          </div>
          <div className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
            The crude workaround (<code>forward_chop</code>) splits images into
            quadrants but creates boundary artifacts where quarters meet.
          </div>
        </div>
      </div>

      {/* L2 loss problem */}
      <h3>L2 Loss → Over-smoothing</h3>
      <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
        Notice in the visual comparisons below how textures are slightly blurred — this is a direct consequence of MSE loss.
      </p>
      <FigImage
        name="Visual_CAR.PNG"
        alt="JPEG artifact removal visual comparison"
        caption="Look closely at textures: MSE-trained models tend to produce smoother outputs."
        maxHeight="280px"
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        <div className="card text-center">
          <div className="text-sm font-semibold mb-2">L2 (MSE) Loss</div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            Penalizes pixel-level error. Optimal prediction is the{" "}
            <strong>mean</strong> of all plausible outputs → blurry.
          </div>
          <div className="mt-3">
            <span className="weakness-tag">Used in paper</span>
          </div>
        </div>
        <div className="card text-center">
          <div className="text-sm font-semibold mb-2">L1 Loss</div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            Penalizes absolute error. Optimal prediction is the{" "}
            <strong>median</strong> → sharper than L2 but still limited.
          </div>
          <div className="mt-3">
            <span className="fix-tag">Our improvement</span>
          </div>
        </div>
        <div className="card text-center">
          <div className="text-sm font-semibold mb-2">L1 + VGG Perceptual</div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            Combines pixel loss with perceptual feature matching → preserves
            textures and edges.
          </div>
          <div className="mt-3">
            <span className="fix-tag">Available in improved code</span>
          </div>
        </div>
      </div>
    </div>
  );
}
