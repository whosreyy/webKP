import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, CheckCircle, XCircle, Info } from 'lucide-react';

const Shifts = () => {
  const { token, user } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [activeShift, setActiveShift] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShifts();
    checkActiveShift();
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

  const checkActiveShift = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/shifts/active', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setActiveShift(data);
    } catch (err) { console.error(err); }
  };

  const endShift = async () => {
    if (!window.confirm('Apakah Anda yakin ingin mengakhiri shift? Ringkasan penjualan akan disimpan.')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/shifts/end/${activeShift.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        alert('Shift berhasil diakhiri!');
        setActiveShift(null);
        fetchShifts();
      }
    } catch (err) { alert('Gagal mengakhiri shift'); }
  };

  return (
    <div style={{ padding: '24px' }}>
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Manajemen Shift</h1>
          <p style={{ color: 'var(--text-muted)' }}>Pantau waktu kerja dan omzet per shift kasir</p>
        </div>
        {activeShift && (
          <button className="btn-danger" onClick={endShift} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <XCircle size={18} /> Akhiri Shift Sekarang
          </button>
        )}
      </header>

      {activeShift && (
        <div className="card" style={{ padding: '24px', background: 'var(--primary-light)', marginBottom: '32px', border: '1px solid var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Clock color="var(--primary)" />
            <h3 style={{ color: 'var(--primary-dark)' }}>Shift Aktif</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mulai Sejak</div>
              <div style={{ fontWeight: '700' }}>{new Date(activeShift.start_time).toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Modal Awal</div>
              <div style={{ fontWeight: '700' }}>Rp {activeShift.initial_cash.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Nama Kasir</div>
              <div style={{ fontWeight: '700' }}>{user.name}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Status</div>
              <div style={{ color: 'var(--success)', fontWeight: '800' }}>AKTIF</div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', fontWeight: '700' }}>Riwayat Shift</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
              <th style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>Kasir</th>
              <th style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>Waktu Mulai</th>
              <th style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>Waktu Selesai</th>
              <th style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>Transaksi</th>
              <th style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>Total Omzet</th>
              <th style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {shifts.map(shift => (
              <tr key={shift.id}>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>{shift.cashier_name}</td>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>{new Date(shift.start_time).toLocaleString()}</td>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>{shift.end_time ? new Date(shift.end_time).toLocaleString() : '-'}</td>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>{shift.total_transactions} trx</td>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--border)', fontWeight: '700' }}>Rp {Number(shift.total_sales).toLocaleString()}</td>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '11px', 
                    background: shift.status === 'active' ? 'var(--primary-light)' : '#f1f5f9',
                    color: shift.status === 'active' ? 'var(--primary-dark)' : 'var(--text-muted)'
                  }}>
                    {shift.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Shifts;
