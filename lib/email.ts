import "server-only";

/**
 * Minimal Resend-compatible email helper. Wired by the reminder cron when
 * `RESEND_API_KEY` is set; otherwise emails are skipped silently (the in-app
 * notification is still created so the user can see it on /thong-bao).
 *
 * We talk to Resend over plain `fetch` to avoid adding a runtime dependency.
 */

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string; status?: number };

export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY missing" };
  }
  const from =
    process.env.RESEND_FROM_EMAIL ?? "GymVN <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        ...(input.html ? { html: input.html } : {}),
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        error: text.slice(0, 300) || `HTTP ${res.status}`,
        status: res.status,
      };
    }
    const data = (await res.json().catch(() => null)) as { id?: string } | null;
    return { ok: true, id: data?.id ?? "unknown" };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "fetch error",
    };
  }
}

export function reminderEmailHtml(opts: {
  displayName: string | null;
  title: string;
  body: string;
  appUrl: string;
  ctaHref: string;
  ctaLabel: string;
}): string {
  const name = opts.displayName?.trim() || "bạn";
  return `<!doctype html>
<html lang="vi">
<head><meta charset="utf-8" /><title>${escapeHtml(opts.title)}</title></head>
<body style="margin:0;padding:24px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#F7F9FA;color:#1B1E28">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #E5EBED;border-radius:6px">
    <tr><td style="padding:24px 28px 0">
      <div style="font-size:13px;color:#536171;letter-spacing:0.02em">GymVN</div>
      <h1 style="font-size:20px;line-height:1.3;margin:8px 0 16px">${escapeHtml(opts.title)}</h1>
    </td></tr>
    <tr><td style="padding:0 28px 8px">
      <p style="margin:0 0 16px;font-size:15px;line-height:1.55">Xin chào ${escapeHtml(name)},</p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.55">${escapeHtml(opts.body)}</p>
      <p style="margin:0 0 24px"><a href="${escapeAttr(`${opts.appUrl}${opts.ctaHref}`)}" style="display:inline-block;background:#0286C3;color:#FFFFFF;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px">${escapeHtml(opts.ctaLabel)}</a></p>
    </td></tr>
    <tr><td style="padding:0 28px 24px;border-top:1px solid #E5EBED">
      <p style="margin:16px 0 0;font-size:12px;color:#8DA4BE;line-height:1.5">Bạn nhận được email này vì đã bật reminder email trong cài đặt. Tắt tại <a href="${escapeAttr(`${opts.appUrl}/cai-dat`)}" style="color:#0286C3">cài đặt thông báo</a>.</p>
    </td></tr>
  </table>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}
