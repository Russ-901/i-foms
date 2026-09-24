import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { HueProvider } from '@/context/HueContext';
import './styles/variables.css';
import './styles/globals.css';
import SessionProviderWrapper from '@/components/providers/SessionProviderWrapper';

export const metadata: Metadata = {
  title: 'i-FOMS',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className='dark'>
        <SessionProviderWrapper>
            <HueProvider>
              {children}
              {/* Without this, every toast.success()/toast.error() call in the
                  app renders nothing at all. */}
              <Toaster theme="dark" position="top-right" richColors closeButton />
            </HueProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}