# COLA-Net Web Application

A full-stack web application for analyzing, comparing, and presenting improvements to the **COLA-Net: Collaborative Attention Network for Image Restoration** paper.

**Live Demo:** [https://frontend-rho-blue-yk21ughru9.vercel.app/](https://frontend-rho-blue-yk21ughru9.vercel.app/)

**Author:** Emmanuel Safo Acheampong — Student ID: 153058678

---

## Overview

This application provides an interactive presentation-style interface covering:

1. **Paper Overview** — Architecture, collaborative attention mechanism, and key contributions of COLA-Net
2. **Weaknesses** — 9 identified weaknesses in the original paper and codebase (including 6 code bugs)
3. **Improvements** — 10 architectural and engineering fixes applied to create a unified, modern codebase
4. **Live Comparison** — Upload images and compare original vs improved model outputs across three tasks:
   - Grayscale Denoising (σ = 15, 25, 50)
   - JPEG Artifact Removal (q = 10, 20, 30, 40)
   - Real-World Denoising
5. **Export** — Download a professional 16-slide PowerPoint presentation summarizing the full analysis

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | Next.js 14, React 18, TypeScript  |
| Styling  | Tailwind CSS                      |
| Backend  | FastAPI (Python), PyTorch          |
| PPTX     | pptxgenjs (browser-side generation)|
| Hosting  | Vercel (frontend), ngrok (backend tunnel) |

## Features

- **Interactive before/after image slider** for visual comparison
- **Dark / Light theme** toggle
- **Lightbox zoom** on all figures and results
- **Tooltips** for technical terms
- **Keyboard navigation** between tabs
- **One-click PPTX export** with 16 professionally designed slides
- **4 trained models** (COLA-B and COLA-E for denoising + COLA-B and COLA-E for JPEG artifact removal)

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+ with PyTorch
- Pre-trained COLA-Net checkpoints

### Frontend

```bash
cd webapp/frontend
npm install
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000).

### Backend

```bash
cd webapp/backend
pip install fastapi uvicorn torch torchvision pillow numpy scikit-image
uvicorn main:app --host 0.0.0.0 --port 8000
```

The frontend proxies API requests to `localhost:8000` in development.

### Environment Variables

| Variable             | Description                                | Default         |
|----------------------|--------------------------------------------|-----------------|
| `NEXT_PUBLIC_API_URL`| Backend URL (set on Vercel for production) | _(empty — proxies to localhost:8000)_ |

## Project Structure

```
webapp/frontend/
├── app/
│   ├── page.tsx          # Main page with 5-tab presentation UI
│   └── globals.css       # Theme styles (light/dark)
├── components/
│   ├── ExportPPTX.ts     # 16-slide PPTX generator
│   ├── ImageCompare.tsx   # Before/after slider component
│   ├── Lightbox.tsx       # Full-screen image zoom
│   └── Tooltip.tsx        # Hover tooltip component
├── lib/
│   └── api.ts            # API base URL + headers
├── next.config.js        # API proxy rewrites
└── package.json
```

## Deployment

The frontend auto-deploys to Vercel on push to `master`. The backend runs locally and is exposed via ngrok:

```bash
ngrok http 8000
```

Set the ngrok URL as `NEXT_PUBLIC_API_URL` in Vercel environment variables.

## Reference

> Chong Mou, Jian Zhang, Xiaopeng Fan, Hangfan Liu, and Ronggang Wang,
> "COLA-Net: Collaborative Attention Network for Image Restoration,"
> IEEE Transactions on Multimedia, 2021.

- [Paper (IEEE)](https://ieeexplore.ieee.org/document/9369906)
- [arXiv](https://arxiv.org/abs/2103.05961)
- [Original Code](https://github.com/MC-E/COLA-Net)
