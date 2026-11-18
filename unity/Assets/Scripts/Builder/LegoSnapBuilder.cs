using System;
using System.Collections.Generic;
using UnityEngine;
using BuildSmartNigeria.Core;

namespace BuildSmartNigeria.Builder
{
    /// <summary>
    /// Interactive Lego-style 3D Builder for WebGL (mouse), Android (touch), and VR controllers.
    /// Snaps Blender-generated EPS panels, Sandcrete blocks, and Y12 starter pegs onto a concrete platform
    /// and updates live counts on every snap.
    /// </summary>
    public class LegoSnapBuilder : MonoBehaviour
    {
        [Header("Land Plot Dimensions (Meters)")]
        public float landWidthMeters = 15f;
        public float landDepthMeters = 30f;
        public float setbackSideMeters = 1.2f;
        public float setbackFrontMeters = 1.5f;

        [Header("Scene References")]
        public Camera activeCamera;
        public LayerMask buildSurfaceLayer;
        public Transform platformContainer;
        public Transform piecesContainer;

        [Header("Blender-Exported Prefabs")]
        public GameObject epsPanelPrefab;
        public GameObject block9Prefab;
        public GameObject block6Prefab;
        public GameObject starterPegPrefab;
        public GameObject ghostIndicatorPrefab;

        [Header("Active Tool State")]
        public PieceType activePieceType = PieceType.EpsPanel3D;
        public bool placeVertical = false;

        public readonly List<BuildPiece> PlacedPieces = new List<BuildPiece>();

        public int EpsPanelsCount { get; private set; }
        public int BlocksCount { get; private set; }
        public int StarterPegsCount { get; private set; }

        public event Action OnDesignChanged;

        private GameObject _ghostInstance;

        private void Start()
        {
            if (activeCamera == null) activeCamera = Camera.main;
            if (ghostIndicatorPrefab != null)
            {
                _ghostInstance = Instantiate(ghostIndicatorPrefab);
                _ghostInstance.SetActive(false);
            }
        }

        private void Update()
        {
            if (activeCamera == null) return;

            Ray ray = activeCamera.ScreenPointToRay(Input.mousePosition);
            if (Physics.Raycast(ray, out RaycastHit hit, 120f, buildSurfaceLayer))
            {
                Vector3 snapped = SnapToModuleGrid(hit.point, activePieceType);
                UpdateGhost(snapped);

                if (Input.GetMouseButtonDown(0))
                {
                    PlacePieceAtWorldPoint(snapped, activePieceType, placeVertical);
                }
            }
            else if (_ghostInstance != null)
            {
                _ghostInstance.SetActive(false);
            }

            if (Input.GetKeyDown(KeyCode.R))
            {
                placeVertical = !placeVertical;
            }
        }

        public Vector3 SnapToModuleGrid(Vector3 worldPos, PieceType type)
        {
            float step = (type == PieceType.Block9Single || type == PieceType.Block6Single) ? 0.45f : 0.60f;
            float x = Mathf.Clamp(Mathf.Round(worldPos.x / step) * step, setbackSideMeters, landWidthMeters - setbackSideMeters);
            float z = Mathf.Clamp(Mathf.Round(worldPos.z / step) * step, setbackFrontMeters, landDepthMeters - setbackFrontMeters);
            return new Vector3(x, 0.22f, z);
        }

        public BuildPiece PlacePieceAtWorldPoint(Vector3 snappedPos, PieceType type, bool vertical)
        {
            GameObject prefab = ResolvePrefab(type);
            if (prefab == null) return null;

            Quaternion rot = vertical ? Quaternion.Euler(0f, 90f, 0f) : Quaternion.identity;
            GameObject obj = Instantiate(prefab, snappedPos, rot, piecesContainer);

            var piece = obj.GetComponent<BuildPiece>() ?? obj.AddComponent<BuildPiece>();
            piece.pieceType = type;
            piece.pieceId = Guid.NewGuid().ToString("N").Substring(0, 10);
            piece.gridCoord = new Vector2(snappedPos.x, snappedPos.z);
            piece.isVertical = vertical;

            PlacedPieces.Add(piece);
            RecalculateLiveCounts();
            OnDesignChanged?.Invoke();
            return piece;
        }

