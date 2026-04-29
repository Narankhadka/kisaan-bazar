import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

function Highlight({ text, query }) {
  if (!query || !text) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-gray-900 not-italic px-0.5 rounded">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </span>
  );
}

export default function PriceCard({ price, highlight = '', onClick }) {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const avg = parseFloat(price.avg_price);
  const min = parseFloat(price.min_price);
  const max = parseFloat(price.max_price);
  const cropName = lang === 'en' ? (price.crop?.name_english || price.crop?.name_nepali) : price.crop?.name_nepali;

  const handleClick = () => {
    if (onClick) { onClick(price); return; }
    const name = price.crop?.name_nepali;
    if (name) navigate(`/prices?q=${encodeURIComponent(name)}`);
  };

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && handleClick()}
      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-1 cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all duration-150 active:scale-[0.98]"
    >
      <div className="text-3xl text-center">{price.crop?.emoji || '🌿'}</div>
      <div className="font-semibold text-gray-800 text-center text-sm leading-tight">
        <Highlight text={cropName} query={highlight} />
      </div>
      <div className="text-gray-400 text-xs text-center">
        <Highlight text={lang === 'en' ? price.crop?.name_nepali : price.crop?.name_english} query={highlight} />
      </div>
      <div className="text-center mt-1">
        <span className="text-lg font-bold" style={{ color: '#1a6b2e' }}>
          {t('currency')}{avg.toFixed(0)}
        </span>
        <span className="text-xs text-gray-400 ml-1">/{price.crop?.unit || 'kg'}</span>
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{t('price.min')} {t('currency')}{min.toFixed(0)}</span>
        <span>{t('price.max')} {t('currency')}{max.toFixed(0)}</span>
      </div>
    </div>
  );
}
