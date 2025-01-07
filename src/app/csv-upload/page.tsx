"use client";
import React, { useState } from "react";
import Sidebar from "@/components/Dash/Sidebar";
import DashboardHeader from "@/components/Dash/Header";

const CSVUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = () => {
    if (file) {
      console.log("Uploading file:", file.name);
    } else {
      alert("Please select or drop a file to upload.");
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <DashboardHeader
          title="Upload Athlete Data"
          description="Drag and drop a CSV file or select it manually to upload athlete data."
        />

        {/* Content Area */}
        <section className="flex-1 p-6 flex flex-col items-center justify-center">
          <div
            className={`border-2 border-dashed ${
              dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
            } p-6 rounded-lg bg-white shadow w-full max-w-2xl flex flex-col items-center justify-center`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <p className="text-gray-500 mb-4">
              {file
                ? `Selected File: ${file.name}`
                : "Drag & drop your CSV file here"}
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="file-input"
            />
            <label
              htmlFor="file-input"
              className="bg-blue-950 text-white px-4 py-2 rounded cursor-pointer hover:bg-gray-600"
            >
              Select File
            </label>
          </div>
          <button
            onClick={handleUpload}
            className="bg-blue-950 text-white px-4 py-2 rounded hover:bg-gray-600 w-full max-w-2xl mt-6"
          >
            Upload CSV
          </button>
        </section>
      </main>
    </div>
  );
};

export default CSVUpload;
