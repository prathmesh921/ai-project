import React from 'react';

interface TeamBadgeProps {
  name: string;
  colour?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
}

export default function TeamBadge({ name, colour = '#003087', size = 'md', showName = false }: TeamBadgeProps) {
  // Generate 2-3 letter abbreviation
  const words = name.trim().split(/\s+/);
  let initials = '';
  if (words.length === 1) {
    initials = words[0].slice(0, 3).toUpperCase();
  } else if (words.length === 2) {
    initials = (words[0][0] + words[1][0]).toUpperCase();
  } else {
    initials = (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
  }

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm font-bold',
    lg: 'w-14 h-14 text-base font-extrabold',
    xl: 'w-20 h-20 text-xl font-black',
  };

  return (
    <div className="flex items-center gap-2.5 inline-flex">
      <div
        className={`${sizeClasses[size]} rounded-xl flex items-center justify-center shrink-0 border border-white/20 shadow-md transition-transform hover:scale-105`}
        style={{
          background: `linear-gradient(135deg, ${colour}dd 0%, #0a0e1a 100%)`,
          boxShadow: `0 0 15px ${colour}40`,
        }}
        title={name}
      >
        <span className="text-white drop-shadow-md tracking-wider font-mono">{initials}</span>
      </div>
      {showName && <span className="font-semibold text-slate-100 truncate">{name}</span>}
    </div>
  );
}
