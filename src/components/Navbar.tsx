import React from "react";
import Image from "next/image";
import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";

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
