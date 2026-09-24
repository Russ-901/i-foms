import mongoose, { Schema, Document, models } from 'mongoose';

export interface IFuel extends Document {
  vehicleId: mongoose.Types.ObjectId;
  tripId: mongoose.Types.ObjectId;
  liters: number;
  requestedBy: mongoose.Types.ObjectId;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  cancellationReason?: string;
  requestDate: Date;
  createdAt: Date;
}

const FuelSchema = new Schema<IFuel>(
  {
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
    liters: { type: Number, required: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'], default: 'Pending' },
    cancellationReason: { type: String },
    requestDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default models.Fuel || mongoose.model<IFuel>('Fuel', FuelSchema);
