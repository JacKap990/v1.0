export const runtime = 'edge';
import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        if (!email || !password || !name) {
            return NextResponse.json(
                { error: "כל השדות חובה" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: "סיסמה חייבת להיות לפחות 6 תווים" },
                { status: 400 }
            );
        }

        // Check if user exists
        const existingUser = await db.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "משתמש עם אימייל זה כבר קיים המערכת" },
                { status: 409 }
            );
        }

        // MVP: Storing plain text password as in the original vanilla app logic.
        // In actual production, this MUST use bcrypt.hash(password, 10)
        const newUser = await db.user.create({
            data: {
                name,
                email,
                password,
            } as any,
        });

        // Strip password from response
        const { password: _, ...userWithoutPassword } = newUser as any;

        return NextResponse.json(
            { success: true, user: userWithoutPassword },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration Error:", error);
        return NextResponse.json(
            { error: "שגיאת מערכת ביצירת משתמש" },
            { status: 500 }
        );
    }
}
