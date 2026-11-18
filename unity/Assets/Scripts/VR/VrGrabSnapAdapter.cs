using UnityEngine;
using BuildSmartNigeria.Core;
using BuildSmartNigeria.Builder;

#if BUILDSMART_XR
using UnityEngine.XR.Interaction.Toolkit;
#endif

namespace BuildSmartNigeria.VR
{
    /// <summary>
    /// VR Headset (Meta Quest / OpenXR) adapter allowing users to physically grab
    /// a 3D Block or EPS Panel and snap it onto the foundation grid.
    /// Define BUILDSMART_XR in Project Settings after installing XR Interaction Toolkit.
    /// </summary>
    public class VrGrabSnapAdapter : MonoBehaviour
    {
        public LegoSnapBuilder snapBuilder;
        public BuildPiece piece;

#if BUILDSMART_XR
        private UnityEngine.XR.Interaction.Toolkit.Interactables.XRGrabInteractable _grab;

        private void Awake()
        {
            _grab = GetComponent<UnityEngine.XR.Interaction.Toolkit.Interactables.XRGrabInteractable>();
            if (piece == null) piece = GetComponent<BuildPiece>();
            if (_grab != null)
            {
                _grab.selectExited.AddListener(OnReleasedInVr);
            }
        }

        private void OnReleasedInVr(SelectExitEventArgs args)
        {
            if (snapBuilder == null || piece == null) return;
            Vector3 snapped = snapBuilder.SnapToModuleGrid(transform.position, piece.pieceType);
            transform.position = snapped;
            // Lock rotation cleanly to 0 or 90 deg modular axis
            float yaw = Mathf.Round(transform.eulerAngles.y / 90f) * 90f;
            transform.rotation = Quaternion.Euler(0f, yaw, 0f);
            piece.gridCoord = new Vector2(snapped.x, snapped.z);
            piece.isVertical = Mathf.Abs(Mathf.DeltaAngle(yaw, 90f)) < 15f || Mathf.Abs(Mathf.DeltaAngle(yaw, 270f)) < 15f;
            if (!snapBuilder.PlacedPieces.Contains(piece))
            {
                snapBuilder.PlacedPieces.Add(piece);
            }
            snapBuilder.RecalculateLiveCounts();
        }
#endif
    }
}
