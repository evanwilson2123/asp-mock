'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';

const ConditionalNavbar: React.FC = () => {
  const pathname = usePathname();

  // Hide Navbar on the intended zone page (adjust the path as needed)
  if (pathname === '/intended-zone') {
    return null;
  }

  return <Navbar />;
};

export default ConditionalNavbar;
