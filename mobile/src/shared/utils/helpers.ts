import React, { useEffect, useState } from "react";
import { api } from "src/services/api";
import { getLeafletView } from "./getLeafletView";
import { FermeListItem, MobileSeries, FarmMapMarker } from "../types/types";
import { CHART_LABELS, FALLBACK_FARM_COORDS } from "./constants";

export function messageFromError(error: unknown) {
    if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { error?: string } } }).response;
    if (response?.data?.error) return response.data.error;
    }

    if (error instanceof Error) return error.message;
    return "Erreur reseau.";
}

export function useEndpoint<T>(path: string, deps: React.DependencyList = [], pollIntervalMs?: number) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [nonce, setNonce] = useState(0);
    useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    api
      .get(path)
      .then((res) => {
        if (alive) setData(res.data);
      })
      .catch((err) => {
        if (alive) setError(messageFromError(err));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    }, [path, nonce, ...deps]);

    useEffect(() => {
      if (!pollIntervalMs) return;
      const interval = setInterval(() => {
        setNonce((n) => n + 1);
      }, pollIntervalMs);
      return () => clearInterval(interval);
    }, [pollIntervalMs]);

    return { data, loading, error, reload: () => setNonce((n) => n + 1) };
}

export function formatMg(value: number) {
    return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function formatMaybeNumber(value: number | null | undefined, suffix = "") {
    return typeof value === "number" && Number.isFinite(value) ? `${value}${suffix}` : "--";
}

export function hasSeriesData(series?: MobileSeries | null) {
    return Boolean(series?.values?.length);
}

export function escapeChartText(value: string) {
    return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function makeChartPath(values: number[]) {
    const width = 241;
    const height = 105;
    const dMax = values.length > 0 ? Math.max(...values) : 60;
    const dMin = values.length > 0 ? Math.min(...values) : -60;
    const padding = (dMax - dMin) * 0.1 || 10;
    const max = Math.ceil(dMax + padding);
    const min = Math.floor(dMin - padding);
    const source = values;
    const points = source.map((value, index) => {
            const x = source.length === 1 ? 0 : (width / (source.length - 1)) * index;
            const clamped = Math.max(min, Math.min(max, value));
            const y = ((max - clamped) / (max - min)) * height;
            return { x, y };
          });
    if (points.length === 0) return { path: "", points: [], max, min };
    const path = points.slice(1).reduce((acc, point, index) => {
            const prev = points[index];
            const dx = point.x - prev.x;
            const c1x = prev.x + dx * 0.45;
            const c2x = point.x - dx * 0.45;
            return `${acc}C${c1x.toFixed(3)} ${prev.y.toFixed(3)} ${c2x.toFixed(3)} ${point.y.toFixed(3)} ${point.x.toFixed(3)} ${point.y.toFixed(3)}`;
          }, `M${points[0].x.toFixed(3)} ${points[0].y.toFixed(3)}`);
    return { path, points, max, min };
}

export function buildDesignLineChartHtml(color: string, values: number[], labels: string[]) {
    const safeColor = color.replace(/[^#A-Fa-f0-9]/g, "");
    const chart = makeChartPath(values);
    const range = chart.max - chart.min || 1;
    const yTicks = [
            chart.max,
            Math.round(chart.max - range * 0.33),
            Math.round(chart.max - range * 0.66),
            chart.min
          ];
    const monthLabels = (labels.length > 0 ? labels : CHART_LABELS).map(escapeChartText);
    const pointMarkup = chart.points
            .map(
              (point) =>
                `<ellipse cx="${point.x.toFixed(3)}" cy="${point.y.toFixed(3)}" rx="2.16" ry="1.73" fill="${safeColor}" stroke="${safeColor}" />`
            )
            .join("");
    const monthMarkup = monthLabels.map((label) => `<span>${label}</span>`).join("");
    return `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <style>
      * { box-sizing: border-box; }
      html, body {
        width: 100%;
        height: 118px;
        margin: 0;
        padding: 0;
        overflow: hidden;
        background: #FFFFFF;
        font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .wrap {
        height: 118px;
        display: flex;
        align-items: stretch;
        gap: 8px;
        background: #FFFFFF;
      }
      .axis {
        width: 25px;
        height: 118px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: flex-start;
      }
      .axis span {
        height: 15px;
        color: #454C72;
        font-size: 12px;
        line-height: 15px;
        font-weight: 400;
      }
      .chart {
        flex: 1;
        min-width: 0;
        height: 118px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      svg {
        flex: 1;
        width: 100%;
        height: 106px;
        display: block;
      }
      .months {
        height: 12px;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
      }
      .months span {
        flex: 1;
        text-align: center;
        color: #454C72;
        font-size: 10px;
        line-height: 12px;
        font-weight: 400;
        padding-top: 2px;
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="axis">
        <span>${yTicks[0]}</span>
        <span>${yTicks[1]}</span>
        <span>${yTicks[2]}</span>
        <span>${yTicks[3]}</span>
      </div>
      <div class="chart">
        <svg viewBox="0 0 241 106" fill="none" preserveAspectRatio="none">
          <rect x="2.161" y="0.5" width="238.337" height="105" stroke="#F3F3F6" />
          <path d="M1.661 35.333H240.998" stroke="#F3F3F6" />
          <path d="M1.661 70.667H240.998" stroke="#F3F3F6" />
          <path d="M41.55 0L41.55 104.896" stroke="#F3F3F6" />
          <path d="M81.438 0L81.438 104.896" stroke="#F3F3F6" />
          <path d="M121.331 0L121.331 104.896" stroke="#F3F3F6" />
          <path d="M161.222 0L161.222 104.896" stroke="#F3F3F6" />
          <path d="M201.11 0L201.11 104.896" stroke="#F3F3F6" />
          <path d="${chart.path}" stroke="${safeColor}" stroke-width="1.5" fill="none" />
          ${pointMarkup}
        </svg>
        <div class="months">
          ${monthMarkup}
        </div>
      </div>
    </div>
  </body>
</html>`;
}

export function buildFarmMarkers(fermes: FermeListItem[]): FarmMapMarker[] {
    return fermes.map((ferme, index) => {
    const fallback = FALLBACK_FARM_COORDS[index % FALLBACK_FARM_COORDS.length];
    const latitude = typeof ferme.lat === "number" ? ferme.lat : fallback.latitude;
    const longitude = typeof ferme.lng === "number" ? ferme.lng : fallback.longitude;
    const isAlert = ferme.ruchesAttention > 0 || ferme.status === "alerte";
    return {
      id: ferme.id || `${ferme.nom}-${index}`,
      title: ferme.nom,
      subtitle: `${ferme.region || ferme.pays} · ${isAlert ? "Alerte" : "Normale"}`,
      latitude,
      longitude,
      isAlert
    };
    });
}

export function buildLeafletHtml(markers: FarmMapMarker[]) {
    const view = getLeafletView(markers);
    const markerJson = JSON.stringify(markers);
    return `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
      html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background: #DDEBFA; }
      .leaflet-control-attribution { font: 8px/1.2 sans-serif; }
      .farm-pin {
        width: 24px;
        height: 24px;
        border-radius: 999px;
        background: #5668DF;
        border: 4px solid rgba(255,255,255,.94);
        box-shadow: 0 4px 12px rgba(23,31,79,.22);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .farm-pin.alert {
        width: 30px;
        height: 30px;
        background: #FF9F3B;
        border-color: rgba(255,231,206,.95);
      }
      .farm-pin::after {
        content: "";
        width: 6px;
        height: 6px;
        border-radius: 999px;
        background: white;
      }
      .leaflet-popup-content-wrapper {
        border-radius: 12px;
        box-shadow: 0 8px 18px rgba(23,31,79,.14);
      }
      .popup-title {
        color: #171F4F;
        font-weight: 800;
        font-size: 13px;
        margin-bottom: 3px;
      }
      .popup-subtitle {
        color: #747995;
        font-weight: 600;
        font-size: 11px;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      const markers = ${markerJson};
      const map = L.map("map", {
        zoomControl: false,
        attributionControl: true
      }).setView([${view.latitude}, ${view.longitude}], ${view.zoom});

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd",
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors &copy; CARTO"
      }).addTo(map);

      function escapeHtml(value) {
        return String(value)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }

      function markerIcon(isAlert) {
        return L.divIcon({
          className: "",
          html: '<span class="farm-pin ' + (isAlert ? "alert" : "") + '"></span>',
          iconSize: isAlert ? [30, 30] : [24, 24],
          iconAnchor: isAlert ? [15, 15] : [12, 12],
          popupAnchor: [0, -12]
        });
      }

      const bounds = [];
      markers.forEach((marker) => {
        const latLng = [marker.latitude, marker.longitude];
        bounds.push(latLng);
        L.marker(latLng, { icon: markerIcon(marker.isAlert) })
          .addTo(map)
          .on("click", function() {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(marker.id);
            }
          });
      });

      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [28, 28], maxZoom: 10 });
      }
    </script>
  </body>
</html>`;
}

export function shortFarmName(name: string) {
    const clean = name.trim() || "Ferme";
    return clean.length > 12 ? clean.slice(0, 12) : clean;
}
