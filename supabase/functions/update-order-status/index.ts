import {
  corsHeaders,
  jsonResponse,
  getSupabase,
  sendStatusUpdateEmail,
} from "../_shared/email.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // --- JWT verification ---
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");

    if (!token) {
      return jsonResponse({ ok: false, error: "Non autorisé" }, 401);
    }

    const supabase = getSupabase();

    const { data: userData, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !userData?.user) {
      return jsonResponse({ ok: false, error: "Session invalide" }, 401);
    }

    const body = await req.json();
    const { order_id, status, note } = body;

    if (!order_id || !status) {
      return jsonResponse({ ok: false, error: "order_id et status requis" }, 400);
    }

    const validStatuses = ["pending_payment", "paid", "preparing", "ready_for_pickup", "shipping", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return jsonResponse({ ok: false, error: "Statut invalide" }, 400);
    }

    // --- Fetch order ---
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id,order_number,customer_email,customer_first_name,status")
      .eq("id", order_id)
      .maybeSingle();

    if (orderErr || !order) {
      return jsonResponse({ ok: false, error: "Commande introuvable" }, 404);
    }

    // --- Update order status ---
    const { error: updateErr } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", order_id);

    if (updateErr) {
      console.error("update-order-status error:", updateErr.message);
      return jsonResponse({ ok: false, error: "Erreur de mise à jour" }, 500);
    }

    // --- Insert history ---
    await supabase
      .from("order_status_history")
      .insert({ order_id, status, note: note || null, email_sent: false });

    // --- Send customer email for relevant statuses ---
    const emailStatuses = ["preparing", "ready_for_pickup", "shipping", "delivered"];
    if (emailStatuses.includes(status)) {
      try {
        await sendStatusUpdateEmail(
          order.order_number,
          order.customer_email,
          order.customer_first_name,
          status
        );
        await supabase
          .from("order_status_history")
          .update({ email_sent: true })
          .eq("order_id", order_id)
          .eq("status", status);
      } catch (e) {
        console.error("Status email error (non-blocking):", e.message);
      }
    }

    return jsonResponse({ ok: true, order_id, status });
  } catch (err) {
    console.error("update-order-status error:", err);
    return jsonResponse({ ok: false, error: "Erreur interne" }, 500);
  }
});
