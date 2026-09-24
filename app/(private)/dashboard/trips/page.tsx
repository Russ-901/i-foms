'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHue } from '@/context/HueContext';
import gsap from 'gsap';
import { ArrowUp, ArrowDown, ArrowUpDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { useDebounce } from 'use-debounce';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Trip, Vehicle, Staff, Form, LocationSuggestion } from '@/types/models';
import TripStatusBadge from '@/components/trips/TripStatusBadge';

type SortKey = 'tripNumber' | 'route' | 'vehicle' | 'driverName' | 'startDate' | 'status';
const PAGE_SIZE = 8;

const ACCESSORS: Record<SortKey, (t: Trip) => string | number> = {
  tripNumber: (t) => t.tripNumber ?? '',
  route: (t) => `${t.origin ?? ''} ${t.destination ?? ''}`,
  vehicle: (t) => t.vehicleId?.plateNumber ?? '',
  driverName: (t) => t.driverName ?? '',
  startDate: (t) => new Date(t.startDate).getTime(),
  status: (t) => t.status ?? '',
};

export default function TripsPage() {
  const hue = useHue();
  const router = useRouter();
  const titleRef = useRef<HTMLHeadingElement>(null);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<Form>({
    tripNumber: '',
    origin: '',
    destination: '',
    vehicleId: '',
    driverName: '',
    purpose: '',
    startDate: new Date(),
    requestedBy: null,
  });

  const [originSuggestions, setOriginSuggestions] = useState<LocationSuggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<LocationSuggestion[]>([]);
  const [debouncedOrigin] = useDebounce(form.origin, 500);
  const [debouncedDestination] = useDebounce(form.destination, 500);

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (titleRef.current)
      gsap.fromTo(titleRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 1 });

    Promise.all([fetchTrips(), fetchVehicles(), fetchStaff()]).finally(() =>
      setLoading(false)
    );
    generateTripNumber();
  }, []);

  useEffect(() => {
    if (debouncedOrigin) fetchLocationSuggestions(debouncedOrigin, setOriginSuggestions);
  }, [debouncedOrigin]);

  useEffect(() => {
    if (debouncedDestination) fetchLocationSuggestions(debouncedDestination, setDestinationSuggestions);
  }, [debouncedDestination]);

  async function fetchTrips() {
    const res = await fetch('/api/trips');
    const data: Trip[] = await res.json();
    setTrips(data);
  }

  async function fetchVehicles() {
    const res = await fetch('/api/vehicles');
    const data: Vehicle[] = await res.json();
    setVehicles(data);
  }

  async function fetchStaff() {
    const res = await fetch('/api/staff');
    const data: Staff[] = await res.json();
    setStaff(data);
  }

  async function fetchLocationSuggestions(query: string, setter: (val: LocationSuggestion[]) => void) {
    if (!query) return;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
    );
    const data: LocationSuggestion[] = await res.json();
    setter(data.slice(0, 5));
  }

  function generateTripNumber() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    setForm(f => ({ ...f, tripNumber: `TR00${code}` }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    if (!form.vehicleId) return toast.error('Please select a vehicle.');
    if (!form.origin || !form.destination) return toast.error('Please fill in both origin and destination.');
    if (!form.purpose) return toast.error('Please specify trip purpose.');

    setSubmitting(true);
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success('Trip request submitted successfully!');
        resetForm();
        generateTripNumber();
        setOpen(false);
        fetchTrips();
      } else {
        toast.error('Failed to submit trip request.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setForm({
      tripNumber: '',
      origin: '',
      destination: '',
      vehicleId: '',
      driverName: '',
      purpose: '',
      startDate: new Date(),
      requestedBy: null,
    });
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return trips;
    return trips.filter((t) =>
      [t.tripNumber, t.origin, t.destination, t.driverName, t.status, t.vehicleId?.plateNumber]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q))
    );
  }, [trips, search]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const accessor = ACCESSORS[sortKey];
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = accessor(a);
      const bv = accessor(b);
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function SortHeader({ label, sortableKey }: { label: string; sortableKey: SortKey }) {
    const active = sortKey === sortableKey;
    return (
      <TableHead className="text-gray-300">
        <button
          type="button"
          onClick={() => toggleSort(sortableKey)}
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
        >
          {label}
          {active ? (
            sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
          ) : (
            <ArrowUpDown size={14} className="opacity-40" />
          )}
        </button>
      </TableHead>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <motion.h1
          ref={titleRef}
          className="text-2xl font-bold uppercase"
          style={{ color: `hsl(${hue},70%,60%)` }}
        >
          Trip Management
        </motion.h1>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              style={{
                backgroundColor: `hsl(${hue}, 70%, 50%)`,
                color: 'white',
              }}
              disabled={vehicles.length === 0}
              className="hover:opacity-90 cursor-pointer disabled:opacity-50"
            >
              + Register Trip
            </Button>
          </DialogTrigger>

          <DialogContent
            className="bg-gray-900 border text-white w-md h-[800px] flex flex-col justify-center items-start"
            style={{ borderColor: `hsl(${hue},70%,20%)` }}
          >
            <DialogHeader className="mb-4">
              <DialogTitle
                className="uppercase text-lg font-semibold"
                style={{ color: `hsl(${hue},70%,60%)` }}
              >
                Register New Trip
              </DialogTitle>
            </DialogHeader>

            {vehicles.length === 0 ? (
              <div className="w-full p-6 text-center text-gray-400">
                <p>No vehicles available. Please register a vehicle before creating a trip.</p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="space-y-4 h-[700px] overflow-y-auto scroll-hidden p-4 w-full"
              >
                {/* Trip Number */}
                <div className="grid space-y-2">
                  <Label>Trip Number</Label>
                  <Input readOnly value={form.tripNumber} className="border-none text-gray-400" />
                </div>

                {/* Vehicle Selector */}
                <div className="grid space-y-2">
                  <Label>Vehicle</Label>
                  <Select onValueChange={(v: string) => setForm({ ...form, vehicleId: v })}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-200 w-full">
                      <SelectValue placeholder="Select Vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((v: Vehicle) => (
                        <SelectItem key={v._id} value={v._id}>
                          {v.plateNumber} — {v.manufacturer} {v.modelName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Driver Selector */}
                <div className="grid space-y-2">
                  <Label>Driver</Label>
                  <Select
                    onValueChange={(v: string) => {
                      const selectedDriver = staff.find((s) => s._id === v);
                      setForm({ ...form, driverId: selectedDriver?._id, driverName: selectedDriver?.name || '' });
                    }}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-200 w-full">
                      <SelectValue placeholder="Select Driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff
                        .filter((s) => s.position === 'Driver' || s.position === 'Senior Driver')
                        .map((driver) => (
                          <SelectItem key={driver._id} value={driver._id}>
                            {driver.name} — {driver.position}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Origin */}
                <div className="grid space-y-2">
                  <Label>Origin</Label>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        className="w-full bg-gray-800 border-gray-700 text-gray-200 border hover:bg-gray-700 flex justify-start"
                      >
                        {form.origin || 'Select Origin'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border border-gray-700 text-white">
                      <DialogHeader>
                        <DialogTitle>Select Trip Origin</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-2">
                        <Input
                          placeholder="Search origin..."
                          value={form.origin}
                          onChange={(e) => setForm({ ...form, origin: e.target.value })}
                        />
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {originSuggestions.map((loc, i) => (
                            <Button
                              key={i}
                              variant="ghost"
                              className="w-full justify-start text-left hover:bg-gray-800"
                              onClick={() => setForm({
                                ...form,
                                origin: loc.display_name,
                                originLat: parseFloat(loc.lat),
                                originLng: parseFloat(loc.lon),
                              })}
                            >
                              {loc.display_name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Destination */}
                <div className="grid space-y-2">
                  <Label>Destination</Label>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        className="w-full bg-gray-800 border-gray-700 text-gray-200 border hover:bg-gray-700 flex justify-start"
                      >
                        {form.destination || 'Select Destination'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border border-gray-700 text-white">
                      <DialogHeader>
                        <DialogTitle>Select Destination</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-2">
                        <Input
                          placeholder="Search destination..."
                          value={form.destination}
                          onChange={(e) => setForm({ ...form, destination: e.target.value })}
                        />
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {destinationSuggestions.map((loc, i) => (
                            <Button
                              key={i}
                              variant="ghost"
                              className="w-full justify-start text-left hover:bg-gray-800"
                              onClick={() => setForm({
                                ...form,
                                destination: loc.display_name,
                                destinationLat: parseFloat(loc.lat),
                                destinationLng: parseFloat(loc.lon),
                              })}
                            >
                              {loc.display_name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Purpose */}
                <div className="grid space-y-2">
                  <Label>Purpose</Label>
                  <Input
                    placeholder="Describe trip purpose..."
                    value={form.purpose}
                    onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-gray-200 w-full"
                    required
                  />
                </div>

                {/* Start Date */}
                <div className="grid space-y-2">
                  <Label>Trip Date</Label>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        className="w-full bg-gray-800 border-gray-700 text-gray-200 border hover:bg-gray-700 flex justify-start"
                      >
                        {form.startDate.toDateString()}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border border-gray-700 text-white flex flex-col items-center">
                      <DialogHeader>
                        <DialogTitle>Select Trip Date</DialogTitle>
                      </DialogHeader>
                      <Calendar
                        mode="single"
                        selected={form.startDate}
                        onSelect={(date) => date && setForm({ ...form, startDate: date })}
                        className="rounded-md border border-gray-700 bg-gray-800 text-gray-200"
                      />
                    </DialogContent>
                  </Dialog>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-4 hover:opacity-90 transition-all"
                  style={{ backgroundColor: `hsl(${hue}, 70%, 50%)`, color: 'white' }}
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {loading && <p className="text-gray-500">Loading data...</p>}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <Input
          placeholder="Search by trip #, route, driver, plate..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="bg-gray-800 border-gray-700 pl-9"
        />
      </div>

      {/* Trips Table */}
      <div className="overflow-x-auto border border-gray-800 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-800">
              <SortHeader label="Trip #" sortableKey="tripNumber" />
              <SortHeader label="Route" sortableKey="route" />
              <SortHeader label="Vehicle" sortableKey="vehicle" />
              <SortHeader label="Driver" sortableKey="driverName" />
              <SortHeader label="Date" sortableKey="startDate" />
              <SortHeader label="Status" sortableKey="status" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {!loading && paged.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  No trips found.
                </TableCell>
              </TableRow>
            )}
            {paged.map((t, i) => (
              <TableRow
                key={t._id}
                onClick={() => router.push(`/dashboard/trips/${t._id}`)}
                className="cursor-pointer hover:bg-gray-800/60 transition-colors"
                style={{ animation: `fadeIn 0.5s ease ${i * 0.05}s both` }}
              >
                <TableCell>{t.tripNumber}</TableCell>
                <TableCell className="max-w-xs truncate">{t.origin} → {t.destination}</TableCell>
                <TableCell className="uppercase">{t.vehicleId?.plateNumber ?? 'N/A'}</TableCell>
                <TableCell>{t.driverName}</TableCell>
                <TableCell>{new Date(t.startDate).toLocaleDateString()}</TableCell>
                <TableCell><TripStatusBadge status={t.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Page {page} of {totalPages} ({sorted.length} trips)</span>
          <div className="space-x-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
