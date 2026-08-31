'use client';

import { useEffect } from 'react';
import { IS_NATIVE } from '@/lib/api/client';
import { initNativeAuthListener } from '@/lib/auth/native';

/** Mounts the deep-link auth listener in Capacitor builds; no-op on web. */
export default function NativeAuthListener() {
  useEffect(() => {
    if (IS_NATIVE) initNativeAuthListener();
  }, []);
  return null;
}
