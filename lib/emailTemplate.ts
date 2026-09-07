export function emailTemplate(opts: {
  title: string
  body: string
  cta?: { text: string; url: string }
  recipientName?: string
  type?: 'info'|'success'|'warning'|'announcement'
}): string {
  const colors = {
    info:         { accent:'#1a6b3a', badge:'#f0f9f4', badgeText:'#1a6b3a' },
    success:      { accent:'#1a6b3a', badge:'#f0f9f4', badgeText:'#1a6b3a' },
    warning:      { accent:'#d97706', badge:'#fffbeb', badgeText:'#92400e' },
    announcement: { accent:'#1a6b3a', badge:'#f0f9f4', badgeText:'#1a6b3a' },
  }
  const c = colors[opts.type || 'info']
  const year = new Date().getFullYear()
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${opts.title}</title></head>
<body style="margin:0;padding:0;background:#f5f5f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f3;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Header -->
        <tr><td style="background:#0a0a0a;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
          <div style="display:inline-flex;align-items:center;gap:10px;">
            <div style="width:36px;height:36px;background:${c.accent};border-radius:8px;display:inline-flex;align-items:center;justify-content:center;">
              <span style="color:white;font-weight:900;font-size:18px;">M</span>
            </div>
            <span style="color:white;font-weight:900;font-size:18px;letter-spacing:-0.5px;">MOUAU FreshStart</span>
          </div>
          <div style="width:60px;height:3px;background:${c.accent};border-radius:2px;margin:16px auto 0;"></div>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:white;padding:36px 32px;">
          ${opts.recipientName ? `<p style="color:#aaa;font-size:13px;margin:0 0 4px 0;">Hello,</p><p style="color:#0a0a0a;font-weight:800;font-size:20px;margin:0 0 24px 0;">${opts.recipientName}</p>` : ''}
          
          <h2 style="color:#0a0a0a;font-size:22px;font-weight:900;margin:0 0 16px 0;line-height:1.3;">${opts.title}</h2>
          
          <div style="color:#4b4b4b;font-size:15px;line-height:1.7;margin:0 0 28px 0;">
            ${opts.body}
          </div>

          ${opts.cta ? `
          <div style="text-align:center;margin:28px 0 0 0;">
            <a href="${opts.cta.url}" style="display:inline-block;background:${c.accent};color:white;font-weight:700;font-size:14px;padding:14px 32px;border-radius:12px;text-decoration:none;letter-spacing:0.3px;">
              ${opts.cta.text} →
            </a>
          </div>` : ''}
        </td></tr>

        <!-- Divider + campus badge -->
        <tr><td style="background:white;padding:0 32px;">
          <div style="background:${c.badge};border-radius:10px;padding:14px 18px;display:flex;align-items:center;gap:12px;margin-bottom:0;">
            <span style="font-size:20px;">🎓</span>
            <div>
              <p style="margin:0;font-weight:700;font-size:13px;color:${c.badgeText};">Michael Okpara University of Agriculture</p>
              <p style="margin:0;font-size:12px;color:#888;">Umudike, Abia State, Nigeria</p>
            </div>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:white;border-radius:0 0 16px 16px;padding:20px 32px 28px;border-top:1px solid #f0f0f0;margin-top:20px;">
          <p style="margin:16px 0 0 0;color:#aaa;font-size:11px;line-height:1.6;text-align:center;">
            You received this because you're registered on MOUAU FreshStart.<br>
            <a href="https://mouau-rose.vercel.app/profile" style="color:${c.accent};text-decoration:none;font-weight:600;">Manage notifications</a>
            &nbsp;·&nbsp;
            <a href="https://mouau-rose.vercel.app" style="color:${c.accent};text-decoration:none;font-weight:600;">Open app</a>
          </p>
          <p style="margin:12px 0 0 0;color:#ccc;font-size:10px;text-align:center;">© ${year} MOUAU FreshStart · All rights reserved</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`
}
