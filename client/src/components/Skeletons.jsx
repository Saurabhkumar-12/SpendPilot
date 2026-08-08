import React from 'react';

export function CardSkeleton() {
  return (
    <div className="p-5 rounded-2xl bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] animate-pulse shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div className="h-3 w-24 bg-[#F7F6F0] dark:bg-[#071C16] rounded"></div>
        <div className="h-8 w-8 bg-[#F7F6F0] dark:bg-[#071C16] rounded-xl"></div>
      </div>
      <div className="h-8 w-36 bg-[#F7F6F0] dark:bg-[#071C16] rounded"></div>
    </div>
  );
}

export function ListSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl bg-[#FCFCF8] dark:bg-[#0E2920] border border-[#DDE5DF] dark:border-[#1A4337] flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F7F6F0] dark:bg-[#071C16]"></div>
            <div className="space-y-2">
              <div className="h-3 w-32 bg-[#F7F6F0] dark:bg-[#071C16] rounded"></div>
              <div className="h-2.5 w-20 bg-[#F7F6F0] dark:bg-[#071C16] rounded"></div>
            </div>
          </div>
          <div className="h-4 w-16 bg-[#F7F6F0] dark:bg-[#071C16] rounded"></div>
        </div>
      ))}
    </div>
  );
}
