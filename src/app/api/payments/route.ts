import { NextResponse } from 'next/server';
import { getAllPayments } from '@/lib/sheets';

export async function GET() {
  try {
    const payments = await getAllPayments();
    return NextResponse.json({ success: true, payments });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('GET /api/payments error:', message);
    return NextResponse.json({ success: false, errors: [message] }, { status: 500 });
  }
}
