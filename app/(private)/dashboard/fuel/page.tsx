'use client';

import { useEffect, useRef, useState } from 'react';
import { useHue } from '@/context/HueContext';
import gsap from 'gsap';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useSession } from 'next-auth/react';
import { Trip, Vehicle, Fuel } from '@/types/models';
import { toast } from 'sonner';

export default function FuelPage() {
  const hue = useHue();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const { data: session } = useSession();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [fuelRequests, setFuelRequests] = useState<Fuel[]>([]);
  const [form, setForm] = useState({
    vehicleId: '',
    amountLitres: '',
    requestDate: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (titleRef.current)
      gsap.fromTo(titleRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 1 });
    fetchAll();
  }, []);

  // 🔹 Vehicle mileage reference for auto fuel estimation
  const modelMileageMap: Record<string, number> = {
    Corolla: 90000,
    Hilux: 150000,
    Camry: 110000,
    RAV4: 95000,
    Navara: 140000,
    Patrol: 130000,
    Note: 80000,
    'X-Trail': 100000,
    Ranger: 145000,
    Focus: 95000,
    Fiesta: 85000,
    Everest: 130000,
    'Model S': 40000,
    'Model 3': 35000,
    'Model X': 45000,
    'Model Y': 38000,
    X1: 85000,
    X3: 90000,
    X5: 100000,
    '3 Series': 95000,
    '5 Series': 105000,
    'C-Class': 95000,
    'E-Class': 105000,
    GLA: 90000,
    GLE: 100000,
    'CX-5': 90000,
    Mazda3: 85000,
    Mazda6: 95000,
    Golf: 88000,
    Polo: 78000,
    Tiguan: 93000,
    Passat: 97000,
  };

  async function fetchAll() {
    try {
      setLoading(true);

      const [tripsRes, vehRes, fuelRes] = await Promise.all([
        fetch('/api/trips'),
        fetch('/api/vehicles'),
        fetch('/api/fuel'),
      ]);

      const [tripsData, allVehicles, fuelData] = await Promise.all([
        tripsRes.ok ? tripsRes.json() : [],
        vehRes.ok ? vehRes.json() : [],
        fuelRes.ok ? fuelRes.json() : [],
      ]);

      setTrips(tripsData);
      setFuelRequests(fuelData);

      const tripVehicleIds = tripsData.map(
        (t: Trip) =>
          typeof t.vehicleId === 'string' ? t.vehicleId : t.vehicleId?._id?.toString()
      );

      const availableVehicles = allVehicles.filter((v: Vehicle) =>
        tripVehicleIds.includes(v._id?.toString())
      );

      setVehicles(availableVehicles);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load data. Try again.');
    } finally {
      setLoading(false);
    }
  }

  function autoCalculateFuel(vehicle: Vehicle) {
    const baseMileage = modelMileageMap[vehicle.modelName] || 90000;
    const fuelFactor = vehicle.fuelType.toLowerCase().includes('diesel') ? 0.85 : 1.0;
    const ageFactor = Math.max(0.7, 1 - (new Date().getFullYear() - vehicle.year) * 0.03);
    const estimatedLitres = Math.round((baseMileage / 10000) * fuelFactor * ageFactor);
    return estimatedLitres;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.vehicleId || !form.requestDate) {
      toast.warning('Please fill all required fields.');
      return;
    }

    const vehicle = vehicles.find((v) => v._id === form.vehicleId);
    if (!vehicle) {
      toast.warning('Selected vehicle not found.');
      return;
    }

    const estimatedFuel = autoCalculateFuel(vehicle);

    const trip = trips.find((t: Trip) => {
      const veh = t.vehicleId;
      const vid = typeof veh === 'string' ? veh : veh?._id?.toString();
      return vid === form.vehicleId;
    });

    if (!trip) {
      toast.warning('No active trip associated with this vehicle.');
      return;
    }

    const payload = {
      vehicleId: form.vehicleId,
      tripId: trip._id?.toString(),
      amountLitres: form.amountLitres || estimatedFuel,
      requestDate: form.requestDate,
    };

    try {
      setLoading(true);
      const res = await fetch('/api/fuel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success('Fuel request submitted successfully!');
        setForm({ vehicleId: '', amountLitres: '', requestDate: new Date().toISOString() });
        fetchAll();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to create fuel request');
      }
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong while creating the request.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(
    requestId: string,
    status: 'Approved' | 'Rejected' | 'Cancelled',
    cancellationReason?: string
  ) {
    try {
      const body: { requestId: string; status: string; cancellationReason?: string } = {
        requestId,
        status,
      };
      if (status === 'Cancelled' && cancellationReason)
        body.cancellationReason = cancellationReason;

      const res = await fetch('/api/fuel', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(`Fuel request ${status}`);
        fetchAll();
      } else toast.error('Action failed.');
    } catch (error) {
      console.error(error);
      toast.error('Request update failed.');
    }
  }

  return (
    <div className="space-y-6">
      <h1
        ref={titleRef}
        className="text-2xl font-bold uppercase"
        style={{ color: `hsl(${hue},70%,60%)` }}
      >
        Fuel Requests
      </h1>

      {/* Add Request Dialog */}
      {session?.user?.role === 'staff' && (
        <Dialog>
          <DialogTrigger asChild>
            <Button
              disabled={!vehicles.length}
              style={{
                backgroundColor: `hsl(${hue},70%,50%)`,
                color: 'white',
                opacity: vehicles.length ? 1 : 0.5,
              }}
            >
              + New Fuel Request
            </Button>
          </DialogTrigger>

          <DialogContent
            className="bg-gray-900 border text-white max-w-md"
            style={{ borderColor: `hsl(${hue},70%,20%)` }}
          >
            <DialogHeader>
              <DialogTitle
                className="uppercase"
                style={{ color: `hsl(${hue},70%,60%)` }}
              >
                Add Fuel Request
              </DialogTitle>
            </DialogHeader>

            {!vehicles.length ? (
              <p className="text-sm text-red-400 text-center py-4">
                No vehicles with active trips found. Please ensure a trip exists first.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 p-4">
                {/* Vehicle */}
                <div className="grid gap-2">
                  <Label>Vehicle</Label>
                  <Select
                    onValueChange={(v) => {
                      const vehicle = vehicles.find((veh) => veh._id === v);
                      setForm({
                        ...form,
                        vehicleId: v,
                        amountLitres: vehicle ? String(autoCalculateFuel(vehicle)) : '',
                      });
                    }}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-200 w-full">
                      <SelectValue placeholder="Select Vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((v) => {
                        const trip = trips.find(
                          (t: Trip) =>
                            (typeof t.vehicleId === 'string' ? t.vehicleId : t.vehicleId?._id) === v._id
                        );
                        return (
                          <SelectItem key={v._id} value={v._id}>
                            {v.plateNumber} — {trip?.tripNumber || 'No Trip'} ({v.modelName})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Auto Fuel Estimate */}
                <div className="grid gap-2">
                  <Label>Estimated Fuel (Litres)</Label>
                  <Input
                    type="number"
                    value={form.amountLitres}
                    onChange={(e) =>
                      setForm({ ...form, amountLitres: e.target.value })
                    }
                    className="bg-gray-800 border-gray-700 text-gray-200"
                    required
                    disabled
                  />
                  <small className="text-gray-400 text-xs">
                    Estimated based on model, fuel type, and mileage.
                  </small>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  style={{
                    backgroundColor: `hsl(${hue},70%,50%)`,
                    color: 'white',
                    opacity: loading ? 0.7 : 1,
                  }}
                  className="w-full mt-4 hover:opacity-90"
                >
                  {loading ? 'Submitting...' : 'Save Request'}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* 🧾 Fuel Requests Table */}
      <div className="overflow-x-auto border border-gray-800 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-800">
              {['User', 'Amount', 'Date', 'Status', 'Actions'].map((h) => (
                <TableHead key={h} className="text-gray-300">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {fuelRequests.map((f, i) => (
              <TableRow
                key={f._id}
                style={{ animation: `fadeIn 0.5s ease ${i * 0.05}s both` }}
              >
                <TableCell>{f.requestedBy?.username}</TableCell>
                <TableCell>{f.liters} Litres</TableCell>
                <TableCell>{new Date(f.requestDate).toLocaleDateString()}</TableCell>
                <TableCell>{f.status}</TableCell>
                <TableCell>
                  {/* 🧠 Admin actions */}
                  {session?.user?.role === 'admin' && f.status === 'Pending' && (
                    <div className="space-x-2">
                      <Button
                        onClick={() => handleStatusChange(f._id, 'Approved')}
                        className="bg-green-600 hover:opacity-90"
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleStatusChange(f._id, 'Rejected')}
                        className="bg-red-600 hover:opacity-90"
                      >
                        Reject
                      </Button>
                      <Button
                        onClick={() =>
                          handleStatusChange(f._id, 'Cancelled', 'Cancelled by admin')
                        }
                        className="bg-yellow-600 hover:opacity-90"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}

                  {/* 🧭 Staff (owner) cancel option */}
                  {session?.user?.role === 'staff' &&
                    f.status === 'Pending' &&
                    f.requestedBy?._id === session?.user?.id && (
                      <Button
                        onClick={() =>
                          handleStatusChange(f._id, 'Cancelled', 'Cancelled by requester')
                        }
                        className="bg-yellow-600 hover:opacity-90"
                      >
                        Cancel Request
                      </Button>
                    )}

                  {/* 🧾 Default message */}
                  {!(
                    (session?.user?.role === 'admin' && f.status === 'Pending') ||
                    (session?.user?.role === 'staff' &&
                      f.status === 'Pending' &&
                      f.requestedBy?._id === session?.user?.id)
                  ) && (
                    <span className="text-gray-500 text-sm italic">
                      No available actions
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}