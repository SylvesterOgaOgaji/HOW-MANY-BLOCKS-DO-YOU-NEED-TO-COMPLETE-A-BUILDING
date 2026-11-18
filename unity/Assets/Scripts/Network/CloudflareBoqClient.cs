using System;
using System.Collections;
using System.Collections.Generic;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;
using BuildSmartNigeria.Core;
using BuildSmartNigeria.Builder;

namespace BuildSmartNigeria.Network
{
    [Serializable]
    public class EstimateRequestPayload
    {
        public string city = "abuja";
        public string buildMode = "piece_by_piece";
        public string wallSystem = "eps_panel";
        public float wallHeightM = 3.0f;
        public int floors = 1;
        public string roofStyle = "gable";
        public float platformAreaM2 = 120f;
        public List<PlacedPieceData> placedPieces = new List<PlacedPieceData>();
    }

    [Serializable]
    public class EstimateQuantitiesSummary
    {
        public int wallUnitsCount;
        public int starterPegsCount;
        public int cementBags;
        public int waterLitres;
        public int waterTanks1000L;
    }

    [Serializable]
    public class EstimateCostsSummary
    {
        public double substructureCost;
        public double wallingCost;
        public double roofingCost;
        public double carcassTotal;
        public double completeTurnkeyTotal;
    }

    [Serializable]
    public class EstimateResponsePayload
    {
        public EstimateQuantitiesSummary quantities;
        public EstimateCostsSummary costs;
    }

    /// <summary>
    /// Syncs Unity's live 3D placed pieces with your Cloudflare Workers BOQ API (/api/estimate & /api/projects).
    /// Works seamlessly across WebGL, Android, and Standalone VR builds.
    /// </summary>
    public class CloudflareBoqClient : MonoBehaviour
    {
        [Header("Cloudflare Workers Endpoint")]
        public string apiBaseUrl = "https://buildsmart-nigeria-api.your-subdomain.workers.dev";
        public string selectedCityId = "abuja";
        public string activeWallSystem = "eps_panel";

        public LegoSnapBuilder snapBuilder;

        public EstimateResponsePayload LatestEstimate { get; private set; }
        public event Action<EstimateResponsePayload> OnEstimateUpdated;

        private void OnEnable()
        {
            if (snapBuilder != null)
            {
                snapBuilder.OnDesignChanged += RequestLiveEstimate;
            }
        }

        private void OnDisable()
        {
            if (snapBuilder != null)
            {
                snapBuilder.OnDesignChanged -= RequestLiveEstimate;
            }
        }

        public void RequestLiveEstimate()
        {
            if (snapBuilder == null) return;
            StartCoroutine(PostEstimateCoroutine());
        }

        private IEnumerator PostEstimateCoroutine()
        {
            var payload = new EstimateRequestPayload
            {
                city = selectedCityId,
                buildMode = "piece_by_piece",
                wallSystem = activeWallSystem,
                platformAreaM2 = Mathf.Max(20f, (snapBuilder.landWidthMeters - 2.4f) * (snapBuilder.landDepthMeters - 3.0f))
            };

            foreach (var p in snapBuilder.PlacedPieces)
            {
                payload.placedPieces.Add(p.ToPayload());
            }

            string json = JsonUtility.ToJson(payload);
            byte[] bodyRaw = Encoding.UTF8.GetBytes(json);

            using (var req = new UnityWebRequest($"{apiBaseUrl.TrimEnd('/')}/api/estimate", "POST"))
            {
                req.uploadHandler = new UploadHandlerRaw(bodyRaw);
                req.downloadHandler = new DownloadHandlerBuffer();
                req.SetRequestHeader("Content-Type", "application/json");

                yield return req.SendWebRequest();

                if (req.result == UnityWebRequest.Result.Success)
                {
                    LatestEstimate = JsonUtility.FromJson<EstimateResponsePayload>(req.downloadHandler.text);
                    OnEstimateUpdated?.Invoke(LatestEstimate);
                }
                else
                {
                    Debug.LogWarning($"[BuildSmart API] Estimate request failed: {req.error}");
                }
            }
        }
    }
}
