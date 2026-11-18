# Connecting Blender & Blender MCP to BuildSmart Nigeria

This folder turns **Blender (free & open-source)** into your real 3D PBR mesh factory for **Web (Three.js)**, **Unity (WebGL / Android / VR Headsets)**, and **Cloudflare R2**.

---

## Option 1: One-Command Batch Export (Zero Add-on Needed)
1. Install **Blender 4.x LTS** from `https://www.blender.org/download/`.
2. Open a terminal inside the cloned repo and run:
   ```bash
   cd blender
   blender --background --python generate_buildsmart_assets.py
   ```
3. This creates real 1:1 metric `.glb` and `.fbx` models in `blender/exports/`:
   - `block_9_inch.glb` / `.fbx` (`450 × 225 × 225 mm` dual-core hollow sandcrete block)
   - `block_6_inch.glb` / `.fbx` (`450 × 225 × 150 mm` dual-core hollow sandcrete block)
   - `eps_panel_3d.glb` / `.fbx` (`1.20 × 3.00 × 0.14 m` polystyrene bead core + galvanized 3D steel wire mesh)
   - `starter_peg_y12.glb` / `.fbx` (`Y12` deformed steel peg with foundation L-hook)
   - `geepee_tank_tower.glb` / `.fbx` (steel tower + ribbed tank + vent pipe)
4. Copy the generated `.fbx` or `.glb` files straight into:
   - `unity/Assets/Models/` (for Unity WebGL, Android, Meta Quest VR)
   - Or upload `.glb` files to **Cloudflare R2** (`wrangler r2 object put ...`) so your web/mobile clients load them from CDN!

---

## Option 2: Live Prompting with Blender MCP (Local AI ↔ Blender)
If you want to sculpt new Nigerian house items (e.g., burglary-proof grilles, POP ceilings, parapet fascia, interlocking paving stones) via prompts on your computer:

1. Download **Blender MCP** (`https://github.com/ahujasid/blender-mcp`).
2. In Blender: **Edit → Preferences → Add-ons → Install from Disk**, choose `addon.py`, enable **Interface: Blender MCP**, and click **Start MCP Server** in the 3D Viewport sidebar (`N` key).
3. Ensure `uv` is installed locally, then add Blender MCP to your local IDE / desktop MCP config:
   ```json
   {
     "mcpServers": {
       "blender": {
         "command": "uvx",
         "args": ["blender-mcp"]
       }
     }
   }
   ```
4. Prompt your AI client locally (e.g., *"Create a Nigerian aluminum casement window 1.2m × 1.2m with burglar-proof bars and export to unity/Assets/Models/window_1200.glb"*) and drop straight into Unity.
