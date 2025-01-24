// hooks/useClaims.ts
import { useState, useEffect } from 'react';
import { DailyClaimAggregate } from '@/types';

export function useClaims() {
  const [claims, setClaims] = useState<DailyClaimAggregate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/claims');
      if (!response.ok) throw new Error('Failed to fetch claims');
      const data = await response.json();
      setClaims(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch claims');
    } finally {
      setLoading(false);
    }
  };

  const addClaim = async (claimData: any) => {
    try {
      const response = await fetch('/api/claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(claimData),
      });

      if (!response.ok) throw new Error('Failed to add claim');
      
      // Refresh claims data
      await fetchClaims();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add claim');
      return false;
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  return {
    claims,
    loading,
    error,
    refreshClaims: fetchClaims,
    addClaim
  };
}