const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const FROM = `"RentToolLend" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`;
const APP_URL = process.env.CLIENT_URL || 'http://localhost:3000';

const send = async (to, subject, html) => {
  const transporter = createTransporter();
  if (!transporter) return; // Email not configured — skip silently
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
  } catch (err) {
    console.error('Email send error:', err.message);
  }
};

const wrap = (content) => `
  <div style="font-family:Inter,system-ui,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
    <div style="background:#ea580c;padding:24px 32px;">
      <h1 style="color:#fff;margin:0;font-size:22px;">🔧 RentToolLend</h1>
    </div>
    <div style="padding:32px;">
      ${content}
    </div>
    <div style="background:#f9fafb;padding:16px 32px;text-align:center;color:#9ca3af;font-size:12px;border-top:1px solid #f3f4f6;">
      RentToolLend · Community tool sharing ·
      <a href="${APP_URL}" style="color:#ea580c;">Visit site</a>
    </div>
  </div>
`;

const btn = (text, url) =>
  `<a href="${url}" style="display:inline-block;background:#ea580c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">${text}</a>`;

const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' });
const fmtMoney = (n) => `$${Number(n).toFixed(2)}`;

// ─── Email templates ───────────────────────────────────────────────────────

// 1. Lender: new booking request
const sendNewBookingRequest = async (booking) => {
  const { lender, renter, tool, startDate, endDate, totalDays, totalCharged, lenderPayout, renterMessage } = booking;
  await send(
    lender.email,
    `New booking request for "${tool.title}"`,
    wrap(`
      <h2 style="color:#111827;margin-top:0;">You have a new booking request!</h2>
      <p style="color:#6b7280;">
        <strong>${renter.firstName} ${renter.lastName}</strong> wants to rent your tool.
      </p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Tool</td><td style="padding:8px 0;font-weight:600;border-bottom:1px solid #f3f4f6;">${tool.title}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Start date</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">${fmtDate(startDate)}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">End date</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">${fmtDate(endDate)}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Duration</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">${totalDays} day${totalDays !== 1 ? 's' : ''}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Renter pays</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">${fmtMoney(totalCharged)}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">You earn</td><td style="padding:8px 0;font-weight:700;color:#16a34a;">${fmtMoney(lenderPayout)}</td></tr>
      </table>
      ${renterMessage ? `<div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:16px;"><p style="margin:0;color:#6b7280;font-size:13px;">Message from renter:</p><p style="margin:8px 0 0;color:#111827;">"${renterMessage}"</p></div>` : ''}
      <p style="color:#6b7280;font-size:14px;">Log in to approve or decline this request.</p>
      ${btn('Review Booking', `${APP_URL}/bookings/${booking._id}`)}
    `)
  );
};

// 2. Renter: booking approved
const sendBookingApproved = async (booking) => {
  const { renter, lender, tool, startDate, endDate, totalDays, totalCharged, paymentMethod } = booking;
  await send(
    renter.email,
    `Your booking for "${tool.title}" was approved!`,
    wrap(`
      <h2 style="color:#16a34a;margin-top:0;">✓ Booking Approved!</h2>
      <p style="color:#6b7280;">
        Great news! <strong>${lender.firstName} ${lender.lastName}</strong> approved your booking request.
      </p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Tool</td><td style="padding:8px 0;font-weight:600;border-bottom:1px solid #f3f4f6;">${tool.title}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Start date</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">${fmtDate(startDate)}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">End date</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">${fmtDate(endDate)}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Duration</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">${totalDays} day${totalDays !== 1 ? 's' : ''}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">Total</td><td style="padding:8px 0;font-weight:700;">${fmtMoney(totalCharged)}</td></tr>
      </table>
      <p style="color:#6b7280;font-size:14px;">Payment method: <strong style="text-transform:capitalize;">${paymentMethod}</strong>. Please complete payment to confirm your rental.</p>
      ${btn('View Booking', `${APP_URL}/bookings/${booking._id}`)}
    `)
  );
};

// 3. Renter: booking declined
const sendBookingDeclined = async (booking) => {
  const { renter, lender, tool, cancellationReason } = booking;
  await send(
    renter.email,
    `Booking request for "${tool.title}" was declined`,
    wrap(`
      <h2 style="color:#dc2626;margin-top:0;">Booking Request Declined</h2>
      <p style="color:#6b7280;">
        Unfortunately, <strong>${lender.firstName} ${lender.lastName}</strong> was unable to approve your booking for <strong>${tool.title}</strong>.
      </p>
      ${cancellationReason ? `<div style="background:#fef2f2;border-radius:8px;padding:16px;margin:16px 0;"><p style="margin:0;color:#6b7280;font-size:13px;">Reason:</p><p style="margin:8px 0 0;color:#b91c1c;">"${cancellationReason}"</p></div>` : ''}
      <p style="color:#6b7280;font-size:14px;">Don't worry — there are plenty of other tools available.</p>
      ${btn('Search Other Tools', `${APP_URL}/search`)}
    `)
  );
};

// 4. Both parties: booking cancelled
const sendBookingCancelled = async (booking, cancelledByRenter) => {
  const { renter, lender, tool, startDate, endDate, cancellationReason } = booking;
  const cancelledBy = cancelledByRenter ? `${renter.firstName} ${renter.lastName}` : `${lender.firstName} ${lender.lastName}`;

  const emailTo = cancelledByRenter ? lender.email : renter.email;
  const recipientName = cancelledByRenter ? lender.firstName : renter.firstName;

  await send(
    emailTo,
    `Booking for "${tool.title}" was cancelled`,
    wrap(`
      <h2 style="color:#dc2626;margin-top:0;">Booking Cancelled</h2>
      <p style="color:#6b7280;">Hi ${recipientName}, the booking for <strong>${tool.title}</strong> (${fmtDate(startDate)} – ${fmtDate(endDate)}) has been cancelled by ${cancelledBy}.</p>
      ${cancellationReason ? `<div style="background:#fef2f2;border-radius:8px;padding:16px;margin:16px 0;"><p style="margin:0;color:#6b7280;font-size:13px;">Reason:</p><p style="margin:8px 0 0;color:#b91c1c;">"${cancellationReason}"</p></div>` : ''}
      ${btn('View Bookings', `${APP_URL}/bookings`)}
    `)
  );
};

// 5. Both parties: booking completed + leave review prompt
const sendBookingCompleted = async (booking) => {
  const { renter, lender, tool, startDate, endDate, lenderPayout } = booking;

  // Email to renter
  await send(
    renter.email,
    `Your rental of "${tool.title}" is complete — leave a review!`,
    wrap(`
      <h2 style="color:#111827;margin-top:0;">Rental Complete!</h2>
      <p style="color:#6b7280;">Your rental of <strong>${tool.title}</strong> (${fmtDate(startDate)} – ${fmtDate(endDate)}) has been marked as complete. Thanks for using RentToolLend!</p>
      <p style="color:#6b7280;font-size:14px;">How was your experience? Leave a review for ${lender.firstName} to help the community.</p>
      ${btn('Leave a Review', `${APP_URL}/bookings/${booking._id}`)}
    `)
  );

  // Email to lender
  await send(
    lender.email,
    `Rental of "${tool.title}" complete — ${fmtMoney(lenderPayout)} earned!`,
    wrap(`
      <h2 style="color:#16a34a;margin-top:0;">✓ Rental Complete</h2>
      <p style="color:#6b7280;">The rental of <strong>${tool.title}</strong> has been completed. Here's your earnings summary:</p>
      <div style="background:#f0fdf4;border-radius:8px;padding:20px;margin:16px 0;text-align:center;">
        <p style="margin:0;color:#6b7280;font-size:14px;">You earned</p>
        <p style="margin:8px 0 0;font-size:32px;font-weight:800;color:#16a34a;">${fmtMoney(lenderPayout)}</p>
      </div>
      <p style="color:#6b7280;font-size:14px;">Leave a review for ${renter.firstName} to help other lenders.</p>
      ${btn('Leave a Review', `${APP_URL}/bookings/${booking._id}`)}
    `)
  );
};

// 6. Lender: new claim filed on their tool
const sendClaimFiled = async (claim, booking) => {
  const { lender, tool } = booking;
  await send(
    lender.email,
    `A claim has been filed for "${tool.title}"`,
    wrap(`
      <h2 style="color:#ea580c;margin-top:0;">⚠ Insurance Claim Filed</h2>
      <p style="color:#6b7280;">A claim has been filed related to the rental of <strong>${tool.title}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Claim type</td><td style="padding:8px 0;text-transform:capitalize;border-bottom:1px solid #f3f4f6;">${claim.claimType.replace('_', ' ')}</td></tr>
        ${claim.estimatedDamageAmount ? `<tr><td style="padding:8px 0;color:#6b7280;">Estimated amount</td><td style="padding:8px 0;">${fmtMoney(claim.estimatedDamageAmount)}</td></tr>` : ''}
      </table>
      <p style="color:#6b7280;font-size:14px;">Our team will review this claim within 24 hours. You may be contacted for additional information.</p>
      ${btn('View Claim', `${APP_URL}/claims`)}
    `)
  );
};

module.exports = {
  sendNewBookingRequest,
  sendBookingApproved,
  sendBookingDeclined,
  sendBookingCancelled,
  sendBookingCompleted,
  sendClaimFiled,
};
