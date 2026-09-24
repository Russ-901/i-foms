import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IService extends Document {
  vehicleId: Types.ObjectId;
  description: string;
  odometer?: number;
  cost?: number;
  servicedBy?: string;
  serviceDate: Date;
  createdAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    description: { type: String, required: true },
    odometer: Number,
    cost: Number,
    servicedBy: String,
    serviceDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Service: Model<IService> =
  mongoose.models.Service || mongoose.model<IService>('Service', ServiceSchema);

export default Service;
