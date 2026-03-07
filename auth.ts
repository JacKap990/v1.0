import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { db } from "./src/lib/db"

export const { handlers, auth, signIn, signOut } = NextAuth({
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
                    const guestUser = await db.user.upsert({
                        where: { email: "guest@pantry.com" },
                        update: {},
                        create: {
                            email: "guest@pantry.com",
                            password: "guest123",
                            name: "Guest User",
                            themePref: "system",
                            colorTheme: "indigo",
                        }
                    });
                    return guestUser as any;
                }

                const user = await db.user.findUnique({
                    where: { email: credentials.email as string }
                });

                if (!user || !(user as any).password) {
                    throw new Error("Invalid credentials");
                }

                const isPasswordValid = credentials.password === (user as any).password;

                if (!isPasswordValid) {
                    throw new Error("Invalid credentials");
                }

                return user as any;
            }
        })
    ],
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = (user as any).id;
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
    secret: process.env.NEXT_AUTH_SECRET || process.env.AUTH_SECRET || "fallback_secret",
})
