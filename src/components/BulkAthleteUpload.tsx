'use client';

import React, { useState, ChangeEvent } from 'react';
import { useUser } from '@clerk/nextjs';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import AthleteSidebar from '@/components/Dash/AthleteSidebar';
import Sidebar from '@/components/Dash/Sidebar';

interface AthleteData {
  firstName: string;
  lastName: string;
  email: string;
  [key: string]: string;
}

interface FileUploadStatus {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  message: string;
  data?: AthleteData[];
}

const BulkAthleteUpload = () => {
  /* ----------------------------- auth / routing ----------------------------- */
  const { user } = useUser();
  const role = user?.publicMetadata?.role as string | undefined;

  /* ----------------------------- uploader state ----------------------------- */
  const [fileQueue, setFileQueue] = useState<FileUploadStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const parseCSV = (csvText: string): AthleteData[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must contain a header row and at least one data row');
    }

    const headers = lines[0].split(',').map(header => header.trim());
    const requiredFields = ['firstName', 'lastName', 'email'];
    
    // Validate headers
    const missingFields = requiredFields.filter(field => !headers.includes(field));
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    const data: AthleteData[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(value => value.trim());
      if (values.length !== headers.length) {
        throw new Error(`Row ${i + 1} has ${values.length} columns, expected ${headers.length}`);
      }

      const row: AthleteData = {
        firstName: '',
        lastName: '',
        email: ''
      };

      headers.forEach((header, index) => {
        row[header] = values[index];
      });

      // Validate email format
      if (!row.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        throw new Error(`Invalid email format in row ${i + 1}`);
      }

      data.push(row);
    }

    return data;
  };

  /* ----------------------------- handlers ----------------------------- */
  const onSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    for (const file of files) {
      if (!file.name.endsWith('.csv')) {
        setFileQueue(prev => [...prev, {
          file,
          status: 'error',
          message: 'File must be a CSV'
        }]);
        continue;
      }

      try {
        const text = await file.text();
        const parsedData = parseCSV(text);
        setFileQueue(prev => [...prev, {
          file,
          status: 'pending',
          message: `${parsedData.length} athletes found`,
          data: parsedData
        }]);
      } catch (err) {
        setFileQueue(prev => [...prev, {
          file,
          status: 'error',
          message: err instanceof Error ? err.message : 'Failed to parse CSV file'
        }]);
      }
    }
  };

  const uploadFile = async (fileStatus: FileUploadStatus) => {
    if (!fileStatus.data) return;
    
    try {
      // Update status to uploading
      setFileQueue(prev => 
        prev.map(f => 
          f.file === fileStatus.file 
            ? { ...f, status: 'uploading', message: 'Uploading...' }
            : f
        )
      );

      const response = await fetch('/api/athletes/bulk-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ athletes: fileStatus.data }),
      });

      if (!response.ok) {
        throw new Error('Failed to upload athletes');
      }

      // Update status to success
      setFileQueue(prev => 
        prev.map(f => 
          f.file === fileStatus.file 
            ? { ...f, status: 'success', message: 'Upload successful!' }
            : f
        )
      );
    } catch (err: any) {
      // Update status to error
      setFileQueue(prev => 
        prev.map(f => 
          f.file === fileStatus.file 
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
        {/* Upload Card */}
        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Bulk Athlete Upload
          </h2>

          <div className="space-y-4">
            <div>
              <input
                type="file"
                accept=".csv"
                onChange={onSelect}
                multiple
                className="w-full text-gray-900 file:mr-3 file:rounded file:border file:border-gray-300 file:bg-gray-50 file:px-3 file:py-2"
              />
              <p className="text-sm text-gray-500 mt-1">
                Required fields: firstName, lastName, email
              </p>
            </div>

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
                      {fileStatus.data && fileStatus.status === 'pending' && (
                        <div className="mt-2 text-xs text-gray-500">
                          Preview: {fileStatus.data.slice(0, 3).map(athlete => 
                            `${athlete.firstName} ${athlete.lastName}`
                          ).join(', ')}
                          {fileStatus.data.length > 3 && ` and ${fileStatus.data.length - 3} more`}
                        </div>
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

export default BulkAthleteUpload;
