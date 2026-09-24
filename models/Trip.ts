// models/Trip.ts
import mongoose, { Schema, Types, Document } from 'mongoose';

export interface ITrip extends Document {
  tripNumber: string;
  origin: string;
  destination: string;
  // Coordinates of the picked origin/destination, used to simulate live GPS movement.
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  vehicleId: Types.ObjectId;
  driverId: Types.ObjectId;
  driverName: string;
  purpose: string;
  status: 'Pending' | 'Approved' | 'Ongoing' | 'Completed' | 'Cancelled' | 'Declined';
  cancellationReason?: string;
  startDate: Date;
  // When an admin actually moved the trip to "Ongoing". The GPS simulation
  // measures progress from here, so a trip planned for an earlier date
  // doesn't show up already parked at its destination.
  actualStartTime?: Date;
  endDate?: Date;
  requestedBy: Types.ObjectId; // 👈 who created the trip
  approvedBy?: Types.ObjectId; // 👈 admin approval
  fuelRequested?: boolean; // 👈 staff toggle
  createdAt: Date;
}

const TripSchema = new Schema<ITrip>(
  {
    tripNumber: { type: String, required: true, unique: true },
    origin: { type: String, required: true },
    destination: { type: String, required: true },
    originLat: Number,
    originLng: Number,
    destinationLat: Number,
    destinationLng: Number,
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    driverId: { type: Schema.Types.ObjectId, ref: 'Staff' },
    driverName: { type: String, required: true },
    purpose: { type: String, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Ongoing', 'Completed', 'Cancelled', 'Declined'],
      default: 'Pending',
    },
    cancellationReason: String,
    startDate: { type: Date, required: true },
    actualStartTime: Date,
    endDate: Date,
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    fuelRequested: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Trip || mongoose.model<ITrip>('Trip', TripSchema);


