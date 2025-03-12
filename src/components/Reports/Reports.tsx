'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';
import Loader from '../Loader';
import ErrorMessage from '../ErrorMessage';

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

const Reports: React.FC = () => {
  // State declarations
  const [dateOne, setDateOne] = useState<string>('');
  const [dateTwo, setDateTwo] = useState<string>('');
  const [reportType, setReportType] = useState<string>('Trackman');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);

  const { athleteId } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const role = user?.publicMetadata?.role;

  // Fetch athlete data on mount.
  useEffect(() => {
    setLoading(true);
    const fetchAthlete = async () => {
      try {
        const response = await fetch(`/api/athlete/${athleteId}`);
        if (!response.ok) {
          throw new Error('Error fetching athlete');
        }
        const data = await response.json();
        setAthlete(data.athlete);
      } catch (error: any) {
        console.error(error);
        setErrorMessage('Error fetching athlete');
      } finally {
        setLoading(false);
      }
    };

    fetchAthlete();
  }, [athleteId]);

  // Handlers for date and report type changes.
  const handleDateOneChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setDateOne(e.target.value);
  const handleDateTwoChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setDateTwo(e.target.value);
  const handleReportTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setReportType(e.target.value);

  // Helper function: Convert dates to ISO (YYYY-MM-DD)
  const convertToISO = (dateStr: string): string => {
    return new Date(dateStr).toISOString().split('T')[0];
  };

  // Form submission: send request and handle PDF response.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const isoDateOne = convertToISO(dateOne);
      const isoDateTwo = convertToISO(dateTwo);

      const response = await fetch(
        'https://asp-py-9gjt.onrender.com/generate-trackman-report',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date_one: isoDateOne,
            date_two: isoDateTwo,
            athleteId: athleteId,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        setErrorMessage(`Error generating report: ${errorText}`);
        setLoading(false);
        return;
      }

      // Instead of auto-downloading the file, we set the blob URL in state and open the modal.
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      setShowPdfModal(true);
    } catch (error: any) {
      console.error('Error generating report:', error);
      setErrorMessage('Error generating report.');
    }
    setLoading(false);
  };

  // Modal handlers.
  const handleViewPDF = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  const closeModal = () => {
    if (pdfUrl) {
      window.URL.revokeObjectURL(pdfUrl);
    }
    setPdfUrl(null);
    setShowPdfModal(false);
  };

  if (loading) return <Loader />;
  if (errorMessage)
    return (
      <div className="p-4">
        <ErrorMessage role={role as string} message={errorMessage} />
      </div>
    );

  return (
    <div className="flex min-h-screen">
      {/* Sidebar for Mobile */}
      <div className="md:hidden bg-gray-100">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>
      {/* Sidebar for Desktop */}
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-100 flex flex-col overflow-x-hidden">
        {/* Navigation Bar */}
        <nav className="bg-white rounded-lg shadow-md mb-6 p-3 flex space-x-4 sticky top-0 z-10">
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
          {['Pitching', 'Hitting', 'Goals'].map((tech) => (
            <button
              key={tech}
              onClick={() =>
                router.push(`/athlete/${athleteId}/${tech.toLowerCase()}`)
              }
              className={`text-gray-700 font-semibold hover:text-gray-900 transition ${
                tech === 'Goals' ? 'underline' : ''
              }`}
            >
              {tech}
            </button>
          ))}
        </nav>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Generate {athlete?.firstName}&apos;s Reports
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="dateOne"
                className="block text-sm font-medium text-gray-700"
              >
                Start Date
              </label>
              <input
                type="date"
                id="dateOne"
                value={dateOne}
                onChange={handleDateOneChange}
                className="mt-1 block w-full rounded-md border-gray-300 text-black shadow-sm"
                required
              />
            </div>
            <div>
              <label
                htmlFor="dateTwo"
                className="block text-sm font-medium text-gray-700"
              >
                End Date
              </label>
              <input
                type="date"
                id="dateTwo"
                value={dateTwo}
                onChange={handleDateTwoChange}
                className="mt-1 block w-full rounded-md border-gray-300 text-black shadow-sm"
                required
              />
            </div>
            <div>
              <label
                htmlFor="reportType"
                className="block text-sm font-medium text-gray-700"
              >
                Report Type
              </label>
              <select
                id="reportType"
                value={reportType}
                onChange={handleReportTypeChange}
                className="mt-1 block w-full rounded-md border-gray-300 text-black shadow-sm"
                required
              >
                <option value="trackman">Trackman</option>
              </select>
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Generate Report
            </button>
          </form>
        </div>
      </div>

      {/* PDF Modal */}
      {showPdfModal && pdfUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Report Ready
            </h2>
            <p className="text-gray-700 mb-6">
              Your report has been generated. Click below to view it.
            </p>
            <div className="flex justify-around">
              <button
                onClick={handleViewPDF}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
              >
                View PDF
              </button>
              <button
                onClick={closeModal}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
