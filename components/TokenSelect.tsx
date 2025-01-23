// components/TokenSelect.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Token } from '@/types';
import { X, Search } from 'lucide-react';

interface TokenSelectProps {
  tokens: Token[];
  selectedTokens: Token[];
  onTokensChange: (tokens: Token[]) => void;
}

export const TokenSelect: React.FC<TokenSelectProps> = ({
  tokens = [],  // Provide default empty array
  selectedTokens = [],  // Provide default empty array
  onTokensChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredTokens = tokens.filter(token => 
    !(selectedTokens || []).find(t => t.id === token.id) &&
    (token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
     token.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleTokenSelect = (token: Token) => {
    onTokensChange([...(selectedTokens || []), token]);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleTokenRemove = (tokenId: string) => {
    onTokensChange((selectedTokens || []).filter(t => t.id !== tokenId));
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
    <div ref={containerRef} className="relative">
      {/* Selected Tokens */}
      <div className="flex flex-wrap gap-2 mb-2">
        {(selectedTokens || []).map(token => (
          <div 
            key={token.id}
            className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
          >
            {token.symbol}
            <button
              onClick={() => handleTokenRemove(token.id)}
              className="ml-1 p-1 hover:text-blue-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search tokens..."
          className="pl-9 w-full p-2 border rounded"
        />
      </div>

      {/* Dropdown */}
      {isOpen && searchTerm && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredTokens.length > 0 ? (
            filteredTokens.map(token => (
              <button
                key={token.id}
                onClick={() => handleTokenSelect(token)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex justify-between items-center"
              >
                <span>{token.symbol} - {token.name}</span>
                {token.price > 0 && (
                  <span className="text-gray-500">${token.price.toFixed(2)}</span>
                )}
              </button>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-500">No tokens found</div>
          )}
        </div>
      )}
    </div>
  );
};