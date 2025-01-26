import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import _ from 'lodash';

interface CoinGeckoToken {
  id: string;
  symbol: string;
  name: string;
  large?: string;
  thumb?: string;
  current_price?: number;
  market_cap_rank?: number;
}

interface TokenSearchProps {
  onSelect: (token: CoinGeckoToken | null) => void;
  selectedToken?: CoinGeckoToken | null;
}

export function CoinGeckoTokenSearch({ onSelect, selectedToken: externalSelectedToken }: TokenSearchProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<CoinGeckoToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState<CoinGeckoToken | null>(externalSelectedToken || null);
  const [error, setError] = useState<string | null>(null);

  // Search CoinGecko API
  const searchCoinGecko = async (searchTerm: string) => {
    try {
      setIsLoading(true);
      const searchResponse = await fetch(
        `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(searchTerm)}`
      );
      
      if (!searchResponse.ok) throw new Error('CoinGecko search API error');
      
      const searchData = await searchResponse.json();
      const coins = searchData.coins.slice(0, 10);

      // Fetch current prices for all coins in one request
      const ids = coins.map((coin: any) => coin.id).join(',');
      const priceResponse = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
      );
      
      if (!priceResponse.ok) throw new Error('CoinGecko price API error');
      
      const priceData = await priceResponse.json();

      // Combine search results with prices
      const enrichedResults = coins.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        large: coin.large,
        thumb: coin.thumb,
        current_price: priceData[coin.id]?.usd,
        market_cap_rank: coin.market_cap_rank
      }));

      setResults(enrichedResults);
    } catch (error) {
      console.error('CoinGecko API error:', error);
      setError('Failed to fetch tokens. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (search.trim()) {
      const debounceSearch = setTimeout(() => {
        searchCoinGecko(search);
      }, 300);

      return () => clearTimeout(debounceSearch);
    } else {
      setResults([]);
    }
  }, [search]);

  const handleTokenSelect = async (token: CoinGeckoToken) => {
    try {
      // Get the latest price when selecting
      const priceResponse = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${token.id}&vs_currencies=usd`
      );
      
      if (!priceResponse.ok) throw new Error('Failed to fetch latest price');
      
      const priceData = await priceResponse.json();
      const updatedToken = {
        ...token,
        current_price: priceData[token.id]?.usd
      };

      setSelectedToken(updatedToken);
      onSelect(updatedToken);
      setSearch('');
      setResults([]);
    } catch (error) {
      console.error('Error fetching latest price:', error);
      // Still select the token even if price fetch fails
      setSelectedToken(token);
      onSelect(token);
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
            {selectedToken.large && (
              <img
                src={selectedToken.large}
                alt={selectedToken.symbol}
                className="w-8 h-8 rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <div>
              <div className="font-medium">{selectedToken.name}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <span>{selectedToken.symbol}</span>
                {selectedToken.current_price && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-muted-foreground/10">
                    ${selectedToken.current_price.toLocaleString()}
                  </span>
                )}
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
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-2 pl-8 border rounded bg-muted/50"
          placeholder="Search cryptocurrencies..."
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
                key={token.id}
                onClick={() => handleTokenSelect(token)}
                className="p-2 hover:bg-muted cursor-pointer flex items-center gap-2"
              >
                <div className="relative flex-shrink-0 w-8 h-8">
                  {token.large && (
                    <img 
                      src={token.large}
                      alt={token.symbol}
                      className="w-8 h-8 rounded-full bg-muted"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                </div>
                <div className="flex-grow">
                  <div className="font-medium">{token.name}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <span>{token.symbol}</span>
                    {token.current_price && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted-foreground/10">
                        ${token.current_price.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                {token.market_cap_rank && (
                  <div className="text-xs text-muted-foreground">
                    Rank #{token.market_cap_rank}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}