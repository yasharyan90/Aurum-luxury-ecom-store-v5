// src/lib/productService.js
import { supabase } from './supabase';
import { MOCK_PRODUCTS } from './mockData';

const isConfigured = () =>
  process.env.REACT_APP_SUPABASE_URL &&
  process.env.REACT_APP_SUPABASE_URL !== 'https://placeholder.supabase.co';

// ── Fetch all products (with optional filters) ────────────
export async function fetchProducts({ category = '', search = '', limit = 50 } = {}) {
  if (!isConfigured()) {
    let products = [...MOCK_PRODUCTS];
    if (category) products = products.filter(p => p.category === category);
    if (search)   products = products.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase())
    );
    return products.slice(0, limit);
  }
  try {
    let query = supabase.from('products').select('*').eq('is_active', true).limit(limit);
    if (category) query = query.eq('category', category);
    if (search)   query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%`);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('fetchProducts error:', err);
    return MOCK_PRODUCTS;
  }
}

// ── Fetch single product by ID ───────────────────────────
export async function fetchProductById(id) {
  if (!isConfigured()) return MOCK_PRODUCTS.find(p => p.id === String(id)) || null;
  try {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  } catch {
    return MOCK_PRODUCTS.find(p => p.id === String(id)) || null;
  }
}

// ── Create product (owner only) ──────────────────────────
export async function createProduct(productData) {
  if (!isConfigured()) {
    const newProduct = { ...productData, id: String(Date.now()), rating: 0, reviews: 0, is_active: true };
    MOCK_PRODUCTS.push(newProduct);
    return newProduct;
  }
  const { data, error } = await supabase.from('products').insert([productData]).select().single();
  if (error) throw error;
  return data;
}

// ── Update product (owner only) ──────────────────────────
export async function updateProduct(id, productData) {
  if (!isConfigured()) {
    const idx = MOCK_PRODUCTS.findIndex(p => p.id === String(id));
    if (idx > -1) Object.assign(MOCK_PRODUCTS[idx], productData);
    return MOCK_PRODUCTS[idx];
  }
  const { data, error } = await supabase.from('products').update(productData).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

// ── Delete product (owner only, soft delete) ─────────────
export async function deleteProduct(id) {
  if (!isConfigured()) {
    const idx = MOCK_PRODUCTS.findIndex(p => p.id === String(id));
    if (idx > -1) MOCK_PRODUCTS.splice(idx, 1);
    return true;
  }
  const { error } = await supabase.from('products').update({ is_active: false }).eq('id', id);
  if (error) throw error;
  return true;
}
