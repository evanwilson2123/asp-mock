"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import CoachSidebar from "@/components/Dash/CoachSidebar";
import Sidebar from "@/components/Dash/Sidebar";
import { useRouter } from "next/navigation";

const AddMembersPage: React.FC = () => {
  const { isSignedIn, user } = useUser();
  const role = user?.publicMetadata?.role;
  const [activeForm, setActiveForm] = useState<"Coach" | "Athlete">("Coach");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    level: "Youth", // Default level for Athlete form
  });
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn === false) {
      router.push("/sign-in");
      return;
    }

    if (role !== "ADMIN") {
      router.push("/");
    }
  }, [isSignedIn, user, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const endpoint =
      activeForm === "Coach" ? "/api/add-Coach" : "/api/add-Athlete";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage(`${activeForm} added successfully!`);
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          level: "Youth",
        });
      } else {
        const errorData = await response.json();
        setMessage(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error(`Error adding ${activeForm.toLowerCase()}:`, error);
      setMessage("An error occurred. Please try again.");
    }
  };

  if (!isSignedIn) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white">
        {role === "COACH" ? <CoachSidebar /> : <Sidebar />}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        {/* Card Wrapper */}
        <div className="w-full max-w-lg bg-white p-8 rounded-lg shadow-md">
          {/* Header */}
          <h1 className="text-2xl font-bold text-gray-700 text-center mb-6">
            Add New Member
          </h1>

          {/* Toggle Buttons */}
          <div className="flex justify-center mb-6">
            <button
              className={`px-4 py-2 rounded-l-lg ${
                activeForm === "Coach"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              } hover:bg-blue-700 transition`}
              onClick={() => setActiveForm("Coach")}
            >
              Add Coach
            </button>
            <button
              className={`px-4 py-2 rounded-r-lg ${
                activeForm === "Athlete"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              } hover:bg-blue-700 transition`}
              onClick={() => setActiveForm("Athlete")}
            >
              Add Athlete
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="w-full border text-black border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="w-full border text-black border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full border text-black border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {activeForm === "Coach" && (
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full border text-black border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
            {activeForm === "Athlete" && (
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
                required
                className="w-full border text-black border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Youth">Youth</option>
                <option value="High School">High School</option>
                <option value="College">College</option>
                <option value="Pro">Pro</option>
              </select>
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
              {`Add ${activeForm}`}
            </button>
          </form>

          {/* Message */}
          {message && (
            <p className="mt-4 text-center text-gray-700">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddMembersPage;
