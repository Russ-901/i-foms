import { DefaultSession, DefaultUser } from "next-auth";
import { ObjectId } from "mongoose";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      email: string;
      role: "admin" | "staff" | "user";
      staffId?: string | ObjectId; // ✅ added
      department?: string;
      position?: string;
      status?: "Active" | "Inactive";
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    username: string;
    email: string;
    role: "admin" | "staff" | "user";
    staffId?: string | ObjectId; // ✅ added
    department?: string;
    position?: string;
    status?: "Active" | "Inactive";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    email: string;
    role: "admin" | "staff" | "user";
    staffId?: string | ObjectId; // ✅ added
    department?: string;
    position?: string;
    status?: "Active" | "Inactive";
  }
}