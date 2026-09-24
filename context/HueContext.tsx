'use client';

import { createContext, useContext } from 'react';
import useHueAnimation from '@/hooks/animation';

const HueContext = createContext<number>(0);

export function HueProvider({ children }: { children: React.ReactNode }) {
  const hue = useHueAnimation();
  return <HueContext.Provider value={hue}>{children}</HueContext.Provider>;
}

export function useHue() {
  return useContext(HueContext);
}