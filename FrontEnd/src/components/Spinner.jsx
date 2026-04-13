import { useLanguage } from '../context/LanguageContext';

export default function Spinner({ size = 8, label }) {
  const { t } = useLanguage();
  const displayLabel = label !== undefined ? label : t('loading');

  return (
    <div className="flex flex-col justify-center items-center py-10 gap-3">
      <div
        className={`w-${size} h-${size} border-4 rounded-full animate-spin`}
        style={{ borderColor: '#1a6b2e', borderTopColor: 'transparent' }}
      />
      {displayLabel && <p className="text-sm text-gray-400">{displayLabel}</p>}
    </div>
  );
}
