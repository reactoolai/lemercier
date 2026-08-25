import { createClient } from "npm:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SHOP_NAME = Deno.env.get("SHOP_NAME") || "Le Mercier Alma";
const SHOP_URL = Deno.env.get("SHOP_URL") || "https://lemercieralma.com";
const FROM_EMAIL = "info@lechoixdesophie.com";
const NOTIFY_EMAIL = Deno.env.get("ORDER_NOTIFY_EMAIL") || FROM_EMAIL;

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

interface OrderItem {
  name: string;
  brand?: string;
  image_url?: string;
  color?: string;
  size?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface OrderInfo {
  order_number: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  fulfillment_type: string;
  ship_address1?: string;
  ship_address2?: string;
  ship_city?: string;
  ship_province?: string;
  ship_postal_code?: string;
  subtotal: number;
  shipping_total: number;
  tps: number;
  tvq: number;
  total: number;
  items: OrderItem[];
}

function fmt(n: number): string {
  return n.toFixed(2).replace(".", ",") + " $";
}

function emailShell(innerHtml: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#FAFAF8;font-family:'Jost',Helvetica,Arial,sans-serif;color:#1D2433;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF8;padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(20,36,58,.06);">
<tr><td style="background:#1B3560;padding:28px 40px;text-align:center;">
<img src="${SHOP_URL}/logo.jpg" alt="${SHOP_NAME}" style="width:56px;height:56px;border-radius:50%;object-fit:cover;" />
<div style="font-family:'Marcellus',Georgia,serif;font-size:20px;letter-spacing:.14em;color:#fff;margin-top:12px;">${SHOP_NAME}</div>
</td></tr>
<tr><td style="padding:36px 40px 24px;">
${innerHtml}
</td></tr>
<tr><td style="padding:24px 40px 36px;border-top:1px solid #E4E4DE;">
<p style="font-size:13px;color:#8A8F99;margin:0 0 8px;line-height:1.6;">${SHOP_NAME} — 630 Rue Sacré-Coeur O, Alma (Québec) G8B 1M1</p>
<p style="font-size:12px;color:#8A8F99;margin:0;">Propulsé par <a href="https://reactool.ai" style="color:#1B3560;text-decoration:none;">Reactool</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function itemsTable(items: OrderItem[]): string {
  const rows = items.map((it) => `
<tr>
<td style="padding:12px 0;border-bottom:1px solid #E4E4DE;">
${it.image_url ? `<img src="${it.image_url}" alt="" style="width:48px;height:60px;object-fit:cover;border-radius:4px;" />` : ""}
</td>
<td style="padding:12px 8px;border-bottom:1px solid #E4E4DE;">
<div style="font-size:14px;font-weight:500;color:#1D2433;">${it.name}</div>
${it.brand ? `<div style="font-size:12px;color:#8A8F99;margin-top:2px;">${it.brand}</div>` : ""}
<div style="font-size:12px;color:#8A8F99;margin-top:4px;">
${it.color ? `Couleur: ${it.color}` : ""}${it.color && it.size ? " · " : ""}${it.size ? `Taille: ${it.size}` : ""}
</div>
</td>
<td style="padding:12px 8px;border-bottom:1px solid #E4E4DE;text-align:center;font-size:14px;">${it.quantity}</td>
<td style="padding:12px 0;border-bottom:1px solid #E4E4DE;text-align:right;font-size:14px;color:#1B3560;font-weight:500;">${fmt(it.line_total)}</td>
</tr>`).join("");

  return `
<table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">
<tr style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#8A8F99;">
<td style="padding-bottom:8px;"></td>
<td style="padding-bottom:8px;">Article</td>
<td style="padding-bottom:8px;text-align:center;">Qté</td>
<td style="padding-bottom:8px;text-align:right;">Prix</td>
</tr>
${rows}
</table>`;
}

function totalsBlock(o: OrderInfo): string {
  const deliveryInfo = o.fulfillment_type === "pickup"
    ? "<strong style=\"color:#1B3560;\">Ramassage en boutique</strong><br/>630 Rue Sacré-Coeur O, Alma (Québec) G8B 1M1"
    : `<strong style="color:#1B3560;">Livraison</strong><br/>${o.ship_address1 || ""}${o.ship_address2 ? ", " + o.ship_address2 : ""}<br/>${o.ship_city || ""}, ${o.ship_province || "QC"} ${o.ship_postal_code || ""}`;

  return `
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;font-size:14px;">
<tr><td style="padding:6px 0;color:#5A6070;">Sous-total</td><td style="padding:6px 0;text-align:right;color:#1D2433;">${fmt(o.subtotal)}</td></tr>
<tr><td style="padding:6px 0;color:#5A6070;">Livraison</td><td style="padding:6px 0;text-align:right;color:#1D2433;">${o.shipping_total === 0 ? "Gratuite" : fmt(o.shipping_total)}</td></tr>
<tr><td style="padding:6px 0;color:#5A6070;">TPS (5 %)</td><td style="padding:6px 0;text-align:right;color:#1D2433;">${fmt(o.tps)}</td></tr>
<tr><td style="padding:6px 0;color:#5A6070;">TVQ (9,975 %)</td><td style="padding:6px 0;text-align:right;color:#1D2433;">${fmt(o.tvq)}</td></tr>
<tr><td style="padding:10px 0;font-size:16px;font-weight:600;color:#1B3560;border-top:1px solid #E4E4DE;">Total</td><td style="padding:10px 0;text-align:right;font-size:16px;font-weight:600;color:#1B3560;border-top:1px solid #E4E4DE;">${fmt(o.total)}</td></tr>
</table>
<div style="margin-top:24px;padding:16px 20px;background:#F5F4EF;border-radius:8px;font-size:14px;color:#5A6070;line-height:1.6;">
${deliveryInfo}
</div>`;
}

export async function sendEmail(to: string[], subject: string, html: string): Promise<boolean> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${SHOP_NAME} <${FROM_EMAIL}>`,
        reply_to: FROM_EMAIL,
        to,
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend error:", res.status, errText);
      return false;
    }
    return true;
  } catch (e) {
    console.error("sendEmail error:", e.message);
    return false;
  }
}

export async function sendOrderConfirmationEmails(order: OrderInfo): Promise<void> {
  const inner = `
<h1 style="font-family:'Marcellus',Georgia,serif;font-size:26px;color:#1B3560;margin:0 0 8px;">Confirmation de votre commande</h1>
<p style="font-size:15px;color:#5A6070;margin:0 0 24px;">Merci ${order.customer_first_name} ! Votre commande <strong style="color:#1B3560;">${order.order_number}</strong> a été confirmée.</p>
${itemsTable(order.items)}
${totalsBlock(order)}
<p style="font-size:14px;color:#8A8F99;margin-top:24px;line-height:1.6;">Vous recevrez un courriel à chaque étape de votre commande. Pour toute question, contactez-nous au (418) 662-3240.</p>`;

  await sendEmail(
    [order.customer_email],
    `Confirmation de votre commande ${order.order_number}`,
    emailShell(inner)
  );

  const adminInner = `
<h1 style="font-family:'Marcellus',Georgia,serif;font-size:24px;color:#1B3560;margin:0 0 8px;">Nouvelle commande</h1>
<p style="font-size:15px;color:#5A6070;margin:0 0 20px;">Commande <strong style="color:#1B3560;">${order.order_number}</strong> — ${order.customer_first_name} ${order.customer_last_name}</p>
<p style="font-size:14px;color:#5A6070;margin:0 0 20px;">Courriel: ${order.customer_email}</p>
${itemsTable(order.items)}
${totalsBlock(order)}`;

  await sendEmail(
    [NOTIFY_EMAIL],
    `🛍️ Nouvelle commande ${order.order_number} — ${SHOP_NAME}`,
    emailShell(adminInner)
  );
}

export async function sendStatusUpdateEmail(
  orderNumber: string,
  customerEmail: string,
  customerFirstName: string,
  status: string
): Promise<void> {
  const statusMessages: Record<string, { subject: string; title: string; body: string }> = {
    preparing: {
      subject: `Votre commande ${orderNumber} est en préparation`,
      title: "Votre commande est en préparation",
      body: "Nous préparons votre commande avec soin. Vous serez notifié dès qu'elle sera prête.",
    },
    ready_for_pickup: {
      subject: `Votre commande ${orderNumber} est prête pour le ramassage`,
      title: "Votre commande est prête pour le ramassage",
      body: "Votre commande est prête ! Vous pouvez venir la chercher à la boutique: 630 Rue Sacré-Coeur O, Alma (Québec). Nos heures d'ouverture: Lun–Mer 9h30–17h30, Jeu–Ven 9h30–21h, Sam 9h30–17h, Dim 12h–16h.",
    },
    shipping: {
      subject: `Votre commande ${orderNumber} est en livraison`,
      title: "Votre commande est en livraison",
      body: "Votre commande a été expédiée et est en route vers vous. Vous la recevrez sous peu.",
    },
    delivered: {
      subject: `Votre commande ${orderNumber} a été livrée`,
      title: "Votre commande a été livrée",
      body: "Votre commande a été livrée. Merci d'avoir magasiné chez Le Mercier Alma ! N'hésitez pas à nous contacter si vous avez des questions.",
    },
  };

  const info = statusMessages[status];
  if (!info) return;

  const inner = `
<h1 style="font-family:'Marcellus',Georgia,serif;font-size:26px;color:#1B3560;margin:0 0 8px;">${info.title}</h1>
<p style="font-size:15px;color:#5A6070;margin:0 0 24px;">Bonjour ${customerFirstName},</p>
<p style="font-size:15px;color:#5A6070;margin:0 0 24px;line-height:1.7;">${info.body}</p>
<p style="font-size:14px;color:#8A8F99;margin-top:24px;">Commande: <strong style="color:#1B3560;">${orderNumber}</strong></p>`;

  await sendEmail(
    [customerEmail],
    info.subject,
    emailShell(inner)
  );
}
