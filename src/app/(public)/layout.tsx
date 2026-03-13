import type { Metadata } from 'next';
import Link from 'next/link';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Database, Calendar, Download } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AfWASA Congress Programme',
  description: 'Congress programme for the African Water and Sanitation Association',
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">AfWASA Congress</span>
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link 
              href="/programme" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Programme
            </Link>
            <Link 
              href="/downloads" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Downloads
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="border-t py-6 md:py-8 mt-auto">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} AfWASA - African Water and Sanitation Association
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/programme" className="hover:text-foreground">
              Programme
            </Link>
            <Link href="/downloads" className="hover:text-foreground">
              Downloads
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
