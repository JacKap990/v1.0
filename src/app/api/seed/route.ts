export const runtime = 'edge';
import { NextResponse } from "next/server";
import { seedSystemRecipes } from "@/app/actions/recipes";

export async function GET() {
    try {
        const res = await seedSystemRecipes();
        return NextResponse.json(res);
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
