"use client";

/* ─────────────────────────────────────────────────────────────────────
   Slide 1-4: Article Explanation with architecture diagrams
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

/* ── Slide 1: Introduction ────────────────────────────────────────── */
export function SlideIntro() {
  return (
    <div className="slide">
      <div className="flex items-center gap-3 mb-2">
        <span className="info-tag">Slide 1</span>
        <span className="text-xs" style={{ color: "var(--text-dim)" }}>
          Paper Overview
        </span>
      </div>
      <h2>COLA-Net: Collaborative Attention Network</h2>
      <p>
        Published in IEEE Transactions on Multimedia (2021) by Chong Mou et al.
        COLA-Net is the first network to combine <strong>local</strong> and{" "}
        <strong>non-local</strong> attention in a learnable, self-adaptive manner
        for image restoration.
      </p>

      {/* Attention heatmap to illustrate local vs non-local */}
      <FigImage
        name="heat.PNG"
        alt="Attention dependence heatmap"
        caption="Fig. 2: Heatmap of attention dependence. Deeper color = more local ops needed. Flat areas need non-local attention."
        maxHeight="280px"
      />

      <h3>The Core Problem</h3>
      <p>
        Recovering a clean image <strong>x</strong> from a degraded observation{" "}
        <strong>y = Ax + n</strong>. Existing methods use either local attention
        (limited receptive field, struggles with repetitive patterns) or non-local
        attention (unreliable on noisy pixels, over-smooths textures). Neither
        alone is sufficient.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="card text-center">
          <div className="text-3xl mb-2">🔍</div>
          <div className="font-semibold text-sm">Local Attention</div>
          <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            SK-Net channel attention at multiple scales. Good for complex
            textures.
          </div>
        </div>
        <div className="card text-center">
          <div className="text-3xl mb-2">🌐</div>
          <div className="font-semibold text-sm">Non-local Attention</div>
          <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Patch-wise similarity matching across entire image. Good for
            repetitive details.
          </div>
        </div>
        <div className="card text-center">
          <div className="text-3xl mb-2">🤝</div>
          <div className="font-semibold text-sm">Collaborative Fusion</div>
          <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Adaptive channel-wise weighting decides how much of each to use per
            feature.
          </div>
        </div>
      </div>

      <h3>Three Tasks</h3>
      <div className="grid grid-cols-3 gap-3 mt-3">
        {[
          {
            task: "Grayscale Denoising",
            desc: "Remove AWGN (σ = 10–70)",
            datasets: "Set12, BSD68, Urban100",
          },
          {
            task: "Real Denoising",
            desc: "Handle real camera noise",
            datasets: "DND, SIDD",
          },
          {
            task: "JPEG Artifact Removal",
            desc: "Fix compression (q = 10–40)",
            datasets: "Classic5, LIVE1",
          },
        ].map((t) => (
          <div key={t.task} className="card">
            <div className="font-semibold text-sm">{t.task}</div>
            <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {t.desc}
            </div>
            <div className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>
              {t.datasets}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Slide 2: Full Architecture Diagram ───────────────────────────── */
export function SlideArchitecture() {
  return (
    <div className="slide">
      <div className="flex items-center gap-3 mb-2">
        <span className="info-tag">Slide 2</span>
        <span className="text-xs" style={{ color: "var(--text-dim)" }}>
          Architecture
        </span>
      </div>
      <h2>Global Architecture — COLA-B</h2>
      <p className="mb-4">
        The network uses a chain of DnCNN feature extraction modules followed by
        Collaborative Attention Blocks (CABs). A global residual skip-connection
        adds the input back at the end.
      </p>

      {/* Paper figure 1: network architecture */}
      <FigImage
        name="network.PNG"
        alt="COLA-Net architecture diagram"
        caption="Fig. 1: COLA-Net architecture. Top: overall pipeline. Bottom: Collaborative Attention Block (CAB) detail."
        maxHeight="340px"
      />

      {/* Main pipeline */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[700px]">
          <FlowRow gap="gap-2">
            <Box color="cyan">Noisy Input y</Box>
            <ArrowRight />
            <Box color="accent">DnCNN FEM</Box>
            <ArrowRight />
            <Box color="purple">CAB × 4</Box>
            <ArrowRight />
            <Box color="accent">DnCNN FEM</Box>
            <ArrowRight />
            <Box color="green">+ Input (Residual)</Box>
            <ArrowRight />
            <Box color="green">Clean Output x̂</Box>
          </FlowRow>

          {/* CAB detail */}
          <div className="mt-8">
            <DiagramSection label="Inside each Collaborative Attention Block (CAB)" labelColor="purple">
              <FlowRow gap="gap-2">
                <Box color="accent" small>DnCNN FEM</Box>
                <ArrowRight />
                <div className="flex flex-col items-center gap-1">
                  <Box color="accent" small>Features F</Box>
                </div>
                <ArrowRight />
              </FlowRow>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Local branch */}
                <DiagramSection label="Local Branch (SKUnit)" labelColor="orange">
                  <FlowCol>
                    <FlowRow gap="gap-1">
                      <Box color="orange" small>Conv 3×3</Box>
                      <Box color="orange" small>Conv 3×3 + 3×3</Box>
                    </FlowRow>
                    <ArrowDown />
                    <Box color="orange" small>Channel Attention (Softmax Gating)</Box>
                    <ArrowDown />
                    <Box color="orange" small>F_local</Box>
                  </FlowCol>
                </DiagramSection>

                {/* Non-local branch */}
                <DiagramSection label="Non-local Branch (Patch Attention)" labelColor="cyan">
                  <FlowCol>
                    <FlowRow gap="gap-1">
                      <Box color="cyan" small>θ (Q)</Box>
                      <Box color="cyan" small>φ (K)</Box>
                      <Box color="cyan" small>g (V)</Box>
                    </FlowRow>
                    <ArrowDown />
                    <Box color="cyan" small>Unfold → 3D Patches</Box>
                    <ArrowDown />
                    <Box color="cyan" small>M = softmax(V·K) × Q</Box>
                    <ArrowDown />
                    <Box color="cyan" small>Fold → F_nonlocal</Box>
                  </FlowCol>
                </DiagramSection>
              </div>

              {/* Fusion */}
              <div className="mt-4">
                <DiagramSection label="Adaptive Fusion" labelColor="green">
                  <FlowRow gap="gap-2">
                    <Box color="orange" small>F_local</Box>
                    <Plus />
                    <Box color="cyan" small>F_nonlocal</Box>
                    <ArrowRight />
                    <Box color="default" small>GAP</Box>
                    <ArrowRight />
                    <Box color="default" small>FC → Softmax</Box>
                    <ArrowRight />
                    <Box color="green" small>w_L · F_L + w_NL · F_NL</Box>
                  </FlowRow>
                </DiagramSection>
              </div>
            </DiagramSection>
          </div>
        </div>
      </div>

      {/* Two variants */}
      <h3>Two Variants</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge-accent">COLA-B</span>
            <span className="text-sm font-semibold">Base Model</span>
          </div>
          <table className="data-table">
            <tbody>
              <tr><td>FEM</td><td>DnCNN (6 layers)</td></tr>
              <tr><td>CABs</td><td>4 blocks</td></tr>
              <tr><td>Params</td><td>1.10M</td></tr>
              <tr><td>Architecture</td><td>Sequential chain</td></tr>
            </tbody>
          </table>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge-accent">COLA-E</span>
            <span className="text-sm font-semibold">Enhanced Model</span>
          </div>
          <table className="data-table">
            <tbody>
              <tr><td>FEM</td><td>ResBlocks (16 total)</td></tr>
              <tr><td>CABs</td><td>3 blocks (CES module)</td></tr>
              <tr><td>Params</td><td>1.88M</td></tr>
              <tr><td>Architecture</td><td>ResBlocks + CES in body</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Slide 3: Non-local Attention Detail ──────────────────────────── */
export function SlideNonLocal() {
  return (
    <div className="slide">
      <div className="flex items-center gap-3 mb-2">
        <span className="info-tag">Slide 3</span>
        <span className="text-xs" style={{ color: "var(--text-dim)" }}>
          Key Innovation
        </span>
      </div>
      <h2>Patch-wise Non-local Attention</h2>
      <p>
        Unlike pixel-level non-local methods that are unreliable on noisy images,
        COLA-Net matches <strong>3D patches</strong> (e.g., 7×7×C blocks) to find
        similar structures across the entire image.
      </p>

      {/* Paper figure 5: non-local attention detail */}
      <FigImage
        name="nl.PNG"
        alt="Patch-wise non-local attention submodule"
        caption="Fig. 5: Non-local attention submodule. Q/K/V projections → unfold to patches → attention → fold back."
        maxHeight="360px"
      />

      <div className="overflow-x-auto mt-6 pb-4">
        <div className="min-w-[600px]">
          <FlowCol>
            <FlowRow gap="gap-2">
              <Box color="accent">Input Feature F</Box>
            </FlowRow>
            <ArrowDown />
            <FlowRow gap="gap-3">
              <FlowCol>
                <Box color="cyan" small>1×1 Conv θ</Box>
                <div className="text-xs" style={{ color: "var(--text-dim)" }}>Query Q</div>
              </FlowCol>
              <FlowCol>
                <Box color="cyan" small>1×1 Conv φ</Box>
                <div className="text-xs" style={{ color: "var(--text-dim)" }}>Key K</div>
              </FlowCol>
              <FlowCol>
                <Box color="cyan" small>1×1 Conv g</Box>
                <div className="text-xs" style={{ color: "var(--text-dim)" }}>Value V</div>
              </FlowCol>
            </FlowRow>
            <ArrowDown />
            <FlowRow gap="gap-3">
              <Box color="purple" small>Unfold Q (stride=1)</Box>
              <Box color="purple" small>Unfold K (stride=1)</Box>
              <Box color="purple" small>Unfold V (stride=4)</Box>
            </FlowRow>
            <ArrowDown />
            <Box color="orange">
              Attention: M = softmax(V<sup>T</sup> · K × scale)
            </Box>
            <ArrowDown />
            <Box color="orange">
              Aggregate: O = M · Q<sup>T</sup>
            </Box>
            <ArrowDown />
            <FlowRow gap="gap-2">
              <Box color="green" small>Fold → Feature Map</Box>
              <ArrowRight />
              <Box color="green" small>1×1 Conv W + Residual</Box>
            </FlowRow>
          </FlowCol>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="card">
          <div className="font-semibold text-sm mb-2">Why Patches, Not Pixels?</div>
          <ul className="text-xs space-y-1" style={{ color: "var(--text-muted)" }}>
            <li>• Individual noisy pixels are unreliable for similarity matching</li>
            <li>• 3D patches (7×7×C) carry structural information that resists noise</li>
            <li>• Averaging over a patch region stabilizes the attention weights</li>
          </ul>
        </div>
        <div className="card">
          <div className="font-semibold text-sm mb-2">Key Parameters</div>
          <table className="data-table">
            <tbody>
              <tr><td>Patch size</td><td>7 × 7</td></tr>
              <tr><td>Value stride</td><td>4 (coarse grid)</td></tr>
              <tr><td>Q/K stride</td><td>1 (dense grid)</td></tr>
              <tr><td>Bottleneck channels</td><td>16 (from 64)</td></tr>
              <tr><td>Softmax scale</td><td>10</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Slide 4: Results ─────────────────────────────────────────────── */
export function SlideResults() {
  return (
    <div className="slide">
      <div className="flex items-center gap-3 mb-2">
        <span className="info-tag">Slide 4</span>
        <span className="text-xs" style={{ color: "var(--text-dim)" }}>
          Performance
        </span>
      </div>
      <h2>Key Results</h2>
      <p className="mb-4">
        COLA-Net achieves state-of-the-art results across all three tasks with
        only 1.10M (COLA-B) to 1.88M (COLA-E) parameters.
      </p>

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Dataset</th>
              <th>COLA-B (PSNR/SSIM)</th>
              <th>COLA-E (PSNR/SSIM)</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Gray Denoise (σ=25)</td><td>Set12</td><td>30.90 / 0.8716</td><td className="hl-green font-semibold">30.90 / 0.8716</td></tr>
            <tr><td>Gray Denoise (σ=25)</td><td>BSD68</td><td>29.42 / 0.8339</td><td className="hl-green font-semibold">29.46 / 0.8368</td></tr>
            <tr><td>Gray Denoise (σ=25)</td><td>Urban100</td><td>31.17 / 0.9062</td><td className="hl-green font-semibold">31.33 / 0.9086</td></tr>
            <tr><td>Real Denoise</td><td>DND</td><td>39.07 / 0.949</td><td className="hl-green font-semibold">39.64 / 0.954</td></tr>
            <tr><td>CAR (q=10)</td><td>LIVE1</td><td>29.96 / 0.8178</td><td className="hl-green font-semibold">30.03 / 0.8184</td></tr>
            <tr><td>CAR (q=10)</td><td>Classic5</td><td>30.41 / 0.8936</td><td className="hl-green font-semibold">30.41 / 0.8936</td></tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="metric-card">
          <div className="metric-value hl-blue">1.10M</div>
          <div className="metric-label">COLA-B Parameters</div>
        </div>
        <div className="metric-card">
          <div className="metric-value hl-blue">1.88M</div>
          <div className="metric-label">COLA-E Parameters</div>
        </div>
        <div className="metric-card">
          <div className="metric-value hl-green">SOTA</div>
          <div className="metric-label">at time of publication</div>
        </div>
      </div>

      {/* Visual comparison from the paper */}
      <h3>Visual Comparison — Gray Denoising (σ=25)</h3>
      <FigImage
        name="Visual_DN_Gray.PNG"
        alt="Visual comparison of denoising methods"
        caption="Fig. 7: Visual comparison on Urban100 and Set12. COLA-E achieves best PSNR/SSIM."
        maxHeight="400px"
      />

      {/* PSNR charts */}
      <h3>PSNR Across Noise Levels</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
        <FigImage
          name="PSNR_DN_Gray.PNG"
          alt="PSNR chart for gray denoising"
          caption="Gray Denoising"
          maxHeight="250px"
        />
        <FigImage
          name="PSNR_CAR.PNG"
          alt="PSNR chart for JPEG artifact removal"
          caption="JPEG Artifact Removal"
          maxHeight="250px"
        />
        <FigImage
          name="PSNR_DN_Real.PNG"
          alt="PSNR chart for real denoising"
          caption="Real-World Denoising"
          maxHeight="250px"
        />
      </div>
    </div>
  );
}
