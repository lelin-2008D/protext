import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
  variant?: 'badge' | 'plain';
  alt?: string;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 32,
  variant = 'plain',
  alt = 'HISAB Logo'
}) => {
  const base = import.meta.env.BASE_URL || '/';
  // Ensure single slash between base and favicon.svg
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const logoSrc = `${normalizedBase}favicon.svg`;

  if (variant === 'badge') {
    return (
      <div
        className={`relative flex items-center justify-center rounded-xl bg-slate-900/5 dark:bg-white/5 border border-slate-200/60 dark:border-slate-800/80 p-1.5 shadow-sm overflow-hidden ${className}`}
      >
        <img
          src={logoSrc}
          alt={alt}
          className="w-full h-full object-contain filter drop-shadow-sm transition-transform"
          style={{ width: size, height: size }}
          loading="eager"
        />
      </div>
    );
  }

  return (
    <img
      src={logoSrc}
      alt={alt}
      className={`object-contain filter drop-shadow-sm select-none pointer-events-none transition-transform ${className}`}
      style={{ width: size, height: size }}
      loading="eager"
    />
  );
};
