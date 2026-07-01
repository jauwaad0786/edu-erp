import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar  from '../../components/Navbar';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

function prettyLabel(v) {
  if (!v) return '';
  return v.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
}

function StatCard({ icon, label, value, sub, color, darkMode }) {
  return (
    <div className="stat-card" style={{ background: darkMode ? '#141b2d' : undefined, borderColor: darkMode ? '#1e293b' : undefined }}>
      <div className="stat-icon" style={{ background: color + '16' }}>
        <i className={`ti ${icon}`} style={{ fontSize: 18, color }} aria-hidden="true" />
      </div>
      <div className="stat-label" style={{ color: darkMode ? '#94a3b8' : undefined }}>{label}</div>
      <div className="stat-value" style={{ color }}>{value ?? '—'}</div>
      {sub && <div className="stat-sub" style={{ color: darkMode ? '#64748b' : undefined }}>{sub}</div>}
    </div>
  );
}

const EMPTY_FORM = {
  name: '', contact_person: '', phone: '', email: '', address: '',
  gst_number: '', pan_number: '', category: 'OTHER', notes: '',
};

export default function VendorsPage() {
  const { user } = useAuth();
  const isPrincipal = user?.role === 'PRINCIPAL';

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('ederp_theme') === 'dark');
  useEffect(() => { localStorage.setItem('ederp_theme', darkMode ? 'dark' : 'light'); }, [darkMode]);

  const [meta, setMeta]           = useState({ categories: [] });
  const [vendors, setVendors]     = useState([]);
  const [loading, setLoading]     = useState(true);

  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch]                 = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);

  const [historyVendor, setHistoryVendor] = useState(null);
  const [historyData, setHistoryData]     = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    api.get('/finance/vendors/meta').then(r => setMeta(r.data)).catch(() => {});
  }, []);

  const load = () => {
    setLoading(true);
    const params = {};
    if (categoryFilter) params.category = categoryFilter;
    if (search.trim())  params.search = search.trim();
    api.get('/finance/vendors', { params })
      .then(r => setVendors(r.data || []))
      .catch(() => setVendors([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [categoryFilter, search]);

  const fmt = n => Number(n || 0).toLocaleString('en-IN');
  const cardBg = { background: darkMode ? '#141b2d' : undefined, borderColor: darkMode ? '#1e293b' : undefined };

  const openAdd = () => { setForm(EMPTY_FORM); setModalOpen(true); };

  const save = async () => {
    if (!form.name.trim()) { alert('Vendor ka naam zaroori hai'); return; }
    setSaving(true);
    try {
      await api.post('/finance/vendors', form);
      setModalOpen(false);
      load();
    } catch (err) {
      alert(err?.response?.data?.error || 'Save nahi hua, dobara try karo');
    }
    setSaving(false);
  };

  const remove = async (id) => {
    if (!window.confirm('Ye vendor remove karna hai?')) return;
    try {
      await api.delete(`/finance/vendors/${id}`);
      load();
    } catch {
      alert('Delete nahi hua');
    }
  };

  const openHistory = async (v) => {
    setHistoryVendor(v);
    setHistoryLoading(true);
    try {
      const r = await api.get(`/finance/vendors/${v.id}/history`);
      setHistoryData(r.data);
    } catch {
      setHistoryData(null);
    }
    setHistoryLoading(false);
  };

  return (
    <div className={`app-shell${darkMode ? ' theme-dark' : ''}`}>
      <Sidebar darkMode={darkMode} />
      <div className="main-content">
        <Navbar title="Vendors" darkMode={darkMode} onToggleDark={() => setDarkMode(d => !d)} />
        <div className="page-body">

          <div className="page-header flex justify-between items-center">
            <div>
              <h2 className="page-title">Vendor Management</h2>
              <p className="page-subtitle">Suppliers, GST/PAN details aur unki purchase history</p>
            </div>
            {isPrincipal && (
              <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={openAdd}>
                <i className="ti ti-plus" style={{ fontSize: 14 }} aria-hidden="true" /> Add Vendor
              </button>
            )}
          </div>

          <div className="grid-4 mb-6">
            <StatCard icon="ti-building-store" label="Total Vendors" value={vendors.length}
              sub="Active suppliers" color="#4f46e5" darkMode={darkMode} />
            <StatCard icon="ti-category" label="Categories" value={meta.categories.length}
              sub="Vendor types" color="#7c3aed" darkMode={darkMode} />
          </div>

          <div className="card" style={{ margin: 0, ...cardBg }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="ti ti-building-store" style={{ color: '#4f46e5', fontSize: 17 }} aria-hidden="true" /> Vendors
              </h4>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input className="form-input" placeholder="Search vendors..." style={{ width: 170, fontSize: 12 }}
                  value={search} onChange={e => setSearch(e.target.value)} />
                <select className="form-select" style={{ width: 160, fontSize: 12 }} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                  <option value="">All Categories</option>
                  {meta.categories.map(c => <option key={c} value={c}>{prettyLabel(c)}</option>)}
                </select>
              </div>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Vendor</th><th>Category</th><th>Contact</th>
                    <th>Phone</th><th>GST</th><th>Rating</th>
                    {isPrincipal && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--neutral-4)' }}>Loading...</td></tr>
                  ) : vendors.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--neutral-4)' }}>Koi vendor nahi mila</td></tr>
                  ) : vendors.map(v => (
                    <tr key={v.id}>
                      <td>
                        <div onClick={() => openHistory(v)} style={{ fontWeight: 600, fontSize: 13, color: '#4f46e5', cursor: 'pointer' }}>
                          {v.name}
                        </div>
                        {v.address && <div style={{ fontSize: 11, color: 'var(--neutral-5)' }}>{v.address}</div>}
                      </td>
                      <td style={{ fontSize: 12 }}>{prettyLabel(v.category)}</td>
                      <td style={{ fontSize: 12 }}>{v.contact_person || '—'}</td>
                      <td style={{ fontSize: 12 }}>{v.phone || '—'}</td>
                      <td style={{ fontSize: 12 }}>{v.gst_number || '—'}</td>
                      <td>
                        {v.rating > 0 ? (
                          <span style={{ fontSize: 12 }}>{'★'.repeat(v.rating)}{'☆'.repeat(5 - v.rating)}</span>
                        ) : <span style={{ fontSize: 12, color: 'var(--neutral-5)' }}>—</span>}
                      </td>
                      {isPrincipal && (
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => openHistory(v)} title="Purchase History" style={{
                              background: 'none', border: 'none', cursor: 'pointer', color: '#4f46e5', padding: 4,
                            }}><i className="ti ti-history" style={{ fontSize: 15 }} aria-hidden="true" /></button>
                            <button onClick={() => remove(v.id)} title="Delete" style={{
                              background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 4,
                            }}><i className="ti ti-trash" style={{ fontSize: 15 }} aria-hidden="true" /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add Vendor Modal */}
      {modalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setModalOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: darkMode ? '#141b2d' : '#fff', borderRadius: 14, width: 500, maxWidth: '92vw',
            maxHeight: '88vh', overflowY: 'auto', padding: 24,
          }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 16, color: darkMode ? '#f1f5f9' : '#0f172a' }}>Add Vendor</h3>
            <p style={{ margin: '0 0 18px', fontSize: 12, color: darkMode ? '#94a3b8' : '#64748b' }}>
              Ye naam Expense/Inventory forms mein vendor field se exactly match hona chahiye taaki purchase history connect ho
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="form-label">Vendor Name *</label>
                <input className="form-input" placeholder="e.g. ABC Stationery" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Category</label>
                  <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {meta.categories.map(c => <option key={c} value={c}>{prettyLabel(c)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Contact Person</label>
                  <input className="form-input" value={form.contact_person}
                    onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="form-label">Address</label>
                <input className="form-input" value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">GST Number</label>
                  <input className="form-input" value={form.gst_number}
                    onChange={e => setForm(f => ({ ...f, gst_number: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">PAN Number</label>
                  <input className="form-input" value={form.pan_number}
                    onChange={e => setForm(f => ({ ...f, pan_number: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="form-label">Notes</label>
                <input className="form-input" value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button className="btn btn-neutral btn-sm" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" disabled={saving} onClick={save}>
                {saving ? 'Saving...' : 'Save Vendor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purchase History Modal */}
      {historyVendor && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => { setHistoryVendor(null); setHistoryData(null); }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: darkMode ? '#141b2d' : '#fff', borderRadius: 14, width: 620, maxWidth: '92vw',
            maxHeight: '85vh', overflowY: 'auto', padding: 24,
          }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 16, color: darkMode ? '#f1f5f9' : '#0f172a' }}>
              {historyVendor.name} — Purchase History
            </h3>

            {historyLoading ? (
              <div style={{ textAlign: 'center', padding: 30, color: 'var(--neutral-4)' }}>Loading...</div>
            ) : !historyData ? (
              <div style={{ textAlign: 'center', padding: 30, color: 'var(--neutral-4)' }}>Data nahi mila</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                  <div style={{ border: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}`, borderRadius: 10, padding: '12px 16px' }}>
                    <div style={{ fontSize: 11, color: darkMode ? '#94a3b8' : '#64748b' }}>Total Spent</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#16a34a' }}>₹{fmt(historyData.total_spent)}</div>
                  </div>
                  <div style={{ border: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}`, borderRadius: 10, padding: '12px 16px' }}>
                    <div style={{ fontSize: 11, color: darkMode ? '#94a3b8' : '#64748b' }}>Pending Payment</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#d97706' }}>₹{fmt(historyData.total_pending)}</div>
                  </div>
                </div>

                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: darkMode ? '#e2e8f0' : '#0f172a' }}>Expenses</div>
                <div className="table-container" style={{ marginBottom: 16 }}>
                  <table>
                    <thead><tr><th>Title</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                    <tbody>
                      {historyData.expenses.length === 0 ? (
                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: 16, color: 'var(--neutral-4)' }}>Koi expense nahi</td></tr>
                      ) : historyData.expenses.map(e => (
                        <tr key={e.id}>
                          <td style={{ fontSize: 12 }}>{e.title}</td>
                          <td style={{ fontSize: 12, fontWeight: 700 }}>₹{fmt(e.amount)}</td>
                          <td style={{ fontSize: 12 }}>{e.status}</td>
                          <td style={{ fontSize: 12 }}>{e.payment_date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: darkMode ? '#e2e8f0' : '#0f172a' }}>Inventory Items</div>
                <div className="table-container">
                  <table>
                    <thead><tr><th>Item</th><th>Qty</th><th>Value</th><th>Date</th></tr></thead>
                    <tbody>
                      {historyData.inventory_items.length === 0 ? (
                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: 16, color: 'var(--neutral-4)' }}>Koi item nahi</td></tr>
                      ) : historyData.inventory_items.map(i => (
                        <tr key={i.id}>
                          <td style={{ fontSize: 12 }}>{i.name}</td>
                          <td style={{ fontSize: 12 }}>{i.quantity}</td>
                          <td style={{ fontSize: 12, fontWeight: 700 }}>₹{fmt(i.total_value)}</td>
                          <td style={{ fontSize: 12 }}>{i.purchase_date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
              <button className="btn btn-neutral btn-sm" onClick={() => { setHistoryVendor(null); setHistoryData(null); }}>Close</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .theme-dark { background: #0b1220; }
        .theme-dark .main-content { background: #0b1220; }
        .theme-dark .card, .theme-dark .stat-card { background: #141b2d !important; border-color: #1e293b !important; }
        .theme-dark .card-header { border-color: #1e293b !important; }
        .theme-dark h2, .theme-dark h3, .theme-dark h4, .theme-dark .page-title, .theme-dark .stat-value { color: #f1f5f9 !important; }
        .theme-dark .page-subtitle, .theme-dark .stat-label, .theme-dark .stat-sub { color: #94a3b8 !important; }
        .theme-dark .table-container, .theme-dark table { background: #141b2d !important; }
        .theme-dark th { background: #1c2436 !important; color: #94a3b8 !important; border-color: #1e293b !important; }
        .theme-dark td { border-color: #1e293b !important; color: #cbd5e1 !important; }
        .theme-dark .btn-neutral { background: #1e293b !important; color: #cbd5e1 !important; border-color: #334155 !important; }
        .theme-dark .form-select, .theme-dark .form-input { background: #0f172a !important; color: #e2e8f0 !important; border-color: #334155 !important; }
        .theme-dark .form-label { color: #94a3b8 !important; }
      `}</style>
    </div>
  );
}
