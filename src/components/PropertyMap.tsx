"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { Coordinates } from "@/lib/types";

export function PropertyMap({ coordinates }: { coordinates: Coordinates }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current) return;

      const markerIcon = L.divIcon({
        className: "",
        html: '<div style="width:16px;height:16px;border-radius:9999px;background:#1E3A8A;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current, { zoomControl: true });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(mapRef.current);
      }

      mapRef.current.setView([coordinates.lat, coordinates.lng], 15);
      // keyboard: false — this marker has no click/popup behavior, so making
      // it a focusable "button" with no accessible name would be a
      // dead-end tab stop rather than remove it from the tab order.
      L.marker([coordinates.lat, coordinates.lng], { icon: markerIcon, keyboard: false }).addTo(mapRef.current);
    });

    return () => {
      cancelled = true;
    };
  }, [coordinates]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label={`Map showing the property location at approximately ${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}. Use arrow keys to pan and plus/minus to zoom.`}
      className="h-56 overflow-hidden rounded-2xl border border-border-subtle shadow-[var(--shadow-soft)] sm:h-72 [&_.leaflet-control-attribution]:text-[10px]"
    />
  );
}
