import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IVehicle extends Document {
  plateNumber: string;
  modelName: string;
  manufacturer: string;
  year: number;
  fuelType: string;
  mileage: number;
  status: 'active' | 'inactive' | 'maintenance';
  staffId: Types.ObjectId; // Linked staff member who registered the vehicle
  createdAt?: Date;
  updatedAt?: Date;
}

const VehicleSchema = new Schema<IVehicle>(
  {
    plateNumber: { type: String, required: true, unique: true },
    modelName: { type: String, required: true },
    manufacturer: { type: String, required: true },
    year: { type: Number, required: true },
    fuelType: { type: String, required: true },
    mileage: { type: Number, required: true },
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance'],
      default: 'active',
    },
    staffId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
  },
  { timestamps: true }
);

const Vehicle: Model<IVehicle> =
  mongoose.models.Vehicle || mongoose.model<IVehicle>('Vehicle', VehicleSchema);

export default Vehicle;