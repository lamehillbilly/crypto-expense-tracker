import { useState, useCallback } from 'react';
import { getAddress } from 'ethers';

export function useTokenLogo() {
  const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set());

  const getTokenLogoUrl = useCallback((tokenId: string) => {
    if (!tokenId) return null;
    try {
      const checksumAddress = getAddress(tokenId);
      if (failedLogos.has(checksumAddress)) {
        return null;
      }
      return `https://raw.githubusercontent.com/RamsesExchange/ramses-assets/main/blockchains/avalanche/assets/${checksumAddress}/logo.png`;
    } catch (error) {
      return null;
    }
  }, [failedLogos]);

  const markLogoAsFailed = useCallback((tokenId: string) => {
    setFailedLogos(prev => new Set(prev).add(tokenId));
  }, []);

  return { getTokenLogoUrl, markLogoAsFailed, failedLogos };
} 