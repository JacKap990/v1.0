import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "../prisma";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "test@example.com" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Missing credentials");
                }

                // Special auto-setup for guest user
                if (credentials.email === "guest@pantry.com" && credentials.password === "guest123") {
                    const guestUser = await prisma.user.upsert({
                        where: { email: "guest@pantry.com" },
                        update: {}, // Do nothing if exists
                        create: {
                            email: "guest@pantry.com",
                            password: "guest123",
                            name: "Guest User",
                            themePref: "system",
                            colorTheme: "indigo",
                        } as any
                    });
                    return {
                        id: guestUser.id,
                        email: guestUser.email,
                        name: guestUser.name,
                    };
                }

                // Find User
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });

                if (!user || !user.password) {
                    throw new Error("Invalid credentials");
                }

                // Basic plain text check for MVP (Should be bcrypt in production)
                const isPasswordValid = credentials.password === user.password;

                if (!isPasswordValid) {
                    throw new Error("Invalid credentials");
                }

                // Return standard NextAuth user object
                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                };
            }
        })
    ],
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: '/login', // Redirect here if auth is required
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
};
