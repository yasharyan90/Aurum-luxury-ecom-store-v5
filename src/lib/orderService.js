// src/lib/orderService.js
import { supabase } from './supabase';
import { MOCK_ORDERS } from './mockData';
import { sendOrderConfirmationEmail } from './emailService';

const isConfigured = () =>
  process.env.REACT_APP_SUPABASE_URL &&
  !process.env.REACT_APP_SUPABASE_URL.includes('placeholder');

// ── Place a new order ─────────────────────────────────────────
export async function placeOrder({ userId, items, subtotal, tax, total, address, paymentId, paymentMethod }) {
  const orderData = {
    user_id:        userId,
    status:         'paid',
    subtotal,
    tax,
    total,
    address,
    payment_id:     paymentId || null,
    payment_method: paymentMethod || 'razorpay',
  };

  let order;

  if (!isConfigured()) {
    // Demo mode
    order = {
      ...orderData,
      id:            'ORD-' + Date.now(),
      created_at:    new Date().toISOString(),
      customer_name: address?.full_name || 'Customer',
      order_items:   items.map(item => ({
        product_name: item.name,
        price:        item.price,
        quantity:     item.qty,
        emoji:        item.emoji,
        products:     { name: item.name, emoji: item.emoji },
      })),
    };
    MOCK_ORDERS.unshift(order);
  } else {
    // Real Supabase
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();
    if (orderError) throw orderError;

    const orderItems = items.map(item => ({
      order_id:     newOrder.id,
      product_id:   item.id,
      product_name: item.name,
      price:        item.price,
      quantity:     item.qty,
    }));
    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) throw itemsError;

    order = { ...newOrder, order_items: orderItems };
  }

  // ── Send confirmation email (non-blocking) ──────────────
  sendOrderConfirmationEmail({ order, items: order.order_items || items.map(i => ({ ...i, quantity: i.qty })), address })
    .catch(err => console.warn('Email send skipped:', err));

  return order;
}

// ── Fetch orders for a specific user ─────────────────────────
export async function fetchUserOrders(userId) {
  if (!isConfigured()) {
    return MOCK_ORDERS.filter(o => o.user_id === userId || true).slice(0, 5); // demo: show all
  }
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id, product_name, price, quantity,
          products ( name, emoji, brand, category )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('fetchUserOrders error:', err);
    return [];
  }
}

// ── Fetch all orders (owner) ──────────────────────────────────
export async function fetchOrders(userId = null) {
  if (!isConfigured()) return MOCK_ORDERS;
  try {
    let query = supabase
      .from('orders')
      .select(`
        *,
        profiles:user_id (full_name, email),
        order_items (*, products (name, emoji))
      `)
      .order('created_at', { ascending: false });
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch { return MOCK_ORDERS; }
}

// ── Update order status (owner) ───────────────────────────────
export async function updateOrderStatus(orderId, status) {
  if (!isConfigured()) {
    const order = MOCK_ORDERS.find(o => o.id === orderId);
    if (order) order.status = status;
    return order;
  }
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
