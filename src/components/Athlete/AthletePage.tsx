"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import CoachSidebar from "@/components/Dash/CoachSidebar";
import Sidebar from "@/components/Dash/Sidebar";
import Loader from "../Loader";
import Image from "next/image";

interface Athlete {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  level: string;
  age?: number;
  height?: string;
  weight?: string;
  profilePhotoUrl?: string;
}

const AthleteDetails = () => {
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredTile, setHoveredTile] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [confirmationTech, setConfirmationTech] = useState<string | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [coachNotes, setCoachNotes] = useState<string>("");

  const router = useRouter();
  const { athleteId } = useParams();
  const { user } = useUser();
  const role = user?.publicMetadata?.role;

  const technologies = ["Blast Motion", "Hittrax", "Trackman", "Armcare"];

  useEffect(() => {
    const fetchAthlete = async () => {
      try {
        const response = await fetch(`/api/athlete/${athleteId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch athlete details");
        }

        const data = await response.json();
        setAthlete(data.athlete || null);
        setCoachNotes(data.athlete?.coachNotes || "");
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

  const handleNotesSave = async () => {
    try {
      const response = await fetch(`/api/athlete/${athleteId}/notes`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: coachNotes }),
      });

      if (!response.ok) {
        throw new Error("Failed to save notes");
      }

      setUploadStatus("Notes saved successfully");
    } catch (error) {
      console.error("Error saving notes:", error);
      setUploadStatus("Failed to save notes");
    } finally {
      setTimeout(() => setUploadStatus(null), 3000);
    }
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

      setUploadStatus(`File successfully uploaded for ${tech}`);
    } catch (error: any) {
      setUploadStatus("Error uploading file: " + error.message);
    } finally {
      setTimeout(() => setUploadStatus(null), 3000);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, tech: string) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setFileToUpload(file); // Temporarily store the file
      setConfirmationTech(tech); // Set the technology for confirmation
    }
  };

  const confirmUpload = async (tech: string) => {
    if (fileToUpload) {
      await handleFileUpload(tech, fileToUpload);
    }
    setFileToUpload(null);
    setConfirmationTech(null);
  };

  if (loading)
    return (
      <div>
        <Loader />
      </div>
    );
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="md:hidden bg-gray-100">
        {role === "COACH" ? <CoachSidebar /> : <Sidebar />}
      </div>
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === "COACH" ? <CoachSidebar /> : <Sidebar />}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 bg-gray-100">
        {/* Technology Nav Bar */}
        <nav className="bg-white rounded-lg shadow-md mb-6 p-3 flex space-x-4 sticky top-0 z-10">
          {technologies.map((tech) => (
            <button
              key={tech}
              onClick={() =>
                router.push(
                  `/athlete/${athleteId}/reports/${tech
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`
                )
              }
              className="text-gray-700 font-semibold hover:text-gray-900 transition"
            >
              {tech}
            </button>
          ))}
          <button
            onClick={() => router.push(`/athlete/${athleteId}/new-assessment`)}
            className="text-gray-700 font-semibold hover:text-gray-900 transition"
          >
            New Assessment
          </button>
        </nav>

        {/* Top Header + Back Button */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-700">
            {athlete?.firstName} {athlete?.lastName}&apos;s Profile
          </h1>
          <button
            onClick={handleBackClick}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Back to Athletes
          </button>
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center space-x-6">
            {/* Profile Photo */}
            <div className="w-36 h-36 bg-gray-200 overflow-hidden rounded-lg">
              {athlete?.profilePhotoUrl ? (
                <Image
                  src={athlete.profilePhotoUrl || "/default-avatar.png"} // Provide a fallback image
                  alt={`${athlete.firstName} ${athlete.lastName}`}
                  width={144} // Adjust dimensions based on your design
                  height={144}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No Photo
                </div>
              )}
            </div>

            {/* Athlete Info */}
            <div>
              <p className="text-lg font-bold text-gray-700">
                {athlete?.firstName} {athlete?.lastName}
              </p>
              <p className="text-sm text-gray-500">Email: {athlete?.email}</p>
              <p className="text-sm text-gray-500">
                Level: {athlete?.level || "N/A"}
              </p>
              <p className="text-sm text-gray-500">
                Age: {athlete?.age || "N/A"}
              </p>
              <p className="text-sm text-gray-500">
                Height: {athlete?.height || "N/A"}
              </p>
              <p className="text-sm text-gray-500">
                Weight: {athlete?.weight || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-700 mb-4">
            Coach&apos;s Notes
          </h2>
          <textarea
            value={coachNotes}
            onChange={(e) => setCoachNotes(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Add notes about this athlete..."
          ></textarea>
          <button
            onClick={handleNotesSave}
            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Save Notes
          </button>
        </div>

        {/* CSV Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-700 mb-4">Upload CSV</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {technologies.map((tech) => (
              <div
                key={tech}
                className={`border-2 rounded-lg p-6 text-center ${
                  hoveredTile === tech
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 bg-gray-100"
                }`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, tech)}
                onMouseEnter={() => setHoveredTile(tech)}
                onMouseLeave={() => setHoveredTile(null)}
              >
                <p className="text-gray-700 font-semibold">{tech}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Drag and drop a CSV file here
                </p>
                <input
                  type="file"
                  id="file-input"
                  className="hidden"
                  accept=".csv"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Confirmation Modal */}
        {confirmationTech && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <p className="text-gray-700 mb-4">
                Are you sure you want to upload this file for{" "}
                <span className="font-semibold">{confirmationTech}</span>?
              </p>
              <div className="flex space-x-4 justify-center">
                <button
                  onClick={() => confirmUpload(confirmationTech)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmationTech(null)}
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

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
