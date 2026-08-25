import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

export function Tabs({
  tabs,
  activeTab,
  onChange,
  className = '',
}) {
  return (
    <div className={clsx('flex border-b border-slate-200 overflow-x-auto no-scrollbar', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={clsx(
              'relative py-3.5 px-5 font-semibold text-sm transition-colors whitespace-nowrap flex items-center gap-2',
              isActive ? 'text-purple-600' : 'text-slate-500 hover:text-slate-900'
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={clsx(
                  'text-xs px-2 py-0.5 rounded-full font-bold',
                  isActive ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                )}
              >
                {tab.count}
              </span>
            )}
            {isActive && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
