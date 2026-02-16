
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const response = await fetch('https://api.sanctum.so/v1/apy/latest?lst=JupSOL', {
            headers: {
                'Accept': 'application/json',
            },
            next: { revalidate: 300 } // Cache for 5 minutes
        });

        if (!response.ok) {
            throw new Error(`Sanctum API error: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.warn('⚠️ Sanctum API unreachable (JupSOL APY), using fallback (10%)');
        return NextResponse.json({ apy: 0.10 }, { status: 200 }); // Fallback to ~10% if fails
    }
}
