"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import CoachSidebar from "@/components/Dash/CoachSidebar";
import Sidebar from "@/components/Dash/Sidebar";
import Loader from "../Loader";

interface Athlete {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  level: string;
  u?: string;
}

const AthleteDetails = () => {
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredTile, setHoveredTile] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const router = useRouter();
  const { athleteId } = useParams();
  const { user } = useUser();
  const role = user?.publicMetadata?.role;

  const technologies = ["Blast Motion", "Hittrax", "Trackman", "Armcare"];

  useEffect(() => {
    // Fetch athlete details
    const fetchAthlete = async () => {
      try {
        const response = await fetch(`/api/athlete/${athleteId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch athlete details");
        }

        const data = await response.json();
        setAthlete(data.athlete || null);
      } catch (error: any) {
        setError(error.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchAthlete();
  }, [athleteId]);

  const handleBackClick = () => {
    router.push("/manage-athletes");
  };

  const handleFileUpload = async (tech: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        `/api/athlete/${athleteId}/upload/${tech
          .toLowerCase()
          .replace(/\s+/g, "-")}`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("File upload failed");
      }

      setUploadStatus(`File uploaded for ${tech}`);
    } catch (error: any) {
      setUploadStatus("Error uploading file: " + error.message);
    } finally {
      setTimeout(() => setUploadStatus(null), 3000);
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    tech: string
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(tech, file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setHoveredTile(null); // Prevent hover conflict with drag state
  };

  const handleDragLeave = () => {
    setHoveredTile(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, tech: string) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(tech, file);
    }
  };

  if (loading)
    return (
      <div>
        <Loader />
      </div>
    );
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white">
        {role === "COACH" ? <CoachSidebar /> : <Sidebar />}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 bg-gray-100">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-700">
            {athlete?.firstName} {athlete?.lastName}&apos;s Details
          </h1>
          <button
            onClick={handleBackClick}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Back to Athletes
          </button>
        </div>

        {/* Reports Section */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h2 className="text-lg font-bold text-gray-700 mb-4">View Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {technologies.map((tech) => (
              <button
                key={tech}
                onClick={() =>
                  router.push(`/athlete/${athleteId}/reports?tech=${tech}`)
                }
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg shadow text-gray-700 text-left font-semibold"
              >
                {tech}
              </button>
            ))}
          </div>
        </div>

        {/* Drag and Drop Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-bold text-gray-700 mb-4">
            Upload CSV Data
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {technologies.map((tech) => (
              <div
                key={tech}
                className={`border-2 rounded-lg p-6 text-center ${
                  hoveredTile === tech
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 bg-gray-100"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, tech)}
                onMouseEnter={() => setHoveredTile(tech)}
                onMouseLeave={() => setHoveredTile(null)}
              >
                <p className="text-gray-700 font-semibold">{tech}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Drag and drop a CSV file here or click to upload
                </p>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    id={`upload-input-${tech}`}
                    className="hidden"
                    accept=".csv"
                    onChange={(e) => handleFileChange(e, tech)}
                  />
                  <span className="text-blue-600 underline">
                    Click to upload
                  </span>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Upload Status */}
        {uploadStatus && (
          <div className="mt-4 p-2 bg-green-200 text-green-800 rounded-lg">
            {uploadStatus}
          </div>
        )}
      </div>
    </div>
  );
};

export default AthleteDetails;
