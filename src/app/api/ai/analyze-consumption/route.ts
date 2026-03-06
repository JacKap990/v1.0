import { NextResponse } from 'next/server';
import { generateSmartConsumptionRates } from '@/app/actions/analytics';

export async function POST() {
    try {
        const result = await generateSmartConsumptionRates();
        return NextResponse.json(result);
    } catch (error) {
        console.error("Failed to generate routes", error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
