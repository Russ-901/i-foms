import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/connection';
import Staff from '@/models/Staff';
import User from '@/models/User';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text', placeholder: 'Email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        await connectDB();
        if (!credentials?.email || !credentials?.password) throw new Error('Email and password are required');

        const staff = await Staff.findOne({ email: credentials.email });
        if (!staff) throw new Error('Staff not found');

        const user = await User.findOne({ staffId: staff._id });
        if (!user) throw new Error('Linked user account missing');

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) throw new Error('Incorrect password');

        if (user.status !== 'Active') throw new Error('Your account is inactive');

        return {
          id: user._id.toString(),
          staffId: user.staffId.toString(),
          email: staff.email,
          name: staff.name,
          username: user.username,
          role: user.role as "admin" | "staff" | "user",
          department: staff.department,
          position: staff.position,
          status: user.status as "Active" | "Inactive",
        };
      },
    }),
  ],

  session: { strategy: 'jwt' }, // ✅ literal type

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.staffId = user.staffId;
        token.role = user.role;
        token.department = user.department;
        token.position = user.position;
        token.status = user.status;
        token.username = user.username;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id as string,
        staffId: token.staffId as string,
        role: token.role as 'admin' | 'staff' | 'user',
        department: token.department as string,
        position: token.position as string,
        status: token.status as 'Active' | 'Inactive',
        username: token.username as string,
        email: token.email as string,
      };
      return session;
    },
  },

  pages: { signIn: '/auth/signin' },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };