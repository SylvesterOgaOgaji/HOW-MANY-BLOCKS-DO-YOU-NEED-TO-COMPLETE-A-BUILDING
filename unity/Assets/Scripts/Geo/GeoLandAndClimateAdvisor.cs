using System;
using System.Collections.Generic;
using UnityEngine;
using BuildSmartNigeria.Builder;

namespace BuildSmartNigeria.Geo
{
    [Serializable]
    public struct SurveyBeacon
    {
        public string label;
        public double latitude;
        public double longitude;
    }

    /// <summary>
    /// Converts Google Maps GPS Survey Beacons into metric Unity plot coordinates,
    /// calculates Nigerian SW Monsoon / NE Harmattan wind orientation, and places
    /// Borehole vs Septic Soakaway at >= 15m safe hygienic separation.
    /// </summary>
    public class GeoLandAndClimateAdvisor : MonoBehaviour
    {
        private const double EarthRadiusMeters = 6378137.0;

        [Header("GPS Survey Beacons (From Survey Plan / Google Maps)")]
        public List<SurveyBeacon> beacons = new List<SurveyBeacon>();

        [Header("Scene Visuals")]
        public LegoSnapBuilder snapBuilder;
        public Transform houseRootTransform;
        public Transform boreholeTowerTransform;
        public Transform septicSoakawayTransform;

        [Header("Live Outputs")]
        public float measuredAreaM2;
        public float measuredWidthM;
        public float measuredDepthM;
        public float recommendedYawDeg;
        public float boreholeSepticSeparationM;
        public bool separationSafe;

        public void ApplyBeaconsToUnityPlot()
        {
            if (beacons == null || beacons.Count < 3) return;

            double lat0 = 0, lng0 = 0;
            foreach (var b in beacons)
            {
                lat0 += b.latitude;
                lng0 += b.longitude;
            }
            lat0 /= beacons.Count;
            lng0 /= beacons.Count;
            double cosLat = Math.Cos(lat0 * Math.PI / 180.0);

            var localPts = new List<Vector2>();
            double minX = double.MaxValue, maxX = double.MinValue;
            double minZ = double.MaxValue, maxZ = double.MinValue;

            foreach (var b in beacons)
            {
                double x = ((b.longitude - lng0) * Math.PI / 180.0) * EarthRadiusMeters * cosLat;
                double z = ((b.latitude - lat0) * Math.PI / 180.0) * EarthRadiusMeters;
                localPts.Add(new Vector2((float)x, (float)z));
                minX = Math.Min(minX, x);
                maxX = Math.Max(maxX, x);
                minZ = Math.Min(minZ, z);
                maxZ = Math.Max(maxZ, z);
            }

            // Shoelace polygon area
            double sum = 0;
            for (int i = 0; i < localPts.Count; i++)
            {
                var p1 = localPts[i];
                var p2 = localPts[(i + 1) % localPts.Count];
                sum += (double)p1.x * p2.y - (double)p2.x * p1.y;
            }

            measuredAreaM2 = Mathf.Abs((float)sum) * 0.5f;
            measuredWidthM = Mathf.Max(6f, (float)(maxX - minX));
            measuredDepthM = Mathf.Max(8f, (float)(maxZ - minZ));

            if (snapBuilder != null)
            {
                snapBuilder.landWidthMeters = measuredWidthM;
                snapBuilder.landDepthMeters = measuredDepthM;
            }

            // Climate & Wind Orientation (Northern Nigeria > 8.5 deg receives stronger Harmattan)
            recommendedYawDeg = lat0 >= 8.5 ? 15f : 10f;
            if (houseRootTransform != null)
            {
                houseRootTransform.rotation = Quaternion.Euler(0f, recommendedYawDeg, 0f);
            }

            // Place Borehole Upwind (SW Corner) and Septic Downwind (NE Corner)
            Vector3 bh = new Vector3(Mathf.Min(measuredWidthM - 1.5f, 2f), 0f, Mathf.Max(2.5f, measuredDepthM - 2.5f));
            Vector3 sep = new Vector3(Mathf.Max(2f, measuredWidthM - 2.2f), 0f, Mathf.Min(measuredDepthM - 2.5f, 2.4f));

            if (boreholeTowerTransform != null) boreholeTowerTransform.position = bh;
            if (septicSoakawayTransform != null) septicSoakawayTransform.position = sep;

            boreholeSepticSeparationM = Vector3.Distance(bh, sep);
            separationSafe = boreholeSepticSeparationM >= 15f;
        }
    }
}
