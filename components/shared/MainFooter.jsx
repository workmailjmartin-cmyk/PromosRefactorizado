'use client';

import { usePathname } from 'next/navigation';

export default function MainFooter() {
  const pathname = usePathname();
  const esInterno = pathname?.startsWith('/internal');

  if (!esInterno) return null;

  return <footer className="main-footer">Designed by Juan Pablo Martin</footer>;
}