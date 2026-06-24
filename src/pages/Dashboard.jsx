import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, ShoppingBag, AlertTriangle, UserCheck, DollarSign } from 'lucide-react';

const Dashboard = () => {
  const { token, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user.role === 'admin') {
      fetchStats();
    }
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setStats(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  if (user.role !== 'admin') {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Selamat Datang, {user.name}!</h2>
        <p style={{ color: 'var(--text-muted)' }}>Silakan gunakan menu di samping untuk mulai bekerja.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: '8px' }}>Dashboard Admin</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Ringkasan performa toko hari ini</p>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div className="card" style={{ padding: '24px', position: 'relative' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>Penjualan Hari Ini</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary-dark)' }}>Rp {stats?.salesToday.toLocaleString()}</div>
          <div style={{ position: 'absolute', right: '20px', top: '24px', background: 'var(--primary-light)', padding: '10px', borderRadius: '12px' }}>
            <DollarSign color="var(--primary-dark)" />
          </div>
        </div>
        <div className="card" style={{ padding: '24px', position: 'relative' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>Total Transaksi</div>
          <div style={{ fontSize: '24px', fontWeight: '800' }}>{stats?.transToday}</div>
          <div style={{ position: 'absolute', right: '20px', top: '24px', background: '#fef3c7', padding: '10px', borderRadius: '12px' }}>
            <TrendingUp color="#d97706" />
          </div>
        </div>
        <div className="card" style={{ padding: '24px', position: 'relative' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>Kasir Aktif</div>
          <div style={{ fontSize: '24px', fontWeight: '800' }}>{stats?.activeCashiers?.length || 0}</div>
          <div style={{ position: 'absolute', right: '20px', top: '24px', background: '#dcfce7', padding: '10px', borderRadius: '12px' }}>
            <UserCheck color="#15803d" />
          </div>
        </div>
        <div className="card" style={{ padding: '24px', position: 'relative' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>Stok Menipis</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: stats?.lowStock?.length > 0 ? 'var(--danger)' : 'var(--text-main)' }}>{stats?.lowStock?.length || 0}</div>
          <div style={{ position: 'absolute', right: '20px', top: '24px', background: '#fee2e2', padding: '10px', borderRadius: '12px' }}>
            <AlertTriangle color="#b91c1c" />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card">
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', fontWeight: '700' }}>Kasir Sedang Aktif</div>
          <div style={{ padding: '16px' }}>
            {stats?.activeCashiers?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Tidak ada kasir yang aktif</p>
            ) : (
              stats?.activeCashiers?.map((cashier, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderBottom: idx < stats.activeCashiers.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: '40px', height: '40px', background: 'var(--primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'var(--primary-dark)' }}>
                    {cashier.name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600' }}>{cashier.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--success)' }}>Online</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', fontWeight: '700', display: 'flex', justifyContent: 'space-between' }}>
            <span>Peringatan Stok</span>
            <ShoppingBag size={18} />
          </div>
          <div style={{ padding: '16px' }}>
            {stats?.lowStock?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Semua stok aman</p>
            ) : (
              stats?.lowStock?.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: idx < stats.lowStock.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span>{item.name}</span>
                  <span style={{ color: 'var(--danger)', fontWeight: '700' }}>Sisa: {item.stock}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
