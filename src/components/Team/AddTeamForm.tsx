"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const AddTeamForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    u: "",
    coach: "",
    assistants: [] as string[],
    players: [] as string[],
  });

  const [message, setMessage] = useState("");
  const [coaches, setCoaches] = useState<any[]>([]);
  const [athletes, setAthletes] = useState<any[]>([]);
  const router = useRouter();

  // Fetch all coaches from the database
  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        const response = await fetch("/api/coaches");
        if (response.ok) {
          const data = await response.json();
          setCoaches(data.coaches);
        } else {
          setMessage("Failed to fetch coaches");
        }
      } catch (error) {
        console.error("Error fetching coaches:", error);
        setMessage("An error occurred while fetching coaches");
      }
    };
    fetchCoaches();
  }, []);

  // Fetch athletes based on `u`
  const fetchAthletes = async (u: string) => {
    try {
      const response = await fetch(`/api/athletes?u=${u}`);
      if (response.ok) {
        const data = await response.json();
        setAthletes(data.athletes);
      } else {
        setMessage("Failed to fetch athletes");
      }
    } catch (error) {
      console.error("Error fetching athletes:", error);
      setMessage("An error occurred while fetching athletes");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "u" && value) {
      // Fetch athletes dynamically when `u` is entered/changed
      fetchAthletes(value);
    }
  };

  const toggleSelection = (id: string, field: "assistants" | "players") => {
    setFormData((prev) => {
      const selected = prev[field];
      return {
        ...prev,
        [field]: selected.includes(id)
          ? selected.filter((item) => item !== id)
          : [...selected, id],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/create-team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage("Team added successfully!");
        setFormData({
          name: "",
          u: "",
          coach: "",
          assistants: [],
          players: [],
        });
        setTimeout(() => router.push("/teams-groups"), 2000);
      } else {
        const errorData = await response.json();
        setMessage(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error adding team:", error);
      setMessage("An error occurred. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] bg-gray-100">
      <div className="w-full max-w-lg bg-white p-8 rounded-lg shadow-md">
        {/* Header */}
        <h1 className="text-2xl font-bold text-gray-700 text-center mb-6">
          Add New Team/Group
        </h1>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Team Name */}
          <input
            type="text"
            name="name"
            placeholder="Team Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full border text-black border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Age Group */}
          <input
            type="text"
            name="u"
            placeholder="Age Group (e.g., 18u, 17u)"
            value={formData.u}
            onChange={handleChange}
            required
            className="w-full border text-black border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Head Coach */}
          <select
            name="coach"
            value={formData.coach}
            onChange={handleChange}
            required
            className="w-full border text-black border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Head Coach</option>
            {coaches.map((coach) => (
              <option key={coach._id} value={coach._id}>
                {coach.firstName} {coach.lastName}
              </option>
            ))}
          </select>

          {/* Assistant Coaches */}
          <div>
            <h2 className="font-semibold text-gray-700 mb-2">Assistants</h2>
            <div className="space-y-2">
              {coaches.map((coach) => (
                <label
                  key={coach._id}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    value={coach._id}
                    checked={formData.assistants.includes(coach._id)}
                    onChange={() => toggleSelection(coach._id, "assistants")}
                    className="text-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                  <span
                    className={`${
                      formData.assistants.includes(coach._id)
                        ? "text-blue-600 font-bold"
                        : "text-gray-700"
                    }`}
                  >
                    {coach.firstName} {coach.lastName}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Players */}
          <div>
            <h2 className="font-semibold text-gray-700 mb-2">Players</h2>
            <div className="space-y-2">
              {athletes.map((athlete) => (
                <label
                  key={athlete._id}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    value={athlete._id}
                    checked={formData.players.includes(athlete._id)}
                    onChange={() => toggleSelection(athlete._id, "players")}
                    className="text-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                  <span
                    className={`${
                      formData.players.includes(athlete._id)
                        ? "text-blue-600 font-bold"
                        : "text-gray-700"
                    }`}
                  >
                    {athlete.firstName} {athlete.lastName}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Add Team
          </button>
        </form>

        {/* Message */}
        {message && (
          <p className="mt-4 text-center text-gray-700 font-medium">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default AddTeamForm;
