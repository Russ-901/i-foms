import mongoose, { Schema, Document, models } from 'mongoose';

export interface IStaff extends Document {
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  // Set while an admin-created staff member hasn't set up their own login
  // yet. Cleared once the invite is accepted (a User account is created).
  inviteToken?: string;
  inviteTokenExpiresAt?: Date;
}

const staffSchema = new Schema<IStaff>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    department: {
      type: String,
      enum: ['Administration', 'Fuel Management', 'Transportation', 'Mechanics'],
      required: true,
    },
    position: {
      type: String,
      enum: [
        // Administration
        'HR',
        'Finance',
        'Supervisor',
        // Fuel Management
        'Fuel Supervisor',
        'Fuel Operator',
        // Transportation
        'Driver',
        'Senior Driver',
        // Mechanics
        'Mechanic',
        'Senior Mechanic',
      ],
      required: true,
    },
    inviteToken: { type: String, select: false },
    inviteTokenExpiresAt: { type: Date, select: false },
  },
  { timestamps: true }
);

const Staff = models.Staff || mongoose.model<IStaff>('Staff', staffSchema);
export default Staff;


