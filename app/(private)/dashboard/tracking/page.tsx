'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useHue } from '@/context/HueContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VehicleTrackingPoint } from '@/types/models';

// Leaflet touches `window`, so the map can only render on the client.
const VehicleMap = dynamic(() => import('@/components/tracking/VehicleMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-gray-500">Loading map...</div>
  ),
});

const POLL_INTERVAL_MS = 4000;

export default function TrackingPage() {
  const hue = useHue();
  const [points, setPoints] = useState<VehicleTrackingPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function fetchTracking() {
      try {
        const res = await fetch('/api/vehicles/tracking');
        if (!res.ok) throw new Error('Failed to load tracking data');
        setPoints(await res.json());
        setError(false);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchTracking();
    intervalRef.current = setInterval(fetchTracking, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const moving = points.filter((p) => p.status === 'moving');
  const parked = points.filter((p) => p.status === 'parked');

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1
          className="text-2xl font-bold uppercase"
          style={{ color: `hsl(${hue},70%,60%)` }}
        >
          Live Vehicle Tracking
        </h1>
        <p className="text-sm text-gray-400">
          Positions update every {POLL_INTERVAL_MS / 1000}s while a trip is Ongoing.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-400">
          Couldn&apos;t load tracking data. Retrying automatically...
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-[500px]">
        <div className="lg:col-span-3 h-[500px] lg:h-full rounded-lg overflow-hidden border border-gray-800">
          <VehicleMap points={points} hue={hue} />
        </div>

        <div className="space-y-4 overflow-y-auto">
          <Card className="bg-gray-900/60 border-gray-800">
            <CardHeader>
              <CardTitle className="text-sm uppercase text-gray-300">
                On the road ({moving.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {moving.length === 0 && (
                <p className="text-sm text-gray-500">No vehicles are currently on an ongoing trip.</p>
              )}
              {moving.map((p) => (
                <div key={p.vehicleId} className="text-sm">
                  <div className="flex justify-between">
                    <span className="font-semibold" style={{ color: `hsl(${hue},80%,60%)` }}>
                      {p.plateNumber}
                    </span>
                    <span className="text-gray-400">{Math.round(p.progress * 100)}%</span>
                  </div>
                  <p className="text-gray-500">{p.modelName} · Trip {p.tripNumber}</p>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round(p.progress * 100)}%`,
                        backgroundColor: `hsl(${hue},80%,55%)`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-gray-900/60 border-gray-800">
            <CardHeader>
              <CardTitle className="text-sm uppercase text-gray-300">
                Parked ({parked.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {parked.length === 0 && (
                <p className="text-sm text-gray-500">No completed-trip vehicles to show yet.</p>
              )}
              {parked.map((p) => (
                <div key={p.vehicleId} className="text-sm flex justify-between">
                  <span className="text-gray-300">{p.plateNumber}</span>
                  <span className="text-gray-500">{p.modelName}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {!loading && points.length === 0 && !error && (
            <p className="text-sm text-gray-500">
              No vehicles have GPS data yet. Start a trip and mark it Ongoing to see it move here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
