'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs'; // If you're using Clerk
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';
import AthleteSidebar from './Dash/AthleteSidebar';

/**
 * Loader Component
 *
 * The `Loader` component displays a fullscreen loading spinner with a conditional sidebar based on the user's role.
 * This component is typically used while fetching data, authenticating users, or processing background tasks.
 *
 * Features:
 * - **Dynamic Sidebar:** Shows the appropriate sidebar (`CoachSidebar` or `Sidebar`) based on the user's role.
 * - **Responsive Design:** Adjusts layout for mobile and desktop screens using Tailwind's responsive utilities.
 * - **Custom Spinner:** Simple yet elegant loading spinner with Tailwind CSS animation and color accents.
 *
 * Technologies Used:
 * - **React:** Functional component structure with hooks for dynamic rendering.
 * - **Clerk:** Retrieves user data (optional; can be adapted if not using Clerk).
 * - **Tailwind CSS:** Handles responsive design, layout, and animation.
 *
 * Props:
 * - None (the component determines the layout based on the logged-in user's role).
 *
 * State Management:
 * - **Role-Based Rendering:** Uses Clerk's `useUser()` to detect the user's role (`"COACH"` or default).
 *
 * Key Components:
 * - `CoachSidebar`: Rendered when the user's role is `"COACH"`.
 * - `Sidebar`: Rendered for all other users or if the role is undefined.
 * - Spinner (`div` with `animate-spin`): Creates a rotating loader effect with a blue accent.
 *
 * Usage Example:
 * ```tsx
 * <Loader />
 * ```
 *
 * Use Cases:
 * - **Data Fetching:** Display during API calls or long-running operations.
 * - **Authentication:** Show when verifying user credentials or checking session tokens.
 * - **Page Transitions:** Serve as an intermediate state during navigation between routes.
 *
 * Styling Notes:
 * - The spinner uses a rounded border with different colors to create a rotating visual effect.
 * - The sidebar adjusts based on screen size (`md:hidden` for mobile and `hidden md:block` for desktop).
 *
 * Customization:
 * - **Spinner Size:** Modify `h-16 w-16` to change dimensions.
 * - **Colors:** Adjust `border-blue-200` and `border-t-blue-700` for different themes.
 * - **Animation Speed:** Use `animation-duration` in Tailwind to control spin speed if needed.
 */

const Loader: React.FC = () => {
  // If you want conditional sidebar logic (e.g. "COACH" role)
  const { user } = useUser();
  const role = user?.publicMetadata?.role;

  return (
    <div className="flex h-screen w-full">
      {/* Sidebar */}
      <div className="md:hidden bg-gray-100">
        {role === 'COACH' ? (
          <CoachSidebar />
        ) : role === 'ATHLETE' ? (
          <AthleteSidebar />
        ) : (
          <Sidebar />
        )}
      </div>
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === 'COACH' ? (
          <CoachSidebar />
        ) : role === 'ATHLETE' ? (
          <AthleteSidebar />
        ) : (
          <Sidebar />
        )}
      </div>

      {/* Main area for loader */}
      <div className="flex-1 flex items-center justify-center bg-white">
        {/* 
          Tailwind spinner:
          - animate-spin for rotation
          - border-t-blue-700 for the "accent" color
          - rest is a lighter border
        */}
        <div className="animate-spin rounded-full h-16 w-16 border-8 border-blue-200 border-t-blue-700" />
      </div>
    </div>
  );
};

export default Loader;
