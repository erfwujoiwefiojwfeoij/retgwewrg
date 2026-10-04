import { Inter, Manrope } from 'next/font/google';
import { AuthProvider } from '@/components/providers/AuthProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter' });
const manrope = Manrope({ subsets: ['latin', 'cyrillic'], variable: '--font-manrope' });

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { default: 'LUNEA — кабинет для записи', template: '%s — LUNEA' },
  description: 'Запись для салона, студии, барбершопа и частного мастера.',
  openGraph: {
    title: 'LUNEA',
    description: 'Кабинет для студий, салонов и частных мастеров.',
    locale: 'ru_RU',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'LUNEA', description: 'Кабинет для студий, салонов и частных мастеров.' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body className={`${inter.variable} ${manrope.variable} font-sans antialiased`}>
        <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:px-3 focus:py-2">К содержанию</a>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
