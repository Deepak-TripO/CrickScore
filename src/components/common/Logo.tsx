import React from 'react';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  href?: string;
}

export default function Logo({ size = 'md', className = '', href = '/' }: LogoProps) {
  const heightClass = {
    sm: 'h-10 sm:h-12',
    md: 'h-12 sm:h-14',
    lg: 'h-16 sm:h-20',
    xl: 'h-24 sm:h-28'
  }[size] || 'h-12 sm:h-14';

  const content = (
    <div className={`inline-flex items-center gap-2 group shrink-0 ${className}`}>
      <img
        src="/logo.png"
        alt="BatScore Logo"
        loading="eager"
        decoding="async"
        className={`${heightClass} w-auto object-contain transition-transform group-hover:scale-105`}
      />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0">
        {content}
      </Link>
    );
  }

  return content;
}
