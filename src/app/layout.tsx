import type { Metadata } from 'next';
import { Geist, Geist_Mono, Pixelify_Sans, Silkscreen } from 'next/font/google';
import { Toaster } from 'sonner';
import { Providers } from './providers';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const pixelDisplay = Pixelify_Sans({
  variable: '--font-pixel',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const pixelMono = Silkscreen({
  variable: '--font-pixel-mono',
  subsets: ['latin'],
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: {
    default: 'Byakuya',
    template: '%s | Byakuya',
  },
  description: '16-bit pixel-themed realtime chat application',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pixelDisplay.variable} ${pixelMono.variable} overflow-x-hidden antialiased`}
      >
        <Providers>
          {children}
          <Toaster
            richColors
            position="top-right"
            toastOptions={{
              className:
                '!rounded-none !border-2 !border-[#0b0e14] !shadow-[3px_3px_0_#090c12] !font-sans',
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
