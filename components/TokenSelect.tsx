// components/TokenSelect.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Token } from '@/types';
import { X, Search } from 'lucide-react';

interface TokenSelectProps {
  value?: string;
  tokens?: Token[];
  onTokensChange: (token: Token) => void;
  placeholder?: string;
  selectedTokens?: string[];
}

export function TokenSelect({ 
  tokens = [], 
  onTokensChange, 
  placeholder = "Select token",
  selectedTokens = []
}: TokenSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredTokens = tokens.filter(token => 
    token.symbol.toLowerCase().includes(search.toLowerCase()) &&
    !selectedTokens.includes(token.symbol)
  );

  const handleTokenSelect = (token: Token) => {
    onTokensChange(token);
    setIsOpen(false);
    setSearch('');
  };
  const handleTokenRemove = (tokenId: string) => {
    const updatedTokens = selectedTokens.filter(id => id !== tokenId);
    const token = tokens.find(t => t.id === tokenId);
    if (token) {
      onTokensChange(token);
    }
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onFocus={() => setIsOpen(true)}
        className="w-full p-2 border rounded"
        placeholder={placeholder}
      />
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredTokens.map((token) => (
            <div
              key={token.id}
              onClick={() => handleTokenSelect(token)}
              className="p-2 hover:bg-accent cursor-pointer flex items-center justify-between"
            >
              <span>{token.symbol}</span>
              <span className="text-sm text-muted-foreground">${token.price}</span>
            </div>
          ))}
          {filteredTokens.length === 0 && (
            <div className="p-2 text-muted-foreground">No tokens found</div>
          )}
        </div>
      )}
    </div>
  );
}