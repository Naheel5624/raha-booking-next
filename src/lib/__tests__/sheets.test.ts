import { describe, it, expect, beforeEach } from 'jest';
import { checkAvailability, buildTimeline, generateBookingId, type Booking } from '../sheets';

// Helper to create a minimal booking
function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    'Booking ID': 'BK260830001',
    'Event Name': 'Test Event',
    'Client Name': 'Test Client',
    'Client Email': '',
    'Contact Phone': '1234567890',
    'Date': '2026-08-30',
    'Start Time': '10:00 AM',
    'End Time': '02:00 PM',
    'Total Amount': 50000,
    'Amount Paid': 25000,
    'Balance Due': 25000,
    'Payment Status': 'Partially Paid',
    'Booking Status': 'Confirmed',
    'Blocked Until': '04:00 PM',
    'Calendar Event ID': '',
    'Booking Notes': '',
    'Created At': new Date().toISOString(),
    ...overrides,
  };
}

describe('checkAvailability — overlap prevention', () => {
  const date = '2026-08-30';
  const BUFFER = 120; // 2 hours

  describe('should ALLOW valid bookings', () => {
    it('allows booking when hall is empty', () => {
      const result = checkAvailability([], date, '10:00 AM', '02:00 PM');
      expect(result.available).toBe(true);
    });

    it('allows booking starting exactly when buffer ends', () => {
      // Existing: 10:00 AM - 02:00 PM, buffer ends at 04:00 PM
      const existing = makeBooking({ 'Start Time': '10:00 AM', 'End Time': '02:00 PM' });
      const result = checkAvailability([existing], date, '04:00 PM', '06:00 PM');
      expect(result.available).toBe(true);
    });

    it('allows booking starting after buffer ends', () => {
      const existing = makeBooking({ 'Start Time': '10:00 AM', 'End Time': '02:00 PM' });
      const result = checkAvailability([existing], date, '05:00 PM', '08:00 PM');
      expect(result.available).toBe(true);
    });

    it('allows booking on a different date', () => {
      const existing = makeBooking({ 'Date': '2026-08-30', 'Start Time': '10:00 AM', 'End Time': '02:00 PM' });
      const result = checkAvailability([existing], '2026-08-31', '10:00 AM', '02:00 PM');
      expect(result.available).toBe(true);
    });

    it('allows booking that does not conflict with buffer', () => {
      // Existing: 10:00 AM - 12:00 PM (buffer until 02:00 PM)
      // New: 02:00 PM - 04:00 PM — exactly when buffer ends
      const existing = makeBooking({ 'Start Time': '10:00 AM', 'End Time': '12:00 PM' });
      const result = checkAvailability([existing], date, '02:00 PM', '04:00 PM');
      expect(result.available).toBe(true);
    });
  });

  describe('should REJECT overlapping bookings', () => {
    it('rejects booking that overlaps existing event (partial overlap at start)', () => {
      const existing = makeBooking({ 'Start Time': '10:00 AM', 'End Time': '02:00 PM' });
      const result = checkAvailability([existing], date, '08:00 AM', '11:00 AM');
      expect(result.available).toBe(false);
    });

    it('rejects booking that overlaps existing event (partial overlap at end)', () => {
      const existing = makeBooking({ 'Start Time': '10:00 AM', 'End Time': '02:00 PM' });
      const result = checkAvailability([existing], date, '01:00 PM', '03:00 PM');
      expect(result.available).toBe(false);
    });

    it('rejects booking that falls entirely within existing event', () => {
      const existing = makeBooking({ 'Start Time': '10:00 AM', 'End Time': '04:00 PM' });
      const result = checkAvailability([existing], date, '12:00 PM', '02:00 PM');
      expect(result.available).toBe(false);
    });

    it('rejects booking that completely contains existing event', () => {
      const existing = makeBooking({ 'Start Time': '12:00 PM', 'End Time': '02:00 PM' });
      const result = checkAvailability([existing], date, '10:00 AM', '04:00 PM');
      expect(result.available).toBe(false);
    });

    it('rejects booking that overlaps with existing cleaning buffer (30 min before buffer ends)', () => {
      // Existing: 10:00 AM - 02:00 PM, buffer until 04:00 PM
      // New: 03:30 PM - 05:00 PM — overlaps buffer
      const existing = makeBooking({ 'Start Time': '10:00 AM', 'End Time': '02:00 PM' });
      const result = checkAvailability([existing], date, '03:30 PM', '05:00 PM');
      expect(result.available).toBe(false);
    });

    it('rejects booking that falls entirely within cleaning buffer', () => {
      // Existing: 10:00 AM - 02:00 PM, buffer until 04:00 PM
      // New: 02:30 PM - 03:30 PM — entirely within buffer
      const existing = makeBooking({ 'Start Time': '10:00 AM', 'End Time': '02:00 PM' });
      const result = checkAvailability([existing], date, '02:30 PM', '03:30 PM');
      expect(result.available).toBe(false);
    });

    it('rejects booking that touches end of existing event exactly', () => {
      // Existing: 10:00 AM - 02:00 PM
      // New: 02:00 PM - 04:00 PM — starts exactly when existing ends
      const existing = makeBooking({ 'Start Time': '10:00 AM', 'End Time': '02:00 PM' });
      const result = checkAvailability([existing], date, '02:00 PM', '04:00 PM');
      expect(result.available).toBe(false);
    });

    it('rejects new booking whose buffer extends into existing booking', () => {
      // Existing: 04:00 PM - 07:00 PM
      // New: 02:00 PM - 04:00 PM — buffer until 06:00 PM overlaps existing start
      const existing = makeBooking({ 'Start Time': '04:00 PM', 'End Time': '07:00 PM' });
      const result = checkAvailability([existing], date, '02:00 PM', '04:00 PM');
      expect(result.available).toBe(false);
    });

    it('rejects new booking whose buffer extends into existing booking (tight)', () => {
      // Existing: 03:00 PM - 05:00 PM
      // New: 01:00 PM - 03:00 PM — buffer until 05:00 PM, existing starts at 03:00 PM
      const existing = makeBooking({ 'Start Time': '03:00 PM', 'End Time': '05:00 PM' });
      const result = checkAvailability([existing], date, '01:00 PM', '03:00 PM');
      expect(result.available).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('rejects end time before start time', () => {
      const result = checkAvailability([], date, '04:00 PM', '02:00 PM');
      expect(result.available).toBe(false);
      expect(result.reason).toContain('End time must be after start time');
    });

    it('rejects equal start and end time', () => {
      const result = checkAvailability([], date, '02:00 PM', '02:00 PM');
      expect(result.available).toBe(false);
    });

    it('ignores cancelled bookings', () => {
      const existing = makeBooking({
        'Start Time': '10:00 AM',
        'End Time': '02:00 PM',
        'Booking Status': 'Cancelled',
      });
      const result = checkAvailability([existing], date, '10:00 AM', '02:00 PM');
      expect(result.available).toBe(true);
    });

    it('handles multiple bookings on same day', () => {
      const b1 = makeBooking({ 'Booking ID': 'BK260830001', 'Start Time': '08:00 AM', 'End Time': '10:00 AM' });
      const b2 = makeBooking({ 'Booking ID': 'BK260830002', 'Start Time': '04:00 PM', 'End Time': '06:00 PM' });
      // Between buffer of b1 (ends 12:00 PM) and start of b2 (04:00 PM) — should be available
      const result = checkAvailability([b1, b2], date, '12:30 PM', '03:00 PM');
      expect(result.available).toBe(true);
    });

    it('rejects booking between two bookings when it hits one buffer', () => {
      const b1 = makeBooking({ 'Booking ID': 'BK260830001', 'Start Time': '08:00 AM', 'End Time': '10:00 AM' });
      const b2 = makeBooking({ 'Booking ID': 'BK260830002', 'Start Time': '04:00 PM', 'End Time': '06:00 PM' });
      // New: 11:00 AM - 05:00 PM — overlaps b2
      const result = checkAvailability([b1, b2], date, '11:00 AM', '05:00 PM');
      expect(result.available).toBe(false);
    });
  });
});

describe('buildTimeline', () => {
  const date = '2026-08-30';

  it('shows full day as available when no bookings', () => {
    const slots = buildTimeline([], date);
    expect(slots).toHaveLength(1);
    expect(slots[0].type).toBe('available');
    expect(slots[0].start).toBe('08:00 AM');
    expect(slots[0].end).toBe('10:00 PM');
  });

  it('shows booked + buffer + available slots', () => {
    const b = makeBooking({ 'Start Time': '10:00 AM', 'End Time': '02:00 PM' });
    const slots = buildTimeline([b], date);
    expect(slots.length).toBeGreaterThanOrEqual(3);
    expect(slots[0].type).toBe('available'); // 08:00 - 10:00
    expect(slots[1].type).toBe('booked');   // 10:00 - 02:00
    expect(slots[2].type).toBe('buffer');   // 02:00 - 04:00
  });

  it('merges consecutive buffers', () => {
    const b1 = makeBooking({ 'Booking ID': 'BK001', 'Start Time': '10:00 AM', 'End Time': '12:00 PM' });
    const b2 = makeBooking({ 'Booking ID': 'BK002', 'Start Time': '02:00 PM', 'End Time': '04:00 PM' });
    const slots = buildTimeline([b1, b2], date);
    // Should have: available(8-10), booked(10-12), buffer(12-2), booked(2-4), buffer(4-6), available(6-10)
    const types = slots.map((s) => s.type);
    expect(types).toEqual(['available', 'booked', 'buffer', 'booked', 'buffer', 'available']);
  });
});

describe('generateBookingId', () => {
  it('generates BKYYMMDD001 for first booking of the day', () => {
    const id = generateBookingId([], '2026-08-30');
    expect(id).toBe('BK260830001');
  });

  it('increments sequence for existing bookings', () => {
    const existing = [makeBooking({ 'Booking ID': 'BK260830001' })];
    const id = generateBookingId(existing, '2026-08-30');
    expect(id).toBe('BK260830002');
  });

  it('resets sequence for a new day', () => {
    const existing = [makeBooking({ 'Booking ID': 'BK260830001' })];
    const id = generateBookingId(existing, '2026-08-31');
    expect(id).toBe('BK260831001');
  });
});
