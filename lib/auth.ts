import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "phone",
      name: "Phone Number",
      credentials: {
        phone: { label: "Phone Number", type: "tel", placeholder: "555-1234" },
        code: { label: "Access Code", type: "text", placeholder: "6-digit code" },
      },
      async authorize(credentials) {
        if (!credentials?.phone) {
          throw new Error("Phone number is required")
        }

        // Normalize phone number (remove spaces, dashes, etc.)
        const normalizedPhone = credentials.phone.replace(/\D/g, "")

        // Check if contractor has any active photo assignments
        const activeAssignments = await prisma.photoAssignment.findFirst({
          where: {
            contractorPhone: normalizedPhone,
            completedAt: null, // Only active assignments
          },
          include: {
            lead: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                address: true,
              },
            },
          },
        })

        if (!activeAssignments) {
          throw new Error("No active photo assignments found for this phone number")
        }

        // Find or create user
        let user = await prisma.user.findFirst({
          where: { phone: normalizedPhone },
        })

        if (!user) {
          user = await prisma.user.create({
            data: {
              name: `Contractor ${normalizedPhone.slice(-4)}`,
              email: `${normalizedPhone}@contractor.local`,
              phone: normalizedPhone,
              role: "CONTRACTOR",
            },
          })
        }

        return {
          id: user.id,
          phone: user.phone,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.phone = (user as { phone?: string }).phone as string
        token.role = (user as { role?: string }).role as string
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as { id?: string }).id = token.id as string
        (session.user as { phone?: string }).phone = token.phone as string
        (session.user as { role?: string }).role = token.role as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}

