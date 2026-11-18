using System;
using UnityEngine;

namespace BuildSmartNigeria.Core
{
    public enum PieceType
    {
        EpsPanel3D,
        Block9Bay,
        Block6Bay,
        Block9Single,
        Block6Single,
        StarterPeg,
        DoorFrame,
        WindowBay
    }

    [Serializable]
    public struct PlacedPieceData
    {
        public string id;
        public string type;
        public float x;
        public float z;
        public string dir;
        public int layer;
    }

    /// <summary>
    /// Attach to every interactive Blender-imported Prefab (Block, EPS Panel, Starter Peg).
    /// Carries metric dimensions and JSON payload mapping for Cloudflare /api/estimate.
    /// </summary>
    public class BuildPiece : MonoBehaviour
    {
        [Header("Nigerian Material Spec")]
        public PieceType pieceType = PieceType.EpsPanel3D;
        public float widthMeters = 1.20f;
        public float heightMeters = 3.00f;
        public float thicknessMeters = 0.14f;

        [HideInInspector] public string pieceId;
        [HideInInspector] public Vector2 gridCoord;
        [HideInInspector] public bool isVertical;
        [HideInInspector] public int stackLayer;

        public string ToApiTypeString()
        {
            return pieceType switch
            {
                PieceType.EpsPanel3D => "eps_panel",
                PieceType.Block9Bay => "block_9_bay",
                PieceType.Block6Bay => "block_6_bay",
                PieceType.Block9Single => "block_9_single",
                PieceType.Block6Single => "block_6_single",
                PieceType.StarterPeg => "starter_peg",
                PieceType.DoorFrame => "door",
                PieceType.WindowBay => "window",
                _ => "eps_panel"
            };
        }

        public PlacedPieceData ToPayload()
        {
            return new PlacedPieceData
            {
                id = pieceId,
                type = ToApiTypeString(),
                x = gridCoord.x,
                z = gridCoord.y,
                dir = isVertical ? "v" : "h",
                layer = stackLayer
            };
        }
    }
}
