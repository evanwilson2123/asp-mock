'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

import CoachSidebar from '@/components/Dash/CoachSidebar';
import AthleteSidebar from '@/components/Dash/AthleteSidebar';
import Sidebar from '@/components/Dash/Sidebar';

import Loader from '../Loader';
import ErrorMessage from '../ErrorMessage';

interface Test {
  id: number;
  date: string; // ISO string after JSON stringify
  peakPower?: number;
  jumpHeight?: number;
  peakVertForce?: number;
  rsi?: number;
}

type TestsByType = {
  sj: Test[];
  cmj: Test[];
  imtp: Test[];
  hop: Test[];
};

interface TestData {
  cmjData: { peakPower: number; jumpHeight: number };
  sjData: { peakPower: number; jumpHeight: number };
  imtpData: { peakVertForce: number };
  hopData: { rsi: number };
}

const TEST_TYPES = [
  { key: 'sj', label: 'SJ' },
  { key: 'cmj', label: 'CMJ' },
  { key: 'imtp', label: 'IMTP' },
  { key: 'hop', label: 'Hop' },
] as const;

const ForceplatesOverview: React.FC = () => {
  /* --------------- route + auth --------------- */
  const { athleteId } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const role = user?.publicMetadata?.role as string | undefined;

  /* --------------- state ---------------------- */
  const [tests, setTests] = useState<TestsByType>({
    sj: [],
    cmj: [],
    imtp: [],
    hop: [],
  });
  const [testData, setTestData] = useState<TestData>({
    cmjData: { peakPower: 0, jumpHeight: 0 },
    sjData: { peakPower: 0, jumpHeight: 0 },
    imtpData: { peakVertForce: 0 },
    hopData: { rsi: 0 },
  });
  const [selectedType, setSelectedType] = useState<
    'sj' | 'cmj' | 'imtp' | 'hop'
  >('cmj');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* --------------- fetch data ----------------- */
  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await fetch(`/api/athlete/${athleteId}/forceplates`);
        if (!res.ok) {
          setError('Error fetching force-plate data');
          return;
        }
        const json = await res.json();
        const data = json.tests;

        const parsed: TestsByType = {
          sj: data.sjTests ?? [],
          cmj: data.cmjTests ?? [],
          imtp: data.imtpTests ?? [],
          hop: data.hopTests ?? [],
        };

        // Sort each array newest → oldest
        Object.keys(parsed).forEach((k) => {
          parsed[k as keyof TestsByType].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        });

        setTests(parsed);
        setTestData({
          cmjData: data.cmjData,
          sjData: data.sjData,
          imtpData: data.imtpData,
          hopData: data.hopData,
        });
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (athleteId) fetchTests();
  }, [athleteId]);

  /* --------------- render ---------------------- */
  if (loading) return <Loader />;
  if (error) return <ErrorMessage role={role as string} message={error} />;

  const renderTestData = () => {
    switch (selectedType) {
      case 'cmj':
        return (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Peak Power</h3>
              <p className="text-2xl font-bold text-gray-900">
                {testData.cmjData.peakPower.toFixed(1)} 
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Jump Height</h3>
              <p className="text-2xl font-bold text-gray-900">
                {testData.cmjData.jumpHeight.toFixed(1)} cm
              </p>
            </div>
          </div>
        );
      case 'sj':
        return (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Peak Power</h3>
              <p className="text-2xl font-bold text-gray-900">
                {testData.sjData.peakPower.toFixed(1)} W
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Jump Height</h3>
              <p className="text-2xl font-bold text-gray-900">
                {testData.sjData.jumpHeight.toFixed(1)} cm
              </p>
            </div>
          </div>
        );
      case 'imtp':
        return (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-sm font-medium text-gray-500">Peak Vertical Force</h3>
            <p className="text-2xl font-bold text-gray-900">
              {testData.imtpData.peakVertForce.toFixed(1)} N
            </p>
          </div>
        );
      case 'hop':
        return (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-sm font-medium text-gray-500">RSI</h3>
            <p className="text-2xl font-bold text-gray-900">
              {testData.hopData.rsi.toFixed(2)}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* ---------- sidebars ---------- */}
      {/* mobile */}
      <div className="md:hidden bg-gray-100">
        {role === 'COACH' ? (
          <CoachSidebar />
        ) : role === 'ATHLETE' ? (
          <AthleteSidebar />
        ) : (
          <Sidebar />
        )}
      </div>
      {/* desktop */}
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === 'COACH' ? (
          <CoachSidebar />
        ) : role === 'ATHLETE' ? (
          <AthleteSidebar />
        ) : (
          <Sidebar />
        )}
      </div>

      {/* ---------- main content ---------- */}
      <div className="flex-1 p-6 bg-gray-100 overflow-x-hidden flex-col">
        {/* sticky navbar (mirrors BlastMotionStats) */}
        <nav className="bg-white rounded-lg shadow-md mb-6 p-3 flex space-x-4 sticky top-0 z-10">
          <button
            onClick={() => router.push(`/athlete/${athleteId}`)}
            className="text-gray-700 font-semibold hover:text-gray-900 transition"
          >
            Profile
          </button>
          {['Assessments', 'Pitching', 'Hitting', 'Goals'].map((s) => (
            <button
              key={s}
              onClick={() =>
                router.push(`/athlete/${athleteId}/${s.toLowerCase()}`)
              }
              className="text-gray-700 font-semibold hover:text-gray-900 transition"
            >
              {s}
            </button>
          ))}
          <button
            onClick={() => router.push(`/athlete/${athleteId}/media`)}
            className="text-gray-700 font-semibold hover:text-gray-900 transition"
          >
            Media
          </button>
        </nav>

        {/* page title + type toggles */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-700 mb-4">
            Force-Plates Overview
          </h1>

          {/* toggle buttons */}
          <div className="flex flex-wrap gap-3">
            {TEST_TYPES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSelectedType(key)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                  selectedType === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* tests list for selected type */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            {TEST_TYPES.find((t) => t.key === selectedType)?.label} Tests
          </h2>

          {/* Display test data */}
          {renderTestData()}

          {tests[selectedType].length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {tests[selectedType].map((test) => (
                <li key={test.id} className="py-2">
                  <button
                    onClick={() =>
                      router.push(
                        `/athlete/${athleteId}/forceplates/${selectedType}/${test.id}`
                      )
                    }
                    className="w-full text-left text-gray-800 hover:underline"
                  >
                    {new Date(test.date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No tests recorded.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForceplatesOverview;
