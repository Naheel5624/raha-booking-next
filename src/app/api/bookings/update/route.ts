import { NextRequest, NextResponse } from 'next/server';
import { getAllBookings, updateBookingField } from '@/lib/sheets';

// POST /api/bookings/update { bookingId, totalAmount }
export async function POST(req: NextRequest) {
  try {
    const { bookingId, totalAmount } = await req.json();
    if (!bookingId) {
      return NextResponse.json({ success: false, errors: ['Booking ID required.'] }, { status: 400 });
    }

    const bookings = await getAllBookings();
    const booking = bookings.find((b) => b['Booking ID'] === bookingId);
    if (!booking) {
      return NextResponse.json({ success: false, errors: ['Booking not found.'] }, { status: 404 });
    }

    const newTotal = parseFloat(totalAmount);
    if (isNaN(newTotal) || newTotal < 0) {
      return NextResponse.json({ success: false, errors: ['Invalid Total Amount.'] }, { status: 400 });
    }

    const paid = booking['Amount Paid'];
    if (paid > newTotal) {
      return NextResponse.json({ success: false, errors: ['Amount Paid exceeds the new Total Amount. Update payment first.'] }, { status: 400 });
    }

    const balance = newTotal - paid;
    let paymentStatus = 'Unpaid';
    if (balance <= 0) paymentStatus = 'Paid';
    else if (paid > 0) paymentStatus = 'Partially Paid';

    await updateBookingField(bookingId, 'Total Amount', newTotal);
    await updateBookingField(bookingId, 'Balance Due', balance);
    await updateBookingField(bookingId, 'Payment Status', paymentStatus);

    // Auto-confirm if paid > 0
    if (paid > 0 && booking['Booking Status'] === 'Pending') {
      await updateBookingField(bookingId, 'Booking Status', 'Confirmed');
    }

    return NextResponse.json({
      success: true,
      message: `Total Amount updated for ${bookingId}`,
      totalAmount: newTotal,
      balance,
      paymentStatus,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('POST /api/bookings/update error:', message);
    return NextResponse.json({ success: false, errors: [message] }, { status: 500 });
  }
}
