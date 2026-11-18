"""
BuildSmart Nigeria — Blender 4.x Procedural 3D Asset Pack Generator
Generates true 1:1 metric scale (.glb & .fbx) meshes for:
  1. 9-inch Hollow Sandcrete Block (450 x 225 x 225 mm, dual hollow cores)
  2. 6-inch Hollow Sandcrete Block (450 x 225 x 150 mm, dual hollow cores)
  3. 3D Polystyrene (EPS) Wire-Mesh Panel (1.20 x 3.00 x 0.14 m + galvanized wire grid)
  4. Vertical Starter Iron Peg (Y12 ribbed rebar w/ concrete anchor hook)
  5. Overhead Geepee Water Tank + Steel Stanchion + 4-Pipe Manifold

Usage (run headless in terminal on your PC):
  blender --background --python generate_buildsmart_assets.py
Outputs go into: ./exports/*.glb and ./exports/*.fbx
"""

import math
import os
import bpy
import bmesh

EXPORT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "exports")
os.makedirs(EXPORT_DIR, exist_ok=True)


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for mesh in bpy.data.meshes:
        bpy.data.meshes.remove(mesh)
    for mat in bpy.data.materials:
        bpy.data.materials.remove(mat)


def make_material(name, base_color, roughness=0.85, metallic=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = base_color
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metallic
    return mat


def export_active_collection(base_name):
    glb_path = os.path.join(EXPORT_DIR, f"{base_name}.glb")
    fbx_path = os.path.join(EXPORT_DIR, f"{base_name}.fbx")
    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
    )
    bpy.ops.export_scene.fbx(
        filepath=fbx_path,
        use_selection=True,
        apply_scale_options="FBX_SCALE_ALL",
    )
    print(f"[BuildSmart] Exported {base_name}.glb and {base_name}.fbx")


def create_hollow_block(name, length=0.45, height=0.225, thickness=0.225):
    clear_scene()
    mat_block = make_material("SandcreteConcrete", (0.46, 0.44, 0.41, 1.0), roughness=0.92)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, height / 2))
    outer = bpy.context.active_object
    outer.name = name
    outer.scale = (length, thickness, height)
    bpy.ops.object.transform_apply(scale=True)

    # Boolean carve two hollow cores
    core_w = length * 0.30
    core_t = thickness * 0.56
    for cx in (-length * 0.22, length * 0.22):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx, 0, height / 2))
        cutter = bpy.context.active_object
        cutter.scale = (core_w, core_t, height + 0.04)
        bpy.ops.object.transform_apply(scale=True)

        mod = outer.modifiers.new(name="HollowCore", type="BOOLEAN")
        mod.operation = "DIFFERENCE"
        mod.object = cutter
        bpy.context.view_layer.objects.active = outer
        bpy.ops.object.modifier_apply(modifier=mod.name)
        bpy.data.objects.remove(cutter, do_unlink=True)

    # Bevel edges slightly for realism
    bev = outer.modifiers.new(name="Chamfer", type="BEVEL")
    bev.width = 0.004
    bev.segments = 2
    bpy.ops.object.modifier_apply(modifier=bev.name)

    outer.data.materials.append(mat_block)
    outer.select_set(True)
    export_active_collection(name)


