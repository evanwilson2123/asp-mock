'use client';

import React, { useState } from 'react';

/**
 * ForcePlatesUpload
 * ----------------------------------------------------
 * Simple client-side CSV uploader that POSTs the file
 * to `/api/forceplates`. Shows basic success / error
 * feedback and disables the button while uploading.
 */
const ForcePlatesUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<
    'idle' | 'uploading' | 'success' | 'error'
  >('idle');
  const [message, setMessage] = useState<string>('');

  /* ---------- handlers ---------- */
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

  /* ---------- UI ---------- */
  return (
    <div className="mx-auto w-full max-w-md space-y-4 rounded-lg border p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Upload Force-Plates CSV</h2>

      <input
        type="file"
        accept=".csv"
        onChange={onSelect}
        className="file:mr-3 file:rounded file:border file:border-gray-300 file:bg-gray-50 file:px-3 file:py-1"
      />

      <button
        onClick={onUpload}
        disabled={status === 'uploading'}
        className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {status === 'uploading' ? 'Uploading…' : 'Upload'}
      </button>

      {status === 'error' && <p className="text-sm text-red-600">{message}</p>}
      {status === 'success' && (
        <p className="text-sm text-green-600">{message}</p>
      )}
    </div>
  );
};

export default ForcePlatesUpload;
