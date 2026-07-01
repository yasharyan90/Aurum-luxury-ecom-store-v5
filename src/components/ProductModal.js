// src/components/ProductModal.js
import React, { useState, useEffect, useRef } from 'react';
import styles from './ProductModal.module.css';

const EMOJI_OPTIONS = ['💎','💍','⌚','👜','🌹','🧡','💙','💚','🖤','💼','🌕','👑','✨','🪙','🏺'];
const CATEGORIES = ['Jewellery','Watches','Clothing','Accessories','Fragrance'];

export default function ProductModal({ product = null, onClose, onSave }) {
  const isEdit = Boolean(product);
  const [form, setForm]   = useState({ brand:'', name:'', category:'', description:'', price:'', stock:'', emoji:'💎', tags:'', badge:'' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Image state
  const [images, setImages]           = useState([]); // { id, url, file?, isExisting }
  const [activeIdx, setActiveIdx]     = useState(0);
  const [dragOver, setDragOver]       = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (product) {
      setForm({
        brand:       product.brand || '',
        name:        product.name  || '',
        category:    product.category || '',
        description: product.description || '',
        price:       product.price || '',
        stock:       product.stock ?? '',
        emoji:       product.emoji || '💎',
        tags:        Array.isArray(product.tags) ? product.tags.join(', ') : (product.tags || ''),
        badge:       product.badge || '',
      });
      // Load existing images
      const existing = [];
      if (product.image_url) {
        existing.push({ id: 'existing-0', url: product.image_url, isExisting: true });
      }
      if (Array.isArray(product.images)) {
        product.images.forEach((url, i) => {
          if (url && url !== product.image_url) {
            existing.push({ id: `existing-${i+1}`, url, isExisting: true });
          }
        });
      }
      setImages(existing);
      setActiveIdx(0);
    }
  }, [product]);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  // ── Image handlers ──────────────────────────────────────
  const addFiles = (files) => {
    const newImgs = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .slice(0, 10 - images.length) // max 10 total
      .map(file => ({
        id: `new-${Date.now()}-${Math.random()}`,
        url: URL.createObjectURL(file),
        file,
        isExisting: false,
      }));
    if (!newImgs.length) return;
    setImages(prev => {
      const next = [...prev, ...newImgs];
      setActiveIdx(next.length - 1);
      return next;
    });
  };

  const removeImage = (id) => {
    setImages(prev => {
      const next = prev.filter(img => img.id !== id);
      setActiveIdx(i => Math.min(i, Math.max(0, next.length - 1)));
      return next;
    });
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  // Convert File to base64 data URL (for saving in mock/demo mode)
  const toBase64 = (file) => new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });

  const handleSubmit = async () => {
    if (!form.brand || !form.name || !form.category || !form.price) {
      setError('Please fill in all required fields.'); return;
    }
    setSaving(true); setError('');
    try {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);

      // Resolve image URLs (convert new file blobs → base64 for demo)
      const resolvedImages = await Promise.all(
        images.map(async img => {
          if (img.isExisting) return img.url;
          return img.file ? await toBase64(img.file) : img.url;
        })
      );

      await onSave({
        brand:       form.brand.trim(),
        name:        form.name.trim(),
        category:    form.category,
        description: form.description.trim(),
        price:       parseFloat(form.price),
        stock:       parseInt(form.stock) || 0,
        emoji:       form.emoji || '💎',
        tags,
        badge:       form.badge.trim() || null,
        image_url:   resolvedImages[0] || null,
        images:      resolvedImages,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  const activeImage = images[activeIdx];

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-label={isEdit ? 'Edit Product' : 'Add Product'}>
        <button className={styles.close} onClick={onClose} aria-label="Close">✕</button>
        <h2 className={styles.title}>{isEdit ? 'Edit Product' : 'Add New Product'}</h2>

        {error && <div className="msg msg-error">{error}</div>}

        {/* ── Image Upload Section ── */}
        <div className={styles.imageSection}>
          {/* Main Preview */}
          <div
            className={`${styles.mainPreview} ${dragOver ? styles.dragActive : ''} ${images.length === 0 ? styles.emptyPreview : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => images.length === 0 && fileInputRef.current?.click()}
          >
            {activeImage ? (
              <>
                <img src={activeImage.url} alt="Product" className={styles.previewImg} />
                {/* Emoji badge top-left */}
                <div className={styles.emojiBadge}>{form.emoji || '💎'}</div>
                {/* Remove button */}
                <button
                  className={styles.removeImgBtn}
                  onClick={(e) => { e.stopPropagation(); removeImage(activeImage.id); }}
                  title="Remove image"
                >✕</button>
                {/* Image counter */}
                {images.length > 1 && (
                  <div className={styles.imgCounter}>{activeIdx + 1} / {images.length}</div>
                )}
              </>
            ) : (
              <div className={styles.uploadPrompt}>
                <div className={styles.uploadIcon}>🖼</div>
                <p className={styles.uploadText}>Drop images here or <span>click to browse</span></p>
                <p className={styles.uploadHint}>PNG, JPG, WEBP · up to 10 images</p>
              </div>
            )}
          </div>

          {/* Thumbnails row */}
          {images.length > 0 && (
            <div className={styles.thumbRow}>
              {images.map((img, i) => (
                <button
                  key={img.id}
                  className={`${styles.thumb} ${i === activeIdx ? styles.thumbActive : ''}`}
                  onClick={() => setActiveIdx(i)}
                >
                  <img src={img.url} alt={`thumb-${i}`} className={styles.thumbImg} />
                </button>
              ))}
              {images.length < 10 && (
                <button
                  className={styles.thumbAdd}
                  onClick={() => fileInputRef.current?.click()}
                  title="Add more images"
                >+</button>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className={styles.hiddenInput}
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>

        {/* ── Emoji Picker (compact, below image) ── */}
        <div className="form-group" style={{marginBottom:'1.25rem'}}>
          <label className="form-label">Emoji Icon <span style={{color:'#8C8278',fontSize:11,fontWeight:400}}>(shown as badge on image)</span></label>
          <div className={styles.emojiPicker}>
            {EMOJI_OPTIONS.map(e => (
              <button
                key={e}
                className={`${styles.emojiBtn} ${form.emoji === e ? styles.emojiSelected : ''}`}
                onClick={() => setForm(f => ({ ...f, emoji: e }))}
                type="button"
              >{e}</button>
            ))}
          </div>
        </div>

        {/* ── Product Fields ── */}
        <div className={styles.grid}>
          <div className="form-group">
            <label className="form-label">Brand *</label>
            <input className="form-input" value={form.brand} onChange={set('brand')} placeholder="e.g. Maison Aurum" />
          </div>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select className="form-input form-select" value={form.category} onChange={set('category')}>
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Product Name *</label>
          <input className="form-input" value={form.name} onChange={set('name')} placeholder="e.g. Diamond Eternal Ring" />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-textarea" value={form.description} onChange={set('description')} placeholder="Describe this piece…" rows={3} />
        </div>

        <div className={styles.grid}>
          <div className="form-group">
            <label className="form-label">Price (₹) *</label>
            <input className="form-input" type="number" value={form.price} onChange={set('price')} placeholder="285000" min="0" />
          </div>
          <div className="form-group">
            <label className="form-label">Stock Quantity</label>
            <input className="form-input" type="number" value={form.stock} onChange={set('stock')} placeholder="10" min="0" />
          </div>
        </div>

        <div className={styles.grid}>
          <div className="form-group">
            <label className="form-label">Badge Label</label>
            <input className="form-input" value={form.badge} onChange={set('badge')} placeholder="e.g. Bestseller, Rare, New" />
          </div>
          <div className="form-group">
            <label className="form-label">Tags (comma separated)</label>
            <input className="form-input" value={form.tags} onChange={set('tags')} placeholder="new arrival, bestseller" />
          </div>
        </div>

        <div className={styles.actions}>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : (isEdit ? 'Update Product' : 'Add Product')}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
