// src/components/TableSkeleton.js
// Skeleton rows for AdminPage product/order tables.
import React from 'react';

export default function TableSkeleton({ rows = 5, cols = 5 }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, r) => (
                <tr key={r} aria-hidden="true">
                    {Array.from({ length: cols }).map((_, c) => (
                        <td key={c} style={{ padding: '14px 16px' }}>
                            <div
                                className="skeleton skeleton-text"
                                style={{ marginBottom: 0, width: c === 0 ? '85%' : '60%' }}
                            />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}
