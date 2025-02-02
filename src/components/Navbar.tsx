import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SignOutButton } from '@clerk/nextjs';

/**
 * Navbar Component
 *
 * The `Navbar` component renders a responsive navigation bar for the ASP-ANALYTICS application.
 * It includes the app logo, name, navigation links, and a sign-out button.
 *
 * Features:
 * - **Responsive Layout:** Adjusts content alignment based on screen size.
 * - **Logo & Branding:** Displays the ASP-ANALYTICS logo and name with a link to the homepage.
 * - **Navigation Links:** Provides links to core sections: Home, About, and Contact.
 * - **Sign-Out Button:** Uses Clerk's `SignOutButton` for secure sign-out functionality.
 *
 * Technologies Used:
 * - **React:** Built as a functional component.
 * - **Next.js:** Utilizes `Image` for optimized image rendering and `Link` for client-side navigation.
 * - **Clerk:** Handles authentication with the `SignOutButton` component.
 * - **Tailwind CSS:** Provides utility-first styling for layout, spacing, and hover effects.
 *
 * Props:
 * - None (static navbar with no dynamic props).
 *
 * Folder Structure:
 * \`\`\`
 * components/
 * └── Navbar.tsx
 * public/
 * └── logo.PNG  (Logo image used in the navbar)
 * \`\`\`
 *
 * Usage Example:
 * \`\`\`tsx
 * import Navbar from "@/components/Navbar";
 *
 * export default function HomePage() {
 *   return (
 *     <div>
 *       <Navbar />
 *       <main>
 *         {/* Page content here */

const Navbar: React.FC = () => {
  return (
    <header className="bg-gray-900 text-white p-4 flex justify-between items-center">
      {/* Logo and App Name */}
      <Link href="/" className="flex items-center space-x-2">
        <Image src="/logo.PNG" alt="logo" width={50} height={50} />
        <h1 className="text-xl font-bold">ASP-ANALYTICS</h1>
      </Link>
      {/* Navigation Links */}
      <nav className="flex space-x-6">
        <a href="#" className="hover:underline">
          Home
        </a>
        <a href="#" className="hover:underline">
          About
        </a>
        <a href="#" className="hover:underline">
          Contact
        </a>
        {/* <button className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700">
          Sign Out
        </button> */}
        <SignOutButton />
      </nav>
    </header>
  );
};

export default Navbar;
