# HOW MANY BLOCKS DO YOU NEED TO COMPLETE A BUILDING?
### BuildSmart Nigeria — 3D Lego House Builder, Polystyrene (EPS) vs. Sandcrete Blocks & Phased BOQ Planner

A visual, low-mental-load **3D interactive house-building companion** built for the everyday Nigerian hustler, civil servant, and first-time landowner.

Instead of guessing quantities or getting stranded mid-build, users can snap rooms together in 3D like Lego, compare **Sandcrete Blocks (6"/9")** side-by-side against **Polystyrene (EPS 3D Wire-Mesh Panels on a Raised Concrete Platform + Starter Iron Pegs)**, calculate cement, rebar, water, and labour, and plan a realistic **Build-As-You-Earn** schedule.

---

## Core Capabilities

1. **Interactive 3D "Lego" Studio (`client/src/components/Builder3D.jsx`)**
   - Pick real Nigerian plot sizes (`Half Plot 9×30m`, `450m²`, `600m²`) or 1-tap starter templates (*1-Bed Starter Core, 2-Bed, 3-Bed, 4-Bed G+1*).
   - Snap, move, and resize rooms on a 0.5m grid.
   - Switch live between **9" Blocks**, **6" Blocks**, and **EPS Polystyrene (Raised Concrete Platform + Vertical Starter Iron Pegs + Wire Mesh)**.
   - Scrub through **Stages 1–6** (*Setting Out → Platform/Foundation → Walls → Openings/Decking → Timber Roof Trusses & Sheets → Overhead Water Tank & Septic*) and toggle **X-Ray Mode**.

2. **Full BOQ, Water, Labour & Side-by-Side Comparison (`client/src/components/BoqTab.jsx`)**
   - Notebook-style step-by-step math (`Gross Area − Openings = Net Area → Blocks/EPS Panels + Wastage`), plus a **30-Second Thumb-Rule Sanity Check** and an interactive **3D Material X-Ray**.
   - Computes cement bags, sharp/plaster sand tippers, 20mm granite, iron rods, **mixing + curing water (litres & 1,000L tanks)**, and **worker-days**.
   - Supports **live local price overrides** and 1-click **Print / Save PDF BOQ**.

3. **Build-As-You-Earn Coach (`client/src/components/RoadmapTab.jsx`)**
   - Enter cash on hand and monthly savings to map out 5 weather-safe milestones, **"Pause Safely" steel/platform protection advice**, **DIY cost-saving tasks**, and the **"1-Bed Starter Core (Stop Paying Rent First)"** strategy.

4. **City, Approvals & Local Sourcing (`client/src/components/CityGuideTab.jsx`)**
   - Soil & foundation notes, approval authorities (*AGIS / FCDA Development Control* in Abuja; *Lagos Lands Bureau / LASPPPA / LASBCA* in Lagos; PH, Enugu, Kano), local EPS/material hubs (so users don't import expensive materials), and curated YouTube DIY/EPS guides.

5. **Site Check & DIY Lab (`client/src/components/SiteLabTab.jsx`)**
   - Interactive **Rebar Stamp Decoder** (`B 500 D W R 16`), **Concrete Mix & Water Ratio Calculator**, **Excavation Swell & Tipper Calculator**, **Spirit Level 180° Check**, and **1-Minute Site Quizzes**.

6. **24-Hour Ephemeral Backend + Portable Project Files (`server/`)**
   - **Node.js (Express) + PostgreSQL** backend automatically purges saved cloud workspaces after **24 hours** (`expires_at = NOW() + INTERVAL '24 hours'`).
   - Users can **Download `.buildpack.json`** at any time and **Re-upload** months later to resume editing and refresh prices with zero account lock-in.

---

## Quick Start (Local Development)

### 1. Start the Backend (Node.js + PostgreSQL)
```bash
cd server
npm install
# Optional: set DATABASE_URL in .env (falls back cleanly to 24h local ephemeral storage if omitted)
npm run dev
```

### 2. Start the Frontend (Vite + React + Three.js)
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173` (API runs on `http://localhost:6543`).

### 3. Run Tests & Production Build
```bash
cd server && npm test
cd ../client && npm run build
```

### 4. Docker Compose (PostgreSQL 16 + App)
```bash
docker compose up --build
```
