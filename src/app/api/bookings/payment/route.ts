import { NextRequest, NextResponse } from 'next/server';

// Convert YYYY-MM-DD to DD/Mon/YYYY for spreadsheet storage
function toDisplayDate(iso: string): string {
  if (!iso) return iso;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const parts = iso.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0]); const m = parseInt(parts[1]) - 1; const d = parseInt(parts[2]);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return `${String(d).padStart(2, "0")}/${months[m]}/${y}`;
    }
  }
  return iso;
}


import { getAllBookings, updateBookingField, appendPaymentRecord } from '@/lib/sheets';

// POST /api/bookings/payment { bookingId: "RA...", amountPaid: 25000, paymentDate: "2026-08-31", paymentMethod: "Bank" }
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
    const previousPaid = booking['Amount Paid'];
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

    // Auto-confirm booking when any payment is made
    if (paid > 0 && booking['Booking Status'] === 'Pending') {
      await updateBookingField(bookingId, 'Booking Status', 'Confirmed');
    }

    // Record this payment in the Payments sheet
    const additionalAmount = paid - previousPaid;
    if (additionalAmount > 0) {
      // Count existing payments for this booking to determine payment number
      const { getPaymentsForBooking } = await import('@/lib/sheets');
      const existingPayments = await getPaymentsForBooking(bookingId);
      const paymentNumber = existingPayments.length + 1;

      await appendPaymentRecord({
        'Booking ID': bookingId,
        'Client Name': booking['Client Name'],
        'Event Name': booking['Event Name'],
        'Date': toDisplayDate(paymentDate || new Date().toISOString().slice(0, 10)),
        'Payment #': paymentNumber,
        'Amount': additionalAmount,
        'Method': paymentMethod || 'Cash',
        'Recorded At': new Date().toISOString(),
      });
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
