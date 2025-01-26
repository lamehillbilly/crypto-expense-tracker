'use client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import Image from 'next/image';
import type { Token } from '@/types/token';
import { getAddress } from 'ethers'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

interface TokenSearchProps {
  onSelect: (token: {
    id: string
    address: string
    symbol: string
    image: string | null
  }) => void;
  initialValue?: string;
}

export function TokenSearch({ onSelect, initialValue }: TokenSearchProps) {
  const [search, setSearch] = useState(initialValue || '');
  const [results, setResults] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<Record<string, boolean>>({});

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
    onSelect({
      id: token.id,
      address: token.id,
      symbol: token.symbol,
      image: getTokenImage(token.id)
    });
    setSearch('');
    setResults([]);
  };

  const normalizeAddress = (address: string) => {
    try {
      return getAddress(address)
    } catch (error) {
      console.warn('Invalid address:', address)
      return address
    }
  }

  const getTokenImage = (tokenAddress: string) => {
    try {
      const normalizedAddress = normalizeAddress(tokenAddress)
      return `https://raw.githubusercontent.com/RamsesExchange/ramses-assets/main/blockchains/avalanche/assets/${normalizedAddress}/logo.png`
    } catch (error) {
      return null
    }
  }

  return (
    <Command>
      <CommandInput placeholder="Search tokens..." />
      <CommandList>
        <CommandEmpty>No tokens found.</CommandEmpty>
        <CommandGroup>
          {results.map((token) => (
            <CommandItem
              key={token.id}
              value={token.symbol}
              onSelect={() => handleTokenSelect(token)}
            >
              <div className="flex items-center gap-2">
                {imageError[token.id] || !getTokenImage(token.id) ? (
                  <div className="w-6 h-6 rounded-full bg-muted-foreground/10 flex items-center justify-center">
                    <span className="text-xs font-medium">
                      {token.symbol.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                ) : (
                  <Image
                    src={getTokenImage(token.id)!}
                    alt={token.name || token.symbol}
                    width={24}
                    height={24}
                    className="rounded-full"
                    onError={() => {
                      setImageError(prev => ({
                        ...prev,
                        [token.id]: true
                      }))
                    }}
                  />
                )}
                <span>{token.name || token.symbol}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}