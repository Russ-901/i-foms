import { HueProvider } from '@/context/HueContext';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <HueProvider>
      {children}
    </HueProvider>
  );
}