import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import { Toaster } from 'sonner';
import Link from 'next/link';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Crypto Expense Tracker",
  description: "Track your crypto expenses and claims",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <nav className="border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex space-x-8">
                  <Link 
                    href="/" 
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium"
                  >
                    Home
                  </Link>
                  <Link 
                    href="/claims" 
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium"
                  >
                    Claims
                  </Link>
                </div>
              </div>
            </div>
          </nav>
          <main className="min-h-screen bg-background text-foreground">
            {children}
            <div className="fixed bottom-4 right-4 z-50">
              <ModeToggle />
            </div>
          </main>
          <Toaster richColors closeButton position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
