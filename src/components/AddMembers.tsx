'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';

/**
 * AddMembersPage Component
 *
 * This component allows administrators to add new members (Coaches or Athletes) to the system.
 * It includes form handling, validation, and role-based access control to ensure only authorized
 * users can perform member additions.
 *
 * Key Features:
 * - **Role-Based Access Control:**
 *   - Redirects non-admin users to the homepage.
 *   - Redirects unauthenticated users to the sign-in page.
 *
 * - **Toggle Between Coach and Athlete Forms:**
 *   - Users can switch between adding Coaches and Athletes with toggle buttons.
 *   - Form fields dynamically change based on the selected member type.
 *
 * - **Form Handling & Validation:**
 *   - Validates required fields such as first name, last name, email, and password.
 *   - Athlete-specific fields include level, age group, age, height, and weight.
 *   - Sends form data to the appropriate API endpoint (`/api/add-Coach` or `/api/add-Athlete`).
 *
 * - **Responsive Design:**
 *   - Optimized for both mobile and desktop views with conditional sidebars.
 *   - Tailwind CSS for consistent UI styling and responsiveness.
 *
 * - **Feedback Messages:**
 *   - Displays success or error messages based on API responses.
 *
 * Technologies Used:
 * - **React** for component structure and state management.
 * - **Next.js** for routing and API interactions.
 * - **Clerk** for user authentication and role management.
 * - **Tailwind CSS** for responsive design and styling.
 *
 * Use Cases:
 * - **For Admins:**
 *   - Easily add new coaches and athletes to the system.
 *   - Quickly switch between forms without leaving the page.
 *
 * - **For Developers:**
 *   - Modular and clean code structure for easy maintenance and extension.
 *   - Ready-to-use form handling and API integration patterns.
 */

const AddMembersPage: React.FC = () => {
  const { isSignedIn, user } = useUser();
  const role = user?.publicMetadata?.role;
  const [activeForm, setActiveForm] = useState<'Coach' | 'Athlete'>('Coach');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    level: 'Youth',
    age: 0,
    height: '',
    weight: '',
  });
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn === false) {
      router.push('/sign-in');
      return;
    }

    if (role !== 'ADMIN') {
      router.push('/');
    }
  }, [isSignedIn, user, router, role]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const endpoint =
      activeForm === 'Coach' ? '/api/add-Coach' : '/api/add-Athlete';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage(`${activeForm} added successfully!`);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          level: 'Youth',
          age: 0,
          height: '',
          weight: '',
        });
      } else {
        const errorData = await response.json();
        setMessage(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error(`Error adding ${activeForm.toLowerCase()}:`, error);
      setMessage('An error occurred. Please try again.');
    }
  };

  if (!isSignedIn) return null;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="md:hidden bg-gray-100">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="border-2 border-gray-300 w-screen max-w-xl bg-white p-8 rounded-lg shadow-md">
          {/* Header */}
          <h1 className="text-2xl font-bold text-gray-700 text-center mb-6">
            Add New Member
          </h1>

          {/* Toggle Buttons */}
          <div className="flex justify-center mb-6">
            <button
              className={`px-4 py-2 rounded-l-lg ${
                activeForm === 'Coach'
                  ? 'bg-blue-900 text-white'
                  : 'bg-gray-200 text-gray-700'
              } transition`}
              onClick={() => setActiveForm('Coach')}
            >
              Add Coach
            </button>
            <button
              className={`px-4 py-2 rounded-r-lg ${
                activeForm === 'Athlete'
                  ? 'bg-blue-900 text-white'
                  : 'bg-gray-200 text-gray-700'
              } transition`}
              onClick={() => setActiveForm('Athlete')}
            >
              Add Athlete
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-700"
              >
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                placeholder="Enter first name"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-gray-700"
              >
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                placeholder="Enter last name"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  // Added extra right padding (pr-12) to make room for the icon.
                  className="w-full border border-gray-300 rounded px-4 py-2 pr-12 text-black focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  // Positioned absolutely within the relative container.
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-900 border-2 border-gray-300 bg-gray-100 rounded hover:bg-gray-200"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            {activeForm === 'Athlete' && (
              <>
                <div>
                  <label
                    htmlFor="level"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Level
                  </label>
                  <select
                    id="level"
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-900"
                  >
                    <option value="Youth">Youth</option>
                    <option value="High School">High School</option>
                    <option value="College">College</option>
                    <option value="Pro">Pro</option>
                  </select>
                </div>

                {/* <div>
                  <label
                    htmlFor="u"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Age Group
                  </label>
                  <input
                    type="text"
                    id="u"
                    name="u"
                    placeholder="e.g. 16u"
                    value={formData.u}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div> */}

                <div>
                  <label
                    htmlFor="age"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Age
                  </label>
                  <input
                    type="number"
                    id="age"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    required
                    className="w-full border text-black border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="height"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Height
                  </label>
                  <input
                    type="text"
                    id="height"
                    name="height"
                    placeholder="e.g. 5'11"
                    value={formData.height}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="weight"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Weight
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      id="weight"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      className="w-full border text-black border-gray-300 rounded-l px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-900"
                    />
                    <span className="inline-block bg-gray-100 border border-l-0 border-gray-300 rounded-r px-4 py-2 text-gray-500">
                      lbs
                    </span>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full bg-blue-900 text-white py-2 rounded hover:bg-blue-800 transition"
            >
              {`Add ${activeForm}`}
            </button>
          </form>

          {message && (
            <p className="mt-4 text-center text-gray-700">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddMembersPage;
