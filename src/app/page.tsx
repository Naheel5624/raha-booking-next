'use client';

import { useState, useEffect, useCallback } from 'react';

interface Booking {
  'Booking ID': string;
  'Event Name': string;
  'Client Name': string;
  'Contact Phone': string;
  'Secondary Contact': string;
  'Client Email': string;
  'Date': string;
  'Start Time': string;
  'End Time': string;
  'Total Amount': number;
  'Amount Paid': number;
  'Balance Due': number;
  'Payment Status': string;
  'Booking Status': string;
  'Hall Type': string;
  'Booking Notes': string;
  'Created At': string;
}

interface TimeSlot {
  type: 'available' | 'booked' | 'buffer';
  start: string;
  end: string;
  startMin: number;
  endMin: number;
  event?: string;
  client?: string;
  bookingId?: string;
  hallType?: string;
  paymentStatus?: string;
  total?: number;
  paid?: number;
}

type Tab = 'dashboard' | 'new-booking' | 'today' | 'upcoming' | 'calendar';

function fmtN(n: number) { return n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); }
function esc(s: string) { return s ? s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : ''; }

function printReceipt(b: Record<string, string | number>) {
  const id = b['Booking ID'];
  const clientName = b['Client Name'];
  const phone = b['Contact Phone'];
  const secPhone = b['Secondary Contact'];
  const email = b['Client Email'];
  const event = b['Event Name'];
  const date = b['Date'];
  const start = b['Start Time'];
  const end = b['End Time'];
  const hall = b['Hall Type'] || 'Main Hall';
  const total = Number(b['Total Amount']) || 0;
  const paid = Number(b['Amount Paid']) || 0;
  const balance = Number(b['Balance Due']) || 0;
  const payStatus = b['Payment Status'];
  const bookStatus = b['Booking Status'];
  const notes = b['Booking Notes'] || '';
  const dateFormatted = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Receipt - ${id}</title>
<style>
@page { size: A4; margin: 15mm; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; background: #fff; padding: 20px; }
.receipt { max-width: 700px; margin: 0 auto; border: 2px solid #6B1D2A; border-radius: 12px; overflow: hidden; }
.header-bar { background: linear-gradient(135deg, #4A0E1A 0%, #6B1D2A 50%, #8B2E3D 100%); color: #fff; padding: 28px 30px; text-align: center; border-bottom: 3px solid #C9A84C; }
.header-bar h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
.header-bar p { font-size: 13px; color: #E0C878; font-style: italic; }
.receipt-title { text-align: center; padding: 16px; background: #F5F0E8; border-bottom: 1px solid #E8E0D8; }
.receipt-title h2 { font-size: 18px; color: #6B1D2A; }
.receipt-title .id-badge { display: inline-block; background: #6B1D2A; color: #fff; padding: 4px 16px; border-radius: 20px; font-size: 14px; font-weight: 700; letter-spacing: 1px; margin-top: 6px; }
.body { padding: 24px 30px; }
.section { margin-bottom: 20px; }
.section-title { font-size: 12px; font-weight: 700; color: #6B1D2A; text-transform: uppercase; letter-spacing: 1.5px; padding-bottom: 6px; border-bottom: 2px solid #C9A84C; margin-bottom: 10px; }
.row { display: flex; padding: 7px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
.row:last-child { border-bottom: none; }
.row .label { font-weight: 600; color: #888; width: 40%; }
.row .value { font-weight: 600; color: #333; width: 60%; }
.payment-box { background: #F5F0E8; border: 1px solid #E8E0D8; border-radius: 8px; padding: 16px; margin-top: 10px; }
.payment-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
.payment-row.total { font-size: 16px; font-weight: 700; color: #6B1D2A; border-top: 2px solid #C9A84C; padding-top: 10px; margin-top: 6px; }
.status-badge { display: inline-block; padding: 3px 14px; border-radius: 12px; font-size: 12px; font-weight: 700; color: #fff; }
.status-paid { background: #2E7D32; }
.status-partial { background: #F57F17; }
.status-unpaid { background: #B71C1C; }
.footer { background: #F5F0E8; padding: 16px 30px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #E8E0D8; }
.footer strong { color: #6B1D2A; }
.notes { background: #FFFDE7; border: 1px dashed #C9A84C; border-radius: 8px; padding: 12px; margin-top: 10px; font-size: 12px; color: #666; }
@media print { body { padding: 0; } .receipt { border: 2px solid #6B1D2A; } .no-print { display: none !important; } }
</style></head><body>
<div class="receipt">
  <div class="header-bar">
    <h1>Raha Convention Centre</h1>
    <p>Where moments become memories.</p>
  </div>
  <div class="receipt-title">
    <h2>Booking Receipt</h2>
    <div class="id-badge">${id}</div>
  </div>
  <div class="body">
    <div class="section">
      <div class="section-title">Client Details</div>
      <div class="row"><span class="label">Name</span><span class="value">${clientName}</span></div>
      <div class="row"><span class="label">Contact Phone</span><span class="value">${phone}</span></div>
      <div class="row"><span class="label">Secondary Contact</span><span class="value">${secPhone}</span></div>
      ${email ? `<div class="row"><span class="label">Email</span><span class="value">${email}</span></div>` : ''}
    </div>
    <div class="section">
      <div class="section-title">Event Details</div>
      <div class="row"><span class="label">Event Name</span><span class="value">${event}</span></div>
      <div class="row"><span class="label">Hall</span><span class="value">${hall}</span></div>
      <div class="row"><span class="label">Date</span><span class="value">${dateFormatted}</span></div>
      <div class="row"><span class="label">Time</span><span class="value">${start} – ${end}</span></div>
      <div class="row"><span class="label">Booking Status</span><span class="value">${bookStatus}</span></div>
    </div>
    <div class="section">
      <div class="section-title">Payment Summary</div>
      <div class="payment-box">
        <div class="payment-row"><span>Total Amount</span><span>₹${fmtN(total)}</span></div>
        <div class="payment-row"><span>Amount Paid</span><span>₹${fmtN(paid)}</span></div>
        <div class="payment-row total"><span>Balance Due</span><span>₹${fmtN(balance)}</span></div>
        <div style="text-align:right;margin-top:8px;"><span class="status-badge ${payStatus === 'Paid' ? 'status-paid' : payStatus === 'Partially Paid' ? 'status-partial' : 'status-unpaid'}">${payStatus}</span></div>
      </div>
    </div>
    ${notes ? `<div class="section"><div class="section-title">Notes</div><div class="notes">${notes}</div></div>` : ''}
  </div>
  <div class="footer">
    <strong>Raha Convention Centre</strong> · Where moments become memories.<br>
    This is a computer-generated receipt. No signature required.
  </div>
</div>
<div class="no-print" style="text-align:center;margin-top:20px;">
  <button onclick="window.print()" style="padding:12px 32px;background:#6B1D2A;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;">🖨️ Print Receipt</button>
  <button onclick="window.close()" style="padding:12px 24px;background:#f5f5f5;color:#333;border:1px solid #ddd;border-radius:8px;font-size:14px;cursor:pointer;margin-left:10px;">Close</button>
</div>
<script>window.onload = function() { setTimeout(function() { window.print(); }, 500); };</script>
</body></html>`;

  const w = window.open('', '_blank', 'width=800,height=600');
  if (w) {
    w.document.write(html);
    w.document.close();
  } else {
    alert('Pop-up blocked. Please allow pop-ups for this site to print receipts.');
  }
}

// Use LOCAL date (not UTC) to avoid timezone bugs
function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function Home() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Form state
  const [form, setForm] = useState({
    clientName: '', clientEmail: '', contactPhone: '', secondaryContact: '',
    eventName: '', eventDate: '', startTime: '', endTime: '', hallType: '',
    totalAmount: '', amountPaid: '', bookingNotes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [successBooking, setSuccessBooking] = useState<Booking | null>(null);

  // Calendar state
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(localDateStr());
  const [daySlots, setDaySlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Cancel/Payment modals
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelInfo, setCancelInfo] = useState({ event: '', client: '' });
  const [payModal, setPayModal] = useState<{ id: string; total: number; paid: number } | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [editModal, setEditModal] = useState<{ id: string; currentTotal: number } | null>(null);
  const [editTotal, setEditTotal] = useState('');

  const today = localDateStr();

  // Fetch all bookings
  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      if (data.success) setBookings(data.bookings || []);
    } catch (e) {
      console.error('Fetch bookings failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // Auto-refresh bookings when switching to data-heavy tabs
  useEffect(() => {
    if (tab === 'today' || tab === 'upcoming' || tab === 'dashboard') {
      fetchBookings();
    }
  }, [tab, fetchBookings]);

  // Periodic refresh every 30s so data stays live
  useEffect(() => {
    const interval = setInterval(() => {
      if (tab === 'today' || tab === 'upcoming' || tab === 'dashboard') {
        fetchBookings();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [tab, fetchBookings]);

  // Fetch availability for a date
  const fetchSlots = useCallback(async (dateStr: string) => {
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/availability?date=${dateStr}`);
      const data = await res.json();
      if (data.success) setDaySlots(data.slots || []);
      else setDaySlots([]);
    } catch { setDaySlots([]); }
    finally { setLoadingSlots(false); }
  }, []);

  useEffect(() => {
    if (tab === 'calendar') fetchSlots(selectedDate);
  }, [tab, selectedDate, fetchSlots]);

  // Computed values
  const todayBks = bookings.filter((b) => b['Date'] === today && b['Booking Status'] !== 'Cancelled');
  const upcomingBks = bookings.filter((b) => b['Booking Status'] !== 'Cancelled' && b['Date'] >= today);
  const todayRevenue = todayBks.reduce((s, b) => s + (b['Amount Paid'] || 0), 0);
  const pendingBalance = upcomingBks.reduce((s, b) => s + (b['Balance Due'] || 0), 0);

  // Form helpers
  const total = parseFloat(form.totalAmount) || 0;
  const paid = parseFloat(form.amountPaid) || 0;
  const balance = total - paid;
  let payStatus = 'Unpaid';
  if (total > 0 && balance <= 0) payStatus = 'Paid';
  else if (paid > 0) payStatus = 'Partially Paid';

  // Available time slots
  const TIME_SLOTS = [
    { label: 'Morning (10:00 AM – 2:00 PM)', start: '10:00 AM', end: '02:00 PM' },
    { label: 'Evening (6:00 PM – 10:00 PM)', start: '06:00 PM', end: '10:00 PM' },
  ];

  const handleFormChange = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const submitBooking = async () => {
    setAlertMsg(null);
    if (!form.clientName.trim()) { setAlertMsg({ type: 'error', msg: 'Client Name is required.' }); return; }
    if (!form.contactPhone.trim()) { setAlertMsg({ type: 'error', msg: 'Contact Phone is required.' }); return; }
    if (!form.secondaryContact.trim()) { setAlertMsg({ type: 'error', msg: 'Secondary Contact is required.' }); return; }
    const phoneClean = form.contactPhone.replace(/[^\d]/g, '');
    if (phoneClean.length !== 10) { setAlertMsg({ type: 'error', msg: 'Contact Phone must be exactly 10 digits (no country code).' }); return; }
    const secClean = form.secondaryContact.replace(/[^\d]/g, '');
    if (secClean.length !== 10) { setAlertMsg({ type: 'error', msg: 'Secondary Contact must be exactly 10 digits (no country code).' }); return; }
    if (!form.eventName.trim()) { setAlertMsg({ type: 'error', msg: 'Event Name is required.' }); return; }
    if (!form.hallType) { setAlertMsg({ type: 'error', msg: 'Please select a Hall Type.' }); return; }
    if (!form.eventDate) { setAlertMsg({ type: 'error', msg: 'Event Date is required.' }); return; }
    if (form.eventDate && form.eventDate < today) { setAlertMsg({ type: 'error', msg: 'Event Date cannot be in the past.' }); return; }
    if (!form.startTime) { setAlertMsg({ type: 'error', msg: 'Start Time is required.' }); return; }
    if (!form.endTime) { setAlertMsg({ type: 'error', msg: 'End Time is required.' }); return; }
    if (!form.totalAmount) { setAlertMsg({ type: 'error', msg: 'Total Amount is required.' }); return; }
    if (form.amountPaid === '') { setAlertMsg({ type: 'error', msg: 'Amount Paid is required.' }); return; }
    const tAmt = parseFloat(form.totalAmount) || 0;
    const aPaid = parseFloat(form.amountPaid) || 0;
    if (aPaid > tAmt) { setAlertMsg({ type: 'error', msg: 'Amount Paid cannot exceed Total Amount.' }); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessBooking(data.booking);
        resetForm();
        fetchBookings();
        setTab('dashboard');
      } else {
        setAlertMsg({ type: 'error', msg: data.errors?.join('<br>') || 'Failed to create booking.' });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Connection error';
      setAlertMsg({ type: 'error', msg });
    } finally {
      setSubmitting(false);
    }
  };

  const cancelBooking = async () => {
    if (!cancelId) return;
    try {
      const res = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: cancelId }),
      });
      const data = await res.json();
      if (data.success) {
        setCancelId(null);
        fetchBookings();
        alert('✅ ' + data.message);
      } else {
        alert('❌ ' + (data.errors?.join('\n') || 'Failed'));
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error';
      alert('❌ ' + msg);
    }
  };

  const updatePayment = async () => {
    if (!payModal) return;
    const additional = parseFloat(payAmount);
    if (isNaN(additional) || additional < 0) { alert('Enter a valid amount.'); return; }
    const totalPaid = payModal.paid + additional;
    if (totalPaid > payModal.total) { alert('Payment cannot exceed the remaining balance.'); return; }
    try {
      const res = await fetch('/api/bookings/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: payModal.id, amountPaid: totalPaid }),
      });
      const data = await res.json();
      if (data.success) {
        setPayModal(null);
        fetchBookings();
        alert('✅ ' + data.message);
      } else {
        alert('❌ ' + (data.errors?.join('\n') || 'Failed'));
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error';
      alert('❌ ' + msg);
    }
  };

  const updateTotalAmount = async () => {
    if (!editModal) return;
    const newTotal = parseFloat(editTotal);
    if (isNaN(newTotal) || newTotal < 0) { alert('Enter a valid amount.'); return; }
    try {
      const res = await fetch('/api/bookings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: editModal.id, totalAmount: newTotal }),
      });
      const data = await res.json();
      if (data.success) {
        setEditModal(null);
        fetchBookings();
        alert('✅ ' + data.message);
      } else {
        alert('❌ ' + (data.errors?.join('\n') || 'Failed'));
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error';
      alert('❌ ' + msg);
    }
  };

  const goToNewBooking = (date: string, start: string, end: string) => {
    // Find matching slot or default
    const match = TIME_SLOTS.find((ts) => ts.start === start && ts.end === end);
    setForm((f) => ({ ...f, eventDate: date, startTime: match ? match.start : start, endTime: match ? match.end : end }));
    setTab('new-booking');
    setSuccessBooking(null);
  };

  const resetForm = () => {
    setForm({ clientName: '', clientEmail: '', contactPhone: '', secondaryContact: '', eventName: '', eventDate: today, startTime: '', endTime: '', hallType: '', totalAmount: '', amountPaid: '', bookingNotes: '' });
    setAlertMsg(null);
  };

  const renderBookingsTable = (bks: Booking[], showActions = true) => {
    if (!bks.length) return <div className="empty-state"><div className="icon">📭</div><h3>No bookings found</h3></div>;
    return (
      <div className="table-wrapper">
        <table className="booking-table">
          <thead><tr>
            <th>ID</th><th>Date</th><th>Event</th><th>Hall</th><th>Client</th><th>Time</th>
            <th>Total</th><th>Paid</th><th>Balance</th><th>Payment</th><th>Status</th>
            {showActions && <th></th>}
          </tr></thead>
          <tbody>
            {bks.map((b) => {
              const pc = b['Payment Status'] === 'Paid' ? 'badge-paid' : b['Payment Status'] === 'Partially Paid' ? 'badge-partial' : 'badge-unpaid';
              const sc = b['Booking Status'] === 'Cancelled' ? 'badge-cancelled' : b['Booking Status'] === 'Pending' ? 'badge-pending' : 'badge-confirmed';
              return (
                <tr key={b['Booking ID']}>
                  <td><strong>{b['Booking ID']}</strong></td>
                  <td>{b['Date']}</td>
                  <td>{esc(b['Event Name'])}</td>
                  <td><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: b['Hall Type'] === 'Mini Hall' ? '#f3e8ff' : '#dbeafe', color: b['Hall Type'] === 'Mini Hall' ? '#7c3aed' : '#2563eb', fontWeight: 700, whiteSpace: 'nowrap' }}>{b['Hall Type'] || 'Main Hall'}</span></td>
                  <td>{esc(b['Client Name'])}</td>
                  <td>{b['Start Time']} – {b['End Time']}</td>
                  <td>₹{fmtN(b['Total Amount'])}</td>
                  <td>₹{fmtN(b['Amount Paid'])}</td>
                  <td>₹{fmtN(b['Balance Due'])}</td>
                  <td><span className={`badge-status ${pc}`}>{b['Payment Status']}</span></td>
                  <td><span className={`badge-status ${sc}`}>{b['Booking Status']}</span></td>
                  {showActions && (
                    <td>
                      {b['Booking Status'] !== 'Cancelled' && (
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          <button className="btn btn-outline btn-sm" onClick={() => printReceipt(b as unknown as Record<string, string | number>)} title="Print Receipt">🖨️</button>
                          <button className="btn btn-outline btn-sm" onClick={() => { setEditModal({ id: b['Booking ID'], currentTotal: b['Total Amount'] }); setEditTotal(String(b['Total Amount'])); }} title="Edit Total">✏️</button>
                          <button className="btn btn-outline btn-sm" onClick={() => { setPayModal({ id: b['Booking ID'], total: b['Total Amount'], paid: b['Amount Paid'] }); setPayAmount(''); }}>💳</button>{' '}
                          <button className="btn btn-danger btn-sm" onClick={() => { setCancelId(b['Booking ID']); setCancelInfo({ event: b['Event Name'], client: b['Client Name'] }); }}>✕</button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Calendar rendering
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const prevDays = new Date(calYear, calMonth, 0).getDate();

  const calCells: React.ReactNode[] = [];
  // Day headers
  for (let i = 0; i < 7; i++) {
    calCells.push(<div key={`h${i}`} className="cal-header" style={{ background: 'var(--primary)', color: '#fff', padding: '10px', textAlign: 'center', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{days[i]}</div>);
  }
  // Prev month
  for (let i = firstDay - 1; i >= 0; i--) {
    calCells.push(<div key={`p${i}`} className="cal-day other-month"><div className="cal-day-num">{prevDays - i}</div></div>);
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = ds === today;
    const isSel = ds === selectedDate;
    const isPast = ds < today;
    const dayBks = bookings.filter((b) => b['Date'] === ds && b['Booking Status'] !== 'Cancelled');
    calCells.push(
      <div key={ds} className={`cal-day${isToday ? ' today' : ''}${isSel ? ' selected' : ''}${isPast ? ' past' : ''}`} style={isPast ? { opacity: 0.4, cursor: 'default' } : undefined} onClick={() => { if (!isPast) setSelectedDate(ds); }}>
        <div className="cal-day-num">{d}</div>
        {dayBks.length > 0 && (
          <>
            <div className="cal-day-count">{dayBks.length} booking{dayBks.length > 1 ? 's' : ''}</div>
            <div className="cal-day-dots">
              {dayBks.map((b) => {
                const dotClass = b['Booking Status'] === 'Pending' ? 'pending' : b['Payment Status'] === 'Paid' ? 'paid' : b['Payment Status'] === 'Partially Paid' ? 'partial' : 'booked';
                return (
                  <span key={b['Booking ID']} className={`cal-dot ${dotClass}`} title={`${b['Event Name']} (${b['Booking Status']})`} />
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }
  // Next month
  const remaining = (7 - ((firstDay + daysInMonth) % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    calCells.push(<div key={`n${i}`} className="cal-day other-month"><div className="cal-day-num">{i}</div></div>);
  }

  return (
    <>
      {/* HEADER */}
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <div className="brand-icon">🏛️</div>
            <div className="brand-text">
              <h1>Raha Convention Centre</h1>
              <p>Where moments become memories.</p>
            </div>
          </div>
          <div className="header-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
      </header>

      {/* NAV */}
      <nav className="nav">
        <div className="nav-inner">
          {([
            ['dashboard', '📊', 'Dashboard'],
            ['new-booking', '➕', 'New Booking'],
            ['today', '📋', 'Today', todayBks.length],
            ['upcoming', '📅', 'Upcoming', upcomingBks.length],
            ['calendar', '📆', 'Calendar'],
          ] as [Tab, string, string, number?][]).map(([key, icon, label, count]) => (
            <div key={key} className={`nav-tab${tab === key ? ' active' : ''}`} onClick={() => { setTab(key); setSuccessBooking(null); }}>
              <span>{icon}</span> {label}
              {count !== undefined && count > 0 && <span className="badge">{count}</span>}
            </div>
          ))}
        </div>
      </nav>

      {/* MAIN */}
      <main className="main">

        {/* DASHBOARD */}
        {tab === 'dashboard' && (
          <>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-icon blue">📋</div><div className="stat-info"><h3>{todayBks.length}</h3><p>Today&apos;s Bookings</p></div></div>
              <div className="stat-card"><div className="stat-icon gold">💰</div><div className="stat-info"><h3>₹{fmtN(todayRevenue)}</h3><p>Today&apos;s Revenue</p></div></div>
              <div className="stat-card"><div className="stat-icon green">📅</div><div className="stat-info"><h3>{upcomingBks.length}</h3><p>Upcoming Bookings</p></div></div>
              <div className="stat-card"><div className="stat-icon red">⏳</div><div className="stat-info"><h3>₹{fmtN(pendingBalance)}</h3><p>Pending Balance</p></div></div>
            </div>

            <div className="dash-grid">
              {/* Mini Calendar */}
              <div className="card">
                <div className="card-header"><h2>📆 Quick View</h2></div>
                <div className="card-body">
                  <div className="cal-nav" style={{ marginBottom: 12 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => { setCalMonth((m) => { if (m === 0) { setCalYear((y) => y - 1); return 11; } return m - 1; }); }}>◀</button>
                    <h3 style={{ fontSize: 16 }}>{months[calMonth]} {calYear}</h3>
                    <button className="btn btn-outline btn-sm" onClick={() => { setCalMonth((m) => { if (m === 11) { setCalYear((y) => y + 1); return 0; } return m + 1; }); }}>▶</button>
                  </div>
                  <div className="cal-grid" style={{ marginBottom: 0 }}>{calCells}</div>
                </div>
              </div>

              {/* Today's Slot Bubbles */}
              <div className="card">
                <div className="card-header"><h2>🏛️ Hall Status — Today</h2><button className="btn btn-outline btn-sm" onClick={() => setTab('calendar')}>Full Calendar →</button></div>
                <div className="card-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {TIME_SLOTS.map((ts) => {
                      const normTime = (t: string) => t.replace(/^(d):/, '0$1:');
                      const booking = todayBks.find((b) => normTime(b['Start Time']) === ts.start && normTime(b['End Time']) === ts.end);
                      const isBooked = !!booking;
                      return (
                        <div key={ts.start} className={`cal-slot ${isBooked ? 'booked' : 'available'}`} style={{ maxWidth: '100%' }}
                          onClick={() => !isBooked && goToNewBooking(today, ts.start, ts.end)}>
                          <div className="cal-slot-period">{ts.label.split('(')[0].trim()}</div>
                          <div className="cal-slot-time" style={{ fontSize: 18 }}>{ts.start} – {ts.end}</div>
                          {isBooked ? (
                            <>
                              <div className="cal-slot-status">🔴 BOOKED</div>
                              <div className="cal-slot-details">
                                <strong>{esc(booking['Event Name'])}</strong> — {esc(booking['Client Name'])}
                                <br />{booking['Hall Type'] || 'Main Hall'} · {booking['Booking ID']} · ₹{fmtN(booking['Total Amount'])}
                                {booking['Payment Status'] && (
                                  <span style={{ display: 'inline-block', fontSize: 10, padding: '1px 8px', borderRadius: 8, background: booking['Payment Status'] === 'Paid' ? '#22c55e' : booking['Payment Status'] === 'Partially Paid' ? '#f59e0b' : '#ef4444', color: '#fff', fontWeight: 700, marginLeft: 6 }}>{booking['Payment Status']}</span>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="cal-slot-status">✅ AVAILABLE</div>
                              <div className="cal-slot-details">Click to book →</div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Bookings (compact) */}
            <div className="card">
              <div className="card-header"><h2>📋 Today&apos;s Schedule</h2><button className="btn btn-outline btn-sm" onClick={() => setTab('today')}>View All →</button></div>
              <div className="card-body">
                {loading ? <div className="empty-state"><div className="icon">⏳</div><h3>Loading...</h3></div>
                  : todayBks.length === 0 ? <div className="empty-state"><div className="icon">🎉</div><h3>No bookings today</h3><p>The hall is available all day.</p></div>
                  : todayBks.sort((a, b) => a['Start Time'].localeCompare(b['Start Time'])).map((b) => (
                    <div key={b['Booking ID']} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 12, background: 'var(--beige)', marginBottom: 10, border: '1px solid var(--border-light)' }}>
                      <div style={{ minWidth: 56, textAlign: 'center' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{b['Start Time']}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>to</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>{b['End Time']}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{esc(b['Event Name'])}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{esc(b['Client Name'])} · {b['Hall Type'] || 'Main Hall'} · {b['Booking ID']}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>₹{fmtN(b['Total Amount'])}</div>
                        <span className={`badge-status ${b['Payment Status'] === 'Paid' ? 'badge-paid' : b['Payment Status'] === 'Partially Paid' ? 'badge-partial' : 'badge-unpaid'}`}>{b['Payment Status']}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}

        {/* NEW BOOKING */}
        {tab === 'new-booking' && !successBooking && (
          <div className="card">
            <div className="card-header"><h2>➕ Create New Booking</h2></div>
            <div className="card-body">
              {alertMsg && <div className={`alert alert-${alertMsg.type} show`} dangerouslySetInnerHTML={{ __html: alertMsg.msg }} />}
              <div className="form-grid">
                <div className="form-section-title">👤 Client Information</div>
                <div className="form-group"><label>Client Name <span className="req">*</span></label><input value={form.clientName} onChange={(e) => handleFormChange('clientName', e.target.value)} placeholder="e.g. Ahmed Ali" /></div>
                <div className="form-group"><label>Contact Phone <span className="req">*</span></label><input value={form.contactPhone} onChange={(e) => handleFormChange('contactPhone', e.target.value)} placeholder="10-digit number" maxLength={10} pattern="\d{10}" inputMode="numeric" /></div>
                <div className="form-group"><label>Secondary Contact <span className="req">*</span></label><input value={form.secondaryContact} onChange={(e) => handleFormChange('secondaryContact', e.target.value)} placeholder="10-digit number" maxLength={10} pattern="\d{10}" inputMode="numeric" /></div>
                <div className="form-group"><label>Client Email</label><input type="email" value={form.clientEmail} onChange={(e) => handleFormChange('clientEmail', e.target.value)} placeholder="e.g. client@example.com" /></div>

                <div className="form-section-title">🎉 Event Information</div>
                <div className="form-group"><label>Event Name <span className="req">*</span></label><input value={form.eventName} onChange={(e) => handleFormChange('eventName', e.target.value)} placeholder="e.g. Marriage Reception" /></div>
                <div className="form-group"><label>Event Date <span className="req">*</span></label><input type="date" min={today} value={form.eventDate} onChange={(e) => handleFormChange('eventDate', e.target.value)} /></div>

                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label>Hall Type &amp; Time Slot <span className="req">*</span></label>
                  <div className="slot-bubbles" style={{ marginTop: 6 }}>
                    {["Main Hall", "Mini Hall"].map((ht) => { const isHt = form.hallType === ht; return (<div key={ht} className={`slot-bubble tiny${isHt ? " selected" : ""}`} onClick={() => setForm((f) => ({ ...f, hallType: ht }))}><div className="slot-bubble-label">{ht === "Main Hall" ? "🏛️" : "🏠"} {ht}</div><div className="slot-bubble-check">✓</div></div>); })}
                    <div style={{ width: 2, height: 36, background: "var(--border)", margin: "0 4px", flexShrink: 0 }}></div>
                    {TIME_SLOTS.map((ts) => { const isTs = form.startTime === ts.start && form.endTime === ts.end; return (<div key={ts.start} className={`slot-bubble tiny${isTs ? " selected" : ""}`} onClick={() => setForm((f) => ({ ...f, startTime: ts.start, endTime: ts.end }))}><div className="slot-bubble-label">{ts.label.split("(")[0].trim()}</div><div className="slot-bubble-time">{ts.start} – {ts.end}</div><div className="slot-bubble-check">✓</div></div>); })}
                  </div>
                </div>

                <div className="form-section-title">💳 Payment Information</div>
                <div className="form-group"><label>Total Amount (₹) <span className="req">*</span></label><input type="number" min="0" step="0.01" value={form.totalAmount} onChange={(e) => handleFormChange('totalAmount', e.target.value)} placeholder="0.00" /></div>
                <div className="form-group"><label>Amount Paid (₹) <span className="req">*</span></label><input type="number" min="0" step="0.01" max={form.totalAmount || undefined} value={form.amountPaid} onChange={(e) => { const val = e.target.value; const t = parseFloat(form.totalAmount) || 0; const v = parseFloat(val); if (t > 0 && v > t) { handleFormChange('amountPaid', String(t)); } else { handleFormChange('amountPaid', val); } }} placeholder="0.00" /></div>
                <div className="form-group"><label>Balance Due (₹)</label><div className="computed-field">₹{fmtN(balance)}</div></div>
                <div className="form-group"><label>Payment Status</label><div className="computed-field">{payStatus}</div></div>

                <div className="form-section-title">📝 Additional Notes</div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}><textarea value={form.bookingNotes} onChange={(e) => handleFormChange('bookingNotes', e.target.value)} placeholder="Any special requirements..." /></div>
              </div>
              <div className="btn-group">
                <button className="btn btn-gold" disabled={submitting} onClick={submitBooking}>
                  {submitting ? <><span className="spinner" /> Creating...</> : '✓ Create Booking'}
                </button>
                <button className="btn btn-outline" onClick={resetForm}>↺ Reset</button>
              </div>
            </div>
          </div>
        )}

        {/* BOOKING SUCCESS */}
        {tab === 'new-booking' && successBooking && (
          <div className="card">
            <div className="card-body">
              <div className="success-view">
                <div className="check-icon">✓</div>
                <h2>Booking Confirmed!</h2>
                <p>Your booking has been saved. A confirmation email has been sent.</p>
                <div className="booking-id-display">{successBooking['Booking ID']}</div>
                <div className="booking-summary">
                  {[
                    ['Client', successBooking['Client Name']], ['Phone', successBooking['Contact Phone']], ['Secondary', successBooking['Secondary Contact']], ['Event', successBooking['Event Name']],
                    ['Date', successBooking['Date']], ['Hall', successBooking['Hall Type'] || 'Main Hall'], ['Time', `${successBooking['Start Time']} – ${successBooking['End Time']}`],
                    ['Total', `₹${fmtN(successBooking['Total Amount'])}`], ['Paid', `₹${fmtN(successBooking['Amount Paid'])}`],
                    ['Balance', `₹${fmtN(successBooking['Balance Due'])}`], ['Payment', successBooking['Payment Status']],
                  ].map(([l, v]) => (
                    <div key={l} className="row"><span className="label">{l}</span><span className="value">{v}</span></div>
                  ))}
                </div>
                <div className="btn-group" style={{ justifyContent: 'center' }}>
                  <button className="btn btn-gold" onClick={() => printReceipt(successBooking as unknown as Record<string, string | number>)}>🖨️ Print Receipt</button>
                  <button className="btn btn-primary" onClick={() => { setSuccessBooking(null); resetForm(); setTab('new-booking'); }}>➕ New Booking</button>
                  <button className="btn btn-outline" onClick={() => { setSuccessBooking(null); resetForm(); setTab('dashboard'); }}>📊 Back to Dashboard</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TODAY */}
        {tab === 'today' && (
          <div className="card">
            <div className="card-header"><h2>📋 Today&apos;s Bookings</h2><button className="btn btn-outline btn-sm" onClick={fetchBookings}>↻ Refresh</button></div>
            <div className="card-body">{loading ? <div className="empty-state"><div className="icon">⏳</div><h3>Loading...</h3></div> : renderBookingsTable(todayBks)}</div>
          </div>
        )}

        {/* UPCOMING */}
        {tab === 'upcoming' && (
          <div className="card">
            <div className="card-header"><h2>📅 Upcoming Bookings</h2><button className="btn btn-outline btn-sm" onClick={fetchBookings}>↻ Refresh</button></div>
            <div className="card-body">{loading ? <div className="empty-state"><div className="icon">⏳</div><h3>Loading...</h3></div> : renderBookingsTable(upcomingBks)}</div>
          </div>
        )}

        {/* CALENDAR */}
        {tab === 'calendar' && (
          <div className="card">
            <div className="card-header"><h2>📆 Hall Calendar</h2></div>
            <div className="card-body">
              <div className="cal-nav">
                <button className="btn btn-outline btn-sm" onClick={() => { setCalMonth((m) => { if (m === 0) { setCalYear((y) => y - 1); return 11; } return m - 1; }); }}>◀ Prev</button>
                <h3>{months[calMonth]} {calYear}</h3>
                <button className="btn btn-outline btn-sm" onClick={() => { setCalMonth((m) => { if (m === 11) { setCalYear((y) => y + 1); return 0; } return m + 1; }); }}>Next ▶</button>
              </div>
              <div className="cal-grid">{calCells}</div>

              {/* Slot Bubbles */}
              {loadingSlots ? (
                <div className="empty-state"><div className="icon">⏳</div><h3>Loading...</h3></div>
              ) : !selectedDate ? (
                <div className="empty-state"><div className="icon">📅</div><h3>Select a date</h3><p>Click any day on the calendar to see available slots.</p></div>
              ) : selectedDate < today ? (
                <div className="empty-state"><div className="icon">🔒</div><h3>This date has passed</h3><p>Past dates cannot be booked. Select today or a future date.</p></div>
              ) : (
                <div className="slot-bubbles-row">
                  {TIME_SLOTS.map((ts) => {
                    const normTime2 = (t: string) => t.replace(/^(d):/, '0$1:');
                    const booking = daySlots.find((s) => s.type === 'booked' && normTime2(s.start) === ts.start && normTime2(s.end) === ts.end);
                    const isBooked = !!booking;
                    return (
                      <div key={ts.start}
                        className={`cal-slot ${isBooked ? 'booked' : 'available'}`}
                        onClick={() => !isBooked && goToNewBooking(selectedDate, ts.start, ts.end)}>
                        <div className="cal-slot-period">{ts.label.split('(')[0].trim()}</div>
                        <div className="cal-slot-time">{ts.start} – {ts.end}</div>
                        {isBooked ? (
                          <>
                            <div className="cal-slot-status">🔴 BOOKED</div>
                            <div className="cal-slot-details">
                              <strong>{esc(booking!.event || '')}</strong>
                              <br />{esc(booking!.client || '')}
                              <br />{booking!.hallType || "Main Hall"} · {booking!.bookingId} · ₹{fmtN(booking!.total || 0)}
                              {booking!.paymentStatus && (
                                <span style={{ display: 'inline-block', fontSize: 10, padding: '1px 8px', borderRadius: 8, background: booking!.paymentStatus === 'Paid' ? '#22c55e' : booking!.paymentStatus === 'Partially Paid' ? '#f59e0b' : '#ef4444', color: '#fff', fontWeight: 700, marginLeft: 6 }}>{booking!.paymentStatus}</span>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="cal-slot-status">✅ AVAILABLE</div>
                            <div className="cal-slot-details">Click to book this slot →</div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* CANCEL MODAL */}
      <div className={`modal-overlay${cancelId ? ' show' : ''}`} onClick={() => setCancelId(null)}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header"><h3>⚠️ Confirm Cancellation</h3><button className="modal-close" onClick={() => setCancelId(null)}>✕</button></div>
          <div className="modal-body">
            <p style={{ marginBottom: 16, fontSize: 14 }}>Are you sure you want to cancel this booking?</p>
            <div style={{ background: 'var(--bg)', padding: 14, borderRadius: 8, fontSize: 13, marginBottom: 20, border: '1px solid var(--border-light)' }}>
              <strong>ID:</strong> {cancelId}<br /><strong>Event:</strong> {esc(cancelInfo.event)}<br /><strong>Client:</strong> {esc(cancelInfo.client)}
            </div>
            <div className="btn-group" style={{ marginTop: 0 }}>
              <button className="btn btn-danger" onClick={cancelBooking}>Yes, Cancel</button>
              <button className="btn btn-outline" onClick={() => setCancelId(null)}>Go Back</button>
            </div>
          </div>
        </div>
      </div>

      {/* PAYMENT MODAL */}
      <div className={`modal-overlay${payModal ? ' show' : ''}`} onClick={() => setPayModal(null)}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header"><h3>💳 Update Payment</h3><button className="modal-close" onClick={() => setPayModal(null)}>✕</button></div>
          <div className="modal-body">
            {payModal && (
              <>
                <div style={{ background: 'var(--bg)', padding: 14, borderRadius: 8, fontSize: 13, marginBottom: 16, border: '1px solid var(--border-light)' }}>
                  <strong>ID:</strong> {payModal.id}<br /><strong>Total:</strong> ₹{fmtN(payModal.total)}<br /><strong>Already Paid:</strong> ₹{fmtN(payModal.paid)}<br /><strong>Remaining:</strong> ₹{fmtN(payModal.total - payModal.paid)}
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label>Additional Payment (₹)</label>
                  <input type="number" min="0" max={payModal.total - payModal.paid} step="0.01" value={payAmount} onChange={(e) => { const v = parseFloat(e.target.value); const rem = payModal.total - payModal.paid; if (v > rem) { setPayAmount(String(rem)); } else { setPayAmount(e.target.value); } }} placeholder="Enter amount to pay" />
                </div>
                <div className="form-group">
                  <label>New Balance After Payment</label>
                  <div className="computed-field">₹{fmtN(payModal.total - payModal.paid - (parseFloat(payAmount) || 0))}</div>
                </div>
                <div className="btn-group" style={{ marginTop: 16 }}>
                  <button className="btn btn-success" onClick={updatePayment}>💾 Save Payment</button>
                  <button className="btn btn-outline" onClick={() => setPayModal(null)}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* EDIT TOTAL MODAL */}
      <div className={`modal-overlay${editModal ? ' show' : ''}`} onClick={() => setEditModal(null)}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header"><h3>✏️ Edit Total Amount</h3><button className="modal-close" onClick={() => setEditModal(null)}>✕</button></div>
          <div className="modal-body">
            {editModal && (
              <>
                <div style={{ background: 'var(--bg)', padding: 14, borderRadius: 8, fontSize: 13, marginBottom: 16, border: '1px solid var(--border-light)' }}>
                  <strong>ID:</strong> {editModal.id}<br /><strong>Current Total:</strong> ₹{fmtN(editModal.currentTotal)}
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label>New Total Amount (₹)</label>
                  <input type="number" min="0" step="0.01" value={editTotal} onChange={(e) => setEditTotal(e.target.value)} />
                </div>
                <div className="btn-group" style={{ marginTop: 16 }}>
                  <button className="btn btn-success" onClick={updateTotalAmount}>💾 Save</button>
                  <button className="btn btn-outline" onClick={() => setEditModal(null)}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* LOADING */}
      <div className={`loading-overlay${submitting ? ' show' : ''}`}>
        <div className="spinner" />
        <p>Processing...</p>
      </div>
    </>
  );
}
