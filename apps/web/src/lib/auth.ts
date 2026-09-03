import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Nodemailer from 'next-auth/providers/nodemailer';
import { prisma } from '@exam/db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Nodemailer({
      server: process.env.EMAIL_SERVER, // smtp://user:pass@smtp.example.com:587
      from: process.env.EMAIL_FROM,
    }),
  ],
  pages: { signIn: '/login' },
  session: { strategy: 'database' },
});
