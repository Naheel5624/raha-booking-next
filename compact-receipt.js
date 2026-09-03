function printReceipt(b: Record<string, string | number>, extraPayDate?: string, extraPayMethod?: string, paymentHistory?: { date: string; method: string; amount: number }[]) {
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
  const dateFormatted = fmtDate(date as string);
  const payDate = extraPayDate || (b['Payment Date'] ? fmtDate(b['Payment Date'] as string) : '');
  const payMethod = extraPayMethod || (b['Payment Method'] as string) || '';

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
      <div class="section-title">Payment Details</div>
      <div style="padding:14px 0;border-bottom:1px solid #E8E0D8;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:15px;font-weight:700;color:#333;">Total Amount</span>
        <span style="font-size:15px;font-weight:700;color:#333;">₹${fmtN(total)}</span>
      </div>
      ${(paymentHistory && paymentHistory.length > 0) ? paymentHistory.map((p, i) => `<div style="padding:10px 0 10px 16px;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;font-size:13px;">
        <span style="color:#555;">${i + 1}. Paid</span>
        <span style="font-weight:600;color:#333;">₹${fmtN(p.amount)}</span>
        <span style="color:#888;width:120px;text-align:center;">${p.date}</span>
        <span style="color:#6B1D2A;font-weight:600;width:80px;text-align:right;">${p.method}</span>
      </div>`).join('') : (`<div style="padding:10px 0 10px 16px;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;font-size:13px;">
        <span style="color:#555;">1. Paid</span>
        <span style="font-weight:600;color:#333;">₹${fmtN(paid)}</span>
        ${payDate ? `<span style="color:#888;width:120px;text-align:center;">${payDate}</span>` : '<span style="width:120px;"></span>'}
        ${payMethod ? `<span style="color:#6B1D2A;font-weight:600;width:80px;text-align:right;">${payMethod}</span>` : '<span style="width:80px;"></span>'}
      </div>`)}
      <div style="padding:14px 0;border-bottom:1px solid #E8E0D8;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:13px;font-weight:600;color:#888;">Amount Paid</span>
        <span style="font-size:14px;font-weight:700;color:#2E7D32;">₹${fmtN(paid)}</span>
      </div>
      <div style="padding:14px 0;border-bottom:1px solid #E8E0D8;display:flex;justify-content:space-between;align-items:center;background:#FFF8E1;border-radius:6px;padding:10px 8px;margin-top:4px;">
        <span style="font-size:15px;font-weight:700;color:#6B1D2A;">Balance Due</span>
        <span style="font-size:16px;font-weight:700;color:${balance > 0 ? '#B71C1C' : '#2E7D32'};">₹${fmtN(balance)}</span>
      </div>
      <div style="padding:8px 0;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:12px;color:#888;">Payment Status</span>
        <span class="status-badge ${payStatus === 'Paid' ? 'status-paid' : payStatus === 'Partially Paid' ? 'status-partial' : 'status-unpaid'}">${payStatus}</span>
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
