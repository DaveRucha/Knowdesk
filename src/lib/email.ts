import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendInviteEmail({
  to,
  inviterName,
  orgName,
  role,
  inviteUrl,
}: {
  to: string;
  inviterName: string;
  orgName: string;
  role: string;
  inviteUrl: string;
}) {
  const resend = getResend();
  await resend.emails.send({
    from: "Knowdesk <noreply@knowdesk.me>",
    to,
    subject: `You've been invited to join ${orgName} on Knowdesk`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family:system-ui,sans-serif;background:#f8fafc;margin:0;padding:40px 20px">
        <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden">
          <div style="background:#0f172a;padding:24px 32px;display:flex;align-items:center;gap:12px">
            <div style="width:32px;height:32px;background:#6366f1;border-radius:8px;display:flex;align-items:center;justify-content:center">
              <span style="color:#fff;font-size:16px">K</span>
            </div>
            <span style="color:#fff;font-size:16px;font-weight:600">Knowdesk</span>
          </div>
          <div style="padding:32px">
            <h2 style="margin:0 0 8px;font-size:20px;color:#0f172a">You've been invited</h2>
            <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.6">
              <strong style="color:#0f172a">${inviterName}</strong> has invited you to join 
              <strong style="color:#0f172a">${orgName}</strong> on Knowdesk as a 
              <strong style="color:#6366f1">${role}</strong>.
            </p>
            <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.6">
              Knowdesk is an AI-powered knowledge base that lets your team ask questions and get instant answers from company documents.
            </p>
            <a href="${inviteUrl}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:500">
              Accept Invitation →
            </a>
            <p style="margin:24px 0 0;color:#94a3b8;font-size:12px">
              This invite is valid for 48 hours and can only be used by ${to}.<br>
              If you didn't expect this, you can safely ignore this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}
