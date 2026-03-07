export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';
import { smartSearchScore } from '@/lib/searchUtils';

const limiter = rateLimit({
    interval: 60 * 1000, // 1 minute window
});

export async function GET(request: Request) {
    try {
        // Very basic IP extraction. Depending on hosting (Vercel, Node, etc), this might need adjustment (`x-forwarded-for`)
        const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";

        // Max 60 requests per minute per IP for GET lookups
        await limiter.check(60, ip);
    } catch {
        return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get('barcode');
    const query = searchParams.get('q');

    try {
        if (barcode) {
            // Priority 1: Exact Barcode Match
            const product = await db.globalProduct.findUnique({
                where: { id: barcode }
            });

            if (product) {
                return NextResponse.json({ success: true, product });
            }
            return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
        }

        if (query) {
            const trimmed = query.trim();
            const isNumericQuery = /^\d+$/.test(trimmed);

            let rawProducts: any[] = [];

            if (isNumericQuery) {
                // Partial Barcode Search: search by ID (barcode) containing the digits
                rawProducts = await db.globalProduct.findMany({
                    where: {
                        id: {
                            contains: trimmed
                        }
                    },
                    take: 30
                });
            }

            if (rawProducts.length === 0) {
                // Primary search: name contains the full query
                rawProducts = await db.globalProduct.findMany({
                    where: {
                        name: {
                            contains: trimmed
                        }
                    },
                    take: 50
                });
            }

            // Fallback: if no results, try multi-word fuzzy search
            // Split query into words and search each word, then intersect
            if (rawProducts.length === 0 && trimmed.includes(' ')) {
                const words = trimmed.split(/\s+/).filter(w => w.length >= 2);
                if (words.length > 0) {
                    // Search for products matching ALL words (AND logic)
                    rawProducts = await db.globalProduct.findMany({
                        where: {
                            AND: words.map(word => ({
                                name: { contains: word }
                            }))
                        },
                        take: 50
                    });
                }
            }

            // Additional fallback: search by manufacturer field if exists
            if (rawProducts.length === 0) {
                rawProducts = await db.globalProduct.findMany({
                    where: {
                        OR: [
                            { name: { contains: trimmed } },
                            { manufacturer: { contains: trimmed } },
                            { brand: { contains: trimmed } },
                        ]
                    },
                    take: 50
                });
            }

            // Smart Ranking Algorithm
            const ranked = rawProducts
                .map((p) => {
                    const score = smartSearchScore(trimmed, p.name);
                    // Add a small bonus for shorter names to break ties
                    const finalScore = score - (p.name.length * 0.1);
                    return { ...p, _score: finalScore };
                })
                .sort((a, b) => b._score - a._score)
                .slice(0, 20); // Return top 20 after ranking

            return NextResponse.json({ success: true, products: ranked });
        }

        return NextResponse.json({ success: false, message: 'Missing barcode or search query' }, { status: 400 });

    } catch (error) {
        console.error('Error fetching global product:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Learn a new product from the user (Crowdsourcing DB)
export async function POST(request: Request) {
    try {
        const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";

        // Stricter limit for POST learning: 10 per minute per IP
        await limiter.check(10, `${ip}_POST`);
    } catch {
        return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });
    }

    try {
        const body = await request.json();
        const { name, barcode, category, emoji } = body;

        if (!name || !name.trim()) {
            return NextResponse.json({ success: false, message: 'Product name is required' }, { status: 400 });
        }

        const id = barcode?.trim() || `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        // Upsert: if barcode exists, update it; otherwise create new
        const product = await db.globalProduct.upsert({
            where: { id },
            update: {
                name: name.trim(),
                category: category || 'כללי',
                emoji: emoji || '🛒',
            },
            create: {
                id,
                name: name.trim(),
                category: category || 'כללי',
                emoji: emoji || '🛒',
            }
        });

        return NextResponse.json({ success: true, product });
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
