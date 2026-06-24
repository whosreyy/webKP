import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Trash2, Plus, Minus, CreditCard, XCircle, Save, Printer, ShoppingBag, X, LogOut, CheckCircle, Wallet, Info } from 'lucide-react';

const POS = () => {
  const { token, user, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [activeShift, setActiveShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [showEndShiftModal, setShowEndShiftModal] = useState(false);
  const [shiftSummary, setShiftSummary] = useState(null);
  const [actualCash, setActualCash] = useState('');
  const [paymentData, setPaymentData] = useState({ amountPaid: '', method: 'cash' });
  const [paymentError, setPaymentError] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [storeSettings, setStoreSettings] = useState(null);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [showPendingModal, setShowPendingModal] = useState(false);

  const searchInputRef = useRef(null);

  useEffect(() => {
    fetchProducts();
    checkActiveShift();
    fetchSettings();
    fetchPendingTransactions();
  }, []);

  const formatIDR = (num) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);

  const fetchSettings = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/settings');
      const data = await res.json();
      setStoreSettings(data);
    } catch (err) { console.error(err); }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/products', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setProducts(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchPendingTransactions = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/transactions/pending', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setPendingTransactions(data);
    } catch (err) { console.error(err); }
  };

  const checkActiveShift = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/shifts/active', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setActiveShift(data);
    } catch (err) { console.error(err); }
  };

  const startShift = async (initialCash) => {
    if (!initialCash) return alert('Masukkan modal!');
    try {
      const res = await fetch('http://localhost:5000/api/shifts/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ initial_cash: initialCash })
      });
      const data = await res.json();
      if (data.success) checkActiveShift();
    } catch (err) { alert('Gagal'); }
  };

  const openEndShiftModal = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/shifts/summary/${activeShift.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setShiftSummary(data);
      setShowEndShiftModal(true);
    } catch (err) { alert('Gagal'); }
  };

  const endShiftProcess = async () => {
    if (actualCash === '') return alert('Masukkan jumlah uang!');
    try {
      const res = await fetch(`http://localhost:5000/api/shifts/end/${activeShift.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ actual_cash: Number(actualCash) })
      });
      const data = await res.json();
      if (data.success) {
        let msg = 'Shift berhasil diakhiri.';
        if (data.difference < 0) msg += `\nSelisih KURANG: Rp ${formatIDR(Math.abs(data.difference))}`;
        else if (data.difference > 0) msg += `\nSelisih LEBIH: Rp ${formatIDR(data.difference)}`;
        else msg += '\nUang PAS (Balance).';
        alert(msg);
        setActiveShift(null);
        setShowEndShiftModal(false);
        setActualCash('');
      } else {
        alert('Gagal: ' + (data.message || 'Error tidak diketahui'));
      }
    } catch (err) { 
      alert('Koneksi Error: ' + err.message); 
    }
  };

  const addToCart = (product) => {
    if (product.stock <= 0) return alert('Habis!');
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setSearch('');
  };

  const updateQty = (id, delta) => {
    const product = products.find(p => p.id === id);
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        if (newQty > (product?.stock || 0)) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id));
  
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const change = Number(paymentData.amountPaid) - total;

  const handleProcessTransaction = async (status = 'completed') => {
    if (!activeShift) return alert('Shift tidak aktif!');
    if (status === 'completed' && (paymentData.amountPaid === '' || Number(paymentData.amountPaid) < total)) {
      setPaymentError('Uang tidak cukup!');
      return;
    }

    const transaction = {
      invoice_number: `INV-${Date.now()}`,
      items: cart,
      total_price: total,
      payment_method: paymentData.method,
      amount_paid: Number(paymentData.amountPaid),
      change_amount: change,
      shift_id: activeShift.id,
      status: status
    };

    try {
      const res = await fetch('http://localhost:5000/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(transaction)
      });
      const data = await res.json();
      if (data.success) {
        if (status === 'completed') {
          setLastTransaction({ ...transaction, id: data.transactionId, date: new Date() });
          setShowPayment(false);
          setShowReceipt(true);
        }
        setCart([]);
        setPaymentData({ amountPaid: '', method: 'cash' });
        setPaymentError('');
        fetchProducts();
        fetchPendingTransactions();
      }
    } catch (err) { alert('Gagal.'); }
  };

  const restorePending = async (t) => {
    try {
      const res = await fetch(`http://localhost:5000/api/transactions/${t.id}/details`, { headers: { 'Authorization': `Bearer ${token}` } });
      const items = await res.json();
      setCart(items);
      await fetch(`http://localhost:5000/api/transactions/${t.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      setShowPendingModal(false);
      fetchPendingTransactions();
    } catch (err) { alert('Gagal.'); }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.code.includes(search));

  if (!activeShift) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}>
        <div style={{ 
          width: '420px', 
          padding: '48px', 
          background: '#fff', 
          borderRadius: '32px', 
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
          border: '1px solid var(--border)',
          textAlign: 'center'
        }}>
          <div style={{ 
            width: '64px', height: '64px', background: 'var(--primary-light)', 
            color: 'var(--primary)', borderRadius: '20px', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' 
          }}>
            <Wallet size={32} />
          </div>
          <h1 style={{ marginBottom: '8px', fontWeight: '900', color: '#1e293b', fontSize: '24px', letterSpacing: '-0.5px' }}>Buka Kasir</h1>
          <p style={{ color: '#64748b', marginBottom: '32px', fontSize: '14px', lineHeight: '1.5' }}>Masukkan jumlah modal awal yang ada di laci kasir saat ini.</p>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', textAlign: 'left', marginBottom: '8px', marginLeft: '4px' }}>Modal Awal (Tunai)</label>
            <input 
              type="number" 
              placeholder="Rp 0" 
              style={{ 
                width: '100%', padding: '18px', fontSize: '24px', fontWeight: '900', 
                textAlign: 'center', border: '2px solid #f1f5f9', borderRadius: '18px', 
                outline: 'none', background: '#f8fafc', transition: 'all 0.2s'
              }} 
              id="initialCash"
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = '#f1f5f9'}
              onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
              autoFocus
            />
          </div>
          
          <button className="btn-primary" style={{ width: '100%', padding: '18px', borderRadius: '18px', fontSize: '15px', fontWeight: '800', boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.2)' }} onClick={() => startShift(document.getElementById('initialCash').value)}>Mulai Sesi Sekarang</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pos-container" style={{ gridTemplateColumns: '1fr 380px', padding: '24px', gap: '24px', background: '#f8fafc', height: '100vh' }}>
      
      {/* Panel Kiri: Produk */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        
        {/* Pencarian (Disejajarkan dengan Grid) */}
        <div style={{ padding: '0 10px', marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', padding: '0 20px', 
            background: '#fff', borderRadius: '14px', border: '1px solid var(--border)', 
            boxShadow: 'var(--shadow-subtle)' 
          }}>
            <Search size={20} color="#94a3b8" />
            <input 
              type="text" 
              placeholder="Cari nama barang atau barcode..." 
              style={{ border: 'none', padding: '16px', width: '100%', outline: 'none', background: 'transparent', fontWeight: '500' }} 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              ref={searchInputRef} 
              autoFocus 
            />
          </div>
        </div>
        
        <div className="product-grid" style={{ flexGrow: 1, overflowY: 'auto' }}>
          {filteredProducts.map(p => (
            <div key={p.id} onClick={() => addToCart(p)} style={{ 
              padding: '12px', borderRadius: '18px', border: '1px solid var(--border)', background: '#fff',
              cursor: p.stock <= 0 ? 'default' : 'pointer', opacity: p.stock <= 0 ? 0.5 : 1, transition: '0.1s'
            }}>
              <div className="product-card-img-container">
                {p.image_path ? <img src={`http://localhost:5000${p.image_path}`} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <ShoppingBag size={28} color="#cbd5e1" />}
              </div>
              <div style={{ fontWeight: '700', fontSize: '13px' }}>{p.name}</div>
              <div style={{ color: 'var(--primary)', fontWeight: '800' }}>Rp {formatIDR(p.price)}</div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>Stok: {p.stock}</div>
            </div>
          ))}
        </div>
        
        <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          <button onClick={openEndShiftModal} style={{ background: '#fff', border: '1.5px solid #fee2e2', padding: '12px 24px', borderRadius: '14px', color: '#dc2626', fontWeight: '900', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', width: 'fit-content' }}>
            <LogOut size={18} /> Akhiri Shift
          </button>
        </div>
      </div>

      {/* Panel Kanan: Keranjang */}
      <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', background: '#fff', borderRadius: '24px', height: '100%', overflow: 'hidden', boxShadow: 'var(--shadow-subtle)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontWeight: '800' }}>Orderan</h3>
          <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowPendingModal(true)}><ShoppingBag size={20} color="var(--primary)" />{pendingTransactions.length > 0 && <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--danger)', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{pendingTransactions.length}</span>}</div>
        </div>
        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '20px' }}>
          {cart.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div><div style={{ fontWeight: '700', fontSize: '13px' }}>{item.name}</div><div style={{ fontSize: '12px', color: '#94a3b8' }}>Rp {formatIDR(item.price)}</div></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button onClick={() => updateQty(item.id, -1)} style={{ padding: '4px' }}><Minus size={10} /></button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQty(item.id, 1)} style={{ padding: '4px' }}><Plus size={10} /></button>
                <button onClick={() => removeFromCart(item.id)} style={{ color: '#cbd5e1' }}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: '24px', background: '#f8fafc', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}><span style={{ fontWeight: '600' }}>Total</span><span style={{ fontSize: '24px', fontWeight: '900' }}>Rp {formatIDR(total)}</span></div>
          <button className="btn-primary" style={{ width: '100%', padding: '18px', borderRadius: '16px' }} onClick={() => { setShowPayment(true); setPaymentError(''); }} disabled={cart.length === 0}>Lanjut Bayar</button>
        </div>
      </div>

      {/* Modal End Shift */}
      {showEndShiftModal && shiftSummary && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
          <div style={{ background: '#fff', padding: '40px', borderRadius: '32px', width: '450px', border: '1px solid var(--border)' }}>
            <h2 style={{ fontWeight: '900', marginBottom: '24px', textAlign: 'center' }}>Tutup Buku</h2>
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', marginBottom: '24px', border: '1px solid var(--border)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><span style={{ color: '#64748b' }}>Sesuai Sistem</span><span style={{ fontWeight: '900', fontSize: '18px' }}>Rp {formatIDR(shiftSummary.initial_cash + shiftSummary.total_cash_sales)}</span></div>
            </div>
            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '8px' }}>Jumlah Uang Riil</label>
              <input type="number" placeholder="Rp 0" style={{ width: '100%', padding: '18px', fontSize: '28px', fontWeight: '900', textAlign: 'center', border: '2px solid var(--primary)', borderRadius: '16px', outline: 'none' }} autoFocus value={actualCash} onChange={(e) => setActualCash(e.target.value)} onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
              <button style={{ padding: '16px', background: '#f1f5f9', borderRadius: '16px' }} onClick={() => setShowEndShiftModal(false)}>Batal</button>
              <button className="btn-primary" style={{ padding: '16px', borderRadius: '16px', background: '#dc2626' }} onClick={endShiftProcess}>Akhiri Shift</button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showReceipt && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 600, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', padding: '32px', borderRadius: '32px', width: '320px', textAlign: 'center', border: '1px solid var(--border)' }}>
            <div style={{ width: '56px', height: '56px', background: '#f0fdf4', color: 'var(--success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><CheckCircle size={32} /></div>
            <h3 style={{ fontWeight: '900' }}>Selesai!</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
               <button className="btn-primary" style={{ padding: '16px', borderRadius: '14px' }} onClick={() => window.print()}>Cetak Struk</button>
               <button style={{ color: '#64748b', fontWeight: '700', padding: '16px', background: '#f8fafc', borderRadius: '14px', border: '1px solid var(--border)' }} onClick={() => setShowReceipt(false)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 500, backdropFilter: 'blur(3px)' }}>
          <div style={{ background: '#fff', padding: '32px', borderRadius: '24px', width: '400px', border: '1px solid var(--border)' }}>
            <h1 style={{ textAlign: 'center', fontSize: '32px', fontWeight: '900', marginBottom: '32px' }}>Rp {formatIDR(total)}</h1>
            {paymentError && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '12px', marginBottom: '16px', fontSize: '13px', fontWeight: '700', textAlign: 'center' }}>{paymentError}</div>}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>Uang Diterima</label> 
              <input type="number" style={{ width: '100%', padding: '16px', fontSize: '28px', fontWeight: '800', textAlign: 'right', borderRadius: '12px', border: `2px solid ${paymentError ? 'var(--danger)' : 'var(--primary)'}`, outline: 'none' }} autoFocus value={paymentData.amountPaid} onChange={(e) => { setPaymentData({...paymentData, amountPaid: e.target.value}); setPaymentError(''); }} onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()} /> 
              {change >= 0 && paymentData.amountPaid !== '' && <div style={{ textAlign: 'right', marginTop: '12px', color: 'var(--success)', fontWeight: '800' }}>KEMBALIAN: Rp {formatIDR(change)}</div>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}><button style={{ padding: '14px', background: '#f1f5f9', borderRadius: '12px' }} onClick={() => setShowPayment(false)}>Batal</button> <button className="btn-primary" style={{ padding: '14px', borderRadius: '12px' }} onClick={() => handleProcessTransaction('completed')}>Konfirmasi</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
