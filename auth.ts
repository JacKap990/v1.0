import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./src/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "test@example.com" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Missing credentials");
                }

                // Guest Logic
                if (credentials.email === "guest@pantry.com" && credentials.password === "guest123") {
                    const guestUser = await prisma.user.upsert({
                        where: { email: "guest@pantry.com" },
                        update: {},
                        create: {
                            email: "guest@pantry.com",
                            password: "guest123",
                            name: "Guest User",
                            themePref: "system",
                            colorTheme: "indigo",
                        } as any
                    });
                    return guestUser;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string }
                });

                if (!user || !user.password) {
                    throw new Error("Invalid credentials");
                }

                const isPasswordValid = credentials.password === user.password;

                if (!isPasswordValid) {
                    throw new Error("Invalid credentials");
                }

                return user;
            }
        })
    ],
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
            }
            return session;
        }
    },
    secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_development_only",
})
