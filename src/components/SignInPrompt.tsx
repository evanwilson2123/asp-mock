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
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 rounded-lg shadow-lg p-8 max-w-sm w-full">
        <h1 className="text-2xl font-bold text-center mb-6">
          Welcome to ASP Analytics
        </h1>
        <p className="text-gray-400 text-center mb-6">
          Please sign in to access your dashboard.
        </p>
        <div className="flex justify-center">
          {/* Clerk's Sign-In Button */}
          <SignInButton>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition">
              Sign In
            </button>
          </SignInButton>
        </div>
      </div>
    </div>
  );
};

export default SignInPrompt;
