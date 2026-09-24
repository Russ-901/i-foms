import { Schema, model, models, Types } from "mongoose";

export interface IUser {
  username: string;
  password: string;
  role: "admin" | "staff" | "user";
  staffId: Types.ObjectId; 
  status: "Active" | "Inactive";
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "staff", "user"], default: "staff" },
    staffId: { type: Schema.Types.ObjectId, ref: "Staff", required: true },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true },
);

const User = models.User || model<IUser>("User", UserSchema);
export default User;
