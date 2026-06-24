import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Printer, Store, Save, XCircle, CheckCircle, Usb } from 'lucide-react';

const Settings = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('store');
  const [settings, setSettings] = useState({ store_name: '', store_address: '', store_phone: '', receipt_footer: '' });
  const [printerStatus, setPrinterStatus] = useState('Disconnected');
  const [paperSize, setPaperSize] = useState('58mm');

  useEffect(() => {
    fetchSettings();
    // Check if printer was previously connected in this session
    if (window.serialPort) {
      setPrinterStatus('Connected');
    }
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/settings');
      const data = await res.json();
      setSettings(data);
    } catch (err) { console.error(err); }
  };

  const connectPrinter = async () => {
    try {
      if (!("serial" in navigator)) {
        alert("Browser Anda tidak mendukung koneksi printer langsung. Gunakan Chrome atau Edge.");
        return;
      }

      setPrinterStatus('Connecting...');
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      
      window.serialPort = port; // Store globally for POS.jsx
      setPrinterStatus('Connected');
      localStorage.setItem('printer_connected', 'true');
      alert("Printer Berhasil Terhubung secara Langsung!");
    } catch (err) {
      console.error(err);
      setPrinterStatus('Disconnected');
      alert("Gagal menghubungkan printer. Pastikan printer menyala dan kabel USB terhubung.");
    }
  };

  const handleUpdateSettings = async () => {
    // In real app, send to API
    alert('Pengaturan toko berhasil diperbarui!');
  };

  return (
    <div style={{ padding: '24px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1>Pengaturan Erablue POS</h1>
        <p style={{ color: 'var(--text-muted)' }}>Konfigurasi hardware dan identitas toko</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '24px' }}>
        <div className="card" style={{ padding: '12px', height: 'fit-content' }}>
          <button 
            onClick={() => setActiveTab('store')}
            style={{ 
              width: '100%', padding: '12px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px',
              background: activeTab === 'store' ? 'var(--primary-light)' : 'transparent',
              color: activeTab === 'store' ? 'var(--primary-dark)' : 'var(--text-main)',
              marginBottom: '4px', border: 'none', borderRadius: '8px'
            }}
          >
            <Store size={18} /> Profil Toko
          </button>
          <button 
            onClick={() => setActiveTab('printer')}
            style={{ 
              width: '100%', padding: '12px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px',
              background: activeTab === 'printer' ? 'var(--primary-light)' : 'transparent',
              color: activeTab === 'printer' ? 'var(--primary-dark)' : 'var(--text-main)',
              border: 'none', borderRadius: '8px'
            }}
          >
            <Printer size={18} /> Hardware Printer
          </button>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          {activeTab === 'store' && (
            <div className="animate-fade">
              <h3 style={{ marginBottom: '20px' }}>Informasi Bisnis</h3>
              <div style={{ display: 'grid', gap: '16px', maxWidth: '500px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700' }}>Nama Toko</label>
                  <input className="input-group" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} value={settings.store_name} onChange={e => setSettings({...settings, store_name: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700' }}>Alamat</label>
                  <textarea className="input-group" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} rows="3" value={settings.store_address} onChange={e => setSettings({...settings, store_address: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700' }}>Pesan Footer Struk</label>
                  <input className="input-group" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} value={settings.receipt_footer} onChange={e => setSettings({...settings, receipt_footer: e.target.value})} />
                </div>
                <button className="btn-primary" onClick={handleUpdateSettings}>Simpan Konfigurasi</button>
              </div>
            </div>
          )}

          {activeTab === 'printer' && (
            <div className="animate-fade">
              <h3 style={{ marginBottom: '20px' }}>Koneksi Printer Thermal</h3>
              <div style={{ display: 'grid', gap: '24px', maxWidth: '500px' }}>
                <div style={{ 
                  padding: '24px', borderRadius: '16px', border: '1px solid',
                  background: printerStatus === 'Connected' ? '#f0fdf4' : '#fff5f5',
                  borderColor: printerStatus === 'Connected' ? '#22c55e' : '#feb2b2',
                  textAlign: 'center'
                }}>
                  {printerStatus === 'Connected' ? (
                    <div style={{ color: '#15803d' }}>
                      <CheckCircle size={48} style={{ margin: '0 auto 12px' }} />
                      <div style={{ fontWeight: '800', fontSize: '18px' }}>Printer Terhubung</div>
                      <div style={{ fontSize: '13px' }}>Hardware siap mengirim data ESC/POS</div>
                    </div>
                  ) : (
                    <div style={{ color: '#991b1b' }}>
                      <Usb size={48} style={{ margin: '0 auto 12px' }} />
                      <div style={{ fontWeight: '800', fontSize: '18px' }}>Printer Belum Terhubung</div>
                      <div style={{ fontSize: '13px', marginBottom: '20px' }}>Klik tombol di bawah untuk menyambungkan via USB</div>
                      <button className="btn-primary" onClick={connectPrinter} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                         <Usb size={18} /> Hubungkan Printer USB
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '12px', fontWeight: '700' }}>Ukuran Kertas</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={() => setPaperSize('58mm')}
                      style={{ flex: 1, padding: '16px', borderRadius: '12px', border: '1px solid', background: paperSize === '58mm' ? 'var(--primary-light)' : '#fff', borderColor: paperSize === '58mm' ? 'var(--primary)' : '#e2e8f0', fontWeight: '700' }}
                    >
                      58mm (Standar)
                    </button>
                    <button 
                      onClick={() => setPaperSize('80mm')}
                      style={{ flex: 1, padding: '16px', borderRadius: '12px', border: '1px solid', background: paperSize === '80mm' ? 'var(--primary-light)' : '#fff', borderColor: paperSize === '80mm' ? 'var(--primary)' : '#e2e8f0', fontWeight: '700' }}
                    >
                      80mm (Besar)
                    </button>
                  </div>
                </div>

                {printerStatus === 'Connected' && (
                  <button className="btn-secondary" onClick={() => alert('Mengirim perintah Test Print...')}>
                    Tes Print (ESC/POS)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
