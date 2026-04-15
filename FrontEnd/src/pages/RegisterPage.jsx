import { Component, useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { getDistricts, getMunicipalities, getWardCount } from '../utils/nepalMunicipalities';
import { useAuth } from '../context/AuthContext';

// ─── Error boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unknown error' };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="bg-white rounded-2xl shadow-sm p-8 max-w-sm w-full text-center">
            <div className="flex justify-center mb-4 text-gray-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">पृष्ठ लोड हुन सकेन</h2>
            <p className="text-xs text-gray-400 mb-6 font-mono break-all">{this.state.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 rounded-xl text-white text-sm font-bold"
              style={{ backgroundColor: '#1a6b2e' }}
            >
              पुनः प्रयास गर्नुस्
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const INPUT = 'w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-colors bg-white';
const ERROR = 'text-red-500 text-xs mt-1';

const ID_TYPES = [
  { value: 'citizenship', label: 'नागरिकता (Citizenship Certificate)', placeholder: 'जस्तै: १२-०१-७८-०००००' },
  { value: 'nid',         label: 'राष्ट्रिय परिचयपत्र (NID)',          placeholder: '१२ अंकको नम्बर' },
  { value: 'passport',    label: 'राहदानी (Passport)',                   placeholder: 'Pa1234567' },
];

const BUSINESS_TYPES = [
  'व्यक्तिगत', 'होटल-रेस्टुरेन्ट', 'सुपरमार्केट', 'थोक व्यापारी', 'अन्य',
];

// ─── Progress bar ────────────────────────────────────────────────────────────
function ProgressBar({ step, role }) {
  const steps = role === 'BUYER'
    ? ['आधारभूत जानकारी', 'स्थान र विवरण']
    : ['आधारभूत जानकारी', 'स्थान र विवरण', 'फोटो र परिचयपत्र'];
  const total = steps.length;
  return (
    <div className="px-6 pt-6 pb-4">
      <div className="flex items-center">
        {steps.map((label, i) => {
          const num = i + 1;
          const done = step > num;
          const active = step === num;
          return (
            <div key={num} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                  style={
                    done
                      ? { backgroundColor: '#1a6b2e', color: 'white' }
                      : active
                      ? { backgroundColor: '#1a6b2e', color: 'white', boxShadow: '0 0 0 3px #bbf7d0' }
                      : { backgroundColor: '#e5e7eb', color: '#9ca3af' }
                  }
                >
                  {done ? '✓' : num}
                </div>
                <span className={`text-xs mt-1 hidden sm:block ${active ? 'text-green-700 font-medium' : 'text-gray-400'}`}>
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className="flex-1 h-0.5 mx-2 mb-5 transition-all"
                  style={{ backgroundColor: step > num ? '#1a6b2e' : '#e5e7eb' }}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 text-right mt-1">चरण {step} / {total}</p>
    </div>
  );
}

// ─── File upload box ──────────────────────────────────────────────────────────
function FileUploadBox({ label, hint, preview, onChange, accept, shape = 'rect', required, error }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onChange(file);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
          dragging
            ? 'border-green-400 bg-green-50'
            : error
            ? 'border-red-300 bg-red-50/30'
            : 'border-gray-200 hover:border-green-400 hover:bg-green-50/40'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {preview ? (
          shape === 'circle' ? (
            <img src={preview} alt="preview" className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-green-300" />
          ) : (
            <img src={preview} alt="preview" className="max-h-28 rounded-lg object-cover mx-auto" />
          )
        ) : (
          <div className="py-2">
            <div className="flex justify-center mb-1.5 text-gray-300">
              {shape === 'circle' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                  <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                </svg>
              )}
            </div>
            <p className="text-xs text-gray-500 font-medium">{hint}</p>
            <p className="text-xs text-gray-400 mt-1">क्लिक गर्नुस् वा ड्र्याग गर्नुस्</p>
          </div>
        )}
      </div>
      {preview && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onChange(null); }}
          className="text-xs text-red-500 mt-1 hover:underline"
        >
          हटाउनुस्
        </button>
      )}
      {error && <p className={ERROR}>{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { if (e.target.files[0]) onChange(e.target.files[0]); e.target.value = ''; }}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
function EyeIcon({ open }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="w-4 h-4">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="w-4 h-4">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function RegisterForm() {
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [crops, setCrops] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    role: 'FARMER',
    full_name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    district: '',
    municipality: '',
    ward_number: '',
    farm_size_ropani: '',
    main_crops: [],
    business_type: '',
    id_type: 'citizenship',
    id_number: '',
  });

  const [files, setFiles] = useState({ profile_photo: null, id_front_photo: null, id_back_photo: null });
  const [previews, setPreviews] = useState({ profile_photo: null, id_front_photo: null, id_back_photo: null });
  const [districtSearch, setDistrictSearch] = useState('');
  const [districtOpen, setDistrictOpen] = useState(false);

  // Cascade resets when district or municipality changes
  const set = (k, v) => setForm(f => {
    if (k === 'district') return { ...f, district: v, municipality: '', ward_number: '' };
    if (k === 'municipality') return { ...f, municipality: v, ward_number: '' };
    return { ...f, [k]: v };
  });

  // Clear a single field's error as soon as the user starts correcting it
  const clearError = (key) => setErrors(e => { const n = { ...e }; delete n[key]; return n; });

  const allDistricts = getDistricts();
  const filteredDistricts = districtSearch.trim()
    ? allDistricts.filter(d => d.includes(districtSearch.trim()))
    : allDistricts;
  const municipalities = form.district ? getMunicipalities(form.district) : [];
  const wardCount = form.district && form.municipality
    ? getWardCount(form.district, form.municipality)
    : 0;

  useEffect(() => {
    api.get('/crops/', { params: { page_size: 100 } })
      .then(({ data }) => setCrops(data.results || []))
      .catch(() => {});
  }, []);

  const handleFile = (key, file) => {
    if (!file) {
      setFiles(f => ({ ...f, [key]: null }));
      setPreviews(p => ({ ...p, [key]: null }));
      return;
    }
    setFiles(f => ({ ...f, [key]: file }));
    const reader = new FileReader();
    reader.onload = (e) => setPreviews(p => ({ ...p, [key]: e.target.result }));
    reader.readAsDataURL(file);
  };

  const toggleCrop = (id) => {
    setForm(f => {
      const already = f.main_crops.includes(id);
      if (already) return { ...f, main_crops: f.main_crops.filter(c => c !== id) };
      if (f.main_crops.length >= 5) return f;
      return { ...f, main_crops: [...f.main_crops, id] };
    });
  };

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateStep1 = () => {
    const e = {};
    if (!form.full_name.trim())    e.full_name = 'पूरा नाम आवश्यक छ';
    if (!form.username.trim())     e.username  = 'प्रयोगकर्ता नाम आवश्यक छ';
    if (!form.email.trim())        e.email     = 'इमेल आवश्यक छ';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'मान्य इमेल राख्नुस्';
    if (!form.phone.trim())        e.phone     = 'फोन नम्बर आवश्यक छ';
    else if (!/^(97|98)\d{8}$/.test(form.phone)) e.phone = 'नेपाली मोबाइल नम्बर (98XXXXXXXX)';
    if (!form.password)            e.password  = 'पासवर्ड आवश्यक छ';
    else if (form.password.length < 8)         e.password = 'कम्तिमा ८ अक्षर चाहिन्छ';
    else if (!/[A-Z]/.test(form.password))     e.password = 'कम्तिमा एक ठूलो अक्षर (A-Z) चाहिन्छ';
    else if (!/\d/.test(form.password))        e.password = 'कम्तिमा एक अंक (0-9) चाहिन्छ';
    if (form.password !== form.confirm_password) e.confirm_password = 'पासवर्ड मेल खाएन';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!form.district)            e.district    = 'जिल्ला छान्नुस्';
    if (!form.municipality.trim()) e.municipality = 'गाउँपालिका/नगरपालिका आवश्यक छ';
    if (form.role === 'BUYER' && !form.business_type) e.business_type = 'व्यवसायको प्रकार छान्नुस्';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e = {};
    if (form.role === 'FARMER') {
      if (!form.id_number.trim())  e.id_number      = 'परिचयपत्र नम्बर आवश्यक छ';
      if (!files.id_front_photo)   e.id_front_photo = 'परिचयपत्रको अगाडिको फोटो आवश्यक छ';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const totalSteps = form.role === 'BUYER' ? 2 : 3;

  const handleNext = () => {
    if (step === 1 && validateStep1()) { setErrors({}); setStep(2); }
    else if (step === 2 && form.role === 'FARMER' && validateStep2()) { setErrors({}); setStep(3); }
  };

  const handleBack = () => { setErrors({}); setStep(s => s - 1); };

  const handleSubmit = async (fromBuyer = false) => {
    if (fromBuyer) {
      if (!validateStep2()) return;
    } else {
      if (!validateStep3()) return;
    }
    setLoading(true);
    setServerErrors({});

    const fd = new FormData();
    const skip = ['confirm_password', 'main_crops'];
    Object.entries(form).forEach(([k, v]) => {
      if (!skip.includes(k) && v !== '' && v !== null && v !== undefined) {
        fd.append(k, v);
      }
    });
    form.main_crops.forEach(id => fd.append('main_crops', id));
    if (files.profile_photo)  fd.append('profile_photo',  files.profile_photo);
    if (files.id_front_photo) fd.append('id_front_photo', files.id_front_photo);
    if (files.id_back_photo)  fd.append('id_back_photo',  files.id_back_photo);

    try {
      await api.post('/auth/register/', fd);
      setSuccess(true);
    } catch (err) {
      const d = err.response?.data;
      if (d && typeof d === 'object') {
        setServerErrors(d);
        const step1Fields = ['username', 'email', 'phone', 'password', 'full_name'];
        const step2Fields = ['district', 'municipality', 'business_type'];
        const keys = Object.keys(d);
        if (keys.some(k => step1Fields.includes(k))) setStep(1);
        else if (keys.some(k => step2Fields.includes(k))) setStep(2);
      }
    } finally {
      setLoading(false);
    }
  };

  const fieldError = (key) => errors[key] || (serverErrors[key] ? (Array.isArray(serverErrors[key]) ? serverErrors[key][0] : serverErrors[key]) : null);

  // ── Auth loading guard — show spinner until session check completes ──────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 rounded-full border-4 border-green-200 border-t-green-700 animate-spin" />
      </div>
    );
  }

  // ── Success state ────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-3xl shadow-sm p-10 max-w-sm w-full text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 animate-bounce"
            style={{ backgroundColor: '#f0fdf4', border: '3px solid #1a6b2e' }}
          >
            ✓
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">दर्ता सफल भयो!</h2>
          <p className="text-sm text-gray-500 mb-1">
            {form.full_name || form.username} जी, स्वागत छ!
          </p>
          <p className="text-sm text-gray-500 mb-8">
            तपाईंको खाता प्रमाणीकरण भइरहेको छ।<br />
            प्रमाणीकरण पछि सम्पूर्ण सुविधा उपलब्ध हुनेछ।
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3.5 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#1a6b2e' }}
          >
            लगइन गर्नुस् →
          </button>
        </div>
      </div>
    );
  }

  const idTypePlaceholder = ID_TYPES.find(t => t.value === form.id_type)?.placeholder || '';

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* Left panel */}
      <div
        className="relative px-4 pt-12 pb-10 text-white text-center md:flex md:flex-col md:items-center md:justify-center md:w-80 md:pt-0 md:pb-0 flex-shrink-0"
        style={{ background: 'linear-gradient(160deg, #1a6b2e 0%, #2d9249 100%)' }}
      >
        <div className="absolute top-4 left-4">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm font-medium text-green-200 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10"
          >
            ← किसान बजार
          </Link>
        </div>
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/20 mb-2 md:mb-4 mx-auto">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-white">
            <path d="M12 2a10 10 0 0 1 10 10c0 4-2.5 7.5-6 9M12 2C8 6 6 10 6 14c0 3 1.5 5.5 4 7"/>
            <path d="M12 22V10M8 14c1.5-1 3-1.5 4-2M16 14c-1.5-1-3-1.5-4-2"/>
          </svg>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold">किसान बजार</h1>
        <p className="text-green-200 text-sm md:text-base mt-1 md:mt-3 md:max-w-xs">
          किसान र बजार एकै ठाउँमा।<br />
          बिचौलिया हटाऊँ, किसानलाई सही मूल्य दिलाऊँ।
        </p>
        <div className="hidden md:flex flex-col gap-3 mt-8 w-full px-4">
          {['मुफ्त दर्ता', 'सुरक्षित र विश्वसनीय', 'मोबाइल फ्रेन्डली'].map(text => (
            <div key={text} className="flex items-center gap-2.5 text-sm text-green-100">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — wizard */}
      <div className="flex-1 px-4 py-6 md:py-8 md:flex md:items-start md:justify-center md:bg-gray-50 md:px-8 overflow-y-auto">
        <div className="bg-white rounded-3xl shadow-sm w-full md:max-w-lg">

          <ProgressBar step={step} role={form.role} />

          <div className="px-6 pb-8">

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-base font-bold text-gray-800 mb-1">आधारभूत जानकारी</h2>

                {/* Role cards */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      value: 'FARMER',
                      label: 'किसान',
                      desc: 'बाली बेच्न र मूल्य हेर्न',
                      icon: (
                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 10h16" />
                          <path d="M8 10c0-2.2 1.8-4 4-4s4 1.8 4 4" />
                          <circle cx="12" cy="15" r="2.5" />
                          <path d="M7.5 22c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" />
                        </svg>
                      ),
                    },
                    {
                      value: 'BUYER',
                      label: 'खरिदकर्ता',
                      desc: 'किसानसँग सीधा किन्न',
                      icon: (
                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="9" cy="21" r="1" />
                          <circle cx="20" cy="21" r="1" />
                          <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61H19.4a2 2 0 001.98-1.73L22.5 6H6" />
                        </svg>
                      ),
                    },
                  ].map(r => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => { set('role', r.value); setStep(1); }}
                      className="rounded-xl p-3.5 border-2 text-left transition-all hover:border-green-400"
                      style={form.role === r.value
                        ? { borderColor: '#1a6b2e', backgroundColor: '#f0fdf4', color: '#1a6b2e' }
                        : { borderColor: '#e5e7eb', backgroundColor: 'white', color: '#6b7280' }
                      }
                    >
                      <div className="mb-1">{r.icon}</div>
                      <div className="font-bold text-sm text-gray-800">{r.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{r.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Full name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">पूरा नाम <span className="text-red-500">*</span></label>
                  <input type="text" value={form.full_name} onChange={e => set('full_name', e.target.value)}
                    placeholder="रामबहादुर थापा" className={INPUT + (fieldError('full_name') ? ' border-red-400' : '')} />
                  {fieldError('full_name') && <p className={ERROR}>{fieldError('full_name')}</p>}
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">प्रयोगकर्ता नाम <span className="text-red-500">*</span></label>
                  <input type="text" value={form.username} onChange={e => set('username', e.target.value)}
                    placeholder="rambahadur123" className={INPUT + (fieldError('username') ? ' border-red-400' : '')} />
                  {fieldError('username') && <p className={ERROR}>{fieldError('username')}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">इमेल <span className="text-red-500">*</span></label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    placeholder="name@example.com" className={INPUT + (fieldError('email') ? ' border-red-400' : '')} />
                  {fieldError('email') && <p className={ERROR}>{fieldError('email')}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">फोन <span className="text-red-500">*</span></label>
                  <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                    placeholder="98XXXXXXXX" maxLength={10} className={INPUT + (fieldError('phone') ? ' border-red-400' : '')} />
                  {fieldError('phone') && <p className={ERROR}>{fieldError('phone')}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">पासवर्ड <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)}
                      placeholder="कम्तिमा ८ अक्षर, १ ठूलो, १ अंक" className={INPUT + ' pr-10' + (fieldError('password') ? ' border-red-400' : '')} />
                    <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors">
                      <EyeIcon open={showPassword} />
                    </button>
                  </div>
                  {fieldError('password') && <p className={ERROR}>{fieldError('password')}</p>}
                  {/* Strength hints */}
                  {form.password && (
                    <div className="flex gap-3 mt-1.5">
                      {[
                        { ok: form.password.length >= 8, label: '८+ अक्षर' },
                        { ok: /[A-Z]/.test(form.password), label: 'ठूलो अक्षर' },
                        { ok: /\d/.test(form.password), label: 'अंक' },
                      ].map(h => (
                        <span key={h.label} className={`text-xs ${h.ok ? 'text-green-600' : 'text-gray-400'}`}>
                          {h.ok ? '✓' : '○'} {h.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">पासवर्ड पुन: <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type={showConfirmPassword ? 'text' : 'password'} value={form.confirm_password} onChange={e => set('confirm_password', e.target.value)}
                      placeholder="पासवर्ड दोहोर्याउनुस्" className={INPUT + ' pr-10' + (fieldError('confirm_password') ? ' border-red-400' : '')} />
                    <button type="button" onClick={() => setShowConfirmPassword(v => !v)} tabIndex={-1}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors">
                      <EyeIcon open={showConfirmPassword} />
                    </button>
                  </div>
                  {fieldError('confirm_password') && <p className={ERROR}>{fieldError('confirm_password')}</p>}
                </div>

                <button onClick={handleNext}
                  className="w-full py-3.5 rounded-xl text-white font-bold text-sm mt-2 hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#1a6b2e' }}>
                  अगाडि जानुस् →
                </button>
                <p className="text-center text-sm text-gray-500">
                  पहिलेनै खाता छ?{' '}
                  <Link to="/login" className="font-bold hover:underline" style={{ color: '#f97316' }}>लगइन गर्नुस्</Link>
                </p>
              </div>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-base font-bold text-gray-800 mb-1">स्थान र विवरण</h2>

                {/* ── District — searchable ── */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    जिल्ला <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    autoComplete="off"
                    value={form.district || districtSearch}
                    placeholder={form.district ? '' : 'जिल्ला खोज्नुस् (जस्तै: काठ)'}
                    className={INPUT + (fieldError('district') ? ' border-red-400' : '')}
                    onFocus={() => {
                      // When refocusing after a district was already picked, let user re-search
                      if (form.district) {
                        setDistrictSearch(form.district);
                        set('district', '');
                      }
                      setDistrictOpen(true);
                    }}
                    onChange={e => {
                      setDistrictSearch(e.target.value);
                      set('district', '');
                      clearError('district');
                      setDistrictOpen(true);
                    }}
                    onBlur={() => {
                      // Delay so onMouseDown on dropdown items fires first
                      setTimeout(() => {
                        setDistrictOpen(false);
                        // If user blurred without selecting, clear the partial search
                        setDistrictSearch(prev => {
                          if (!form.district) return '';
                          return prev;
                        });
                      }, 150);
                    }}
                  />
                  {/* Dropdown — only open when districtOpen and no district confirmed yet */}
                  {districtOpen && !form.district && filteredDistricts.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 border border-gray-200 rounded-xl bg-white shadow-lg max-h-52 overflow-y-auto z-50">
                      {filteredDistricts.map(d => (
                        <button
                          key={d}
                          type="button"
                          // onMouseDown fires before onBlur, so we can pick the value
                          // before the blur handler closes the dropdown
                          onMouseDown={e => {
                            e.preventDefault(); // keep focus on input during selection
                            set('district', d);
                            setDistrictSearch('');
                            setDistrictOpen(false);
                            clearError('district');
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-green-50 hover:text-green-700 transition-colors"
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  )}
                  {districtOpen && !form.district && districtSearch && filteredDistricts.length === 0 && (
                    <p className="text-xs text-gray-400 mt-1">"{districtSearch}" — कुनै जिल्ला फेला परेन</p>
                  )}
                  {fieldError('district') && <p className={ERROR}>{fieldError('district')}</p>}
                </div>

                {/* ── Municipality — appears after district confirmed ── */}
                {form.district && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      गाउँपालिका/नगरपालिका <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.municipality}
                      onChange={e => { set('municipality', e.target.value); clearError('municipality'); }}
                      className={INPUT + (fieldError('municipality') ? ' border-red-400' : '')}
                    >
                      <option value="">-- गाउँपालिका/नगरपालिका छान्नुस् --</option>
                      {municipalities.map(m => (
                        <option key={m.name} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                    {fieldError('municipality') && <p className={ERROR}>{fieldError('municipality')}</p>}
                  </div>
                )}

                {/* ── Ward — appears after municipality confirmed ── */}
                {form.municipality && wardCount > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">वडा नम्बर</label>
                    <select
                      value={form.ward_number}
                      onChange={e => set('ward_number', e.target.value)}
                      className={INPUT}
                    >
                      <option value="">-- वडा छान्नुस् (ऐच्छिक) --</option>
                      {Array.from({ length: wardCount }, (_, i) => i + 1).map(n => (
                        <option key={n} value={n}>वडा {n}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* ── BUYER only: business type ── */}
                {form.role === 'BUYER' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      व्यवसायको प्रकार <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.business_type}
                      onChange={e => { set('business_type', e.target.value); clearError('business_type'); }}
                      className={INPUT + (fieldError('business_type') ? ' border-red-400' : '')}
                    >
                      <option value="">-- प्रकार छान्नुस् --</option>
                      {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {fieldError('business_type') && <p className={ERROR}>{fieldError('business_type')}</p>}
                  </div>
                )}

                {/* ── FARMER only: farm size + main crops ── */}
                {form.role === 'FARMER' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">खेतको क्षेत्रफल (रोपनीमा)</label>
                      <input
                        type="number" min="0" step="0.5"
                        value={form.farm_size_ropani}
                        onChange={e => set('farm_size_ropani', e.target.value)}
                        placeholder="जस्तै: 3.5 (ऐच्छिक)"
                        className={INPUT}
                      />
                    </div>

                    {crops.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          मुख्य बाली
                          <span className="text-gray-400 font-normal ml-1">(अधिकतम ५ छान्नुस्)</span>
                        </label>
                        <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto p-1">
                          {crops.map(c => {
                            const sel = form.main_crops.includes(c.id);
                            const maxed = form.main_crops.length >= 5 && !sel;
                            return (
                              <button
                                key={c.id}
                                type="button"
                                disabled={maxed}
                                onClick={() => toggleCrop(c.id)}
                                className="px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all disabled:opacity-40"
                                style={sel
                                  ? { borderColor: '#1a6b2e', backgroundColor: '#f0fdf4', color: '#1a6b2e' }
                                  : { borderColor: '#e5e7eb', backgroundColor: 'white', color: '#374151' }
                                }
                              >
                                {c.emoji} {c.name_nepali}
                              </button>
                            );
                          })}
                        </div>
                        {form.main_crops.length > 0 && (
                          <p className="text-xs text-green-600 mt-1">{form.main_crops.length} बाली छानिएको</p>
                        )}
                      </div>
                    )}
                  </>
                )}

                <div className="flex gap-3 mt-2">
                  <button onClick={handleBack}
                    className="flex-1 py-3.5 rounded-xl font-bold text-sm border-2 hover:bg-gray-50 transition-colors"
                    style={{ borderColor: '#e5e7eb', color: '#374151' }}>
                    ← पछाडि
                  </button>
                  {form.role === 'FARMER' ? (
                    <button onClick={handleNext}
                      className="flex-[2] py-3.5 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: '#1a6b2e' }}>
                      अगाडि जानुस् →
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSubmit(true)}
                      disabled={loading}
                      className="flex-[2] py-3.5 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                      style={{ backgroundColor: '#1a6b2e' }}>
                      {loading ? 'दर्ता हुँदैछ...' : 'दर्ता गर्नुस् ✓'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP 3 ── */}
            {step === 3 && (
              <div className="flex flex-col gap-5">
                <h2 className="text-base font-bold text-gray-800 mb-1">फोटो र परिचयपत्र</h2>

                {/* Profile photo */}
                <FileUploadBox
                  label="प्रोफाइल फोटो (ऐच्छिक)"
                  hint="jpg, jpeg, png, webp — अधिकतम २MB"
                  preview={previews.profile_photo}
                  onChange={f => handleFile('profile_photo', f)}
                  accept=".jpg,.jpeg,.png,.webp"
                  shape="circle"
                />

                <hr className="border-gray-100" />

                {/* ID verification */}
                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-3">
                    परिचयपत्र प्रमाणीकरण
                    {form.role === 'FARMER'
                      ? <span className="text-red-500 ml-1">*</span>
                      : <span className="text-gray-400 font-normal ml-1">(ऐच्छिक)</span>
                    }
                  </h3>

                  {form.role === 'BUYER' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4">
                      <p className="text-xs text-blue-700 leading-relaxed">
                        परिचयपत्र दिनुभएमा तपाईंको खाता <strong>Verified</strong> badge पाउनेछ ✓
                      </p>
                    </div>
                  )}

                  {/* ID type */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      परिचयपत्रको प्रकार
                      {form.role === 'FARMER' && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    <select value={form.id_type} onChange={e => set('id_type', e.target.value)} className={INPUT}>
                      {ID_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>

                  {/* ID number */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      परिचयपत्र नम्बर
                      {form.role === 'FARMER' && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    <input type="text" value={form.id_number} onChange={e => set('id_number', e.target.value)}
                      placeholder={idTypePlaceholder}
                      className={INPUT + (fieldError('id_number') ? ' border-red-400' : '')} />
                    {fieldError('id_number') && <p className={ERROR}>{fieldError('id_number')}</p>}
                  </div>

                  {/* ID front */}
                  <div className="mb-3">
                    <FileUploadBox
                      label="परिचयपत्रको अगाडिको भाग"
                      hint="परिचयपत्रको अगाडिको भाग खिच्नुस् — jpg, jpeg, png, अधिकतम ५MB"
                      preview={previews.id_front_photo}
                      onChange={f => handleFile('id_front_photo', f)}
                      accept=".jpg,.jpeg,.png"
                      required={form.role === 'FARMER'}
                      error={fieldError('id_front_photo')}
                    />
                  </div>

                  {/* ID back */}
                  <FileUploadBox
                    label="परिचयपत्रको पछाडिको भाग (ऐच्छिक)"
                    hint="परिचयपत्रको पछाडिको भाग खिच्नुस् — jpg, jpeg, png"
                    preview={previews.id_back_photo}
                    onChange={f => handleFile('id_back_photo', f)}
                    accept=".jpg,.jpeg,.png"
                  />

                  {/* Security notice */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mt-4">
                    <p className="text-xs text-blue-700 leading-relaxed">
                      🔒 तपाईंको परिचयपत्र सुरक्षित राखिनेछ। यो प्रमाणीकरणका लागि मात्र प्रयोग हुनेछ।
                    </p>
                  </div>
                </div>

                {/* Server error fallback */}
                {Object.keys(serverErrors).length > 0 && !Object.keys(errors).length && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <p className="text-xs text-red-600 font-medium mb-1">दर्तामा समस्या आयो:</p>
                    {Object.entries(serverErrors).map(([k, v]) => (
                      <p key={k} className="text-xs text-red-600">
                        {Array.isArray(v) ? v.join(', ') : String(v)}
                      </p>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={handleBack}
                    className="flex-1 py-3.5 rounded-xl font-bold text-sm border-2 hover:bg-gray-50 transition-colors"
                    style={{ borderColor: '#e5e7eb', color: '#374151' }}>
                    ← पछाडि
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-[2] py-3.5 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                    style={{ backgroundColor: '#1a6b2e' }}>
                    {loading ? 'दर्ता हुँदैछ...' : 'दर्ता गर्नुस् ✓'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <div className="h-8 md:hidden" />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <ErrorBoundary>
      <RegisterForm />
    </ErrorBoundary>
  );
}
