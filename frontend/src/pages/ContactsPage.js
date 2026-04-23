import React, { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';
import styles from './ContactsPage.module.css';

const relationships = ['mother', 'father', 'sister', 'brother', 'husband', 'friend', 'colleague', 'other'];
const emptyForm = { name: '', phone: '', email: '', relationship: 'other', isPrimary: false };

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadContacts(); }, []);

  const loadContacts = async () => {
    try {
      const { data } = await userAPI.getContacts();
      setContacts(data.contacts);
    } catch { toast.error('Failed to load contacts'); }
    finally { setLoading(false); }
  };

  const handleChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) return toast.error('Name and phone are required');
    setSaving(true);
    try {
      if (editId) {
        await userAPI.updateContact(editId, form);
        toast.success('Contact updated!');
      } else {
        await userAPI.addContact(form);
        toast.success('Contact added!');
      }
      resetForm();
      loadContacts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save contact');
    } finally { setSaving(false); }
  };

  const handleEdit = (c) => {
    setForm({ name: c.name, phone: c.phone, email: c.email || '', relationship: c.relationship, isPrimary: c.isPrimary });
    setEditId(c._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    try {
      await userAPI.deleteContact(id);
      toast.success('Contact removed');
      loadContacts();
    } catch { toast.error('Failed to delete contact'); }
  };

  const resetForm = () => { setForm(emptyForm); setEditId(null); setShowForm(false); };

  const relEmoji = { mother: '👩', father: '👨', sister: '👧', brother: '👦', husband: '💑', friend: '🤝', colleague: '💼', other: '👤' };

  return (
    <div className={`fade-in ${styles.page}`}>
      <div className={styles.header}>
        <div>
          <h1 className="section-title">Emergency Contacts</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Add up to 5 trusted people who will be alerted in an emergency ({contacts.length}/5)
          </p>
        </div>
        {!showForm && contacts.length < 5 && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>+ Add Contact</button>
        )}
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="card fade-in">
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, marginBottom: 20 }}>
            {editId ? 'Edit Contact' : 'Add Emergency Contact'}
          </h3>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label>Full Name *</label>
                <input name="name" placeholder="Contact's full name" value={form.name} onChange={handleChange} required />
              </div>
              <div className={styles.field}>
                <label>Phone Number *</label>
                <input name="phone" placeholder="+91 9876543210" value={form.phone} onChange={handleChange} required />
              </div>
              <div className={styles.field}>
                <label>Email Address</label>
                <input type="email" name="email" placeholder="contact@email.com" value={form.email} onChange={handleChange} />
              </div>
              <div className={styles.field}>
                <label>Relationship</label>
                <select name="relationship" value={form.relationship} onChange={handleChange}>
                  {relationships.map(r => (
                    <option key={r} value={r}>{relEmoji[r]} {r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            <label className={styles.checkLabel}>
              <input type="checkbox" name="isPrimary" checked={form.isPrimary} onChange={handleChange} />
              <span>Set as primary emergency contact</span>
            </label>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : editId ? 'Update Contact' : 'Add Contact'}
              </button>
              <button type="button" className="btn-ghost" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Contacts list */}
      {loading ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>Loading contacts...</div>
      ) : contacts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, marginBottom: 8 }}>No contacts yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
            Add trusted contacts so they can be notified during an emergency.
          </p>
          <button className="btn-primary" onClick={() => setShowForm(true)}>Add First Contact</button>
        </div>
      ) : (
        <div className={styles.contactsGrid}>
          {contacts.map((c) => (
            <div key={c._id} className={`card ${styles.contactCard} ${c.isPrimary ? styles.primaryCard : ''}`}>
              {c.isPrimary && (
                <div className={styles.primaryBadge}>
                  <span className="badge badge-pink">★ PRIMARY</span>
                </div>
              )}
              <div className={styles.cardHeader}>
                <div className={styles.bigAvatar}>{c.name.charAt(0)}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {relEmoji[c.relationship]} {c.relationship.charAt(0).toUpperCase() + c.relationship.slice(1)}
                  </div>
                </div>
              </div>
              <div className={styles.contactDetails}>
                <div className={styles.detailRow}><span>📱</span><span>{c.phone}</span></div>
                {c.email && <div className={styles.detailRow}><span>✉️</span><span>{c.email}</span></div>}
                <div className={styles.detailRow}>
                  <span>🔔</span>
                  <span style={{ color: c.isNotified ? 'var(--success)' : 'var(--text-muted)' }}>
                    {c.isNotified ? 'Notifications enabled' : 'Notifications off'}
                  </span>
                </div>
              </div>
              <div className={styles.cardActions}>
                <button className="btn-ghost" style={{ flex: 1, fontSize: 13, padding: '8px' }}
                  onClick={() => handleEdit(c)}>✏️ Edit</button>
                <button style={{ flex: 1, background: '#ff475712', border: '1px solid #ff475744', color: 'var(--danger)', borderRadius: 8, padding: 8, fontSize: 13, cursor: 'pointer' }}
                  onClick={() => handleDelete(c._id, c.name)}>🗑 Delete</button>
              </div>
            </div>
          ))}

          {/* Add more slot */}
          {contacts.length < 5 && !showForm && (
            <button className={styles.addSlot} onClick={() => setShowForm(true)}>
              <span style={{ fontSize: 28 }}>+</span>
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Add Contact</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{5 - contacts.length} slot{5 - contacts.length !== 1 ? 's' : ''} remaining</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
