import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomDropdown({ value, onChange, options, placeholder, className, buttonClassName }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative ${className || ''}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center justify-between w-full h-9 px-3 rounded-md bg-slate-950/60 border border-white/15 text-sm text-white hover:border-white/25 transition-colors ${buttonClassName || ''}`}
      >
        <span className={selected ? '' : 'text-slate-500'}>{selected ? selected.label : placeholder}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform shrink-0 ml-2 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md bg-[#585a62] border border-white/10 shadow-xl overflow-hidden py-0.5">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`flex items-center justify-between w-full px-3 py-2 text-sm text-white transition-colors ${
                opt.value === value ? 'bg-[#1e66d9]' : 'hover:bg-white/10'
              }`}
            >
              <span>{opt.label}</span>
              {opt.value === value && <Check className="h-3.5 w-3.5 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}