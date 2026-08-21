import { TUNISIA_REGION } from "./constants";
import { FarmMapMarker } from "../types/types";

export function getLeafletView(markers: FarmMapMarker[]) {
    if (markers.length === 0) return { ...TUNISIA_REGION, zoom: 6 };
    if (markers.length === 1) {
    return {
      latitude: markers[0].latitude,
      longitude: markers[0].longitude,
      zoom: 10
    };
    }

    const latitudes = markers.map((marker) => marker.latitude);
    const longitudes = markers.map((marker) => marker.longitude);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    const spread = Math.max(maxLat - minLat, maxLng - minLng);
    return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    zoom: spread > 3 ? 6 : spread > 1.6 ? 7 : spread > 0.8 ? 8 : 10
    };
}
