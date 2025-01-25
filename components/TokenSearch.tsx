'use client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import Image from 'next/image';
import type { Token } from '@/types/token';

interface TokenSearchProps {
  onSelect: (token: Token) => void;
  initialValue?: string;
}

export function TokenSearch({ onSelect, initialValue }: TokenSearchProps) {
  const [search, setSearch] = useState(initialValue || '');
  const [results, setResults] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const searchTokens = async () => {
      if (!search.trim()) {
        setResults([]);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(search)}`,
          {
            headers: {
              'Accept': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Transform the data to match our Token interface
        const transformedResults = data.coins.slice(0, 10).map((coin: any) => ({
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol,
          thumb: coin.thumb,
          large: coin.large,
          market_cap_rank: coin.market_cap_rank
        }));

        setResults(transformedResults);
      } catch (error) {
        console.error('Search error:', error);
        setError('Failed to fetch tokens. Please try again.');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchTokens, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const handleTokenSelect = (token: Token) => {
    setSelectedToken(token);
    onSelect(token);
    setSearch('');
    setResults([]);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={selectedToken ? selectedToken.name : search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelectedToken(null);
          }}
          className="w-full p-2 pl-8 border rounded bg-muted/50"
          placeholder="Search tokens..."
        />
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      </div>

      {(results.length > 0 || isLoading || error) && !selectedToken && (
        <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
          {isLoading ? (
            <div className="p-2 text-center text-muted-foreground">Loading...</div>
          ) : error ? (
            <div className="p-2 text-center text-red-500">{error}</div>
          ) : (
            results.map((token) => (
              <div
                key={token.id}
                onClick={() => handleTokenSelect(token)}
                className="p-2 hover:bg-muted cursor-pointer flex items-center gap-2"
              >
                <div className="relative w-8 h-8">
                  <Image
                    src={token.thumb}
                    alt={token.name}
                    width={32}
                    height={32}
                    className="rounded-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `data:image/svg+xml,${encodeURIComponent(
                        `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                          <rect width="32" height="32" fill="#f0f0f0"/>
                          <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="12" fill="#666">
                            ${token.symbol.slice(0, 3).toUpperCase()}
                          </text>
                        </svg>`
                      )}`;
                    }}
                  />
                </div>
                <div>
                  <div className="font-medium">{token.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {token.symbol.toUpperCase()}
                    {token.market_cap_rank && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        Rank #{token.market_cap_rank}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      {selectedToken && (
        <button
          onClick={() => {
            setSelectedToken(null);
            setSearch('');
          }}
          className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}