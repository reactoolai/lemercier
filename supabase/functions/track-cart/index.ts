import {
  corsHeaders,
  jsonResponse,
  getSupabase,
} from "../_shared/email.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      cart_token,
      items,
      subtotal,
      email,
      first_name,
      last_name,
      phone,
      reached_checkout,
    } = body;

    if (!cart_token) {
      return jsonResponse({ ok: false, error: "cart_token requis" }, 400);
    }

    const supabase = getSupabase();

    const itemsArr = Array.isArray(items) ? items : [];
    const itemsCount = itemsArr.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);

    const update: Record<string, any> = {
      items: itemsArr,
      items_count: itemsCount,
      subtotal: subtotal ?? 0,
      last_seen_at: new Date().toISOString(),
    };

    if (email) update.email = email;
    if (first_name) update.first_name = first_name;
    if (last_name) update.last_name = last_name;
    if (phone) update.phone = phone;
    if (reached_checkout !== undefined) update.reached_checkout = reached_checkout;

    const { error } = await supabase
      .from("abandoned_carts")
      .upsert(update, { onConflict: "cart_token" });

    if (error) {
      console.error("track-cart upsert error:", error.message);
      return jsonResponse({ ok: false, error: "Erreur de sauvegarde" }, 500);
    }

    return jsonResponse({ ok: true });
  } catch (err) {
    console.error("track-cart error:", err);
    return jsonResponse({ ok: false, error: "Erreur interne" }, 500);
  }
});
