// src/lib/couponService.js

// Demo coupons — replace with Supabase table later
const DEMO_COUPONS = [
    { code: 'AURUM10',  type: 'percent', value: 10, minOrder: 10000,  description: '10% off on orders above ₹10,000'  },
    { code: 'FLAT5000', type: 'flat',    value: 5000, minOrder: 50000, description: '₹5,000 off on orders above ₹50,000' },
    { code: 'WELCOME',  type: 'percent', value: 15, minOrder: 0,      description: '15% off — Welcome offer'           },
    { code: 'LUXURY20', type: 'percent', value: 20, minOrder: 100000, description: '20% off on orders above ₹1,00,000' },
];

export function validateCoupon(code, subtotal) {
    const coupon = DEMO_COUPONS.find(c => c.code === code.trim().toUpperCase());

    if (!coupon) return { valid: false, message: 'Invalid promo code.' };

    if (subtotal < coupon.minOrder) {
        return {
            valid: false,
            message: `Minimum order of ₹${coupon.minOrder.toLocaleString('en-IN')} required for this code.`,
        };
    }

    const discount =
        coupon.type === 'percent'
            ? Math.round((subtotal * coupon.value) / 100)
            : coupon.value;

    return { valid: true, coupon, discount, message: coupon.description };
}