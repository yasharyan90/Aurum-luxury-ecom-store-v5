// src/components/VariantSelector.js
import React from 'react';
import { getVariantsForCategory } from '../lib/variantConfig';
import styles from './VariantSelector.module.css';

export default function VariantSelector({ category, selected, onChange }) {
    const variantGroups = getVariantsForCategory(category);
    const keys = Object.keys(variantGroups);
    if (!keys.length) return null;

    return (
        <div className={styles.wrap}>
            {keys.map(key => {
                const group = variantGroups[key];
                const current = selected[key] || '';
                return (
                    <div key={key} className={styles.group}>
                        <div className={styles.groupHeader}>
                            <span className={styles.label}>{group.label}</span>
                            {current && <span className={styles.selected}>{current}</span>}
                        </div>

                        {/* Size-style chip selector */}
                        <div className={styles.chips}>
                            {group.options.map(opt => (
                                <button
                                    key={opt}
                                    type="button"
                                    className={`${styles.chip} ${current === opt ? styles.chipActive : ''}`}
                                    onClick={() => onChange({ ...selected, [key]: opt })}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>

                        {group.hint && !current && (
                            <p className={styles.hint}>⚠ {group.hint}</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
