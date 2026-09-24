'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Car } from 'lucide-react';
import { toast } from 'sonner';
import { useHue } from '@/context/HueContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import TripStatusBadge from '@/components/trips/TripStatusBadge';
import { Trip, Fuel } from '@/types/models';

export default function TripDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const hue = useHue();
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';

  const [trip, setTrip] = useState<Trip | null>(null);
  const [fuelRequests, setFuelRequests] = useState<Fuel[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  async function loadAll() {
    setLoading(true);
    try {
      const [tripRes, fuelRes] = await Promise.all([
        fetch(`/api/trips/${id}`),
        fetch('/api/fuel'),
      ]);

      if (!tripRes.ok) {
        setNotFound(true);
        return;
      }

      const [tripData, fuelData] = await Promise.all([
        tripRes.json(),
        fuelRes.ok ? fuelRes.json() : [],
      ]);

      setTrip(tripData);
      setFuelRequests(fuelData.filter((f: Fuel) => f.tripId?._id === id));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load trip details.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, [id]);

  async function updateStatus(status: string, cancellationReason?: string) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/trips/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, cancellationReason }),
      });

      if (res.ok) {
        setTrip(await res.json());
        toast.success(`Trip ${status.toLowerCase()}.`);
        loadAll();
      } else {
        toast.error('Failed to update trip status.');
      }
    } finally {
      setUpdating(false);
    }
  }

  function handleCancel(e: React.FormEvent) {
    e.preventDefault();
    if (!cancelReason.trim()) return toast.warning('Please give a cancellation reason.');
    setCancelOpen(false);
    updateStatus('Cancelled', cancelReason.trim());
    setCancelReason('');
  }

  if (loading) return <p className="text-gray-500">Loading trip...</p>;
  if (notFound || !trip) return <p className="text-gray-500">Trip not found.</p>;

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push('/dashboard/trips')}
        className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} /> Back to Trips
      </button>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold uppercase" style={{ color: `hsl(${hue},70%,60%)` }}>
              {trip.tripNumber}
            </h1>
            <TripStatusBadge status={trip.status} />
          </div>
          <p className="text-gray-400 mt-1 flex items-center gap-1">
            <MapPin size={14} /> {trip.origin} → {trip.destination}
          </p>
        </div>

        {/* Admin lifecycle actions */}
        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            {trip.status === 'Pending' && (
              <>
                <Button size="sm" disabled={updating} onClick={() => updateStatus('Approved')}>
                  Approve
                </Button>
                <Button size="sm" variant="destructive" disabled={updating} onClick={() => updateStatus('Declined')}>
                  Decline
                </Button>
              </>
            )}
            {trip.status === 'Approved' && (
              <Button size="sm" disabled={updating} onClick={() => updateStatus('Ongoing')}>
                Start Trip
              </Button>
            )}
            {trip.status === 'Ongoing' && (
              <>
                <Button size="sm" disabled={updating} onClick={() => updateStatus('Completed')}>
                  Mark Completed
                </Button>
                <Button size="sm" variant="secondary" disabled={updating} onClick={() => setCancelOpen(true)}>
                  Cancel Trip
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {trip.cancellationReason && (
        <p className="text-sm text-red-400">
          Cancellation reason: {trip.cancellationReason}
        </p>
      )}

      {/* Trip Info */}
      <Card className="bg-gray-900/60 border-gray-800">
        <CardHeader>
          <CardTitle className="text-sm uppercase text-gray-300">Trip Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Driver</p>
            <p>{trip.driverName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500">Trip Date</p>
            <p>{new Date(trip.startDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-gray-500">Requested By</p>
            <p>{trip.requestedBy?.username ?? 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500">Approved By</p>
            <p>{trip.approvedBy?.username ?? 'Not yet approved'}</p>
          </div>
          <div className="col-span-2 md:col-span-4">
            <p className="text-gray-500">Purpose</p>
            <p>{trip.purpose}</p>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle */}
      <Card className="bg-gray-900/60 border-gray-800">
        <CardHeader>
          <CardTitle className="text-sm uppercase text-gray-300">Assigned Vehicle</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {trip.vehicleId ? (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Car size={16} className="text-gray-500" />
                <span className="uppercase font-medium">{trip.vehicleId.plateNumber}</span>
                <span className="text-gray-500">
                  {trip.vehicleId.manufacturer} {trip.vehicleId.modelName}
                </span>
              </div>
              <div className="flex gap-2">
                <Link href={`/dashboard/vehicles/${trip.vehicleId._id}`}>
                  <Button size="sm" variant="outline">View Vehicle</Button>
                </Link>
                {trip.status === 'Ongoing' && (
                  <Link href="/dashboard/tracking">
                    <Button size="sm" variant="outline">View on Live Map</Button>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No vehicle assigned.</p>
          )}
        </CardContent>
      </Card>

      {/* Fuel Requisitions */}
      <Card className="bg-gray-900/60 border-gray-800">
        <CardHeader>
          <CardTitle className="text-sm uppercase text-gray-300">
            Fuel Requisitions ({fuelRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fuelRequests.length === 0 ? (
            <p className="text-sm text-gray-500">No fuel requests for this trip.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-800">
                    <TableHead className="text-gray-300">Requested By</TableHead>
                    <TableHead className="text-gray-300">Amount</TableHead>
                    <TableHead className="text-gray-300">Date</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fuelRequests.map((f) => (
                    <TableRow key={f._id}>
                      <TableCell>{f.requestedBy?.username ?? 'N/A'}</TableCell>
                      <TableCell>{f.liters} Litres</TableCell>
                      <TableCell>{new Date(f.requestDate).toLocaleDateString()}</TableCell>
                      <TableCell>{f.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent
          className="bg-gray-900 border text-white"
          style={{ borderColor: `hsl(${hue},70%,20%)` }}
        >
          <DialogHeader>
            <DialogTitle className="uppercase" style={{ color: `hsl(${hue},70%,60%)` }}>
              Cancel Trip
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCancel} className="space-y-4">
            <div className="space-y-2">
              <Label>Reason for cancellation</Label>
              <Input
                placeholder="e.g. Vehicle breakdown"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <Button type="submit" variant="destructive" className="w-full">
              Confirm Cancellation
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
