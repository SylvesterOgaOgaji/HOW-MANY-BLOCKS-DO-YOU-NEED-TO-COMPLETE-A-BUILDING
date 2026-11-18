# Unity Engine Setup Guide (WebGL + Android + VR Headsets)

This folder prepares your **Unity URP project** to import real 3D Blender meshes (`../blender/exports/*.fbx` or `.glb`), snap Blocks / EPS Polystyrene Panels / Starter Pegs piece-by-piece in 3D/VR, calculate BOQ live via your **Cloudflare Workers API**, and deploy to **Web**, **Android**, and **Meta Quest / OpenXR VR**.

---

## 1. Create / Open Your Unity Project
1. In **Unity Hub**, create a project with **3D (URP)** template (Unity `2022.3 LTS` or `Unity 6`).
2. Copy the `unity/Assets/Scripts/` folder from this repo into your Unity project's `Assets/Scripts/`.
3. Run Blender's `generate_buildsmart_assets.py` (see `../blender/BLENDER_MCP_SETUP.md`) and copy `blender/exports/*.fbx` into `Assets/Models/`.
   - *(If you prefer `.glb`, open **Window → Package Manager → + Add package by name** and install `com.unity.cloud.gltfast`.)*

---

## 2. Create Your Interactive Prefabs
Create one Prefab per Blender mesh and attach [`BuildPiece`](Assets/Scripts/Core/BuildPiece.cs):
| Prefab | PieceType | Footprint Module |
| :--- | :--- | :--- |
| `Block9_Prefab` | `Block9Bay` or `Block9Single` | `0.45m` single / `0.90m` wall bay |
| `Block6_Prefab` | `Block6Bay` or `Block6Single` | `0.45m` single / `0.90m` wall bay |
| `EpsPanel3D_Prefab` | `EpsPanel3D` | `1.20m × 3.00m` |
| `StarterPegY12_Prefab` | `StarterPeg` | `0.35m–0.40m` spacing along EPS wall |

Add a `LegoSnapBuilder` GameObject to your scene, assign the prefabs, set your Land `landWidthMeters` × `landDepthMeters` (e.g., `15m × 30m`), and attach [`CloudflareBoqClient`](Assets/Scripts/Network/CloudflareBoqClient.cs) pointed at your deployed Cloudflare Worker URL (`https://buildsmart-nigeria-api.<subdomain>.workers.dev`).

---

## 3. Build Targets (Single Codebase → 3 Platforms)
- **WebGL (Deploy to Cloudflare Pages):**
  1. `File → Build Settings → WebGL → Switch Platform`
  2. `Player Settings → Publishing Settings → Compression Format: Brotli`
  3. Build to `webgl-dist/` and deploy:
     ```bash
     npx wrangler pages deploy webgl-dist --project-name buildsmart-unity
     ```
- **Android Mobile (`.apk` / `.aab`):**
  1. `File → Build Settings → Android → Switch Platform`
  2. Set `Scripting Backend: IL2CPP` and check **ARM64**
  3. Build `.apk` cleanly for any Nigerian Android phone/tablet.
- **VR Headsets (Meta Quest / OpenXR):**
  1. Install **XR Plugin Management**, **OpenXR Plugin**, and **XR Interaction Toolkit** from Package Manager.
  2. Add Scripting Define Symbol `BUILDSMART_XR` in Player Settings so [`VrGrabSnapAdapter`](Assets/Scripts/VR/VrGrabSnapAdapter.cs) automatically binds controller grab + snap events into [`LegoSnapBuilder`](Assets/Scripts/Builder/LegoSnapBuilder.cs)!
