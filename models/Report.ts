import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { IStaff } from './Staff';

export interface IReport extends Document {
  staffId: Types.ObjectId | IStaff;  // can be populated
  actionType: string;
  description: string;
  targetId?: Types.ObjectId;
  targetModel?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    staffId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
    actionType: { type: String, required: true },
    description: { type: String, required: true },
    targetId: { type: Schema.Types.ObjectId, default: null },
    targetModel: { type: String, default: null },
  },
  { timestamps: true }
);

const Report: Model<IReport> =
  mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);

export default Report;