'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';
import Loader from '../Loader';
import Image from 'next/image';
import ErrorMessage from '../ErrorMessage';
import { ICoachNote } from '@/models/coachesNote';
import { TrashIcon } from '@heroicons/react/24/solid';
import { CameraIcon } from '@heroicons/react/24/outline'; // Added for photo upload overlay

interface Athlete {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  age?: number;
  height?: string;
  weight?: string;
  pPhotoUrl?: string;
  level: string;
  season?: string;
  programType?: string;
  active: boolean;
}

/**
 * AthleteDetails Component
 *
 * This component displays detailed information about an athlete, including personal details,
 * program information, coach notes, and performance data upload options.
 */
const AthleteDetails = () => {
  // ========== State Management ==========
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  // Store the array of coach notes
  const [coachNotes, setCoachNotes] = useState<ICoachNote[]>([]);
  // Separate state for the new note text input
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hoveredTile, setHoveredTile] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [confirmationTech, setConfirmationTech] = useState<string | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [updatedFields, setUpdatedFields] = useState({
    active: false,
    level: '',
    season: '',
    programType: '',
  });
  // New state for handling profile photo upload
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // ========== Authentication ==========
  const router = useRouter();
  const { athleteId } = useParams();
  const { user } = useUser();
  const role = user?.publicMetadata?.role;

  const technologies = ['Assessments'];
  const csvTechnologies = ['Blast Motion', 'Hittrax', 'Trackman', 'Armcare'];

  // ========== Fetch Athlete Data ==========
  useEffect(() => {
    const fetchAthlete = async () => {
      try {
        const response = await fetch(`/api/athlete/${athleteId}`);
        if (!response.ok) {
          const errorMessage =
            response.status === 404
              ? 'Athlete data could not be found.'
              : response.status === 500
                ? 'We encountered an issue on our end. Please try again later.'
                : 'An unexpected issue occurred. Please try again.';
          setErrorMessage(errorMessage);
          return;
        }
        setErrorMessage(null);
        const data = await response.json();
        setAthlete(data.athlete || null);
        // Ensure coachesNotes is an array
        setCoachNotes(data.athlete?.coachesNotes || []);
        setUpdatedFields({
          active: data.athlete?.active || false,
          level: data.athlete?.level || '',
          season: data.athlete?.season || '',
          programType: data.athlete?.programType || '',
        });
      } catch (error: any) {
        setErrorMessage(error.message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchAthlete();
  }, [athleteId]);

  // ========== Save New Coach Note ==========
  const handleNotesSave = async () => {
    const newNote: ICoachNote = {
      coachName:
        `${user?.publicMetadata?.firstName || 'Coach'} ${user?.publicMetadata?.lastName || ''}`.trim(),
      coachNote: newNoteText,
      date: new Date(),
    };

    try {
      const response = await fetch(`/api/athlete/${athleteId}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        // Send the note wrapped in an object; adjust if needed
        body: JSON.stringify({ note: newNote }),
      });
      if (!response.ok) {
        throw new Error('Failed to save note');
      }
      // Update local state by appending the new note
      setCoachNotes((prevNotes) => [...prevNotes, newNote]);
      setNewNoteText('');
      setUploadStatus('Note saved successfully');
    } catch (error) {
      console.error('Error saving note:', error);
      setUploadStatus('Failed to save note');
    } finally {
      setTimeout(() => setUploadStatus(null), 3000);
    }
  };

  // ========== Delete Coach Note Handler ==========
  const handleDeleteNote = async (noteId: string) => {
    try {
      const response = await fetch(
        `/api/athlete/${athleteId}/notes?noteId=${noteId}`,
        { method: 'DELETE' }
      );
      if (!response.ok) {
        throw new Error('Failed to delete note');
      }
      setCoachNotes((prevNotes) =>
        prevNotes.filter((note) => note._id?.toString() !== noteId)
      );
      setUploadStatus('Note deleted successfully');
    } catch (error: any) {
      console.error(error);
      setUploadStatus('Failed to delete note');
    } finally {
      setTimeout(() => setUploadStatus(null), 3000);
    }
  };

  // ========== Field Update Handler ==========
  const handleFieldUpdate = async (field: keyof Athlete, value: any) => {
    try {
      const response = await fetch(`/api/athlete/${athleteId}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (!response.ok) {
        throw new Error('Failed to update field');
      }
      setUpdatedFields((prev) => ({ ...prev, [field]: value }));
      setUploadStatus(`${field} updated successfully.`);
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      setUploadStatus(`Failed to update ${field}.`);
    } finally {
      setTimeout(() => setUploadStatus(null), 3000);
    }
  };

  // ========== File Upload Handlers ==========
  const handleFileUpload = async (tech: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch(
        `/api/athlete/${athleteId}/upload/${tech.toLowerCase().replace(/\s+/g, '-')}`,
        { method: 'POST', body: formData }
      );
      if (!response.ok) {
        throw new Error('File upload failed');
      }
      setUploadStatus(`File successfully uploaded for ${tech}`);
    } catch (error: any) {
      setUploadStatus('Error uploading file: ' + error.message);
    } finally {
      setTimeout(() => setUploadStatus(null), 3000);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, tech: string) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setFileToUpload(file);
      setConfirmationTech(tech);
    }
  };

  const confirmUpload = async (tech: string) => {
    if (fileToUpload) {
      await handleFileUpload(tech, fileToUpload);
    }
    setFileToUpload(null);
    setConfirmationTech(null);
  };

  // ========== Profile Photo Upload Handler ==========
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const response = await fetch(`/api/athlete/${athleteId}/uploadPhoto`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Photo upload failed');
      }

      // Assuming the API returns the updated athlete data with a new photo URL
      const data = await response.json();
      // Update the athlete state with the new profile photo URL
      setAthlete((prev) =>
        prev ? { ...prev, profilePhotoUrl: data.profilePhotoUrl } : prev
      );
    } catch (error: any) {
      console.error('Error uploading photo:', error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) return <Loader />;
  if (errorMessage)
    return (
      <div>
        <ErrorMessage role={role as string} message={errorMessage} />
      </div>
    );

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
      <div className="flex-1 p-6 bg-gray-100 flex-col overflow-x-hidden">
        {/* Technology Nav Bar */}
        <nav className="bg-white rounded-lg shadow-md mb-6 p-3 flex space-x-4 sticky top-0 z-10">
          {technologies.map((tech) => (
            <button
              key={tech}
              onClick={() =>
                router.push(
                  `/athlete/${athleteId}/reports/${tech.toLowerCase().replace(/\s+/g, '-')}`
                )
              }
              className="text-gray-700 font-semibold hover:text-gray-900 transition"
            >
              {tech}
            </button>
          ))}
          <button
            key="pitching"
            onClick={() => router.push(`/athlete/${athleteId}/pitching`)}
            className="text-gray-700 font-semibold hover:text-gray-900 transition"
          >
            Pitching
          </button>
          <button
            key="hitting"
            onClick={() => router.push(`/athlete/${athleteId}/hitting`)}
            className="text-gray-700 font-semibold hover:text-gray-900 transition"
          >
            Hitting
          </button>
          <button
            key="goals"
            onClick={() => router.push(`/athlete/${athleteId}/goals`)}
            className="text-gray-700 font-semibold hover:text-gray-900 transition"
          >
            Goals
          </button>
          <button
            key="athletePage"
            onClick={() => router.push(`/athlete/${athleteId}`)}
            className="text-gray-700 font-semibold hover:text-gray-900 transition flex justify-end underline"
          >
            Profile
          </button>
        </nav>

        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            {/* Profile Info */}
            <div className="flex items-center space-x-6">
              <div className="relative w-36 h-36 bg-gray-200 overflow-hidden rounded-lg">
                {athlete?.pPhotoUrl ? (
                  <Image
                    src={athlete.pPhotoUrl}
                    alt={`${athlete.firstName} ${athlete.lastName}`}
                    width={144}
                    height={144}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No Photo
                  </div>
                )}
                {/* Overlay button for uploading a new photo */}
                <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                  <CameraIcon className="h-8 w-8 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                {uploadingPhoto && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
                    Uploading...
                  </div>
                )}
              </div>
              <div>
                <p className="text-lg font-bold text-gray-700">
                  {athlete?.firstName} {athlete?.lastName}
                </p>
                <p className="text-sm text-gray-500">Email: {athlete?.email}</p>
                <p className="text-sm text-gray-500">
                  Age: {athlete?.age || 'N/A'}
                </p>
                <p className="text-sm text-gray-500">
                  Height: {athlete?.height || 'N/A'}
                </p>
                <p className="text-sm text-gray-500">
                  Weight: {athlete?.weight || 'N/A'}
                </p>
              </div>
            </div>
            {/* Dropdowns Section */}
            <div className="flex flex-wrap justify-start items-center space-x-6 mt-6 md:mt-0 bg-gray-50 p-4 rounded shadow-lg">
              {/* Level Dropdown */}
              <div className="flex flex-col">
                <label
                  htmlFor="level"
                  className="text-xs font-medium text-gray-700 mb-1"
                >
                  Level
                </label>
                <select
                  id="level"
                  value={updatedFields.level}
                  onChange={(e) => handleFieldUpdate('level', e.target.value)}
                  className="block w-32 px-2 py-1 text-sm text-gray-700 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {['Youth', 'High School', 'College', 'Pro'].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              {/* Program Dropdown */}
              <div className="flex flex-col">
                <label
                  htmlFor="programType"
                  className="text-xs font-medium text-gray-700 mb-1"
                >
                  Program
                </label>
                <select
                  id="programType"
                  value={updatedFields.programType}
                  onChange={(e) =>
                    handleFieldUpdate('programType', e.target.value)
                  }
                  className="block w-32 px-2 py-1 text-sm text-gray-700 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {[
                    'Pitching',
                    'Hitting',
                    'Pitching + Hitting',
                    'S + C',
                    'Team Athlete',
                  ].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              {/* Season Dropdown */}
              <div className="flex flex-col">
                <label
                  htmlFor="season"
                  className="text-xs font-medium text-gray-700 mb-1"
                >
                  Season
                </label>
                <select
                  id="season"
                  value={updatedFields.season || ''}
                  onChange={(e) => handleFieldUpdate('season', e.target.value)}
                  className="block w-32 px-2 py-1 text-sm text-gray-700 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {['In Season', 'Off Season'].map((season) => (
                    <option key={season} value={season}>
                      {season}
                    </option>
                  ))}
                </select>
              </div>
              {/* Status Dropdown */}
              <div className="flex flex-col">
                <label
                  htmlFor="status"
                  className="text-xs font-medium text-gray-700 mb-1"
                >
                  Status
                </label>
                <select
                  id="status"
                  value={updatedFields.active ? 'Active' : 'Inactive'}
                  onChange={(e) =>
                    handleFieldUpdate('active', e.target.value === 'Active')
                  }
                  className="block w-32 px-2 py-1 text-sm text-gray-700 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {['Active', 'Inactive'].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Coach Notes Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-700 mb-4">
            Coach&apos;s Notes
          </h2>
          {/* Render Existing Notes with Delete Buttons */}
          <div className="mb-4">
            {coachNotes.length > 0 ? (
              coachNotes.map((note, index) => (
                <div
                  key={index}
                  className="mb-2 p-2 border rounded flex justify-between items-start"
                >
                  <div>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">{note.coachName}</span> on{' '}
                      {new Date(note.date).toLocaleDateString()}:
                    </p>
                    <p className="text-gray-800">{note.coachNote}</p>
                  </div>
                  <button
                    onClick={() =>
                      note._id && handleDeleteNote(note._id.toString())
                    }
                    className=""
                  >
                    <TrashIcon className="h-5 w-5 text-gray-700" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No notes yet.</p>
            )}
          </div>
          {/* New Note Input */}
          <textarea
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            className="text-black w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Add a new note..."
          ></textarea>
          <button
            onClick={handleNotesSave}
            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Save Note
          </button>
        </div>

        {/* CSV Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-700 mb-4">Upload CSV</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {csvTechnologies.map((tech) => (
              <div
                key={tech}
                className={`border-2 rounded-lg p-6 text-center ${
                  hoveredTile === tech
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 bg-gray-100'
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
              </div>
            ))}
          </div>
        </div>

        {/* Confirmation Modal */}
        {confirmationTech && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <p className="text-gray-700 mb-4">
                Are you sure you want to upload this file for{' '}
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
