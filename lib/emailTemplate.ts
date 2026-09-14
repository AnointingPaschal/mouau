const APP_URL = 'https://mouau-rose.vercel.app'

export function emailTemplate(opts: {
  title: string
  body: string
  cta?: { text: string; url: string }
  recipientName?: string
  type?: 'info' | 'success' | 'warning' | 'announcement'
  siteName?: string   // from admin settings
  logoUrl?: string    // from admin settings (Supabase URL)
}): string {
  const colors = {
    info:         { accent: '#1a6b3a', badge: '#f0f9f4', badgeText: '#1a6b3a' },
    success:      { accent: '#1a6b3a', badge: '#f0f9f4', badgeText: '#1a6b3a' },
    warning:      { accent: '#d97706', badge: '#fffbeb', badgeText: '#92400e' },
    announcement: { accent: '#1a6b3a', badge: '#f0f9f4', badgeText: '#1a6b3a' },
  }
  const c        = colors[opts.type || 'info']
  const year     = new Date().getFullYear()
  const name     = opts.siteName || 'PDM MOUAU'
  const logoUrl  = opts.logoUrl  || ''
  const hasLogo  = !!logoUrl

  const logoHtml = hasLogo
    ? `<img src="${logoUrl}" alt="${name}" width="36" height="36"
         style="width:36px;height:36px;border-radius:8px;object-fit:contain;background:#fff;display:inline-block;vertical-align:middle;">`
    : `<div style="width:36px;height:36px;background:${c.accent};border-radius:8px;display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;">
         <span style="color:white;font-weight:900;font-size:18px;line-height:1;">${name.charAt(0).toUpperCase()}</span>
       </div>`

  return `<!DOCTYPE html>
<html><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${opts.title}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f3;padding:28px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Header -->
        <tr><td style="background:#0a0a0a;border-radius:14px 14px 0 0;padding:22px 28px;text-align:center;">
          <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr>
              <td style="vertical-align:middle;padding-right:10px;">${logoHtml}</td>
              <td style="vertical-align:middle;">
                <span style="color:white;font-weight:900;font-size:17px;letter-spacing:-0.5px;">${name}</span>
              </td>
            </tr>
          </table>
          <div style="width:50px;height:3px;background:${c.accent};border-radius:2px;margin:14px auto 0;"></div>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:30px 28px;">
          ${opts.recipientName
            ? `<p style="color:#aaa;font-size:12px;margin:0 0 3px;">Hello,</p>
               <p style="color:#0a0a0a;font-weight:800;font-size:19px;margin:0 0 20px;">${opts.recipientName}</p>`
            : ''}

          <h2 style="color:#0a0a0a;font-size:20px;font-weight:900;margin:0 0 14px;line-height:1.3;">${opts.title}</h2>

          ${opts.body
            ? opts.body.split('\n').map(line => line.trim()
                ? `<p style="color:#444;font-size:14px;line-height:1.7;margin:0 0 12px;">${line}</p>`
                : '').join('')
            : ''}

          ${opts.cta
            ? `<div style="margin:24px 0 8px;">
                 <a href="${opts.cta.url}"
                   style="display:inline-block;background:${c.accent};color:white;font-weight:700;font-size:14px;
                          padding:12px 28px;border-radius:10px;text-decoration:none;letter-spacing:-0.2px;">
                   ${opts.cta.text}
                 </a>
               </div>`
            : ''}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f5f5f3;border-radius:0 0 14px 14px;padding:18px 28px;text-align:center;border-top:1px solid #e8e8e8;">
          <p style="color:#aaa;font-size:11px;margin:0 0 4px;">&copy; ${year} ${name} &middot; Michael Okpara University, Umudike</p>
          <a href="${APP_URL}" style="color:${c.accent};font-size:11px;text-decoration:none;font-weight:600;">Open App</a>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`
}
