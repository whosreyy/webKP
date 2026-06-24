import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Edit2, Trash2, Package, X, ArrowUpCircle, Image as ImageIcon } from 'lucide-react';

const Inventory = () => {
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [currentProduct, setCurrentProduct] = useState({
    code: '', name: '', category_id: 1, stock: 0, price: 0, description: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [additionalStock, setAdditionalStock] = useState(0);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      setProducts(data);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    if (!selectedProductId) return alert('Pilih produk!');
    try {
      const response = await fetch(`http://localhost:5000/api/products/${selectedProductId}/stock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ additional_stock: Number(additionalStock) })
      });
      if (response.ok) {
        setIsStockModalOpen(false);
        setAdditionalStock(0);
        setSelectedProductId('');
        fetchProducts();
      }
    } catch (error) { alert('Gagal'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(currentProduct).forEach(key => formData.append(key, currentProduct[key]));
    if (imageFile) formData.append('image', imageFile);

    const url = modalMode === 'add' ? 'http://localhost:5000/api/products' : `http://localhost:5000/api/products/${currentProduct.id}`;
    const method = modalMode === 'add' ? 'POST' : 'PUT';

    try {
      const res = await fetch(url, { method, headers: { 'Authorization': `Bearer ${token}` }, body: formData });
      if (res.ok) { setIsModalOpen(false); setImageFile(null); fetchProducts(); }
    } catch (error) { alert('Gagal'); }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div><h1>Katalog Barang</h1><p style={{ color: 'var(--text-muted)' }}>Manajemen stok & inventori gudang</p></div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className="btn-secondary" onClick={() => setIsStockModalOpen(true)} style={{ padding: '12px 24px', borderRadius: '14px', border: '2px solid var(--border)', fontWeight: '700' }}>+ Stok Baru</button>
          <button className="btn-primary" onClick={() => { setModalMode('add'); setCurrentProduct({code: '', name: '', category_id: 1, stock: 0, price: 0, description: ''}); setIsModalOpen(true); }} style={{ padding: '12px 24px', borderRadius: '14px', fontWeight: '800' }}>Tambah Produk</button>
        </div>
      </div>

      <div className="card" style={{ border: '2px solid var(--border)', borderRadius: '24px', overflow: 'hidden' }}>
        <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '2px solid var(--border)', background: '#f8fafc' }}>
          <Search size={22} color="var(--primary)" />
          <input type="text" placeholder="Cari barcode atau nama produk..." style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', fontWeight: '600' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--primary-light)', textAlign: 'left' }}>
              <th style={{ padding: '18px', borderBottom: '2px solid var(--border)', fontWeight: '800' }}>Foto</th>
              <th style={{ padding: '18px', borderBottom: '2px solid var(--border)', fontWeight: '800' }}>Kode</th>
              <th style={{ padding: '18px', borderBottom: '2px solid var(--border)', fontWeight: '800' }}>Nama Barang</th>
              <th style={{ padding: '18px', borderBottom: '2px solid var(--border)', fontWeight: '800' }}>Stok</th>
              <th style={{ padding: '18px', borderBottom: '2px solid var(--border)', fontWeight: '800' }}>Harga Satuan</th>
              <th style={{ padding: '18px', borderBottom: '2px solid var(--border)', fontWeight: '800' }}>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(p => (
              <tr key={p.id}>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: '50px', height: '50px', background: '#f1f5f9', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    {p.image_path ? <img src={`http://localhost:5000${p.image_path}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <ImageIcon size={24} color="#cbd5e1" />}
                  </div>
                </td>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--border)', fontWeight: '700' }}>{p.code}</td>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--border)', fontWeight: '700' }}>{p.name}</td>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: p.stock <= 5 ? 'var(--danger)' : 'var(--success)', fontWeight: '900', fontSize: '15px' }}>{p.stock}</span>
                </td>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--border)', fontWeight: '800' }}>Rp {p.price.toLocaleString()}</td>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <button onClick={() => { setCurrentProduct(p); setModalMode('edit'); setIsModalOpen(true); }} style={{ color: 'var(--primary-dark)' }}><Edit2 size={20} /></button>
                    <button style={{ color: 'var(--danger)' }}><Trash2 size={20} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Add Stock */}
      {isStockModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, backdropFilter: 'blur(8px)' }}>
          <div className="card" style={{ padding: '40px', width: '450px', border: '2px solid var(--border)', borderRadius: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}><h3>Perbarui Stok Masuk</h3><X style={{ cursor: 'pointer' }} onClick={() => setIsStockModalOpen(false)} /></div>
            <form onSubmit={handleUpdateStock}>
              <div style={{ marginBottom: '24px' }}><label style={{ fontWeight: '700' }}>Pilih Nama Barang</label>
                <select className="card" style={{ width: '100%', padding: '16px', border: '2px solid var(--border)', borderRadius: '16px', marginTop: '8px' }} value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} required>
                  <option value="">-- Pilih --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (Sisa: {p.stock})</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '32px' }}><label style={{ fontWeight: '700' }}>Jumlah Stok Tambahan</label>
                <input type="number" className="card" style={{ width: '100%', padding: '16px', fontSize: '24px', textAlign: 'center', border: '2px solid var(--border)', borderRadius: '16px', marginTop: '8px' }} placeholder="0" value={additionalStock} onChange={e => setAdditionalStock(e.target.value)} required />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '18px', borderRadius: '16px', fontSize: '16px', fontWeight: '800' }}>Update Stok Melalui Database</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit/Add Product */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, backdropFilter: 'blur(8px)' }}>
          <div className="card" style={{ padding: '40px', width: '550px', border: '2px solid var(--border)', borderRadius: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}><h2>{modalMode === 'add' ? 'Tambah Produk' : 'Edit Produk'}</h2><X style={{ cursor: 'pointer' }} onClick={() => setIsModalOpen(false)} /></div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                <div style={{ gridColumn: '1 / -1' }}><label style={{ fontWeight: '700' }}>Foto Produk</label><input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} style={{ marginTop: '8px' }} /></div>
                <div><label style={{ fontWeight: '700' }}>Kode</label><input className="card" style={{ width: '100%', padding: '12px', border: '2px solid var(--border)', borderRadius: '12px', marginTop: '8px' }} value={currentProduct.code} onChange={e => setCurrentProduct({...currentProduct, code: e.target.value})} required /></div>
                <div><label style={{ fontWeight: '700' }}>Nama</label><input className="card" style={{ width: '100%', padding: '12px', border: '2px solid var(--border)', borderRadius: '12px', marginTop: '8px' }} value={currentProduct.name} onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})} required /></div>
                <div><label style={{ fontWeight: '700' }}>Harga</label><input type="number" className="card" style={{ width: '100%', padding: '12px', border: '2px solid var(--border)', borderRadius: '12px', marginTop: '8px' }} value={currentProduct.price} onChange={e => setCurrentProduct({...currentProduct, price: e.target.value})} required /></div>
                <div><label style={{ fontWeight: '700' }}>Stok</label><input type="number" className="card" style={{ width: '100%', padding: '12px', border: '2px solid var(--border)', borderRadius: '12px', marginTop: '8px' }} value={currentProduct.stock} onChange={e => setCurrentProduct({...currentProduct, stock: e.target.value})} required disabled={modalMode === 'edit'} /></div>
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '18px', borderRadius: '16px', fontWeight: '900' }}>Simpan Perubahan</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
