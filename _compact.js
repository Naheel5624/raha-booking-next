var fs = require('fs');
var c = fs.readFileSync('src/app/page.tsx', 'utf8');

// Targeted CSS/HTML replacements inside the receipt template
var replacements = [
  // Page margins
  ["@page { size: A4; margin: 15mm; }", "@page { size: A4; margin: 10mm 12mm; }"],
  // Body
  ["body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; background: #fff; padding: 20px; }", "body { font-family: 'Segoe UI', Tahoma, sans-serif; color: #333; background: #fff; font-size: 11px; }"],
  // Receipt container
  ["border-radius: 12px;", "border-radius: 6px;"],
  // Header
  ["padding: 28px 30px;", "padding: 14px 20px;"],
  ["font-size: 24px;", "font-size: 17px;"],
  ["margin-bottom: 4px;", "margin-bottom: 2px;"],
  ["font-size: 13px; color: #E0C878;", "font-size: 10px; color: #E0C878;"],
  // Title
  ["padding: 16px; background: #F5F0E8;", "padding: 8px 12px; background: #F5F0E8;"],
  ["font-size: 18px;", "font-size: 13px;"],
  ["padding: 4px 16px; border-radius: 20px; font-size: 14px;", "padding: 2px 12px; border-radius: 12px; font-size: 11px;"],
  ["margin-top: 6px;", "margin-top: 3px;"],
  // Body section
  ["padding: 24px 30px;", "padding: 10px 14px;"],
  ["margin-bottom: 20px;", "margin-bottom: 8px;"],
  // Section title
  ["font-size: 12px; font-weight: 700; color: #6B1D2A; text-transform: uppercase; letter-spacing: 1.5px; padding-bottom: 6px; border-bottom: 2px solid #C9A84C; margin-bottom: 10px;", "font-size: 9px; font-weight: 700; color: #6B1D2A; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 3px; border-bottom: 1.5px solid #C9A84C; margin-bottom: 4px;"],
  // Rows
  ["padding: 7px 0;", "padding: 3px 0;"],
  ["font-size: 13px;", "font-size: 10px;"],
  ["width: 40%;", "width: 38%;"],
  ["width: 60%;", "width: 62%;"],
  // Payment boxes
  ["padding: 14px 0;border-bottom:1px solid #E8E0D8;display:flex;justify-content:space-between;align-items:center;", "padding: 6px 0;border-bottom:1px solid #E8E0D8;display:flex;justify-content:space-between;align-items:center;"],
  ["padding:10px 0 10px 16px;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;font-size:13px;", "padding:4px 0 4px 8px;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;font-size:10px;"],
  // Payment amounts
  ["font-size:15px;font-weight:700;color:#333;\">", "font-size:11px;font-weight:700;color:#333;\">"],
  // Balance Due
  ["font-size:15px;font-weight:700;color:#6B1D2A;", "font-size:11px;font-weight:700;color:#6B1D2A;"],
  ["font-size:16px;font-weight:700;", "font-size:12px;font-weight:700;"],
  // Amount Paid
  ["font-size:13px;font-weight:600;color:#888;\">Amount Paid", "font-size:10px;font-weight:600;color:#888;\">Amount Paid"],
  ["font-size:14px;font-weight:700;color:#2E7D32;", "font-size:11px;font-weight:700;color:#2E7D32;"],
  // Status badge
  ["padding: 3px 14px;", "padding: 2px 10px;"],
  ["font-size: 12px;font-weight: 700;color: #fff;", "font-size: 9px;font-weight: 700;color: #fff;"],
  // Footer
  ["padding: 16px 30px;", "padding: 8px 14px;"],
  ["font-size: 11px; color: #999;", "font-size: 9px; color: #999;"],
  // Notes
  ["padding: 12px; margin-top: 10px; font-size: 12px;", "padding: 6px 8px; margin-top: 4px; font-size: 10px;"],
  // Contact Phone label -> Phone
  [">Contact Phone<", ">Phone<"],
  // Secondary Contact label -> Secondary
  [">Secondary Contact<", ">Secondary<"],
  // Event Name label -> Event
  [">Event Name<", ">Event<"],
  // Booking Status label -> Status
  [">Booking Status<", ">Status<"],
  // Print button
  ["padding:12px 32px;background:#6B1D2A;color:#fff;border:none;border-radius:8px;font-size:15px;", "padding:10px 24px;background:#6B1D2A;color:#fff;border:none;border-radius:6px;font-size:13px;"],
  ["padding:12px 24px;background:#f5f5f5;color:#333;border:1px solid #ddd;border-radius:8px;font-size:14px;cursor:pointer;margin-left:10px;", "padding:10px 16px;background:#f5f5f5;color:#333;border:1px solid #ddd;border-radius:6px;font-size:12px;cursor:pointer;margin-left:8px;"],
  // Footer text - remove <br> and second line
  ["<strong>Raha Convention Centre</strong> \u00B7 Where moments become memories.<br>\n    This is a computer-generated receipt. No signature required.", "<strong>Raha Convention Centre</strong> \u00B7 Where moments become memories. \u00B7 Computer-generated receipt."],
  // margin-top:20px for no-print
  ["margin-top:20px;", "margin-top:12px;"],
  // print margin in body
  ["body { padding: 0; } .receipt { border: 2px solid #6B1D2A; }", "body { padding: 0; } .receipt { border: 2px solid #6B1D2A; max-width: 100%; }"],
  // border-bottom:3px -> 2px
  ["border-bottom: 3px solid #C9A84C;", "border-bottom: 2px solid #C9A84C;"],
  // border-radius:8px for notes
  ["border-radius: 8px; padding: 12px;", "border-radius: 4px; padding: 6px 8px;"],
  // border-radius:6px for balance box
  ["border-radius:6px;padding:10px 8px;", "border-radius:4px;padding:6px 8px;"],
  // payment status
  ["font-size:12px;color:#888;\">Payment Status", "font-size:9px;color:#888;\">Payment Status"],
  // Reduce print button section margin
  ["margin-top:20px;\\\">\n  <button onclick", "margin-top:12px;\\\">\n  <button onclick"]
];

var changed = 0;
for (var i = 0; i < replacements.length; i++) {
  var old = replacements[i][0];
  var rep = replacements[i][1];
  if (c.indexOf(old) !== -1) {
    c = c.replace(old, rep);
    changed++;
  } else {
    console.log('NOT FOUND:', old.substring(0, 50));
  }
}

fs.writeFileSync('src/app/page.tsx', c, 'utf8');
console.log('Applied', changed, 'of', replacements.length, 'replacements');
