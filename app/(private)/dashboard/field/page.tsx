'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { MapPin, Calendar, Car, Fuel as FuelIcon, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useHue } from '@/context/HueContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import TripStatusBadge from '@/components/trips/TripStatusBadge';
import { Trip } from '@/types/models';

// Declared at module scope (not nested inside the page component) because a
// component defined during render loses its state on every re-render.
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs uppercase tracking-wide text-gray-500">{title}</h2>
      {children}
    </section>
  );
}

function TripCard({
  trip,
  action,
  hue,
  busy,
  onUpdateStatus,
}: {
  trip: Trip;
  action?: 'start' | 'complete';
  hue: number;
  busy: boolean;
  onUpdateStatus: (tripId: string, status: 'Ongoing' | 'Completed') => void;
}) {
  return (
    <Card className="bg-gray-900/70 border-gray-800">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold text-base">{trip.tripNumber}</span>
          <TripStatusBadge status={trip.status} />
        </div>

        <div className="space-y-1.5 text-sm">
          <p className="flex items-start gap-2 text-gray-300">
            <MapPin size={15} className="mt-0.5 shrink-0 text-gray-500" />
            <span>{trip.origin} → {trip.destination}</span>
          </p>
          <p className="flex items-center gap-2 text-gray-400">
            <Calendar size={15} className="shrink-0 text-gray-500" />
            {new Date(trip.startDate).toLocaleDateString()}
          </p>
          <p className="flex items-center gap-2 text-gray-400">
            <Car size={15} className="shrink-0 text-gray-500" />
            <span className="uppercase">{trip.vehicleId?.plateNumber ?? 'No vehicle'}</span>
            {trip.vehicleId?.modelName && (
              <span className="text-gray-500 normal-case">— {trip.vehicleId.modelName}</span>
            )}
          </p>
        </div>

        {trip.purpose && (
          <p className="text-sm text-gray-500 border-t border-gray-800 pt-2">{trip.purpose}</p>
        )}

        {action === 'start' && (
          <Button
            disabled={busy}
            onClick={() => onUpdateStatus(trip._id, 'Ongoing')}
            className="w-full h-12 text-base hover:opacity-90"
            style={{ backgroundColor: `hsl(${hue},70%,45%)`, color: 'white' }}
          >
            {busy ? 'Starting...' : 'Start Trip'}
          </Button>
        )}

        {action === 'complete' && (
          <Button
            disabled={busy}
            onClick={() => onUpdateStatus(trip._id, 'Completed')}
            className="w-full h-12 text-base hover:opacity-90"
            style={{ backgroundColor: `hsl(${hue},70%,45%)`, color: 'white' }}
          >
            {busy ? 'Completing...' : 'Complete Trip'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function FieldViewPage() {
  const hue = useHue();
  const { data: session } = useSession();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const staffId = session?.user?.staffId ? String(session.user.staffId) : null;
  const myName = session?.user?.name ?? null;

  async function fetchTrips() {
    setLoading(true);
    try {
      const res = await fetch('/api/trips');
      if (!res.ok) throw new Error('Failed to load trips');
      setTrips(await res.json());
    } catch (err) {
      console.error(err);
      toast.error('Could not load your trips.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTrips();
  }, []);

  // Trips assigned to the signed-in driver. driverId is the reliable match;
  // driverName covers trips created before a driver was linked by id.
  const myTrips = useMemo(() => {
    return trips.filter((t) => {
      if (staffId && t.driverId) return String(t.driverId) === staffId;
      if (myName && t.driverName) return t.driverName === myName;
      return false;
    });
  }, [trips, staffId, myName]);

  const current = myTrips.filter((t) => t.status === 'Ongoing');
  const upNext = myTrips.filter((t) => t.status === 'Approved');
  const awaiting = myTrips.filter((t) => t.status === 'Pending');
  const past = myTrips.filter((t) =>
    ['Completed', 'Cancelled', 'Declined'].includes(t.status)
  );

  async function updateStatus(tripId: string, status: 'Ongoing' | 'Completed') {
    setUpdatingId(tripId);
    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        toast.success(status === 'Ongoing' ? 'Trip started. Drive safe!' : 'Trip completed.');
        fetchTrips();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || 'Could not update the trip.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not update the trip.');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold uppercase" style={{ color: `hsl(${hue},70%,60%)` }}>
            My Trips
          </h1>
          <p className="text-sm text-gray-400">{session?.user?.name ?? 'Driver'}</p>
        </div>
        <Button
          variant="outline"
          onClick={fetchTrips}
          disabled={loading}
          className="gap-1"
          aria-label="Refresh"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      <Link href="/dashboard/fuel" className="block">
        <Button
          variant="outline"
          className="w-full h-12 justify-start gap-2 text-base border-gray-700"
        >
          <FuelIcon size={16} /> Request Fuel
        </Button>
      </Link>

      {loading && <p className="text-gray-500 text-sm">Loading your trips...</p>}

      {!loading && myTrips.length === 0 && (
        <Card className="bg-gray-900/70 border-gray-800">
          <CardContent className="p-6 text-center space-y-2">
            <p className="text-gray-300">No trips are assigned to you.</p>
            <p className="text-sm text-gray-500">
              Trips show up here once someone assigns you as the driver.
            </p>
          </CardContent>
        </Card>
      )}

      {current.length > 0 && (
        <Section title="On the road now">
          <div className="space-y-3">
            {current.map((t) => (
              <TripCard
                key={t._id}
                trip={t}
                action="complete"
                hue={hue}
                busy={updatingId === t._id}
                onUpdateStatus={updateStatus}
              />
            ))}
          </div>
        </Section>
      )}

      {upNext.length > 0 && (
        <Section title="Ready to go">
          <div className="space-y-3">
            {upNext.map((t) => (
              <TripCard
                key={t._id}
                trip={t}
                action="start"
                hue={hue}
                busy={updatingId === t._id}
                onUpdateStatus={updateStatus}
              />
            ))}
          </div>
        </Section>
      )}

      {awaiting.length > 0 && (
        <Section title="Awaiting approval">
          <div className="space-y-3">
            {awaiting.map((t) => (
              <TripCard key={t._id} trip={t} hue={hue} busy={false} onUpdateStatus={updateStatus} />
            ))}
          </div>
        </Section>
      )}

      {past.length > 0 && (
        <Section title="History">
          <div className="space-y-3">
            {past.slice(0, 5).map((t) => (
              <TripCard key={t._id} trip={t} hue={hue} busy={false} onUpdateStatus={updateStatus} />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
