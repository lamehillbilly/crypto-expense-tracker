import { TrendingUp } from 'lucide-react';

const navigation = [
  // ... existing navigation items ...
  {
    name: 'Trades',
    href: '/trades',
    icon: TrendingUp // or any other icon you prefer from lucide-react
  },
  // ... other navigation items ...
];

// ... rest of the Navbar component 

export function Navbar() {
  return (
    <nav className="border-b">
      {/* Your navigation content */}
    </nav>
  );
} 