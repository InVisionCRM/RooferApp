import { DefaultSession } from "next-auth"
import { UserRole } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      phone: string | null
      role: UserRole
    } & DefaultSession["user"]
  }

  interface User {
    phone: string | null
    role: UserRole
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    phone: string | null
    role: UserRole
  }
}

