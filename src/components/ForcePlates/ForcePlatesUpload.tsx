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

interface FileUploadStatus {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  message: string;
}

const ForcePlatesUpload = () => {
  /* ----------------------------- auth / routing ----------------------------- */
  const { user } = useUser();
  const role = user?.publicMetadata?.role as string | undefined;

  /* ----------------------------- uploader state ----------------------------- */
  const [fileQueue, setFileQueue] = useState<FileUploadStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  /* ----------------------------- handlers ----------------------------- */
  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = files.map(file => ({
      file,
      status: 'pending' as const,
      message: ''
    }));
    setFileQueue(prev => [...prev, ...newFiles]);
  };

  const uploadFile = async (fileStatus: FileUploadStatus) => {
    const { file } = fileStatus;
    
    try {
      // Update status to uploading
      setFileQueue(prev => 
        prev.map(f => 
          f.file === file 
            ? { ...f, status: 'uploading', message: 'Uploading...' }
            : f
        )
      );

      const body = new FormData();
      body.append('file', file);

      const res = await fetch('/api/forceplates', { method: 'POST', body });

      if (!res.ok) {
        const { error } = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(error || 'Upload failed');
      }

      // Update status to success
      setFileQueue(prev => 
        prev.map(f => 
          f.file === file 
            ? { ...f, status: 'success', message: 'Upload successful!' }
            : f
        )
      );
    } catch (err: any) {
      // Update status to error
      setFileQueue(prev => 
        prev.map(f => 
          f.file === file 
            ? { ...f, status: 'error', message: err.message || 'Upload failed' }
            : f
        )
      );
    }
  };

  const processQueue = async () => {
    if (isUploading || fileQueue.length === 0) return;

    setIsUploading(true);
    const pendingFiles = fileQueue.filter(f => f.status === 'pending');

    for (const fileStatus of pendingFiles) {
      await uploadFile(fileStatus);
    }

    setIsUploading(false);
  };

  const removeFile = (fileToRemove: File) => {
    setFileQueue(prev => prev.filter(f => f.file !== fileToRemove));
  };

  const clearCompleted = () => {
    setFileQueue(prev => prev.filter(f => f.status === 'pending' || f.status === 'uploading'));
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
        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Upload Force-Plates CSV
          </h2>

          <div className="space-y-4">
            <input
              type="file"
              accept=".csv"
              onChange={onSelect}
              multiple
              className="w-full text-gray-900 file:mr-3 file:rounded file:border file:border-gray-300 file:bg-gray-50 file:px-3 file:py-2"
            />

            <div className="flex space-x-4">
              <button
                onClick={processQueue}
                disabled={isUploading || fileQueue.length === 0}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Upload All'}
              </button>
              
              <button
                onClick={clearCompleted}
                disabled={!fileQueue.some(f => f.status === 'success' || f.status === 'error')}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition disabled:opacity-50"
              >
                Clear Completed
              </button>
            </div>

            {/* File Queue */}
            {fileQueue.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="font-semibold text-gray-900">Upload Queue</h3>
                {fileQueue.map((fileStatus, index) => (
                  <div 
                    key={`${fileStatus.file.name}-${index}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {fileStatus.file.name}
                      </p>
                      {fileStatus.message && (
                        <p className={`text-sm ${
                          fileStatus.status === 'error' ? 'text-red-600' :
                          fileStatus.status === 'success' ? 'text-green-600' :
                          'text-gray-600'
                        }`}>
                          {fileStatus.message}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {fileStatus.status === 'pending' && (
                        <button
                          onClick={() => removeFile(fileStatus.file)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      )}
                      {fileStatus.status === 'uploading' && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForcePlatesUpload;
