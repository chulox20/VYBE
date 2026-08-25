import React from 'react';

export function FeedSkeleton({ count = 3 }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm animate-pulse flex flex-col gap-3.5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200" />
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="w-32 h-3.5 bg-slate-200 rounded-full" />
              <div className="w-20 h-2.5 bg-slate-100 rounded-full" />
            </div>
          </div>
          <div className="space-y-2 mt-1">
            <div className="w-full h-3 bg-slate-200 rounded-full" />
            <div className="w-5/6 h-3 bg-slate-200 rounded-full" />
            <div className="w-2/3 h-3 bg-slate-100 rounded-full" />
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-1">
            <div className="w-12 h-6 bg-slate-100 rounded-full" />
            <div className="w-12 h-6 bg-slate-100 rounded-full" />
            <div className="w-12 h-6 bg-slate-100 rounded-full" />
            <div className="w-6 h-6 bg-slate-100 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
