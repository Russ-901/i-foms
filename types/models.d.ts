import { ObjectId } from "mongoose";

export interface Params {
  params: {
    id: string;
  };
}

export interface Trip {
  _id: string;
  tripNumber: string;
  origin: string;
  destination: string;
  // Coordinates captured from the picked location suggestion, used for live GPS simulation.
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  // These come back populated (as an object) from GET /api/trips.
  vehicleId: {
    _id: string;
    plateNumber?: string;
    modelName?: string;
    manufacturer?: string;
    fuelType?: string;
  } | null;
  requestedBy: { _id: string; username?: string } | null;
  approvedBy?: { _id: string; username?: string } | null;
  driverId?: string;
  driverName: string;
  purpose: string;
  status: 'Pending' | 'Approved' | 'Ongoing' | 'Completed' | 'Cancelled' | 'Declined';
  cancellationReason?: string;
  startDate: string;
  endDate?: string;
  fuelRequested?: boolean;
  createdAt?: string;
}

export interface Vehicle {
  _id: string;
  plateNumber: string;
  manufacturer: string;
  modelName: string;
  year: number;
  fuelType: string;
  mileage: number;
  status: 'active' | 'inactive' | 'maintenance';
  // Populated from Staff on GET /api/vehicles.
  staffId?: { _id: string; name?: string; email?: string; position?: string } | null;
  createdAt?: string;
}

export interface Fuel {
  _id: string;
  // Comes back populated (as an object) from GET /api/fuel.
  vehicleId?: { _id: string; plateNumber?: string; modelName?: string; fuelType?: string } | null;
  tripId?: { _id: string; tripNumber?: string } | null;
  requestedBy: { _id: string; username?: string } | null;
  liters: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  cancellationReason?: string;
  requestDate: string;
  createdAt?: string;
}

export interface Staff {
  _id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  createdAt?: string;
}

export interface User {
  _id: string;
  username: string;
  role: 'admin' | 'staff' | 'user';
  status: 'Active' | 'Inactive';
  // Populated from Staff on GET /api/users.
  staffId: { _id: string; name?: string; email?: string; department?: string; position?: string } | null;
}

export interface Form {
  tripNumber: string;
  origin: string;
  destination: string;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  vehicleId: string;
  driverId?: string;
  driverName?: string;
  purpose: string;
  startDate: Date;
  requestedBy: string | ObjectId | null;
}

export interface StaffAccount {
  _id: string;
  username: string;
  role: 'admin' | 'staff' | 'user';
  status: 'Active' | 'Inactive';
}

export interface StaffInvite {
  token: string;
  expiresAt: string;
}

// Response shape of GET /api/staff/[id].
export interface StaffDetail {
  staff: Staff;
  account: StaffAccount | null;
  invite: StaffInvite | null;
  trips: Trip[];
}

export interface ServiceRecord {
  _id: string;
  vehicleId: string;
  description: string;
  odometer?: number;
  cost?: number;
  servicedBy?: string;
  serviceDate: string;
  createdAt?: string;
}

export interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

// A vehicle's live (simulated) GPS position, as returned by GET /api/vehicles/tracking.
export interface VehicleTrackingPoint {
  vehicleId: string;
  plateNumber: string;
  modelName: string;
  status: 'moving' | 'parked';
  tripStatus?: Trip['status'];
  tripNumber?: string;
  lat: number;
  lng: number;
  progress: number; // 0 to 1, only meaningful while status is "moving"
}
