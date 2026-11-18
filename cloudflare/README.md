# Deploying BuildSmart Nigeria on Cloudflare (Zero Render Required)

This folder deploys the entire stack natively on **Cloudflare**:
- **Cloudflare Workers** (`src/worker.js`): Edge REST API (`/api/estimate`, `/api/cities`, `/api/projects`) using the exact same JavaScript Nigerian BOQ engine as Node.js.
- **Cloudflare KV** (`PROJECTS_KV`): Stores temporary project snapshots with **native `expirationTtl: 86400`** — Cloudflare automatically deletes saved links after 24 hours without cron jobs or Postgres bills.
- **Cloudflare R2** (`ASSETS_R2`): Zero-egress CDN storage for Blender `.glb` 3D meshes and Unity WebGL/Android/VR assets.
- **Cloudflare Pages**: Hosts the React + Three.js web app AND your exported **Unity WebGL** build.

---

## 1. Install Worker Dependencies & Login
```bash
cd cloudflare
npm install
npx wrangler login
```

## 2. Create KV Namespace (24h Auto-Delete Storage) & R2 Bucket
```bash
npx wrangler kv namespace create PROJECTS_KV
npx wrangler r2 bucket create buildsmart-3d-assets
```
Copy the generated `id` into `cloudflare/wrangler.toml` under `PROJECTS_KV`.

## 3. Deploy the API Worker
```bash
npx wrangler deploy
```
Note your Worker URL, e.g. `https://buildsmart-nigeria-api.<your-subdomain>.workers.dev`.

## 4. Deploy the Frontend (and/or Unity WebGL) to Cloudflare Pages
```bash
cd ../client
npm install
npm run build
npx wrangler pages deploy dist --project-name buildsmart-nigeria
```
In Cloudflare Dashboard → **Pages → buildsmart-nigeria → Functions / Workers**, bind `/api/*` requests to your `buildsmart-nigeria-api` Worker (or use a Cloudflare Worker route on your custom domain `yourdomain.com/api/*`).

## 5. Upload Blender 3D Meshes to R2 (for Web, Android & VR)
After running `blender/generate_buildsmart_assets.py` locally:
```bash
npx wrangler r2 object put buildsmart-3d-assets/block_9_inch.glb --file=../blender/exports/block_9_inch.glb
npx wrangler r2 object put buildsmart-3d-assets/eps_panel_3d.glb --file=../blender/exports/eps_panel_3d.glb
npx wrangler r2 object put buildsmart-3d-assets/starter_peg_y12.glb --file=../blender/exports/starter_peg_y12.glb
```
Your Web, Android, and VR clients can now fetch them directly from `/api/models/<filename>`.
