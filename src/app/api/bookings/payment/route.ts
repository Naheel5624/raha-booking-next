import { NextRequest, NextResponse } from 'next/server';
import { getAllBookings, updateBookingField } from '@/lib/sheets';

// POST /api/bookings/payment { bookingId: "BK...", amountPaid: 25000 }
export async function POST(req: NextRequest) {
  try {
    const { bookingId, amountPaid, paymentDate, paymentMethod } = await req.json();
    if (!bookingId) {
      return NextResponse.json({ success: false, errors: ['Booking ID required.'] }, { status: 400 });
    }

    const bookings = await getAllBookings();
    const booking = bookings.find((b) => b['Booking ID'] === bookingId);

    if (!booking) {
      return NextResponse.json({ success: false, errors: ['Booking not found.'] }, { status: 404 });
    }

    const total = booking['Total Amount'];
    const paid = parseFloat(amountPaid);
    if (isNaN(paid) || paid < 0) {
      return NextResponse.json({ success: false, errors: ['Invalid amount.'] }, { status: 400 });
    }
    if (paid > total) {
      return NextResponse.json({ success: false, errors: ['Amount Paid cannot exceed Total Amount.'] }, { status: 400 });
    }

    const balance = total - paid;
    let paymentStatus = 'Unpaid';
    if (balance <= 0) paymentStatus = 'Paid';
    else if (paid > 0) paymentStatus = 'Partially Paid';

    await updateBookingField(bookingId, 'Amount Paid', paid);
    await updateBookingField(bookingId, 'Balance Due', balance);
    await updateBookingField(bookingId, 'Payment Status', paymentStatus);
    if (paymentDate) await updateBookingField(bookingId, 'Payment Date', paymentDate);
    if (paymentMethod) await updateBookingField(bookingId, 'Payment Method', paymentMethod);

    // Auto-confirm booking when any payment is made
    if (paid > 0 && booking['Booking Status'] === 'Pending') {
      await updateBookingField(bookingId, 'Booking Status', 'Confirmed');
    }

    return NextResponse.json({
      success: true,
      message: `Payment updated for ${bookingId}`,
      balance,
      paymentStatus,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('POST /api/bookings/payment error:', message);
    return NextResponse.json({ success: false, errors: [message] }, { status: 500 });
  }
}
