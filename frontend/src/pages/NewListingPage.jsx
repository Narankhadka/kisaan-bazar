import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { DISTRICTS_BY_PROVINCE } from '../data/districts';
import { stripHtml } from '../utils/searchUtils';

const INPUT = 'w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-colors';

export default function NewListingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [crops, setCrops]           = useState([]);
  const [form, setForm]             = useState({
    crop_id: '', quantity_kg: '', asking_price: '', district: '', description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    if (user && user.role !== 'FARMER') navigate('/');
    if (!user) navigate('/login');
    api.get('/crops/').then(({ data }) => setCrops(data.results || []));
  }, [user]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/listings/', form);
      navigate('/profile');
    } catch (err) {
      const d = err.response?.data;
      setError(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'बाली थप्न सकिएन। पुनः प्रयास गर्नुस्।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-24 md:pb-10">
      <div
        className="text-white"
        style={{ background: 'linear-gradient(160deg, #1a6b2e 0%, #2d9249 100%)' }}
      >
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 pt-8 pb-5">
          <button
            onClick={() => navigate(-1)}
            className="text-green-200 text-sm mb-3 hover:text-white transition-colors"
          >
            ← फिर्ता
          </button>
          <h1 className="text-xl md:text-2xl font-bold">बाली थप्नुस्</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-screen-xl mx-auto px-4 md:px-8 py-5 md:max-w-2xl flex flex-col gap-4">

        {/* Crop select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">बाली छान्नुस् *</label>
          <select
            required
            value={form.crop_id}
            onChange={e => set('crop_id', e.target.value)}
            className={INPUT + ' bg-white'}
          >
            <option value="">-- बाली छान्नुस् --</option>
            {crops.map(c => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name_nepali} ({c.name_english})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">परिमाण (kg) *</label>
            <input
              required type="number" min="1"
              value={form.quantity_kg}
              onChange={e => set('quantity_kg', e.target.value)}
              placeholder="जस्तै: 100"
              className={INPUT}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">मूल्य (रु./kg) *</label>
            <input
              required type="number" min="1"
              value={form.asking_price}
              onChange={e => set('asking_price', e.target.value)}
              placeholder="जस्तै: 45"
              className={INPUT}
            />
          </div>
        </div>

        {/* District dropdown — all 77 districts */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">जिल्ला *</label>
          <select
            required
            value={form.district}
            onChange={e => set('district', e.target.value)}
            className={INPUT + ' bg-white'}
          >
            <option value="">-- जिल्ला छान्नुस् --</option>
            {DISTRICTS_BY_PROVINCE.map(p => (
              <optgroup key={p.province} label={p.province}>
                {p.districts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">विवरण (ऐच्छिक)</label>
          <textarea
            value={form.description}
            onChange={e => set('description', stripHtml(e.target.value))}
            rows={3}
            placeholder="बालीको बारेमा थप जानकारी..."
            className={INPUT + ' resize-none'}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-red-600 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#1a6b2e' }}
        >
          {submitting ? 'लोड हुँदैछ...' : 'बाली थप्नुस्'}
        </button>
      </form>
    </div>
  );
}
