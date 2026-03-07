import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = 'edge';

// Secret key to protect internal DB access
const DB_GATEWAY_SECRET = process.env.DB_GATEWAY_SECRET || "internal_dev_secret";

export async function POST(req: Request) {
    const authHeader = req.headers.get("x-db-secret");

    if (authHeader !== DB_GATEWAY_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { action, model, args } = await req.json();

        if (!action || !model) {
            return NextResponse.json({ error: "Missing action or model" }, { status: 400 });
        }

        // Handle common Prisma operations
        const modelDelegate = (prisma as any)[model];
        if (!modelDelegate || typeof modelDelegate[action] !== "function") {
            return NextResponse.json({ error: `Invalid action ${action} for model ${model}` }, { status: 400 });
        }

        const result = await modelDelegate[action](args);
        return NextResponse.json({ data: result });
    } catch (error: any) {
        console.error("Internal DB Gateway Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
