import React, { useState } from 'react';
import { getAddress } from 'ethers';

interface TokenLogoProps {
  tokenId?: string;
  symbol: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8'
};

const TokenLogo = ({ tokenId, symbol, size = 'md', className = '' }: TokenLogoProps) => {
  const [showFallback, setShowFallback] = useState(false);
  
  const getLogoUrl = (id: string) => {
    try {
      const checksumAddress = getAddress(id);
      return `https://raw.githubusercontent.com/RamsesExchange/ramses-assets/main/blockchains/avalanche/assets/${checksumAddress}/logo.png`;
    } catch {
      return null;
    }
  };

  const logoUrl = tokenId ? getLogoUrl(tokenId) : null;
  const sizeClass = sizeMap[size];
  
  if (showFallback || !logoUrl) {
    return (
      <div className={`${sizeClass} rounded-full bg-muted flex items-center justify-center text-xs font-medium ${className}`}>
        {symbol.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={symbol}
      className={`${sizeClass} rounded-full bg-muted ${className}`}
      onError={() => setShowFallback(true)}
    />
  );
};

export default TokenLogo;