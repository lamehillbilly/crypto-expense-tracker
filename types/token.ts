export interface Token {
    id: string;
    name: string;
    symbol: string;
    thumb?: string;    // CoinGecko thumbnail image
    large?: string;    // CoinGecko large image
    market_cap_rank?: number;
  }