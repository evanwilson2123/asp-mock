'use client';

import { SignInButton } from '@clerk/nextjs';
import React from 'react';

/**
 * SignInPrompt Component
 *
 * The `SignInPrompt` component displays a user-friendly interface
 * prompting users to sign in using Clerk's authentication system.
 *
 * Features:
 * - **Centered Layout:** Vertically and horizontally centers content on the screen.
 * - **Sign-In Button:** Integrates Clerk's `SignInButton` for seamless authentication.
 * - **Responsive Design:** Adjusts layout for various screen sizes using Tailwind CSS.
 *
 * Technologies Used:
 * - **React:** Built as a functional component.
 * - **Clerk:** Handles authentication with the `SignInButton` component.
 * - **Tailwind CSS:** Provides utility-first styling for layout, typography, and responsiveness.
 *
 * Props:
 * - None (static sign-in prompt without dynamic props).
 *
 * Folder Structure:
 * ```
 * components/
 * └── SignInPrompt.tsx
 * ```
 *
 * Usage Example:
 * ```tsx
 * import SignInPrompt from "@/components/SignInPrompt";
 *
 * export default function HomePage() {
 *   return (
 *     <div>
 *       <SignInPrompt />
 *     </div>
 *   );
 * }
 * ```
 *
 * Styling:
 * - **Background:** Dark gray (`bg-gray-900`) with a slightly lighter content card (`bg-gray-800`).
 * - **Typography:** White and gray text for contrast and readability.
 * - **Button:** Blue background with hover effects for interactive feedback.
 *
 * Customization:
 * - **Text:** Modify the `h1` and `p` elements to reflect different app names or instructions.
 * - **Button Style:** Customize Tailwind classes for the sign-in button to match your theme.
 * - **Sign-In Behavior:** Configure Clerk settings to adjust authentication flows as needed.
 *
 * Accessibility:
 * - Fully keyboard-navigable with clear focus indicators (handled by Clerk and Tailwind).
 * - Descriptive headings and text for screen reader support.
 *
 * Edge Cases:
 * - Gracefully handles unauthenticated users by always showing the prompt.
 * - Compatible with both light and dark themes if extended with additional styling.
 */

const SignInPrompt: React.FC = () => {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-900 opacity-20 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-700 opacity-10 rounded-full blur-2xl -z-10" />
      {/* Logo/Icon */}
      <div className="mb-8 flex flex-col items-center">
        {/* Replace with your logo if available */}
        <div className="bg-gray-900 rounded-full w-20 h-20 flex items-center justify-center shadow-lg mb-4">
          <span className="text-4xl">⚡️</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-center mb-2">
          ASP Analytics
        </h1>
        <p className="text-lg text-gray-300 text-center max-w-xl mb-6">
          Unlock your athletic potential. Visualize, track, and compare your performance data with powerful, intuitive analytics.
        </p>
      </div>
      {/* Sign In Call to Action */}
      <div className="flex flex-col items-center bg-gray-800/80 rounded-xl shadow-2xl px-8 py-8 w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4 text-center">Sign in to get started</h2>
        <SignInButton>
          <button className="w-full bg-gray-900 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg text-lg transition mb-2 shadow-md">
            Sign In
          </button>
        </SignInButton>
        <p className="text-gray-400 text-sm text-center mt-2">
          Secure authentication powered by Clerk
        </p>
      </div>
      {/* Footer */}
      <footer className="absolute bottom-4 w-full flex justify-center text-gray-500 text-xs">
        &copy; {new Date().getFullYear()} ASP Analytics. All rights reserved.
      </footer>
    </div>
  );
};

export default SignInPrompt;
