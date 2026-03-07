export const runtime = 'edge';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Return success even if user not found to prevent email enumeration
            return NextResponse.json({ success: true, message: "If an account exists, a reset link has been sent." }, { status: 200 });
        }

        // Generate a secure token using WebCrypto
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour expiration

        // Save token to DB
        await prisma.passwordResetToken.upsert({
            where: { email },
            update: { token, expires },
            create: { email, token, expires }
        });

        // In a real application, you would send an email here.
        // For development/MVP purposes, we will log the reset link to the console.
        const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

        console.log("-----------------------------------------");
        console.log(`PASSWORD RESET FOR: ${email}`);
        console.log(`CLICK LINK: ${resetLink}`);
        console.log("-----------------------------------------");

        return NextResponse.json({ success: true, message: "Password reset link generated." }, { status: 200 });
    } catch (error) {
        console.error("Error in password reset route:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
