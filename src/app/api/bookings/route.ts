import { NextRequest, NextResponse } from 'next/server';
import {
  getAllBookings,
  appendBooking,
  checkAvailability,
  generateBookingId,
  buildTimeline,
  type Booking,
} from '@/lib/sheets';
import { sendBookingConfirmation } from '@/lib/email';

// GET /api/bookings — all bookings
export async function GET() {
  try {
    const bookings = await getAllBookings();
    return NextResponse.json({ success: true, bookings });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('GET /api/bookings error:', message);
    return NextResponse.json({ success: false, errors: [message] }, { status: 500 });
  }
}

// POST /api/bookings — create a new booking
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clientName, clientEmail, contactPhone,
      eventName, eventDate, startTime, endTime,
      totalAmount, amountPaid, bookingNotes,
    } = body;

    // Validate required fields
    const errors: string[] = [];
    if (!clientName?.trim()) errors.push('Client Name is required.');
    if (!contactPhone?.trim()) errors.push('Contact Phone is required.');
    if (!eventName?.trim()) errors.push('Event Name is required.');
    if (!eventDate) errors.push('Event Date is required.');
    if (!startTime) errors.push('Start Time is required.');
    if (!endTime) errors.push('End Time is required.');
    if (!totalAmount && totalAmount !== 0) errors.push('Total Amount is required.');
    if (amountPaid === undefined || amountPaid === null) errors.push('Amount Paid is required.');

    const total = parseFloat(totalAmount);
    const paid = parseFloat(amountPaid);
    if (isNaN(total) || total < 0) errors.push('Invalid Total Amount.');
    if (isNaN(paid) || paid < 0) errors.push('Invalid Amount Paid.');
    if (!isNaN(total) && !isNaN(paid) && paid > total) {
      errors.push('Amount Paid cannot exceed Total Amount.');
    }

    if (clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      errors.push('Invalid email format.');
    }

    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    // Check date is not in the past
    const eventDay = new Date(eventDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (eventDay < today) {
      return NextResponse.json({ success: false, errors: ['Event Date cannot be in the past.'] }, { status: 400 });
    }

    const balance = total - paid;
    let paymentStatus = 'Unpaid';
    if (balance <= 0) paymentStatus = 'Paid';
    else if (paid > 0) paymentStatus = 'Partially Paid';

    const bufferMin = parseInt(process.env.BUFFER_MINUTES || '120');

    // Check availability
    const bookings = await getAllBookings();
    const avail = checkAvailability(bookings, eventDate, startTime, endTime);
    if (!avail.available) {
      return NextResponse.json({ success: false, errors: [avail.reason!] }, { status: 409 });
    }

    // Generate booking ID
    const bookingId = generateBookingId(bookings, eventDate);

    // Parse end time for buffer calculation (handle both 12h and 24h formats)
    const endMin = (() => {
      const m12 = endTime.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)/i);
      if (m12) {
        let h = parseInt(m12[1]);
        const mi = parseInt(m12[2]);
        const ap = m12[4].toUpperCase();
        if (ap === 'PM' && h !== 12) h += 12;
        if (ap === 'AM' && h === 12) h = 0;
        return h * 60 + mi;
      }
      const m24 = endTime.match(/(\d{1,2}):(\d{2})/);
      if (m24) return parseInt(m24[1]) * 60 + parseInt(m24[2]);
      return 0;
    })();
    const blockEnd = endMin + bufferMin;
    const h = Math.floor(blockEnd / 60);
    const mi = blockEnd % 60;
    const blockedUntil = `${String(h % 12 || 12).padStart(2, '0')}:${String(mi).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;

    const now = new Date().toISOString();
    const booking: Booking = {
      'Booking ID': bookingId,
      'Event Name': eventName.trim(),
      'Client Name': clientName.trim(),
      'Client Email': (clientEmail || '').trim(),
      'Contact Phone': contactPhone.trim(),
      'Date': eventDate,
      'Start Time': startTime,
      'End Time': endTime,
      'Total Amount': total,
      'Amount Paid': paid,
      'Balance Due': balance,
      'Payment Status': paymentStatus,
      'Booking Status': 'Confirmed',
      'Blocked Until': blockedUntil,
      'Calendar Event ID': '',
      'Booking Notes': (bookingNotes || '').trim(),
      'Created At': now,
    };

    // Save to Google Sheets
    await appendBooking(booking);

    // Send confirmation email (non-blocking)
    sendBookingConfirmation({
      bookingId,
      clientName: clientName.trim(),
      clientEmail: (clientEmail || '').trim(),
      eventName: eventName.trim(),
      eventDate,
      startTime,
      endTime,
      totalAmount: total,
      amountPaid: paid,
      balanceDue: balance,
      paymentStatus,
      blockedUntil,
    }).catch((e) => console.error('Email failed:', e));

    return NextResponse.json({
      success: true,
      booking,
      message: `Booking ${bookingId} confirmed successfully!`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('POST /api/bookings error:', message);
    return NextResponse.json({ success: false, errors: [message] }, { status: 500 });
  }
}
