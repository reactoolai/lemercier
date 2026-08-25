import { corsHeaders, jsonResponse, sendEmail } from "../_shared/email.ts";

const SHOP_NAME = Deno.env.get("SHOP_NAME") || "Le Mercier Alma";
const FROM_EMAIL = "info@lechoixdesophie.com";
const NOTIFY_EMAIL = Deno.env.get("ORDER_NOTIFY_EMAIL") || FROM_EMAIL;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const name = (body.name || "").trim();
    const email = (body.email || "").trim();
    const subject = (body.subject || "").trim();
    const message = (body.message || "").trim();

    if (!name || !email || !message) {
      return jsonResponse({ ok: false, error: "Tous les champs sont requis." }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ ok: false, error: "Courriel invalide." }, 400);
    }

    const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#FAFAF8;font-family:'Jost',Helvetica,Arial,sans-serif;color:#1D2433;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF8;padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(20,36,58,.06);">
<tr><td style="background:#1B3560;padding:28px 40px;text-align:center;">
<div style="font-family:'Marcellus',Georgia,serif;font-size:20px;letter-spacing:.14em;color:#fff;">${SHOP_NAME} — Nouveau message</div>
</td></tr>
<tr><td style="padding:36px 40px 24px;">
<p style="font-size:15px;color:#5A6070;margin:0 0 16px;"><strong>De:</strong> ${name} &lt;${email}&gt;</p>
<p style="font-size:15px;color:#5A6070;margin:0 0 16px;"><strong>Sujet:</strong> ${subject || "(aucun)"}</p>
<hr style="border:none;border-top:1px solid #E4E4DE;margin:20px 0;" />
<p style="font-size:15px;color:#1D2433;line-height:1.7;white-space:pre-wrap;">${message}</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

    const sent = await sendEmail(
      [NOTIFY_EMAIL],
      `Nouveau message de ${name} — ${SHOP_NAME}`,
      html
    );

    if (!sent) {
      return jsonResponse({ ok: false, error: "Erreur d'envoi du courriel." }, 500);
    }

    return jsonResponse({ ok: true });
  } catch (e) {
    console.error("contact-form error:", e.message);
    return jsonResponse({ ok: false, error: "Erreur inattendue." }, 500);
  }
});
