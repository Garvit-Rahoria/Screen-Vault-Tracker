import React from 'react';
import logoSrc from '../assets/logo.png';

export const RedRingLogo: React.FC<{ size?: number; className?: string }> = ({
  size = 38,
  className
}) => {
  return (
    <img
      src={logoSrc}
      alt="Screen Vault Tracker"
      width={size}
      height={size}
      className={className}
      style={{
        display: 'block',
        flexShrink: 0,
        objectFit: 'contain',
        userSelect: 'none',
        pointerEvents: 'none'
      }}
      draggable={false}
    />
  );
};
