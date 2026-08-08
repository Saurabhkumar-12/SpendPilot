import React from 'react';
import { Plus } from 'lucide-react';

export function SummaryCard({ title, value, amount, currency = '₹', icon: Icon, color = 'emerald', actionText, onAction, onClick }) {
  const colorStyles = {
    emerald: {
      bg: 'bg-[#FCFCF8] dark:bg-[#0E2920]',
      border: 'border-[#DDE5DF] dark:border-[#1A4337]',
      text: 'text-[#19B86A] dark:text-[#2ED47A]',
      badgeBg: 'bg-[#DDF5E8] dark:bg-[#071C16]',
      btn: 'bg-[#DDF5E8] text-[#092B20] hover:bg-[#19B86A] hover:text-white dark:bg-[#071C16] dark:text-[#2ED47A]'
    },
    forest: {
      bg: 'bg-[#092B20] text-[#FCFCF8]',
      border: 'border-[#1A4337]',
      text: 'text-[#2ED47A]',
      badgeBg: 'bg-[#071C16]',
      btn: 'bg-[#19B86A] text-white'
    },
    amber: {
      bg: 'bg-[#FCFCF8] dark:bg-[#0E2920]',
      border: 'border-[#DDE5DF] dark:border-[#1A4337]',
      text: 'text-[#E8A317]',
      badgeBg: 'bg-[#FFF8E6] dark:bg-[#071C16]',
      btn: 'bg-[#FFF8E6] text-[#E8A317]'
    },
    danger: {
      bg: 'bg-[#FCFCF8] dark:bg-[#0E2920]',
      border: 'border-[#DDE5DF] dark:border-[#1A4337]',
      text: 'text-[#D94A4A]',
      badgeBg: 'bg-[#FDF2F2] dark:bg-[#071C16]',
      btn: 'bg-[#FDF2F2] text-[#D94A4A]'
    }
  };

  const style = colorStyles[color] || colorStyles.emerald;
  const displayVal = value !== undefined ? value : `${currency}${(amount || 0).toLocaleString()}`;

  const handleCardClick = (e) => {
    if (onClick) {
      onClick(e);
    } else if (onAction) {
      onAction(e);
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`p-5 rounded-2xl border ${style.border} ${style.bg} shadow-md space-y-3 transition transform hover:-translate-y-1 hover:border-[#19B86A]/40 duration-200 flex flex-col justify-between cursor-pointer group`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#53635B] dark:text-[#B8C9C0] tracking-wide uppercase font-mono">{title}</span>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl ${style.badgeBg} ${style.text} flex items-center justify-center group-hover:scale-110 transition`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-end justify-between gap-2 pt-1">
        <div>
          <h3 className={`font-display font-extrabold text-2xl ${style.text}`}>
            {displayVal}
          </h3>
        </div>

        {actionText && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onAction) onAction(e);
              else if (onClick) onClick(e);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition ${style.btn}`}
          >
            <Plus className="w-3.5 h-3.5" /> {actionText}
          </button>
        )}
      </div>
    </div>
  );
}
