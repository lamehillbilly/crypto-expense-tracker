'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';
import { getAddress } from 'ethers';

interface TokenLogoContextType {
  getTokenLogoUrl: (tokenId: string) => string | null;
  markLogoAsFailed: (tokenId: string) => void;
  preloadLogo: (tokenId: string) => Promise<boolean>;
}

const TokenLogoContext = createContext<TokenLogoContextType | null>(null);

export function TokenLogoProvider({ children }: { children: React.ReactNode }) {
  const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set());
  const [validatedLogos, setValidatedLogos] = useState<Set<string>>(new Set());

  const getTokenLogoUrl = useCallback((tokenId: string) => {
    if (!tokenId) return null;
    try {
      const checksumAddress = getAddress(tokenId);
      if (failedLogos.has(checksumAddress)) {
        return null;
      }
      if (!validatedLogos.has(checksumAddress)) {
        return null;
      }
      // Use our API endpoint instead of GitHub directly
      return `/api/token-logo/${checksumAddress}`;
    } catch (error) {
      return null;
    }
  }, [failedLogos, validatedLogos]);

  const markLogoAsFailed = useCallback((tokenId: string) => {
    try {
      const checksumAddress = getAddress(tokenId);
      setFailedLogos(prev => new Set(prev).add(checksumAddress));
    } catch (error) {
      console.error('Invalid token address:', tokenId);
    }
  }, []);

  const preloadLogo = useCallback(async (tokenId: string): Promise<boolean> => {
    if (!tokenId) return false;
    try {
      const checksumAddress = getAddress(tokenId);
      
      if (failedLogos.has(checksumAddress)) {
        return false;
      }
      
      if (validatedLogos.has(checksumAddress)) {
        return true;
      }

      // Check our API endpoint
      const response = await fetch(`/api/token-logo/${checksumAddress}`, {
        method: 'HEAD',
      });
      
      if (response.ok) {
        setValidatedLogos(prev => new Set(prev).add(checksumAddress));
        return true;
      } else {
        setFailedLogos(prev => new Set(prev).add(checksumAddress));
        return false;
      }
    } catch (error) {
      console.error('Error preloading logo:', error);
      return false;
    }
  }, [failedLogos, validatedLogos]);

  return (
    <TokenLogoContext.Provider value={{ getTokenLogoUrl, markLogoAsFailed, preloadLogo }}>
      {children}
    </TokenLogoContext.Provider>
  );
}

export function useTokenLogo() {
  const context = useContext(TokenLogoContext);
  if (!context) {
    throw new Error('useTokenLogo must be used within a TokenLogoProvider');
  }
  return context;
}