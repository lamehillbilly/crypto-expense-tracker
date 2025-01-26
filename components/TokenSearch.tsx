import { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { getAddress } from 'ethers';
import _ from 'lodash';
import { Button } from '@/components/ui/button';

interface TokenMetadata {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  price: number;
  source?: 'local' | 'coingecko';
  image?: string;
  large?: string; // For CoinGecko images
}

interface TokenSearchProps {
  onSelect: (token: TokenMetadata | null) => void;
  initialValue?: string;
  selectedToken?: TokenMetadata | null;
}

export function TokenSearch({ onSelect, initialValue, selectedToken: externalSelectedToken }: TokenSearchProps) {
  const [search, setSearch] = useState(initialValue || '');
  const [results, setResults] = useState<TokenMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenMetadata | null>(externalSelectedToken || null);
  const [error, setError] = useState<string | null>(null);
  const [allTokens, setAllTokens] = useState<TokenMetadata[]>([]);

  // Search CoinGecko API
  const searchCoinGecko = async (searchTerm: string): Promise<TokenMetadata[]> => {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(searchTerm)}`
      );
      if (!response.ok) throw new Error('CoinGecko API error');
      
      const data = await response.json();
      return data.coins.slice(0, 5).map((coin: any) => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        decimals: 18,
        price: 0,
        source: 'coingecko' as const,
        image: coin.large,
        large: coin.large
      }));
    } catch (error) {
      console.error('CoinGecko search error:', error);
      return [];
    }
  };

  // Fetch local tokens
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await fetch('https://pharaoh-api-production.up.railway.app/tokens');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const tokens: TokenMetadata[] = await response.json();
        const uniqueTokens = _.uniqBy(tokens, token => token.symbol.toLowerCase());
        setAllTokens(uniqueTokens.map(token => ({ ...token, source: 'local' as const })));
      } catch (error) {
        console.error('Error fetching tokens:', error);
        setError('Failed to fetch tokens. Please try again.');
      }
    };

    fetchTokens();
  }, []);

  // Combined search effect
  useEffect(() => {
    const searchTokens = async () => {
      const searchTerm = search.toLowerCase().trim();
      if (!searchTerm) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      
      // Search local tokens
      const localResults = allTokens
        .filter(token => 
          token.symbol?.toLowerCase().includes(searchTerm) ||
          token.name?.toLowerCase().includes(searchTerm)
        );

      // Search CoinGecko
      const geckoResults = await searchCoinGecko(searchTerm);

      // Combine and deduplicate results
      const combinedResults = _.uniqBy(
        [...localResults, ...geckoResults],
        token => token.symbol.toLowerCase()
      ).slice(0, 10);

      setResults(combinedResults);
      setIsLoading(false);
    };

    const debounce = setTimeout(searchTokens, 300);
    return () => clearTimeout(debounce);
  }, [search, allTokens]);

  const handleTokenSelect = async (token: CoinGeckoToken) => {
    try {
      // Get the latest price when selecting
      const priceResponse = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${token.id}&vs_currencies=usd`
      );
      
      if (!priceResponse.ok) throw new Error('Failed to fetch latest price');
      
      const priceData = await priceResponse.json();
      
      // Make sure we pass through all necessary token data including images
      const updatedToken = {
        ...token,
        current_price: priceData[token.id]?.usd,
        // Ensure we keep the large image URL
        large: token.large || token.thumb,
        image: token.large || token.thumb // Add image field for consistency
      };
  
      setSelectedToken(updatedToken);
      onSelect(updatedToken);
      setSearch('');
      setResults([]);
    } catch (error) {
      console.error('Error fetching latest price:', error);
      // Still select the token even if price fetch fails
      const tokenWithImage = {
        ...token,
        large: token.large || token.thumb,
        image: token.large || token.thumb // Add image field for consistency
      };
      setSelectedToken(tokenWithImage);
      onSelect(tokenWithImage);
      setSearch('');
      setResults([]);
    }
  };

  const handleClearSelection = () => {
    setSelectedToken(null);
    onSelect(null);
    setSearch('');
    setResults([]);
  };

  // If token is already selected, show the selected token with clear option
  if (selectedToken) {
    return (
      <div className="relative">
        <div className="p-2 border rounded bg-muted/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selectedToken.image && (
              <img
                src={selectedToken.image}
                alt={selectedToken.symbol}
                className="w-8 h-8 rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <div>
              <div className="font-medium">{selectedToken.name}</div>
              <div className="text-sm text-muted-foreground">
                {selectedToken.symbol}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSelection}
            className="ml-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
          }}
          className="w-full p-2 pl-8 border rounded bg-muted/50"
          placeholder="Search tokens..."
        />
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        {isLoading && (
          <div className="absolute right-2 top-2.5 text-muted-foreground">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {(results.length > 0 || error) && (
        <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
          {error ? (
            <div className="p-2 text-center text-red-500">{error}</div>
          ) : (
            results.map((token) => (
              <div
                key={`${token.source}-${token.id}`}
                onClick={() => handleTokenSelect(token)}
                className="p-2 hover:bg-muted cursor-pointer flex items-center gap-2"
              >
                <div className="relative flex-shrink-0 w-8 h-8">
                  {(token.image || token.large) && (
                    <img 
                      src={token.large || token.image}
                      alt={token.symbol}
                      className="w-8 h-8 rounded-full bg-muted"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                </div>
                <div>
                  <div className="font-medium">{token.name}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <span>{token.symbol}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted-foreground/10">
                      {token.source === 'coingecko' ? 'CoinGecko' : 'Local'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}