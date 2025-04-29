'use client';

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import AthleteSidebar from '@/components/Dash/AthleteSidebar';
import Sidebar from '@/components/Dash/Sidebar';

/**
 * ForcePlatesUpload
 * ----------------------------------------------------
 * Client-side CSV uploader that POSTs the file
 * to `/api/forceplates`.  Mirrors the look-and-feel
 * of the Goals page and includes the same sidebar logic.
 */
const ForcePlatesUpload = () => {
  /* ----------------------------- auth / routing ----------------------------- */
  const { user } = useUser();
  const role = user?.publicMetadata?.role as string | undefined;

  /* ----------------------------- uploader state ----------------------------- */
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<
    'idle' | 'uploading' | 'success' | 'error'
  >('idle');
  const [message, setMessage] = useState<string>('');

  /* ----------------------------- handlers ----------------------------- */
  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setStatus('idle');
    setMessage('');
  };

  const onUpload = async () => {
    if (!file) {
      setStatus('error');
      setMessage('Please choose a CSV file first.');
      return;
    }

    try {
      setStatus('uploading');

      const body = new FormData();
      body.append('file', file);

      const res = await fetch('/api/forceplates', { method: 'POST', body });

      if (!res.ok) {
        const { error } = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(error || 'Upload failed');
      }

      setStatus('success');
      setMessage('Upload successful!');
      setFile(null);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Something went wrong');
    }
  };

  /* ----------------------------- UI ----------------------------- */
  return (
    <div className="flex min-h-screen">
      {/* ---------- Sidebars ---------- */}
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

      {/* ---------- Main content ---------- */}
      <div className="flex-1 p-6 bg-gray-100 overflow-x-hidden flex-col">
        {/* Top navigation (matches Goals styling) */}
        {/* <nav className="bg-white rounded-lg shadow-md mb-6 p-3 flex space-x-4 sticky top-0 z-10">
          <button
            onClick={() => router.push(`/athlete/${athleteId}`)}
            className="text-gray-700 font-semibold hover:text-gray-900 transition"
          >
            Profile
          </button>
          <button
            onClick={() =>
              router.push(`/athlete/${athleteId}/reports/assessments`)
            }
            className="text-gray-700 font-semibold hover:text-gray-900 transition"
          >
            Assessments
          </button>
          {['Pitching', 'Hitting', 'Goals', 'Force-Plates'].map((item) => (
            <button
              key={item}
              onClick={() =>
                router.push(
                  `/athlete/${athleteId}/${item.toLowerCase().replace(' ', '-')}`
                )
              }
              className={`text-gray-700 font-semibold hover:text-gray-900 transition ${
                item === 'Force-Plates' ? 'underline' : ''
              }`}
            >
              {item}
            </button>
          ))}
          <button
            onClick={() => router.push(`/athlete/${athleteId}/comparison`)}
            className="text-gray-700 font-semibold hover:text-gray-900 transition"
          >
            Comparison
          </button>
          <button
            onClick={() => router.push(`/athlete/${athleteId}/media`)}
            className="text-gray-700 font-semibold hover:text-gray-900 transition"
          >
            Media
          </button>
          <button
            onClick={() => router.push(`/athlete/${athleteId}/dash-view`)}
            className="text-gray-700 font-semibold hover:text-gray-900 transition"
          >
            Dash-View
          </button>
        </nav> */}

        {/* Upload Card */}
        <div className="bg-white rounded-lg shadow-md p-6 max-w-lg mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Upload Force-Plates CSV
          </h2>

          <input
            type="file"
            accept=".csv"
            onChange={onSelect}
            className="w-full mb-4 text-gray-900 file:mr-3 file:rounded file:border file:border-gray-300 file:bg-gray-50 file:px-3 file:py-2"
          />

          <button
            onClick={onUpload}
            disabled={status === 'uploading'}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
          >
            {status === 'uploading' ? 'Uploading…' : 'Upload'}
          </button>

          {status === 'error' && (
            <p className="mt-4 text-sm text-red-600">{message}</p>
          )}
          {status === 'success' && (
            <p className="mt-4 text-sm text-green-600">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForcePlatesUpload;
