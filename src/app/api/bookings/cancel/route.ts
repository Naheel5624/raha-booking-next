import { NextRequest, NextResponse } from 'next/server';
import { getAllBookings, updateBookingField } from '@/lib/sheets';

// POST /api/bookings/cancel { bookingId: "BK..." }
export async function POST(req: NextRequest) {
  try {
    const { bookingId } = await req.json();
    if (!bookingId) {
      return NextResponse.json({ success: false, errors: ['Booking ID required.'] }, { status: 400 });
    }

    const bookings = await getAllBookings();
    const booking = bookings.find((b) => b['Booking ID'] === bookingId);

    if (!booking) {
      return NextResponse.json({ success: false, errors: ['Booking not found.'] }, { status: 404 });
    }

    if (booking['Booking Status'] === 'Cancelled') {
      return NextResponse.json({ success: false, errors: ['Booking is already cancelled.'] }, { status: 400 });
    }

    await updateBookingField(bookingId, 'Booking Status', 'Cancelled');

    return NextResponse.json({ success: true, message: `Booking ${bookingId} has been cancelled.` });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('POST /api/bookings/cancel error:', message);
    return NextResponse.json({ success: false, errors: [message] }, { status: 500 });
  }
}
