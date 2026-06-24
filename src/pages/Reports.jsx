import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { History, Calendar, User, DollarSign, ArrowRight, X, Printer, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

const Reports = () => {
  const { token } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [selectedShift, setSelectedShift] = useState(null);
  const [shiftTransactions, setShiftTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/reports/shifts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setShifts(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchShiftDetails = async (shift) => {
    setSelectedShift(shift);
    try {
      const res = await fetch(`http://localhost:5000/api/reports/shifts/${shift.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setShiftTransactions(data);
    } catch (err) { console.error(err); }
  };

  const formatIDR = (num) => new Intl.NumberFormat('id-ID').format(Math.floor(num) || 0);

  return (
    <div style={{ padding: '32px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1>Laporan Per Shift</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manajemen rekonsiliasi kas dan audit shift</p>
      </header>

      <div className="card" style={{ border: '1.5px solid var(--border)', borderRadius: '20px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
              <th style={{ padding: '16px', borderBottom: '1.5px solid var(--border)' }}>Waktu Shift</th>
              <th style={{ padding: '16px', borderBottom: '1.5px solid var(--border)' }}>Kasir</th>
              <th style={{ padding: '16px', borderBottom: '1.5px solid var(--border)', textAlign: 'right' }}>Total Jual</th>
              <th style={{ padding: '16px', borderBottom: '1.5px solid var(--border)', textAlign: 'right' }}>Selisih</th>
              <th style={{ padding: '16px', borderBottom: '1.5px solid var(--border)', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '16px', borderBottom: '1.5px solid var(--border)' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {shifts.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => fetchShiftDetails(s)}>
                <td style={{ padding: '16px' }}>
                  <div style={{ fontWeight: '700', fontSize: '13px' }}>{new Date(s.start_time).toLocaleDateString('id-ID')}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(s.start_time).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})} - {s.end_time ? new Date(s.end_time).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : 'Aktif'}</div>
                </td>
                <td style={{ padding: '16px', fontWeight: '700' }}>{s.cashier_name}</td>
                <td style={{ padding: '16px', textAlign: 'right', fontWeight: '800' }}>Rp {formatIDR(s.total_sales)}</td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                  {s.status === 'closed' ? (
                    <span style={{ fontWeight: '900', color: s.difference_amount < 0 ? 'var(--danger)' : s.difference_amount > 0 ? '#16a34a' : '#64748b' }}>
                      {s.difference_amount === 0 ? 'Balance' : `Rp ${formatIDR(s.difference_amount)}`}
                    </span>
                  ) : '-'}
                </td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                   <span style={{ 
                     padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '800',
                     background: s.status === 'active' ? '#f0fdf4' : '#f1f5f9',
                     color: s.status === 'active' ? '#16a34a' : '#64748b'
                   }}>
                     {s.status === 'active' ? 'AKTIF' : 'SELESAI'}
                   </span>
                </td>
                <td style={{ padding: '16px' }}><ArrowRight size={18} color="#cbd5e1" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Detail Shift Audit */}
      {selectedShift && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
          <div className="card" style={{ width: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '0', borderRadius: '32px', border: '1.5px solid var(--border)' }}>
            <div style={{ padding: '24px', borderBottom: '1.5px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
              <div>
                <h2 style={{ fontWeight: '900' }}>Audit Rekonsiliasi Shift #{selectedShift.id}</h2>
                <p style={{ fontSize: '13px', margin: 0, color: 'var(--text-muted)' }}>Kasir: <strong>{selectedShift.cashier_name}</strong> | Sesi: {new Date(selectedShift.start_time).toLocaleString('id-ID')}</p>
              </div>
              <div style={{ padding: '8px', cursor: 'pointer', borderRadius: '12px', background: '#f1f5f9' }} onClick={() => setSelectedShift(null)}><X size={20} /></div>
            </div>

            <div style={{ padding: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '40px' }}>
                 <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '20px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '700' }}>MODAL AWAL</div>
                    <div style={{ fontSize: '16px', fontWeight: '900' }}>Rp {formatIDR(selectedShift.initial_cash)}</div>
                 </div>
                 <div style={{ padding: '20px', background: '#f0f9ff', borderRadius: '20px', border: '1px solid var(--primary-light)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--primary)', marginBottom: '4px', fontWeight: '700' }}>TDP (CASH)</div>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: 'var(--primary)' }}>Rp {formatIDR(selectedShift.total_sales)}</div>
                 </div>
                 <div style={{ padding: '20px', background: '#fdfcf0', borderRadius: '20px', border: '1px solid #f0eab2' }}>
                    <div style={{ fontSize: '11px', color: '#854d0e', marginBottom: '4px', fontWeight: '700' }}>UANG SEHARUSNYA</div>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#854d0e' }}>Rp {formatIDR(selectedShift.expected_cash)}</div>
                 </div>
                 <div style={{ 
                   padding: '20px', borderRadius: '20px', border: '1.5px solid',
                   background: selectedShift.difference_amount < 0 ? '#fff1f1' : '#f0fdf4',
                   borderColor: selectedShift.difference_amount < 0 ? 'var(--danger)' : '#bcf0da'
                 }}>
                    <div style={{ fontSize: '11px', color: selectedShift.difference_amount < 0 ? 'var(--danger)' : '#16a34a', marginBottom: '4px', fontWeight: '700' }}>UANG RIIL (ACTUAL)</div>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: selectedShift.difference_amount < 0 ? 'var(--danger)' : '#16a34a' }}>Rp {formatIDR(selectedShift.actual_cash)}</div>
                 </div>
              </div>

              {selectedShift.difference_amount !== 0 && (
                <div style={{ 
                  padding: '16px', borderRadius: '16px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px',
                  background: selectedShift.difference_amount < 0 ? '#fee2e2' : '#dcfce7',
                  color: selectedShift.difference_amount < 0 ? '#b91c1c' : '#15803d'
                }}>
                  <AlertCircle size={20} />
                  <span style={{ fontWeight: '800' }}>
                    Terdeteksi selisih {selectedShift.difference_amount < 0 ? 'KURANG (MINUS)' : 'LEBIH'} sebesar Rp {formatIDR(Math.abs(selectedShift.difference_amount))}
                  </span>
                </div>
              )}
              {selectedShift.difference_amount === 0 && (
                <div style={{ padding: '16px', background: '#f0fdf4', color: '#16a34a', borderRadius: '16px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircle2 size={20} />
                  <span style={{ fontWeight: '800' }}>Audit Selesai: Uang di laci Balance (Pas).</span>
                </div>
              )}

              <h3 style={{ marginBottom: '16px', fontWeight: '800' }}>Daftar Transaksi Sesi Ini</h3>
              <div style={{ border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', background: '#f8fafc' }}>
                      <th style={{ padding: '12px', fontSize: '12px' }}>Invoice</th>
                      <th style={{ padding: '12px', fontSize: '12px' }}>Metode</th>
                      <th style={{ padding: '12px', fontSize: '12px', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shiftTransactions.map(t => (
                      <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px', fontWeight: '700', fontSize: '13px' }}>{t.invoice_number}</td>
                        <td style={{ padding: '12px', fontSize: '12px' }}>{t.payment_method.toUpperCase()}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '800' }}>Rp {formatIDR(t.total_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
