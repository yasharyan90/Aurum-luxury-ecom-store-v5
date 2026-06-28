// src/lib/profileService.js
import { supabase } from './supabase';

const isConfigured = () =>
    process.env.REACT_APP_SUPABASE_URL &&
    !process.env.REACT_APP_SUPABASE_URL.includes('placeholder');

// ── In-memory demo store ──────────────────────────────────
const DEMO_STORE = { profile: null, addresses: [] };

// ─────────────────────────────────────────────────────────
//  PROFILE
// ─────────────────────────────────────────────────────────

export async function fetchProfile(userId) {
    if (!isConfigured()) return DEMO_STORE.profile;
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    if (error) throw error;
    return data;
}

export async function updateProfile(userId, updates) {
    if (!isConfigured()) {
        DEMO_STORE.profile = { id: userId, ...DEMO_STORE.profile, ...updates };
        return DEMO_STORE.profile;
    }
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
    if (error) throw error;
    return data;
}

// ─────────────────────────────────────────────────────────
//  ADDRESSES
// ─────────────────────────────────────────────────────────

export async function fetchAddresses(userId) {
    if (!isConfigured()) return DEMO_STORE.addresses;
    const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });
    if (error) throw error;
    return data || [];
}

export async function addAddress(userId, addr) {
    if (!isConfigured()) {
        const newAddr = {
            id: 'addr-' + Date.now(),
            user_id: userId,
            ...addr,
            is_default: DEMO_STORE.addresses.length === 0,
            created_at: new Date().toISOString(),
        };
        if (newAddr.is_default) {
            DEMO_STORE.addresses.forEach(a => (a.is_default = false));
        }
        DEMO_STORE.addresses.unshift(newAddr);
        return newAddr;
    }
    // If this is the first address, make it default
    const existing = await fetchAddresses(userId);
    const isFirst  = existing.length === 0;
    const { data, error } = await supabase
        .from('addresses')
        .insert([{ user_id: userId, ...addr, is_default: isFirst }])
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function updateAddress(addressId, updates) {
    if (!isConfigured()) {
        const addr = DEMO_STORE.addresses.find(a => a.id === addressId);
        if (addr) Object.assign(addr, updates);
        return addr;
    }
    const { data, error } = await supabase
        .from('addresses')
        .update(updates)
        .eq('id', addressId)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function deleteAddress(addressId) {
    if (!isConfigured()) {
        DEMO_STORE.addresses = DEMO_STORE.addresses.filter(a => a.id !== addressId);
        return;
    }
    const { error } = await supabase.from('addresses').delete().eq('id', addressId);
    if (error) throw error;
}

export async function setDefaultAddress(userId, addressId) {
    if (!isConfigured()) {
        DEMO_STORE.addresses.forEach(a => (a.is_default = a.id === addressId));
        return;
    }
    // Clear all defaults then set new one
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId);
    const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', addressId);
    if (error) throw error;
}
