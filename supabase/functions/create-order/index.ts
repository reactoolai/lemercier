import {
  corsHeaders,
  jsonResponse,
  getSupabase,
  sendOrderConfirmationEmails,
} from "../_shared/email.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      cart_token,
      customer,
      fulfillment_type,
      shipping,
      note,
      items,
      payment_token,
    } = body;

    // --- Validation ---
    if (!customer?.first_name || !customer?.last_name || !customer?.email) {
      return jsonResponse({ ok: false, error: "Informations client incomplètes" }, 400);
    }
    if (!payment_token) {
      return jsonResponse({ ok: false, error: "Token de paiement manquant" }, 400);
    }
    if (!Array.isArray(items) || items.length === 0) {
      return jsonResponse({ ok: false, error: "Le panier est vide" }, 400);
    }

    const isDelivery = fulfillment_type === "delivery";
    if (isDelivery) {
      if (!shipping?.address1 || !shipping?.city || !shipping?.postal_code) {
        return jsonResponse({ ok: false, error: "Adresse de livraison incomplète" }, 400);
      }
    }

    const supabase = getSupabase();

    // --- Re-read products from DB (never trust frontend prices) ---
    const productIds = items.map((it: any) => String(it.product_id));
    const { data: dbProducts, error: dbErr } = await supabase
      .from("products")
      .select("id,name,brand,sku,img,price,stock")
      .in("id", productIds);

    if (dbErr) {
      console.error("create-order product fetch error:", dbErr.message);
      return jsonResponse({ ok: false, error: "Erreur de lecture du catalogue" }, 500);
    }

    const productMap = new Map<string, any>();
    for (const p of dbProducts || []) {
      productMap.set(String(p.id), p);
    }

    // --- Build order items ---
    const orderItems: any[] = [];
    let subtotal = 0;

    for (const it of items) {
      const p = productMap.get(String(it.product_id));
      if (!p) {
        return jsonResponse(
          { ok: false, error: `Produit introuvable: ${it.product_id}` },
          400
        );
      }
      const qty = Math.max(1, parseInt(it.quantity) || 1);
      const unitPrice = Number(p.price) || 0;
      const lineTotal = unitPrice * qty;
      subtotal += lineTotal;

      orderItems.push({
        product_id: String(it.product_id),
        sku: p.sku || null,
        name: p.name,
        brand: p.brand || null,
        image_url: p.img || null,
        color: it.color || null,
        size: it.size || null,
        unit_price: unitPrice,
        quantity: qty,
        line_total: lineTotal,
      });
    }

    // --- Totals ---
    const shippingTotal = isDelivery ? (subtotal >= 200 ? 0 : 25) : 0;
    const tps = Math.round((subtotal + shippingTotal) * 0.05 * 100) / 100;
    const tvq = Math.round((subtotal + shippingTotal) * 0.09975 * 100) / 100;
    const total = Math.round((subtotal + shippingTotal + tps + tvq) * 100) / 100;

    // --- Generate order number ---
    const { data: orderNumberData, error: seqErr } = await supabase.rpc("next_order_number");
    if (seqErr || !orderNumberData) {
      console.error("create-order order number error:", seqErr?.message);
      return jsonResponse({ ok: false, error: "Erreur de génération du numéro" }, 500);
    }
    const orderNumber = orderNumberData as string;

    // --- Insert order (pending_payment) ---
    const { data: orderRow, error: orderErr } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        status: "pending_payment",
        customer_first_name: customer.first_name,
        customer_last_name: customer.last_name,
        customer_email: customer.email,
        customer_phone: customer.phone || null,
        fulfillment_type: fulfillment_type || "delivery",
        ship_address1: isDelivery ? shipping.address1 : null,
        ship_address2: isDelivery ? (shipping.address2 || null) : null,
        ship_city: isDelivery ? shipping.city : null,
        ship_province: isDelivery ? (shipping.province || "QC") : null,
        ship_postal_code: isDelivery ? shipping.postal_code : null,
        ship_country: "CA",
        customer_note: note || null,
        subtotal,
        shipping_total: shippingTotal,
        tps,
        tvq,
        total,
        currency: "CAD",
        payment_provider: "square",
        payment_status: "pending",
        cart_token: cart_token || null,
      })
      .select("id")
      .single();

    if (orderErr || !orderRow) {
      console.error("create-order insert error:", orderErr?.message);
      return jsonResponse({ ok: false, error: "Erreur de création de commande" }, 500);
    }

    const orderId = orderRow.id;

    // --- Insert order items ---
    const itemsToInsert = orderItems.map((it) => ({ ...it, order_id: orderId }));
    const { error: itemsErr } = await supabase.from("order_items").insert(itemsToInsert);
    if (itemsErr) {
      console.error("create-order items insert error:", itemsErr.message);
    }

    // --- Charge with Square ---
    const squareToken = Deno.env.get("SQUARE_ACCESS_TOKEN");
    const squareLocationId = Deno.env.get("SQUARE_LOCATION_ID");
    const amountCents = Math.round(total * 100);

    let squarePaymentId: string | null = null;
    let squareError = false;

    try {
      const squareRes = await fetch("https://connect.squareup.com/v2/payments", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${squareToken}`,
          "Square-Version": "2025-01-23",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idempotency_key: crypto.randomUUID(),
          source_id: payment_token,
          amount_money: { amount: amountCents, currency: "CAD" },
          location_id: squareLocationId,
          reference_id: orderNumber,
          buyer_email_address: customer.email,
          note: `Commande ${orderNumber} — Le Mercier Alma`,
        }),
      });

      const squareData = await squareRes.json();

      if (!squareRes.ok) {
        console.error("Square payment error:", squareRes.status, JSON.stringify(squareData));
        squareError = true;
      } else {
        squarePaymentId = squareData.payment?.id || null;
      }
    } catch (e) {
      console.error("Square fetch error:", e.message);
      squareError = true;
    }

    if (squareError) {
      // Mark order as cancelled
      await supabase
        .from("orders")
        .update({ status: "cancelled", payment_status: "failed", updated_at: new Date().toISOString() })
        .eq("id", orderId);

      await supabase
        .from("order_status_history")
        .insert({ order_id: orderId, status: "cancelled", note: "Échec du paiement Square" });

      return jsonResponse(
        { ok: false, error: "Le paiement a échoué. Vérifiez vos informations de paiement et réessayez." },
        402
      );
    }

    // --- Payment success: update order ---
    await supabase
      .from("orders")
      .update({
        status: "paid",
        payment_status: "paid",
        square_payment_id: squarePaymentId,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    await supabase
      .from("order_status_history")
      .insert({ order_id: orderId, status: "paid", email_sent: false });

    // --- Mark abandoned cart as converted ---
    if (cart_token) {
      await supabase
        .from("abandoned_carts")
        .update({ status: "converted", converted_order_id: orderId })
        .eq("cart_token", cart_token);
    }

    // --- Send emails (non-blocking — never fail a paid order) ---
    const orderInfo = {
      order_number: orderNumber,
      customer_first_name: customer.first_name,
      customer_last_name: customer.last_name,
      customer_email: customer.email,
      fulfillment_type: fulfillment_type || "delivery",
      ship_address1: isDelivery ? shipping.address1 : undefined,
      ship_address2: isDelivery ? shipping.address2 : undefined,
      ship_city: isDelivery ? shipping.city : undefined,
      ship_province: isDelivery ? shipping.province : undefined,
      ship_postal_code: isDelivery ? shipping.postal_code : undefined,
      subtotal,
      shipping_total: shippingTotal,
      tps,
      tvq,
      total,
      items: orderItems,
    };

    try {
      await sendOrderConfirmationEmails(orderInfo);
      await supabase
        .from("order_status_history")
        .update({ email_sent: true })
        .eq("order_id", orderId)
        .eq("status", "paid");
    } catch (e) {
      console.error("Email send error (non-blocking):", e.message);
    }

    return jsonResponse({ ok: true, order_number: orderNumber, total });
  } catch (err) {
    console.error("create-order error:", err);
    return jsonResponse({ ok: false, error: "Erreur interne" }, 500);
  }
});
