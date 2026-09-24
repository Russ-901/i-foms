'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { VehicleTrackingPoint } from '@/types/models';

// Recenters the map to fit every tracked vehicle, but only the first time
// points show up — later polls update marker positions in place without
// yanking the map away from wherever the user has panned/zoomed to.
function FitBoundsOnce({ points }: { points: VehicleTrackingPoint[] }) {
  const map = useMap();
  const hasFitted = useRef(false);

  useEffect(() => {
    if (hasFitted.current || points.length === 0) return;
    hasFitted.current = true;

    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 12);
    } else {
      map.fitBounds(points.map((p) => [p.lat, p.lng]), { padding: [40, 40] });
    }
  }, [points, map]);

  return null;
}

export default function VehicleMap({ points, hue }: { points: VehicleTrackingPoint[]; hue: number }) {
  const defaultCenter: [number, number] = points.length
    ? [points[0].lat, points[0].lng]
    : [20, 0];

  return (
    <MapContainer
      center={defaultCenter}
      zoom={points.length ? 12 : 2}
      scrollWheelZoom
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBoundsOnce points={points} />
      {points.map((p) => (
        <CircleMarker
          key={p.vehicleId}
          center={[p.lat, p.lng]}
          radius={9}
          pathOptions={{
            color: p.status === 'moving' ? `hsl(${hue}, 80%, 55%)` : '#9ca3af',
            fillColor: p.status === 'moving' ? `hsl(${hue}, 80%, 55%)` : '#9ca3af',
            fillOpacity: 0.85,
            weight: 2,
          }}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{p.plateNumber}</p>
              <p>{p.modelName}</p>
              <p>Trip: {p.tripNumber ?? 'N/A'}</p>
              <p>
                Status: {p.status === 'moving' ? 'Ongoing' : 'Parked'}
                {p.status === 'moving' && ` — ${Math.round(p.progress * 100)}% of route`}
              </p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