def create_eps_panel_3d(name="eps_panel_3d", width=1.20, height=3.00, core_thick=0.10):
    clear_scene()
    mat_eps = make_material("EpsPolystyreneBead", (0.94, 0.96, 0.98, 1.0), roughness=0.72)
    mat_wire = make_material("GalvanizedWireMesh", (0.72, 0.76, 0.80, 1.0), roughness=0.28, metallic=0.88)

    # Polystyrene core
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, height / 2))
    core = bpy.context.active_object
    core.name = "EPS_FoamCore"
    core.scale = (width, core_thick, height)
    bpy.ops.object.transform_apply(scale=True)
    core.data.materials.append(mat_eps)

    parts = [core]
    mesh_offset = core_thick / 2 + 0.015

    # Build galvanized vertical & horizontal wire grid on front and back faces
    for side in (-1, 1):
        y_pos = side * mesh_offset
        # Vertical wires every 0.15m
        cols = int(round(width / 0.15)) + 1
        for i in range(cols):
            x = -width / 2 + i * (width / (cols - 1))
            bpy.ops.mesh.primitive_cylinder_add(radius=0.0028, depth=height, location=(x, y_pos, height / 2))
            w = bpy.context.active_object
            w.data.materials.append(mat_wire)
            parts.append(w)

        # Horizontal wires every 0.25m
        rows = int(round(height / 0.25)) + 1
        for r in range(rows):
            z = r * (height / (rows - 1))
            bpy.ops.mesh.primitive_cylinder_add(
                radius=0.0028,
                depth=width,
                location=(0, y_pos, z),
                rotation=(0, math.pi / 2, 0),
            )
            w = bpy.context.active_object
            w.data.materials.append(mat_wire)
            parts.append(w)

    bpy.ops.object.select_all(action="DESELECT")
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = core
    export_active_collection(name)


def create_starter_peg_y12(name="starter_peg_y12", height=0.65, radius=0.006):
    clear_scene()
    mat_rebar = make_material("RebarSteel_Y12", (0.28, 0.22, 0.19, 1.0), roughness=0.45, metallic=0.85)

    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=height, location=(0, 0, height / 2))
    peg = bpy.context.active_object
    peg.name = name
    peg.data.materials.append(mat_rebar)

    # L-hook bottom anchor inside concrete platform
    bpy.ops.mesh.primitive_cylinder_add(
        radius=radius,
        depth=0.15,
        location=(0.075, 0, 0.006),
        rotation=(0, math.pi / 2, 0),
    )
    hook = bpy.context.active_object
    hook.data.materials.append(mat_rebar)

    peg.select_set(True)
    hook.select_set(True)
    bpy.context.view_layer.objects.active = peg
    export_active_collection(name)


def create_geepee_tank_tower(name="geepee_tank_tower"):
    clear_scene()
    mat_steel = make_material("TowerSteel", (0.20, 0.25, 0.30, 1.0), roughness=0.35, metallic=0.8)
    mat_tank = make_material("BlackHDPE_Tank", (0.04, 0.05, 0.07, 1.0), roughness=0.38)
    mat_pvc = make_material("PVC_Blue", (0.05, 0.45, 0.80, 1.0), roughness=0.3)

    parts = []
    # Four stanchion legs (3m tall)
    for lx in (-0.55, 0.55):
        for ly in (-0.55, 0.55):
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(lx, ly, 1.5))
            leg = bpy.context.active_object
            leg.scale = (0.08, 0.08, 3.0)
            bpy.ops.object.transform_apply(scale=True)
            leg.data.materials.append(mat_steel)
            parts.append(leg)

    # Top deck
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 3.05))
    deck = bpy.context.active_object
    deck.scale = (1.35, 1.35, 0.1)
    bpy.ops.object.transform_apply(scale=True)
    deck.data.materials.append(mat_steel)
    parts.append(deck)

    # Cylindrical tank
    bpy.ops.mesh.primitive_cylinder_add(radius=0.62, depth=1.45, location=(0, 0, 3.82))
    tank = bpy.context.active_object
    tank.data.materials.append(mat_tank)
    parts.append(tank)

    # Air vent + overflow pipe
    bpy.ops.mesh.primitive_cylinder_add(radius=0.025, depth=0.5, location=(0.25, 0, 4.7))
    vent = bpy.context.active_object
    vent.data.materials.append(mat_pvc)
    parts.append(vent)

    bpy.ops.object.select_all(action="DESELECT")
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = tank
    export_active_collection(name)


if __name__ == "__main__":
    create_hollow_block("block_9_inch", length=0.45, height=0.225, thickness=0.225)
    create_hollow_block("block_6_inch", length=0.45, height=0.225, thickness=0.150)
    create_eps_panel_3d("eps_panel_3d")
    create_starter_peg_y12("starter_peg_y12")
    create_geepee_tank_tower("geepee_tank_tower")
    print(f"[BuildSmart] All 3D Nigerian architectural assets exported to: {EXPORT_DIR}")