        /// <summary>
        /// Auto-generates perimeter walls + starter pegs cleanly inside the user's land setbacks.
        /// </summary>
        public void AutoGenerateFromLand()
        {
            ClearAllPieces();
            float usableW = Mathf.Max(3.6f, landWidthMeters - setbackSideMeters * 2f);
            float usableD = Mathf.Max(3.6f, landDepthMeters - setbackFrontMeters * 2f);
            float step = (activePieceType == PieceType.EpsPanel3D) ? 1.2f : 0.9f;

            int cols = Mathf.Max(2, Mathf.FloorToInt(usableW / step));
            int rows = Mathf.Max(2, Mathf.FloorToInt(usableD / step));

            for (int c = 0; c < cols; c++)
            {
                float x = setbackSideMeters + c * step;
                PlacePieceAtWorldPoint(new Vector3(x, 0.22f, setbackFrontMeters), activePieceType, false);
                PlacePieceAtWorldPoint(new Vector3(x, 0.22f, setbackFrontMeters + rows * step), activePieceType, false);
            }

            for (int r = 0; r < rows; r++)
            {
                float z = setbackFrontMeters + r * step;
                PlacePieceAtWorldPoint(new Vector3(setbackSideMeters, 0.22f, z), activePieceType, true);
                PlacePieceAtWorldPoint(new Vector3(setbackSideMeters + cols * step, 0.22f, z), activePieceType, true);
            }
        }

        public void UndoLastPiece()
        {
            if (PlacedPieces.Count == 0) return;
            var last = PlacedPieces[PlacedPieces.Count - 1];
            PlacedPieces.RemoveAt(PlacedPieces.Count - 1);
            if (last != null) Destroy(last.gameObject);
            RecalculateLiveCounts();
            OnDesignChanged?.Invoke();
        }

        public void ClearAllPieces()
        {
            foreach (var p in PlacedPieces)
            {
                if (p != null) Destroy(p.gameObject);
            }
            PlacedPieces.Clear();
            RecalculateLiveCounts();
            OnDesignChanged?.Invoke();
        }

        public void RecalculateLiveCounts()
        {
            int eps = 0, blocks = 0, pegs = 0;
            foreach (var p in PlacedPieces)
            {
                switch (p.pieceType)
                {
                    case PieceType.EpsPanel3D:
                        eps += 1;
                        pegs += 3; // 3 vertical starter pegs under every 1.2m EPS panel
                        break;
                    case PieceType.Block9Bay:
                    case PieceType.Block6Bay:
                        blocks += 27; // Full 0.9m x 3.0m coursed block bay
                        break;
                    case PieceType.Block9Single:
                    case PieceType.Block6Single:
                        blocks += 1;
                        break;
                    case PieceType.StarterPeg:
                        pegs += 1;
                        break;
                }
            }

            EpsPanelsCount = eps;
            BlocksCount = blocks;
            StarterPegsCount = pegs;
        }

        private GameObject ResolvePrefab(PieceType type)
        {
            return type switch
            {
                PieceType.EpsPanel3D => epsPanelPrefab,
                PieceType.Block9Bay => block9Prefab,
                PieceType.Block9Single => block9Prefab,
                PieceType.Block6Bay => block6Prefab,
                PieceType.Block6Single => block6Prefab,
                PieceType.StarterPeg => starterPegPrefab,
                _ => epsPanelPrefab
            };
        }

        private void UpdateGhost(Vector3 snapped)
        {
            if (_ghostInstance == null) return;
            _ghostInstance.SetActive(true);
            _ghostInstance.transform.position = snapped;
            _ghostInstance.transform.rotation = placeVertical ? Quaternion.Euler(0f, 90f, 0f) : Quaternion.identity;
        }
    }
}
