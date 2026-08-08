import React from 'react';
import { Inbox, Plus } from 'lucide-react';

export function EmptyState({ 
  icon: Icon = Inbox, 
  title = 'No records found', 
  description = 'Start by creating your first entry.', 
  actionText, 
  actionLabel, 
  onAction 
}) {
  const buttonText = actionText || actionLabel;

  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-3xl bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] shadow-sm my-4 space-y-4 transition-colors duration-300">
      
      {/* Icon Badge */}
      <div className="w-14 h-14 rounded-2xl bg-[#EEF9F2] dark:bg-[#071C16] border border-[#19B86A]/30 flex items-center justify-center text-[#19B86A] dark:text-[#2ED47A] shadow-inner">
        <Icon className="w-7 h-7" />
      </div>

      {/* Text Heading & High Contrast Subtext */}
      <div className="space-y-1.5 max-w-md mx-auto">
        <h3 className="font-display font-extrabold text-xl md:text-2xl text-[#092B20] dark:text-[#F7FFF9]">
          {title}
        </h3>
        <p className="text-xs md:text-sm font-medium text-[#53635B] dark:text-[#B8C9C0] leading-relaxed">
          {description}
        </p>
      </div>

      {/* Action Button */}
      {buttonText && onAction && (
        <button
          onClick={onAction}
          className="btn-emerald px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition transform hover:scale-[1.02] mt-2"
        >
          <Plus className="w-4 h-4" />
          <span>{buttonText}</span>
        </button>
      )}

    </div>
  );
}
