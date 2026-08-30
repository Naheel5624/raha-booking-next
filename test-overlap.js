// Comprehensive overlap prevention test
// Run: node test-overlap.js

const BUFFER = 120; // 2 hours

function timeToMinutes(t) {
  t = t.trim();
  const m12 = t.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (m12) {
    let h = parseInt(m12[1]);
    const mi = parseInt(m12[2]);
    const ap = m12[4].toUpperCase();
    if (ap === 'PM' && h !== 12) h += 12;
    if (ap === 'AM' && h === 12) h = 0;
    return h * 60 + mi;
  }
  const m24 = t.match(/(\d{1,2}):(\d{2})/);
  if (m24) return parseInt(m24[1]) * 60 + parseInt(m24[2]);
  return 0;
}

function minutesToTime(m) {
  const h = Math.floor(m / 60);
  const mi = m % 60;
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(mi).padStart(2, '0')} ${ap}`;
}

function checkAvailability(bookings, dateStr, startTime, endTime) {
  const reqStart = timeToMinutes(startTime);
  const reqEnd = timeToMinutes(endTime);

  if (reqEnd <= reqStart) {
    return { available: false, reason: 'End time must be after start time.' };
  }

  for (const b of bookings) {
    if (b.status === 'Cancelled') continue;
    if (b.date !== dateStr) continue;

    const bStart = timeToMinutes(b.start);
    const bEnd = timeToMinutes(b.end);
    const bBlockEnd = bEnd + BUFFER;

    // Check 1: Does new booking overlap with existing booking or its buffer?
    if (reqStart < bBlockEnd && reqEnd > bStart) {
      return { available: false, reason: `Blocked: ${b.name} ${b.start}-${b.end} (buffer to ${minutesToTime(bBlockEnd)})` };
    }

    // Check 2: Does new booking's own buffer extend into an existing booking?
    const reqBlockEnd = reqEnd + BUFFER;
    if (reqBlockEnd > bStart && reqEnd <= bStart) {
      return { available: false, reason: `Buffer conflict: your buffer to ${minutesToTime(reqBlockEnd)} hits "${b.name}" at ${b.start}` };
    }
  }

  return { available: true };
}

// =====================================================
// Test bookings:
//   EXISTING: 10:00 AM – 02:00 PM (buffer until 04:00 PM)
// =====================================================
const EXISTING = { name: 'Wedding', date: '2026-08-30', start: '10:00 AM', end: '02:00 PM', status: 'Confirmed' };

let passed = 0;
let failed = 0;

function test(name, expected, actual) {
  if (expected === actual) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.log(`  ❌ ${name} — expected ${expected}, got ${actual}`);
    failed++;
  }
}

console.log('\n=== SHOULD ALLOW (no conflict) ===');
test('Empty hall', true, checkAvailability([], '2026-08-30', '10:00 AM', '02:00 PM').available);
test('Starts exactly when buffer ends (04:00 PM)', true,
  checkAvailability([EXISTING], '2026-08-30', '04:00 PM', '06:00 PM').available);
test('Starts after buffer (04:30 PM)', true,
  checkAvailability([EXISTING], '2026-08-30', '04:30 PM', '07:00 PM').available);
test('Different date', true,
  checkAvailability([EXISTING], '2026-08-31', '10:00 AM', '02:00 PM').available);
test('Cancelled booking ignored', true,
  checkAvailability([{ ...EXISTING, status: 'Cancelled' }], '2026-08-30', '10:00 AM', '02:00 PM').available);
test('Before existing booking but buffer conflicts (08:00-09:00 AM → buffer 11AM hits 10AM booking)', false,
  checkAvailability([EXISTING], '2026-08-30', '08:00 AM', '09:00 AM').available);

console.log('\n=== SHOULD REJECT (event overlap) ===');
test('Starts during event (08:00 AM–11:00 AM)', false,
  checkAvailability([EXISTING], '2026-08-30', '08:00 AM', '11:00 AM').available);
test('Ends during event (01:00 PM–03:00 PM)', false,
  checkAvailability([EXISTING], '2026-08-30', '01:00 PM', '03:00 PM').available);
test('Entirely inside event (12:00 PM–01:00 PM)', false,
  checkAvailability([EXISTING], '2026-08-30', '12:00 PM', '01:00 PM').available);
test('Event inside new (08:00 AM–04:00 PM)', false,
  checkAvailability([EXISTING], '2026-08-30', '08:00 AM', '04:00 PM').available);
test('Touches end of event exactly (02:00 PM–04:00 PM)', false,
  checkAvailability([EXISTING], '2026-08-30', '02:00 PM', '04:00 PM').available);

console.log('\n=== SHOULD REJECT (buffer overlap — the critical ones!) ===');
test('Overlaps buffer only (03:00 PM–05:00 PM)', false,
  checkAvailability([EXISTING], '2026-08-30', '03:00 PM', '05:00 PM').available);
test('Entirely inside buffer (02:30 PM–03:30 PM)', false,
  checkAvailability([EXISTING], '2026-08-30', '02:30 PM', '03:30 PM').available);
test('Buffer straddle (03:30 PM–05:00 PM)', false,
  checkAvailability([EXISTING], '2026-08-30', '03:30 PM', '05:00 PM').available);

console.log('\n=== SHOULD REJECT (new booking buffer conflict) ===');
test('New buffer hits existing (02:00 PM–04:00 PM → buffer 06:00 PM)', false,
  checkAvailability([EXISTING], '2026-08-30', '02:00 PM', '04:00 PM').available);
test('New buffer tight (01:00 PM–03:00 PM → buffer 05:00 PM)', false,
  checkAvailability([EXISTING], '2026-08-30', '01:00 PM', '03:00 PM').available);

console.log('\n=== EDGE CASES ===');
test('End before start → reject', false,
  checkAvailability([], '2026-08-30', '04:00 PM', '02:00 PM').available);
test('Equal start/end → reject', false,
  checkAvailability([], '2026-08-30', '02:00 PM', '02:00 PM').available);

console.log('\n=== MULTIPLE BOOKINGS ON SAME DAY ===');
const MORNING = { name: 'Seminar', date: '2026-08-30', start: '08:00 AM', end: '11:00 AM', status: 'Confirmed' };
const EVENING = { name: 'Gala', date: '2026-08-30', start: '06:00 PM', end: '09:00 PM', status: 'Confirmed' };
// Morning buffer ends 01:00 PM. Evening starts 06:00 PM. Gap: 01:00 PM - 06:00 PM = 5 hours
// Safe window: start >= 01:00 PM, end + buffer <= 06:00 PM → end <= 04:00 PM
// So 01:00 PM - 04:00 PM works (buffer ends 06:00 PM exactly)
test('Between two bookings (01:00–04:00 PM) fits perfectly', true,
  checkAvailability([MORNING, EVENING], '2026-08-30', '01:00 PM', '04:00 PM').available);
test('Between two bookings (01:00–03:00 PM) safe margin', true,
  checkAvailability([MORNING, EVENING], '2026-08-30', '01:00 PM', '03:00 PM').available);
test('Between two but hits evening buffer (02:00–05:00 PM)', false,
  checkAvailability([MORNING, EVENING], '2026-08-30', '02:00 PM', '05:00 PM').available);
test('Overlaps morning buffer (12:00 PM–02:00 PM)', false,
  checkAvailability([MORNING, EVENING], '2026-08-30', '12:00 PM', '02:00 PM').available);

console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
if (failed > 0) process.exit(1);
else console.log('🎉 ALL TESTS PASSED — Overlap prevention is BULLETPROOF!');
