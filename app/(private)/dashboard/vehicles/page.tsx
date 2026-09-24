'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useHue } from '@/context/HueContext';
import gsap from 'gsap';
import { useRouter } from 'next/navigation';
import { ArrowUp, ArrowDown, ArrowUpDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Vehicle } from '@/types/models';
import StatusBadge from '@/components/vehicles/StatusBadge';
import { toast } from 'sonner';

type SortKey = 'plateNumber' | 'manufacturer' | 'modelName' | 'year' | 'mileage' | 'status';
const PAGE_SIZE = 8;

export default function VehiclesPage() {
  const hue = useHue();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState({
    models: [] as string[],
    years: [] as number[],
    mileage: 0
  });

  const [form, setForm] = useState({
    manufacturer: '',
    modelName: '',
    year: '',
    plateNumber: '',
    mileage: '',
    fuelType: '',
  });

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const manufacturers = [
    'Toyota', 'Nissan', 'Ford', 'Tesla', 'BMW', 'Mercedes', 'Mazda', 'Volkswagen'
  ];
  const fuelOptions = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];

  useEffect(() => {
    if (titleRef.current)
      gsap.fromTo(titleRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 1 });
    fetchVehicles();
  }, []);

  async function fetchVehicles() {
    const res = await fetch('/api/vehicles');
    setVehicles(await res.json());
  }

  // 💡 Intelligent suggestion engine
  useEffect(() => {
    if (form.manufacturer) {
      const modelSuggestions: Record<string, string[]> = {
        Toyota: ['Corolla', 'Hilux', 'Camry', 'RAV4'],
        Nissan: ['Navara', 'Patrol', 'Note', 'X-Trail'],
        Ford: ['Ranger', 'Focus', 'Fiesta', 'Everest'],
        Tesla: ['Model S', 'Model 3', 'Model X', 'Model Y'],
        BMW: ['X1', 'X3', 'X5', '3 Series', '5 Series'],
        Mercedes: ['C-Class', 'E-Class', 'GLA', 'GLE'],
        Mazda: ['CX-5', 'Mazda3', 'Mazda6'],
        Volkswagen: ['Golf', 'Polo', 'Tiguan', 'Passat'],
      };

      // Base mileage by fuel type
      const baseMileage = form.fuelType === 'Electric' ? 30000 : 120000;

      // Model-specific average mileage
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

      setSuggestions((prev) => ({
        ...prev,
        models: modelSuggestions[form.manufacturer] || [],
        years: Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i),
        mileage: modelMileageMap[form.modelName] || baseMileage,
      }));
    }
  }, [form.manufacturer, form.modelName, form.fuelType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Ensure mileage is not empty before sending
    const payload = {
      ...form,
      mileage: form.mileage || suggestions.mileage.toString(),
    };

    const res = await fetch('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast.success('Vehicle registered successfully.');
      setForm({ manufacturer: '', modelName: '', year: '', plateNumber: '', mileage: '', fuelType: '' });
      setOpen(false);
      fetchVehicles();
    } else {
      const err = await res.json().catch(() => ({}));
      console.error(err);
      toast.error(err.detail || err.message || 'Failed to register vehicle.');
    }
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
    if (!q) return vehicles;
    return vehicles.filter((v) =>
      [v.plateNumber, v.manufacturer, v.modelName, v.fuelType, v.status]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q))
    );
  }, [vehicles, search]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av ?? '').localeCompare(String(bv ?? ''));
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
        <h1 ref={titleRef} className="text-2xl font-bold uppercase" style={{ color: `hsl(${hue},70%,60%)` }}>
          Vehicle Management
        </h1>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              style={{
                backgroundColor: `hsl(${hue}, 70%, 50%)`,
                color: 'white',
              }}
              className="hover:opacity-90 cursor-pointer"
            >
              + Register Vehicle
            </Button>
          </DialogTrigger>

          <DialogContent
            className="bg-gray-900 border text-white w-md h-[700px] flex flex-col justify-center items-start"
            style={{ borderColor: `hsl(${hue},70%,20%)` }}
          >
            <DialogHeader className="mb-4">
              <DialogTitle
                className="uppercase"
                style={{ color: `hsl(${hue},70%,60%)` }}
              >
                Register New Vehicle
              </DialogTitle>
            </DialogHeader>

            <form
              onSubmit={handleSubmit}
              className="space-y-4 h-[600px] overflow-y-auto p-4 w-full scroll-hidden"
            >
              {/* Manufacturer */}
              <div className="space-y-2">
                <Label>Manufacturer</Label>
                <Select
                  onValueChange={(value) => setForm({ ...form, manufacturer: value })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 w-full">
                    <SelectValue placeholder="Select manufacturer" />
                  </SelectTrigger>
                  <SelectContent>
                    {manufacturers.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Model */}
              {form.manufacturer && (
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Select
                    onValueChange={(value) => setForm({ ...form, modelName: value })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 w-full">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {suggestions.models.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Year */}
              {form.modelName && (
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Select
                    onValueChange={(value) => setForm({ ...form, year: value })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 w-full">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {suggestions.years.map((y) => (
                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Fuel Type */}
              <div className="space-y-2">
                <Label>Fuel Type</Label>
                <Select
                  onValueChange={(value) => setForm({ ...form, fuelType: value })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 w-full">
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    {fuelOptions.map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Plate Number */}
              <div className="space-y-2">
                <Label>Plate Number</Label>
                <Input
                  placeholder="e.g. MZ 9876"
                  value={form.plateNumber}
                  onChange={(e) => setForm({ ...form, plateNumber: e.target.value })}
                  className="bg-gray-800 border-gray-700 w-full"
                />
              </div>

              {/* Mileage */}
              <div className="space-y-2">
                <Label>Mileage: {form.mileage || suggestions.mileage} km</Label>
                <input type="hidden" value={form.mileage || suggestions.mileage} name="mileage" />
              </div>

              <Button
                type="submit"
                style={{
                  backgroundColor: `hsl(${hue},70%,50%)`,
                  color: 'white',
                }}
                className="hover:opacity-90 w-full mt-4"
              >
                Register Vehicle
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <Input
          placeholder="Search by plate, manufacturer, model..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="bg-gray-800 border-gray-700 pl-9"
        />
      </div>

      {/* Vehicles Table */}
      <div className="overflow-x-auto border border-gray-800 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-800">
              <SortHeader label="Manufacturer" sortableKey="manufacturer" />
              <SortHeader label="Model" sortableKey="modelName" />
              <SortHeader label="Plate" sortableKey="plateNumber" />
              <SortHeader label="Year" sortableKey="year" />
              <TableHead className="text-gray-300">Fuel</TableHead>
              <SortHeader label="Mileage" sortableKey="mileage" />
              <SortHeader label="Status" sortableKey="status" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                  No vehicles found.
                </TableCell>
              </TableRow>
            )}
            {paged.map((v, i) => (
              <TableRow
                key={v._id}
                onClick={() => router.push(`/dashboard/vehicles/${v._id}`)}
                className="cursor-pointer hover:bg-gray-800/60 transition-colors"
                style={{ animation: `fadeIn 0.5s ease ${i * 0.05}s both` }}
              >
                <TableCell>{v.manufacturer}</TableCell>
                <TableCell>{v.modelName}</TableCell>
                <TableCell className='uppercase'>{v.plateNumber}</TableCell>
                <TableCell>{v.year}</TableCell>
                <TableCell>{v.fuelType}</TableCell>
                <TableCell>{v.mileage} km</TableCell>
                <TableCell><StatusBadge status={v.status || 'active'} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Page {page} of {totalPages} ({sorted.length} vehicles)</span>
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
