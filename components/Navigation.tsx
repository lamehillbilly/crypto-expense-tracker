'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingUp, Home, Receipt, DollarSign } from 'lucide-react';

function NavLink({ href, children, icon: Icon }: { href: string; children: React.ReactNode; icon?: React.ElementType }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link 
      href={href} 
      className={`inline-flex items-center px-1 pt-1 text-sm font-medium gap-2 hover:text-primary transition-colors
        ${isActive ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </Link>
  );
}

export function Navigation() {
  return (
    <nav className="border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex space-x-8">
            <NavLink href="/" icon={Home}>
              Home
            </NavLink>
            <NavLink href="/claims" icon={Receipt}>
              Claims
            </NavLink>
            <NavLink href="/trades" icon={TrendingUp}>
              Trades
            </NavLink>
            <NavLink href="/expenses" icon={DollarSign}>
              Expenses
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
}