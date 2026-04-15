"use client";

/* ─────────────────────────────────────────────────────────────────────
   Slide 8-9: How we fix the weaknesses + improved architecture diagram
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
} from "./DiagramPrimitives";
import FigImage from "./FigImage";

/* ── Slide 8: Improvements Overview ───────────────────────────────── */
export function SlideImprovements() {
  return (
    <div className="slide">
      <div className="flex items-center gap-3 mb-2">
        <span className="fix-tag">Slide 8</span>
        <span className="text-xs" style={{ color: "var(--text-dim)" }}>
          Our Improvements
        </span>
      </div>
      <h2>How We Fix the Weaknesses</h2>
      <p className="mb-6">
        10 targeted improvements across architecture, training, and code quality.
      </p>

      {/* Architecture improvements */}
      <h3>Architecture Improvements</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
        {[
          {
            fix: "Vectorized Non-local Attention",
            from: "Per-sample Python for-loop + torch.mm",
            to: "Batched torch.bmm on all samples simultaneously",
            impact: "3-5× GPU speedup, proper batch support",
            color: "green" as const,
          },
          {
            fix: "Safe Fold/Unfold",
            from: "F.fold with mismatched asymmetric padding",
            to: "Fold to padded size → crop back to original",
            impact: "No shape errors on any input size",
            color: "green" as const,
          },
          {
            fix: "Clean Dual-Branch Fusion",
            from: "In-place unsqueeze_() operations",
            to: "Out-of-place operations, explicit residual",
            impact: "Correct autograd, reliable training",
            color: "green" as const,
          },
          {
            fix: "Unified Model Factory",
            from: "3 copies of model code across tasks",
            to: "Single models/ directory + build_model(cfg)",
            impact: "DRY, maintainable, config-driven",
            color: "green" as const,
          },
        ].map((f) => (
          <div key={f.fix} className="card">
            <div className="flex items-center gap-2 mb-2">
              <span className="fix-tag">{f.fix}</span>
            </div>
            <div className="text-xs space-y-1">
              <div>
                <span className="hl-red font-semibold">Before: </span>
                <span style={{ color: "var(--text-muted)" }}>{f.from}</span>
              </div>
              <div>
                <span className="hl-green font-semibold">After: </span>
                <span style={{ color: "var(--text-muted)" }}>{f.to}</span>
              </div>
              <div>
                <span className="hl-blue font-semibold">Impact: </span>
                <span style={{ color: "var(--text-muted)" }}>{f.impact}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Training improvements */}
      <h3>Training Improvements</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
        {[
          {
            fix: "L1 + VGG Loss",
            desc: "Replace MSE with L1 + perceptual loss for sharper outputs",
            icon: "📊",
          },
          {
            fix: "Cosine Annealing + Warmup",
            desc: "Smooth LR schedule instead of step decay at fixed epochs",
            icon: "📈",
          },
          {
            fix: "Mixed Precision (AMP)",
            desc: "torch.cuda.amp for 40-60% less memory, 1.5× training speed",
            icon: "⚡",
          },
          {
            fix: "Full Seed Control",
            desc: "torch + numpy + random + cudnn.deterministic for reproducibility",
            icon: "🎯",
          },
          {
            fix: "Safe Checkpointing",
            desc: "shutil.rmtree instead of os.system('rm -rf'). No shell injection.",
            icon: "🔒",
          },
          {
            fix: "Modern APIs",
            desc: "All 6 deprecated API calls replaced with current equivalents",
            icon: "🔄",
          },
        ].map((f) => (
          <div key={f.fix} className="card text-center">
            <div className="text-2xl mb-2">{f.icon}</div>
            <div className="text-sm font-semibold">{f.fix}</div>
            <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {f.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Slide 9: Improved Architecture Diagram ───────────────────────── */
export function SlideImprovedArch() {
  return (
    <div className="slide">
      <div className="flex items-center gap-3 mb-2">
        <span className="fix-tag">Slide 9</span>
        <span className="text-xs" style={{ color: "var(--text-dim)" }}>
          Improved Architecture
        </span>
      </div>
      <h2>Improved COLA-Net Architecture</h2>
      <p className="mb-6">
        Same conceptual design, but vectorized, safe, and unified.
        Green highlights show what changed.
      </p>

      <div className="overflow-x-auto pb-4">
        <div className="min-w-[700px]">
          {/* Main pipeline — same structure, green highlights on changes */}
          <FlowRow gap="gap-2">
            <Box color="cyan">Input y</Box>
            <ArrowRight />
            <Box color="accent">DnCNN FEM</Box>
            <ArrowRight />
            <Box color="green">DualBranchFusion × 4</Box>
            <ArrowRight />
            <Box color="accent">DnCNN FEM</Box>
            <ArrowRight />
            <Box color="green">+ Residual</Box>
            <ArrowRight />
            <Box color="green">Output x̂</Box>
          </FlowRow>

          {/* Improved CAB detail */}
          <div className="mt-8">
            <DiagramSection label="Improved DualBranchFusion Block" labelColor="green">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {/* Local branch */}
                <DiagramSection label="Local: SKUnit (unchanged)" labelColor="orange">
                  <FlowCol>
                    <FlowRow gap="gap-1">
                      <Box color="orange" small>Conv 3×3</Box>
                      <Box color="orange" small>2× Conv 3×3</Box>
                    </FlowRow>
                    <ArrowDown />
                    <Box color="orange" small>Channel Softmax Gating</Box>
                  </FlowCol>
                </DiagramSection>

                {/* Non-local branch — GREEN highlights */}
                <DiagramSection label="Non-local: Vectorized Attention" labelColor="green">
                  <FlowCol>
                    <FlowRow gap="gap-1">
                      <Box color="green" small>θ Q</Box>
                      <Box color="green" small>φ K</Box>
                      <Box color="green" small>g V</Box>
                    </FlowRow>
                    <ArrowDown />
                    <Box color="green" small>
                      torch.bmm (batched)
                    </Box>
                    <ArrowDown />
                    <Box color="green" small>
                      Fold to padded size → Crop
                    </Box>
                  </FlowCol>
                </DiagramSection>
              </div>

              {/* Fusion */}
              <div className="mt-4">
                <DiagramSection label="Fusion (no in-place ops)" labelColor="green">
                  <FlowRow gap="gap-2">
                    <Box color="orange" small>F_local</Box>
                    <Box color="green" small>F_nonlocal</Box>
                    <ArrowRight />
                    <Box color="green" small>unsqueeze (not unsqueeze_)</Box>
                    <ArrowRight />
                    <Box color="default" small>GAP → FC → Softmax</Box>
                    <ArrowRight />
                    <Box color="green" small>Weighted Sum</Box>
                  </FlowRow>
                </DiagramSection>
              </div>
            </DiagramSection>
          </div>

          {/* Training pipeline */}
          <div className="mt-8">
            <DiagramSection label="Improved Training Pipeline" labelColor="accent">
              <FlowRow gap="gap-2">
                <Box color="accent" small>YAML Config</Box>
                <ArrowRight />
                <Box color="green" small>build_model(cfg)</Box>
                <ArrowRight />
                <Box color="green" small>L1 + VGG Loss</Box>
                <ArrowRight />
                <Box color="green" small>AMP Scaler</Box>
                <ArrowRight />
                <Box color="green" small>Cosine LR</Box>
                <ArrowRight />
                <Box color="green" small>Safe Checkpoint</Box>
              </FlowRow>
            </DiagramSection>
          </div>
        </div>
      </div>

      {/* Side-by-side comparison table */}
      <h3>Old vs Improved — Summary</h3>

      {/* Original architecture for reference */}
      <FigImage
        name="network.PNG"
        alt="Original architecture"
        caption="Reference: Original architecture from paper (Fig. 1). Green highlights above show what we changed."
        maxHeight="250px"
      />

      <div className="overflow-x-auto mt-4">
        <table className="data-table">
          <thead>
            <tr>
              <th>Aspect</th>
              <th>Original Code</th>
              <th>Improved Code</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Non-local attention</td>
              <td className="hl-red">Python for-loop per sample</td>
              <td className="hl-green">Batched torch.bmm</td>
            </tr>
            <tr>
              <td>fold/unfold</td>
              <td className="hl-red">Mismatched padding → crash</td>
              <td className="hl-green">Fold padded → crop</td>
            </tr>
            <tr>
              <td>Loss function</td>
              <td className="hl-red">MSE only</td>
              <td className="hl-green">L1 + VGG perceptual</td>
            </tr>
            <tr>
              <td>LR schedule</td>
              <td className="hl-red">Step decay</td>
              <td className="hl-green">Cosine annealing + warmup</td>
            </tr>
            <tr>
              <td>Precision</td>
              <td className="hl-red">FP32 only</td>
              <td className="hl-green">AMP (FP16/FP32 mixed)</td>
            </tr>
            <tr>
              <td>Codebase</td>
              <td className="hl-red">3 duplicated directories</td>
              <td className="hl-green">1 unified directory + YAML</td>
            </tr>
            <tr>
              <td>Safety</td>
              <td className="hl-red">os.system(&apos;rm -rf&apos;)</td>
              <td className="hl-green">shutil.rmtree()</td>
            </tr>
            <tr>
              <td>APIs</td>
              <td className="hl-red">6 deprecated calls</td>
              <td className="hl-green">All modern equivalents</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
