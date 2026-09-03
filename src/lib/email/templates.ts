const brand = {
  name: "BharmouriRoots",
  color: "#2d6a4f",
  accent: "#e67e22",
};

function layout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f7f4ef;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#2c2416;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f4ef;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e8e0d4;">
        <tr><td style="background:${brand.color};padding:20px 24px;">
          <p style="margin:0;color:#fff;font-size:18px;font-weight:700;">${brand.name}</p>
          <p style="margin:4px 0 0;color:rgba(255,255,255,.75);font-size:12px;">Pure Himachali products</p>
        </td></tr>
        <tr><td style="padding:28px 24px;">${bodyHtml}</td></tr>
        <tr><td style="padding:16px 24px;background:#faf7f2;border-top:1px solid #efe7db;font-size:12px;color:#7a7060;">
          © ${new Date().getFullYear()} ${brand.name}. If you didn’t request this, you can ignore this email.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function passwordResetEmailTemplate(params: {
  name: string;
  resetUrl: string;
  expiresMinutes: number;
}): { subject: string; html: string; text: string } {
  const subject = `Reset your ${brand.name} password`;
  const html = layout(
    subject,
    `
    <h1 style="margin:0 0 12px;font-size:22px;color:${brand.color};">Reset your password</h1>
    <p style="margin:0 0 16px;line-height:1.55;font-size:15px;">Hi ${params.name || "there"},</p>
    <p style="margin:0 0 20px;line-height:1.55;font-size:15px;">
      We received a request to reset your password. Click the button below to choose a new one.
      This link expires in <strong>${params.expiresMinutes} minutes</strong>.
    </p>
    <p style="margin:0 0 24px;">
      <a href="${params.resetUrl}" style="display:inline-block;background:${brand.accent};color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;font-size:14px;">
        Reset Password
      </a>
    </p>
    <p style="margin:0;font-size:12px;color:#7a7060;line-height:1.5;word-break:break-all;">
      Or paste this link into your browser:<br/>${params.resetUrl}
    </p>`
  );
  const text = `Hi ${params.name || "there"},\n\nReset your password (expires in ${params.expiresMinutes} minutes):\n${params.resetUrl}\n\nIf you didn't request this, ignore this email.`;
  return { subject, html, text };
}

export function welcomeEmailTemplate(params: {
  name: string;
  shopUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `Welcome to ${brand.name}`;
  const html = layout(
    subject,
    `
    <h1 style="margin:0 0 12px;font-size:22px;color:${brand.color};">Welcome, ${params.name}!</h1>
    <p style="margin:0 0 20px;line-height:1.55;font-size:15px;">
      Thanks for joining ${brand.name}. Explore authentic organic and traditional Himachali products sourced from the mountains.
    </p>
    <p style="margin:0;">
      <a href="${params.shopUrl}" style="display:inline-block;background:${brand.color};color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;font-size:14px;">
        Shop Now
      </a>
    </p>`
  );
  const text = `Welcome ${params.name}! Shop at ${params.shopUrl}`;
  return { subject, html, text };
}

export function completeRegistrationEmailTemplate(params: {
  email: string;
  completeUrl: string;
  expiresMinutes: number;
}): { subject: string; html: string; text: string } {
  const subject = `Complete your ${brand.name} registration`;
  const html = layout(
    subject,
    `
    <h1 style="margin:0 0 12px;font-size:22px;color:${brand.color};">Welcome to ${brand.name}!</h1>
    <p style="margin:0 0 16px;line-height:1.55;font-size:15px;">Namaste,</p>
    <p style="margin:0 0 20px;line-height:1.55;font-size:15px;">
      Thanks for starting your registration with us. Please click the button below to complete your account setup
      for <strong>${params.email}</strong>. This link expires in <strong>${params.expiresMinutes} minutes</strong>.
    </p>
    <p style="margin:0 0 24px;">
      <a href="${params.completeUrl}" style="display:inline-block;background:${brand.accent};color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;font-size:14px;">
        Complete Registration
      </a>
    </p>
    <p style="margin:0;font-size:12px;color:#7a7060;line-height:1.5;word-break:break-all;">
      Or paste this link into your browser:<br/>${params.completeUrl}
    </p>`
  );
  const text = `Namaste,\n\nComplete your ${brand.name} registration for ${params.email} (expires in ${params.expiresMinutes} minutes):\n${params.completeUrl}\n\nIf you didn't request this, ignore this email.`;
  return { subject, html, text };
}

export function emailOtpTemplate(params: {
  code: string;
  purposeLabel: string;
  expiresMinutes: number;
}): { subject: string; html: string; text: string } {
  const subject = `${params.code} is your ${brand.name} verification code`;
  const html = layout(
    subject,
    `
    <h1 style="margin:0 0 12px;font-size:22px;color:${brand.color};">${params.purposeLabel}</h1>
    <p style="margin:0 0 16px;line-height:1.55;font-size:15px;">Namaste,</p>
    <p style="margin:0 0 20px;line-height:1.55;font-size:15px;">
      Use this one-time code to continue. It expires in <strong>${params.expiresMinutes} minutes</strong>.
    </p>
    <p style="margin:0 0 24px;letter-spacing:6px;font-size:32px;font-weight:700;color:${brand.color};">
      ${params.code}
    </p>
    <p style="margin:0;font-size:12px;color:#7a7060;line-height:1.5;">
      If you did not request this, you can ignore this email.
    </p>`
  );
  const text = `Your ${brand.name} code: ${params.code}\nExpires in ${params.expiresMinutes} minutes.\n\nIf you didn't request this, ignore this email.`;
  return { subject, html, text };
}
