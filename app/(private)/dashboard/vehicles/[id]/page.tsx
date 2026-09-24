'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { useHue } from '@/context/HueContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StatusBadge from '@/components/vehicles/StatusBadge';
import { Vehicle, Trip, Fuel, ServiceRecord } from '@/types/models';

export default function VehicleDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const hue = useHue();
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [fuelRequests, setFuelRequests] = useState<Fuel[]>([]);
  const [service, setService] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    description: '',
    odometer: '',
    cost: '',
    servicedBy: '',
  });

  useEffect(() => {
    loadAll();
  }, [id]);

  async function loadAll() {
    setLoading(true);
    try {
      const [vehicleRes, tripsRes, fuelRes, serviceRes] = await Promise.all([
        fetch(`/api/vehicles/${id}`),
        fetch('/api/trips'),
        fetch('/api/fuel'),
        fetch(`/api/vehicles/${id}/service`),
      ]);

      if (!vehicleRes.ok) {
        setNotFound(true);
        return;
      }

      const [vehicleData, tripsData, fuelData, serviceData] = await Promise.all([
        vehicleRes.json(),
        tripsRes.ok ? tripsRes.json() : [],
        fuelRes.ok ? fuelRes.json() : [],
        serviceRes.ok ? serviceRes.json() : [],
      ]);

      setVehicle(vehicleData);
      setTrips(tripsData.filter((t: Trip) => t.vehicleId?._id === id));
      setFuelRequests(fuelData.filter((f: Fuel) => f.vehicleId?._id === id));
      setService(serviceData);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load vehicle details.');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(status: string) {
    if (!vehicle) return;
    setSavingStatus(true);
    try {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setVehicle(await res.json());
        toast.success('Availability updated.');
      } else {
        toast.error('Failed to update availability.');
      }
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleAddService(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceForm.description) return toast.warning('Please describe the service performed.');

    const res = await fetch(`/api/vehicles/${id}/service`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: serviceForm.description,
        odometer: serviceForm.odometer ? Number(serviceForm.odometer) : undefined,
        cost: serviceForm.cost ? Number(serviceForm.cost) : undefined,
        servicedBy: serviceForm.servicedBy || undefined,
      }),
    });

    if (res.ok) {
      toast.success('Service record added.');
      setServiceForm({ description: '', odometer: '', cost: '', servicedBy: '' });
      setServiceOpen(false);
      loadAll();
    } else {
      toast.error('Failed to add service record.');
    }
  }

  if (loading) return <p className="text-gray-500">Loading vehicle...</p>;
  if (notFound || !vehicle) return <p className="text-gray-500">Vehicle not found.</p>;

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push('/dashboard/vehicles')}
        className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} /> Back to Vehicles
      </button>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold uppercase" style={{ color: `hsl(${hue},70%,60%)` }}>
            {vehicle.plateNumber}
          </h1>
          <p className="text-gray-400">{vehicle.manufacturer} {vehicle.modelName} · {vehicle.year}</p>
        </div>

        {isAdmin ? (
          <Select value={vehicle.status} onValueChange={updateStatus} disabled={savingStatus}>
            <SelectTrigger className="bg-gray-800 border-gray-700 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <StatusBadge status={vehicle.status} />
        )}
      </div>

      {/* Vehicle Info */}
      <Card className="bg-gray-900/60 border-gray-800">
        <CardHeader>
          <CardTitle className="text-sm uppercase text-gray-300">Vehicle Info</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Fuel Type</p>
            <p>{vehicle.fuelType}</p>
          </div>
          <div>
            <p className="text-gray-500">Mileage</p>
            <p>{vehicle.mileage.toLocaleString()} km</p>
          </div>
          <div>
            <p className="text-gray-500">Availability</p>
            <StatusBadge status={vehicle.status} />
          </div>
          <div>
            <p className="text-gray-500">Registered By</p>
            <p>{vehicle.staffId?.name ?? 'N/A'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Trip Log Book */}
      <Card className="bg-gray-900/60 border-gray-800">
        <CardHeader>
          <CardTitle className="text-sm uppercase text-gray-300">Trip Log Book ({trips.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {trips.length === 0 ? (
            <p className="text-sm text-gray-500">No trips recorded for this vehicle yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-800">
                    <TableHead className="text-gray-300">Trip #</TableHead>
                    <TableHead className="text-gray-300">Route</TableHead>
                    <TableHead className="text-gray-300">Driver</TableHead>
                    <TableHead className="text-gray-300">Date</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trips.map((t) => (
                    <TableRow key={t._id}>
                      <TableCell>{t.tripNumber}</TableCell>
                      <TableCell>{t.origin} → {t.destination}</TableCell>
                      <TableCell>{t.driverName}</TableCell>
                      <TableCell>{new Date(t.startDate).toLocaleDateString()}</TableCell>
                      <TableCell>{t.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fuel Requisitions */}
      <Card className="bg-gray-900/60 border-gray-800">
        <CardHeader>
          <CardTitle className="text-sm uppercase text-gray-300">Fuel Requisitions ({fuelRequests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {fuelRequests.length === 0 ? (
            <p className="text-sm text-gray-500">No fuel requests for this vehicle yet.</p>
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

      {/* Service History */}
      <Card className="bg-gray-900/60 border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm uppercase text-gray-300">Service History ({service.length})</CardTitle>
          {isAdmin && (
            <Dialog open={serviceOpen} onOpenChange={setServiceOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  style={{ backgroundColor: `hsl(${hue},70%,50%)`, color: 'white' }}
                  className="hover:opacity-90 cursor-pointer gap-1"
                >
                  <Wrench size={14} /> Log Service
                </Button>
              </DialogTrigger>
              <DialogContent
                className="bg-gray-900 border text-white"
                style={{ borderColor: `hsl(${hue},70%,20%)` }}
              >
                <DialogHeader>
                  <DialogTitle className="uppercase" style={{ color: `hsl(${hue},70%,60%)` }}>
                    Log Service Record
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddService} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="e.g. Oil change, brake pads replaced"
                      value={serviceForm.description}
                      onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Odometer reading (km)</Label>
                    <Input
                      type="number"
                      value={serviceForm.odometer}
                      onChange={(e) => setServiceForm({ ...serviceForm, odometer: e.target.value })}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cost</Label>
                    <Input
                      type="number"
                      value={serviceForm.cost}
                      onChange={(e) => setServiceForm({ ...serviceForm, cost: e.target.value })}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Serviced By</Label>
                    <Input
                      placeholder="Mechanic / workshop name"
                      value={serviceForm.servicedBy}
                      onChange={(e) => setServiceForm({ ...serviceForm, servicedBy: e.target.value })}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <Button
                    type="submit"
                    style={{ backgroundColor: `hsl(${hue},70%,50%)`, color: 'white' }}
                    className="hover:opacity-90 w-full"
                  >
                    Save Record
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {service.length === 0 ? (
            <p className="text-sm text-gray-500">No service records logged yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-800">
                    <TableHead className="text-gray-300">Date</TableHead>
                    <TableHead className="text-gray-300">Description</TableHead>
                    <TableHead className="text-gray-300">Odometer</TableHead>
                    <TableHead className="text-gray-300">Cost</TableHead>
                    <TableHead className="text-gray-300">Serviced By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {service.map((s) => (
                    <TableRow key={s._id}>
                      <TableCell>{new Date(s.serviceDate).toLocaleDateString()}</TableCell>
                      <TableCell>{s.description}</TableCell>
                      <TableCell>{s.odometer ? `${s.odometer.toLocaleString()} km` : 'N/A'}</TableCell>
                      <TableCell>{s.cost ?? 'N/A'}</TableCell>
                      <TableCell>{s.servicedBy ?? 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
