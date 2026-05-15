'use client';

import { useEffect, useState } from 'react';

/**
 * Returns true after the component has mounted client-side.
 * Use this to defer rendering of Recharts (and other DOM-measuring libs)
 * until after hydration, preventing the width(-1)/height(-1) warning.
 */
export function useHasMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
