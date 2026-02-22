
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { method, params } = body;

        const HELIUS_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;
        console.log(`[RPC Proxy] Forwarding to: ${HELIUS_RPC_URL} | Method: ${method}`);

        const response = await fetch(HELIUS_RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'dust-demons-proxy',
                method,
                params
            })
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('RPC Proxy Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
