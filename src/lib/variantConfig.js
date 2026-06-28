// src/lib/variantConfig.js
// Central config — defines which variants each category supports

export const VARIANT_CONFIG = {
    Jewellery: {
        material: {
            label: 'Material',
            options: ['18k Yellow Gold', '18k White Gold', '18k Rose Gold', 'Platinum', 'Sterling Silver'],
        },
        size: {
            label: 'Ring Size',
            options: ['5', '6', '7', '8', '9', '10', '11', '12'],
            hint: 'Use a ring sizer or measure inner diameter in mm',
        },
    },
    Watches: {
        material: {
            label: 'Case Material',
            options: ['Stainless Steel', 'Rose Gold PVD', 'Yellow Gold PVD', 'Titanium', 'Black PVD'],
        },
        strap: {
            label: 'Strap',
            options: ['Leather - Black', 'Leather - Brown', 'Steel Bracelet', 'Rubber - Black'],
        },
    },
    Accessories: {
        color: {
            label: 'Color',
            options: ['Black', 'Tan', 'Burgundy', 'Navy', 'Obsidian', 'Cognac'],
        },
    },
    Fragrance: {
        size: {
            label: 'Size',
            options: ['30ml', '50ml', '100ml', '200ml'],
        },
    },
    Clothing: {
        size: {
            label: 'Size',
            options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
            hint: 'See size guide below',
        },
        color: {
            label: 'Colour',
            options: ['Ivory', 'Midnight Black', 'Champagne', 'Slate Grey', 'Burgundy', 'Forest Green', 'Navy'],
        },
    },
};

// Returns variant groups for a given category
export function getVariantsForCategory(category) {
    return VARIANT_CONFIG[category] || {};
}
