'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import Link from 'next/link';
import { TrashIcon } from '@heroicons/react/24/outline';

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
  peakVerticalForce?: number;
  rsi?: number;
}

type TestsByType = {
  sj: Test[];
  cmj: Test[];
  imtp: Test[];
  hop: Test[];
  ppu: Test[];
};

interface TestData {
  cmjData: { peakPower: number; jumpHeight: number };
  sjData: { peakPower: number; jumpHeight: number };
  imtpData: { peakVerticalForce: number };
  hopData: { rsi: number };
  bodyWeight: number;
  ppuData: { takeoffPeakForceN: number };
}

interface BlastTag {
  _id: string;
  name: string;
  session: boolean;
  description: string;
}

const TEST_TYPES = [
  { key: 'sj', label: 'SJ' },
  { key: 'cmj', label: 'CMJ' },
  { key: 'imtp', label: 'IMTP' },
  { key: 'hop', label: 'Hop' },
  { key: 'ppu', label: 'PPU' },
] as const;

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const TagManager: React.FC<{
  blastTags: BlastTag[];
  availableTags: BlastTag[];
  onAddTag: (tagId: string) => void;
  onRemoveTag: (tagId: string) => void;
  athleteId: string;
}> = ({ blastTags, availableTags, onAddTag, onRemoveTag, athleteId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTagId, setSelectedTagId] = useState('');

  const filteredAvailableTags = availableTags.filter(
    (tag) =>
      !blastTags.some((bt) => bt._id === tag._id) &&
      tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddTag = () => {
    if (selectedTagId) {
      onAddTag(selectedTagId);
      setSelectedTagId('');
      setSearchTerm('');
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <div className="flex flex-col space-y-3">
        {/* Active Tags */}
        <div className="flex flex-wrap gap-2">
          {blastTags.map((tag) => (
            <div
              key={tag._id}
              className="group relative bg-blue-50 border border-blue-200 rounded-full px-3 py-1.5 flex items-center space-x-2"
            >
              <Link
                href={`/athlete/${athleteId}/tags/forceplates/${tag._id}`}
                className="text-blue-700 hover:text-blue-800 font-medium text-sm"
              >
                {tag.name}
              </Link>
              <button
                onClick={() => onRemoveTag(tag._id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <TrashIcon className="h-3.5 w-3.5 text-blue-500 hover:text-blue-700" />
              </button>
              {tag.description && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {tag.description}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Tag Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Tag
        </button>
      </div>

      {/* Add Tag Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add Tags</h3>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setSearchTerm('');
                    setSelectedTagId('');
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search tags..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-500"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Tag List */}
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                  {filteredAvailableTags.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {filteredAvailableTags.map((tag) => (
                        <button
                          key={tag._id}
                          onClick={() => setSelectedTagId(tag._id)}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                            selectedTagId === tag._id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">{tag.name}</div>
                              {tag.description && (
                                <div className="text-sm text-gray-500 mt-0.5">{tag.description}</div>
                              )}
                            </div>
                            {selectedTagId === tag._id && (
                              <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      {searchTerm ? 'No matching tags found' : 'Start typing to search tags'}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setSearchTerm('');
                      setSelectedTagId('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddTag}
                    disabled={!selectedTagId}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Tag
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

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
    ppu: [],
  });
  const [testData, setTestData] = useState<TestData>({
    cmjData: { peakPower: 0, jumpHeight: 0 },
    sjData: { peakPower: 0, jumpHeight: 0 },
    imtpData: { peakVerticalForce: 0 },
    hopData: { rsi: 0 },
    bodyWeight: 0,
    ppuData: { takeoffPeakForceN: 0 },
  });
  const [selectedType, setSelectedType] = useState<
    'sj' | 'cmj' | 'imtp' | 'hop' | 'ppu'
  >('cmj');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'pitching' | 'hitting'>('pitching');

  // Add these new states for tag management
  const [blastTags, setBlastTags] = useState<BlastTag[]>([]);
  const [availableTags, setAvailableTags] = useState<BlastTag[]>([]);

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
          ppu: data.ppuTests ?? [],
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
          bodyWeight: Number(data.bodyWeight) || 0,
          ppuData: { takeoffPeakForceN: data.ppuData?.takeoffPeakForceN || 0 },
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

  // Add these new useEffects for tag management
  useEffect(() => {
    const fetchBlastTags = async () => {
      try {
        const res = await fetch(`/api/tags/${athleteId}/forceplates`);
        if (res.ok) {
          const data = await res.json();
          setBlastTags(data.tags);
        }
      } catch (err: any) {
        console.error('Error fetching force plates tags:', err);
      }
    };
    if (athleteId) fetchBlastTags();
  }, [athleteId]);

  useEffect(() => {
    const fetchAvailableTags = async () => {
      try {
        const res = await fetch(`/api/tags`);
        if (res.ok) {
          const data = await res.json();
          setAvailableTags(data.tags);
        }
      } catch (err: any) {
        console.error('Error fetching available tags:', err);
      }
    };
    fetchAvailableTags();
  }, []);

  /* --------------- render ---------------------- */
  if (loading) return <Loader />;
  if (error) return <ErrorMessage role={role as string} message={error} />;

  // Radar chart data setup
  // These max values should be set to reasonable upper bounds for normalization
  const MAX_VALUES = {
    sjPeakPower: 7000, // W
    cmjPeakPower: 7000, // W
    imtpPeakVertForce: 5000, // N
    hopRSI: 4, // RSI
    bodyWeight: 250, // lbs
    ppuTakeoff: 1500, // N
  };

  // Comparison values from the table
  const comparison = {
    min90: {
      sjPeakPower: 4334.8,
      cmjPeakPower: 4099.9,
      bodyWeight: 162.3,
      imtpPeakVertForce: 2148.1,
      hopRSI: 1.7,
      ppuTakeoff: 934.7,
    },
    avg90: {
      sjPeakPower: 5715.3,
      cmjPeakPower: 5963.9,
      bodyWeight: 213.8,
      imtpPeakVertForce: 3526.6,
      hopRSI: 2.6,
      ppuTakeoff: 1334.7,
    },
    avg95: {
      sjPeakPower: 6259.3,
      cmjPeakPower: 6554.6,
      bodyWeight: 226.2,
      imtpPeakVertForce: 3645.2,
      hopRSI: 2.7,
      ppuTakeoff: 1378.9,
    },
  };

  // Hitting comparison values from the image
  const hittingComparison = {
    min65: {
      sjPeakPower: 3994.16,
      cmjPeakPower: 3826.75,
      bodyWeight: 168.92,
      hopRSI: 2.42,
      ppuTakeoff: 1014.09,
      imtpPeakVertForce: 2587.92,
    },
    avg65: {
      sjPeakPower: 5213.87,
      cmjPeakPower: 4952.88,
      bodyWeight: 192.6,
      hopRSI: 2.69,
      ppuTakeoff: 1268.49,
      imtpPeakVertForce: 3281.79,
    },
    avg70: {
      sjPeakPower: 5815.98,
      cmjPeakPower: 5503.53,
      bodyWeight: 207.83,
      hopRSI: 2.71,
      ppuTakeoff: 1390.43,
      imtpPeakVertForce: 3477.29,
    },
  };

  const radarData = {
    labels: [
      'SJ Peak Power (W)',
      'CMJ Peak Power (W)',
      'Body Weight (lbs)',
      'IMTP Peak Vert Force (N)',
      'Hop RSI',
      'Plyo Pushup Takeoff Force (N)',
    ],
    datasets: [
      {
        label: 'Athlete',
        data: [
          testData.sjData.peakPower / MAX_VALUES.sjPeakPower,
          testData.cmjData.peakPower / MAX_VALUES.cmjPeakPower,
          testData.bodyWeight / MAX_VALUES.bodyWeight,
          testData.imtpData.peakVerticalForce / MAX_VALUES.imtpPeakVertForce,
          testData.hopData.rsi / MAX_VALUES.hopRSI,
          testData.ppuData.takeoffPeakForceN / MAX_VALUES.ppuTakeoff,
        ],
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        borderColor: 'rgba(37, 99, 235, 1)',
        pointBackgroundColor: 'rgba(37, 99, 235, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(37, 99, 235, 1)',
      },
      {
        label: 'Min 90 MPH',
        data: [
          comparison.min90.sjPeakPower / MAX_VALUES.sjPeakPower,
          comparison.min90.cmjPeakPower / MAX_VALUES.cmjPeakPower,
          comparison.min90.bodyWeight / MAX_VALUES.bodyWeight,
          comparison.min90.imtpPeakVertForce / MAX_VALUES.imtpPeakVertForce,
          comparison.min90.hopRSI / MAX_VALUES.hopRSI,
          comparison.min90.ppuTakeoff / MAX_VALUES.ppuTakeoff,
        ],
        backgroundColor: 'rgba(55, 65, 81, 0.1)',
        borderColor: 'rgba(55, 65, 81, 0.7)',
        pointBackgroundColor: 'rgba(55, 65, 81, 1)',
        borderDash: [6, 6],
      },
      {
        label: 'Avg 90+ MPH',
        data: [
          comparison.avg90.sjPeakPower / MAX_VALUES.sjPeakPower,
          comparison.avg90.cmjPeakPower / MAX_VALUES.cmjPeakPower,
          comparison.avg90.bodyWeight / MAX_VALUES.bodyWeight,
          comparison.avg90.imtpPeakVertForce / MAX_VALUES.imtpPeakVertForce,
          comparison.avg90.hopRSI / MAX_VALUES.hopRSI,
          comparison.avg90.ppuTakeoff / MAX_VALUES.ppuTakeoff,
        ],
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        borderColor: 'rgba(251, 191, 36, 1)',
        pointBackgroundColor: 'rgba(251, 191, 36, 1)',
      },
      {
        label: 'Avg 95+ MPH',
        data: [
          comparison.avg95.sjPeakPower / MAX_VALUES.sjPeakPower,
          comparison.avg95.cmjPeakPower / MAX_VALUES.cmjPeakPower,
          comparison.avg95.bodyWeight / MAX_VALUES.bodyWeight,
          comparison.avg95.imtpPeakVertForce / MAX_VALUES.imtpPeakVertForce,
          comparison.avg95.hopRSI / MAX_VALUES.hopRSI,
          comparison.avg95.ppuTakeoff / MAX_VALUES.ppuTakeoff,
        ],
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: 'rgba(239, 68, 68, 1)',
        pointBackgroundColor: 'rgba(239, 68, 68, 1)',
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            // Show actual value instead of normalized
            const idx = context.dataIndex;
            switch (idx) {
              case 0:
                return `SJ Peak Power: ${testData.sjData.peakPower.toFixed(1)} W`;
              case 1:
                return `CMJ Peak Power: ${testData.cmjData.peakPower.toFixed(1)} W`;
              case 2:
                return `Body Weight: ${Number(testData.bodyWeight).toFixed(1)} lbs`;
              case 3:
                return `IMTP Peak Vert Force: ${testData.imtpData.peakVerticalForce.toFixed(1)} N`;
              case 4:
                return `Hop RSI: ${testData.hopData.rsi.toFixed(2)}`;
              case 5:
                return `Plyo Pushup Takeoff Force: ${testData.ppuData.takeoffPeakForceN.toFixed(1)} N`;
              default:
                return '';
            }
          },
        },
      },
    },
    scales: {
      r: {
        min: 0,
        max: 1,
        ticks: {
          stepSize: 0.2,
          callback: function(tickValue: string | number) {
            const val = typeof tickValue === 'number' ? tickValue : parseFloat(tickValue);
            return `${(val * 100).toFixed(0)}%`;
          },
        },
        pointLabels: {
          font: {
            size: 14,
          },
        },
      },
    },
  };

  // Table data setup
  const tableRows = [
    {
      label: 'SJ Peak Power (w)',
      min90: comparison.min90.sjPeakPower,
      avg90: comparison.avg90.sjPeakPower,
      avg95: comparison.avg95.sjPeakPower,
      athlete: testData.sjData.peakPower,
    },
    {
      label: 'CMJ Peak Power (w)',
      min90: comparison.min90.cmjPeakPower,
      avg90: comparison.avg90.cmjPeakPower,
      avg95: comparison.avg95.cmjPeakPower,
      athlete: testData.cmjData.peakPower,
    },
    {
      label: 'Body Weight (lbs)',
      min90: comparison.min90.bodyWeight,
      avg90: comparison.avg90.bodyWeight,
      avg95: comparison.avg95.bodyWeight,
      athlete: testData.bodyWeight,
    },
    {
      label: 'Reactive Strength - RSI',
      min90: comparison.min90.hopRSI,
      avg90: comparison.avg90.hopRSI,
      avg95: comparison.avg95.hopRSI,
      athlete: testData.hopData.rsi,
    },
    {
      label: 'Plyo Pushup - Peak Takeoff Force (n)',
      min90: comparison.min90.ppuTakeoff,
      avg90: comparison.avg90.ppuTakeoff,
      avg95: comparison.avg95.ppuTakeoff,
      athlete: testData.ppuData.takeoffPeakForceN,
    },
    {
      label: 'IMTP - Net Peak Vertical Force (n)',
      min90: comparison.min90.imtpPeakVertForce,
      avg90: comparison.avg90.imtpPeakVertForce,
      avg95: comparison.avg95.imtpPeakVertForce,
      athlete: testData.imtpData.peakVerticalForce,
    },
  ];

  const hittingTableRows = [
    {
      label: 'SJ Peak Power (w)',
      min65: hittingComparison.min65.sjPeakPower,
      avg65: hittingComparison.avg65.sjPeakPower,
      avg70: hittingComparison.avg70.sjPeakPower,
      athlete: testData.sjData.peakPower,
    },
    {
      label: 'CMJ Peak Power (w)',
      min65: hittingComparison.min65.cmjPeakPower,
      avg65: hittingComparison.avg65.cmjPeakPower,
      avg70: hittingComparison.avg70.cmjPeakPower,
      athlete: testData.cmjData.peakPower,
    },
    {
      label: 'Body Weight (lbs)',
      min65: hittingComparison.min65.bodyWeight,
      avg65: hittingComparison.avg65.bodyWeight,
      avg70: hittingComparison.avg70.bodyWeight,
      athlete: testData.bodyWeight,
    },
    {
      label: 'Reactive Strength - RSI',
      min65: hittingComparison.min65.hopRSI,
      avg65: hittingComparison.avg65.hopRSI,
      avg70: hittingComparison.avg70.hopRSI,
      athlete: testData.hopData.rsi,
    },
    {
      label: 'Plyo Pushup - Peak Takeoff Force (n)',
      min65: hittingComparison.min65.ppuTakeoff,
      avg65: hittingComparison.avg65.ppuTakeoff,
      avg70: hittingComparison.avg70.ppuTakeoff,
      athlete: testData.ppuData.takeoffPeakForceN,
    },
    {
      label: 'IMTP - Net Peak Vertical Force (n)',
      min65: hittingComparison.min65.imtpPeakVertForce,
      avg65: hittingComparison.avg65.imtpPeakVertForce,
      avg70: hittingComparison.avg70.imtpPeakVertForce,
      athlete: testData.imtpData.peakVerticalForce,
    },
  ];

  function percentDiff(a: number, b: number) {
    if (!a) return 0;
    return ((b - a) / a) * 100;
  }

  function getDiffColor(val: number) {
    if (val >= 30) return 'bg-green-400/60';
    if (val >= 8) return 'bg-green-200';
    if (val >= 0) return 'bg-yellow-100';
    if (val >= -10) return 'bg-yellow-300';
    if (val >= -20) return 'bg-orange-300';
    return 'bg-red-400 text-white';
  }

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
              {testData.imtpData.peakVerticalForce.toFixed(1)} N
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
      case 'ppu':
        return (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-sm font-medium text-gray-500">Peak Takeoff Force</h3>
            <p className="text-2xl font-bold text-gray-900">
              {testData.ppuData.takeoffPeakForceN.toFixed(1)} N
            </p>
          </div>
        );
    }
  };

  // Add these new handlers for tag management
  const handleAddBlastTag = async (tagId: string) => {
    if (!tagId) return;
    try {
      const res = await fetch(`/api/tags/${athleteId}/forceplates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId, session: false }),
      });
      if (res.ok) {
        const addedTag = availableTags.find((tag) => tag._id === tagId);
        if (addedTag) {
          setBlastTags((prev) => [...prev, addedTag]);
        }
      } else {
        const data = await res.json();
        setError(data.error || 'Error adding tag');
      }
    } catch (err: any) {
      console.error(err);
      setError('Internal Server Error');
    }
  };

  const handleRemoveBlastTag = async (tagId: string) => {
    try {
      const res = await fetch(`/api/tags/${athleteId}/forceplates/${tagId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setBlastTags((prev) => prev.filter((tag) => tag._id !== tagId));
      } else {
        const data = await res.json();
        setError(data.error || 'Error removing tag');
      }
    } catch (err: any) {
      console.error(err);
      setError('Internal Server Error');
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
            key="athletePage"
            onClick={() => router.push(`/athlete/${athleteId}`)}
            className="text-gray-700 font-semibold hover:text-gray-900 transition flex justify-end underline"
          >
            Profile
          </button>
          <button
            key="assessments"
            onClick={() => router.push(`/athlete/${athleteId}/reports/assessments`)}
            className="text-gray-700 font-semibold hover:text-gray-900 transition"
          >
            Assessments
          </button>
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
            key="forceplates"
            onClick={() => router.push(`/athlete/${athleteId}/forceplates`)}
            className="text-gray-700 font-semibold hover:text-gray-900 transition"
          >
            Forceplates
          </button>
          <button
            key="goals"
            onClick={() => router.push(`/athlete/${athleteId}/goals`)}
            className="text-gray-700 font-semibold hover:text-gray-900 transition"
          >
            Goals
          </button>
          <button
            key="comparison"
            onClick={() => router.push(`/athlete/${athleteId}/comparison`)}
            className="text-gray-700 font-semibold hover:text-gray-900 transition"
          >
            Comparison
          </button>
          <button
            key="media"
            onClick={() => router.push(`/athlete/${athleteId}/media`)}
            className="text-gray-700 font-semibold hover:text-gray-900 transition"
          >
            Media
          </button>
          <button
            key="dash-view"
            onClick={() => router.push(`/athlete/${athleteId}/dash-view`)}
            className="text-gray-700 font-semibold hover:text-gray-900 transition"
          >
            Dash-View
          </button>
        </nav>

        {/* Overview and Tags Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-700 mb-4 md:mb-0">
              Force-Plates Overview
            </h1>
            <div className="w-full md:w-auto">
              <TagManager
                blastTags={blastTags}
                availableTags={availableTags}
                onAddTag={handleAddBlastTag}
                onRemoveTag={handleRemoveBlastTag}
                athleteId={athleteId as string}
              />
            </div>
          </div>
        </div>

        {/* Radar Plot Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {/* Pitching/Hitting toggle */}
          <div className="flex gap-4 mb-6">
            <button
              className={`px-4 py-2 rounded-lg font-semibold border transition ${selectedView === 'pitching' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'}`}
              onClick={() => setSelectedView('pitching')}
            >
              Pitching
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-semibold border transition ${selectedView === 'hitting' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'}`}
              onClick={() => setSelectedView('hitting')}
            >
              Hitting
            </button>
          </div>

          {/* Radar Chart & Table: Pitching or Hitting */}
          {selectedView === 'pitching' ? (
            <>
              {/* Radar Chart */}
              <div className="mb-8 w-full max-w-3xl mx-auto aspect-[4/3] min-h-[300px] flex items-center justify-center">
                <Radar data={radarData} options={radarOptions} />
              </div>
              {/* Comparison Table */}
              <div className="overflow-x-auto mb-8">
                <table className="min-w-full border text-xs md:text-sm rounded-lg overflow-hidden shadow">
                  <thead className="bg-gray-100 text-gray-800">
                    <tr>
                      <th className="px-2 py-2 border">Metric</th>
                      <th className="px-2 py-2 border">Min 90 MPH</th>
                      <th className="px-2 py-2 border">Avg 90+ MPH</th>
                      <th className="px-2 py-2 border">Avg 95+ MPH</th>
                      <th className="px-2 py-2 border">Athlete Data</th>
                      <th className="px-2 py-2 border">% Diff Min90</th>
                      <th className="px-2 py-2 border">% Diff 90+</th>
                      <th className="px-2 py-2 border">% Diff 95+</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-800">
                    {tableRows.map((row) => {
                      const diffMin90 = percentDiff(row.min90, row.athlete);
                      const diff90 = percentDiff(row.avg90, row.athlete);
                      const diff95 = percentDiff(row.avg95, row.athlete);
                      return (
                        <tr key={row.label} className="text-center">
                          <td className="border px-2 py-1 font-medium text-left">{row.label}</td>
                          <td className="border px-2 py-1">{row.min90?.toFixed(1)}</td>
                          <td className="border px-2 py-1">{row.avg90?.toFixed(1)}</td>
                          <td className="border px-2 py-1">{row.avg95?.toFixed(1)}</td>
                          <td className="border px-2 py-1 font-bold">{row.athlete?.toFixed(1)}</td>
                          <td className={`border px-2 py-1 font-semibold ${getDiffColor(diffMin90)}`}>{diffMin90.toFixed(1)}%</td>
                          <td className={`border px-2 py-1 font-semibold ${getDiffColor(diff90)}`}>{diff90.toFixed(1)}%</td>
                          <td className={`border px-2 py-1 font-semibold ${getDiffColor(diff95)}`}>{diff95.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              {/* Radar Chart for Hitting */}
              <div className="mb-8 w-full max-w-3xl mx-auto aspect-[4/3] min-h-[300px] flex items-center justify-center">
                <Radar
                  data={{
                    labels: [
                      'SJ Peak Power (w)',
                      'CMJ Peak Power (w)',
                      'Body Weight (lbs)',
                      'Reactive Strength - RSI',
                      'Plyo Pushup - Peak Takeoff Force (n)',
                      'IMTP - Net Peak Vertical Force (n)',
                    ],
                    datasets: [
                      {
                        label: 'Min <65 MPH',
                        data: [
                          hittingComparison.min65.sjPeakPower / MAX_VALUES.sjPeakPower,
                          hittingComparison.min65.cmjPeakPower / MAX_VALUES.cmjPeakPower,
                          hittingComparison.min65.bodyWeight / MAX_VALUES.bodyWeight,
                          hittingComparison.min65.hopRSI / MAX_VALUES.hopRSI,
                          hittingComparison.min65.ppuTakeoff / MAX_VALUES.ppuTakeoff,
                          hittingComparison.min65.imtpPeakVertForce / MAX_VALUES.imtpPeakVertForce,
                        ],
                        borderColor: 'black',
                        borderDash: [6, 6],
                        backgroundColor: 'rgba(0,0,0,0.05)',
                        pointBackgroundColor: 'black',
                      },
                      {
                        label: 'Avg 65-70 MPH',
                        data: [
                          hittingComparison.avg65.sjPeakPower / MAX_VALUES.sjPeakPower,
                          hittingComparison.avg65.cmjPeakPower / MAX_VALUES.cmjPeakPower,
                          hittingComparison.avg65.bodyWeight / MAX_VALUES.bodyWeight,
                          hittingComparison.avg65.hopRSI / MAX_VALUES.hopRSI,
                          hittingComparison.avg65.ppuTakeoff / MAX_VALUES.ppuTakeoff,
                          hittingComparison.avg65.imtpPeakVertForce / MAX_VALUES.imtpPeakVertForce,
                        ],
                        borderColor: 'green',
                        backgroundColor: 'rgba(34,197,94,0.1)',
                        pointBackgroundColor: 'green',
                      },
                      {
                        label: 'Avg >70 MPH',
                        data: [
                          hittingComparison.avg70.sjPeakPower / MAX_VALUES.sjPeakPower,
                          hittingComparison.avg70.cmjPeakPower / MAX_VALUES.cmjPeakPower,
                          hittingComparison.avg70.bodyWeight / MAX_VALUES.bodyWeight,
                          hittingComparison.avg70.hopRSI / MAX_VALUES.hopRSI,
                          hittingComparison.avg70.ppuTakeoff / MAX_VALUES.ppuTakeoff,
                          hittingComparison.avg70.imtpPeakVertForce / MAX_VALUES.imtpPeakVertForce,
                        ],
                        borderColor: 'red',
                        backgroundColor: 'rgba(239,68,68,0.1)',
                        pointBackgroundColor: 'red',
                      },
                      {
                        label: 'Athlete',
                        data: [
                          testData.sjData.peakPower / MAX_VALUES.sjPeakPower,
                          testData.cmjData.peakPower / MAX_VALUES.cmjPeakPower,
                          testData.bodyWeight / MAX_VALUES.bodyWeight,
                          testData.hopData.rsi / MAX_VALUES.hopRSI,
                          testData.ppuData.takeoffPeakForceN / MAX_VALUES.ppuTakeoff,
                          testData.imtpData.peakVerticalForce / MAX_VALUES.imtpPeakVertForce,
                        ],
                        borderColor: 'blue',
                        backgroundColor: 'rgba(37,99,235,0.2)',
                        pointBackgroundColor: 'blue',
                      },
                    ],
                  }}
                  options={radarOptions}
                />
              </div>
              {/* Hitting Table */}
              <div className="overflow-x-auto mb-8">
                <table className="min-w-full border text-xs md:text-sm rounded-lg overflow-hidden shadow">
                  <thead className="bg-gray-100 text-gray-800">
                    <tr>
                      <th className="px-2 py-2 border">Metric</th>
                      <th className="px-2 py-2 border">Min {'<'}65 MPH</th>
                      <th className="px-2 py-2 border">Avg 65-70 MPH</th>
                      <th className="px-2 py-2 border">Avg {'>'}70 MPH</th>
                      <th className="px-2 py-2 border">Athlete Data</th>
                      <th className="px-2 py-2 border">% Diff Min65</th>
                      <th className="px-2 py-2 border">% Diff 65+</th>
                      <th className="px-2 py-2 border">% Diff 70+</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-800">
                    {hittingTableRows.map((row) => {
                      const diffMin65 = percentDiff(row.min65, row.athlete);
                      const diff65 = percentDiff(row.avg65, row.athlete);
                      const diff70 = percentDiff(row.avg70, row.athlete);
                      return (
                        <tr key={row.label} className="text-center">
                          <td className="border px-2 py-1 font-medium text-left">{row.label}</td>
                          <td className="border px-2 py-1">{row.min65?.toFixed(2)}</td>
                          <td className="border px-2 py-1">{row.avg65?.toFixed(2)}</td>
                          <td className="border px-2 py-1">{row.avg70?.toFixed(2)}</td>
                          <td className="border px-2 py-1 font-bold">{row.athlete?.toFixed(2)}</td>
                          <td className={`border px-2 py-1 font-semibold ${getDiffColor(diffMin65)}`}>{diffMin65.toFixed(1)}%</td>
                          <td className={`border px-2 py-1 font-semibold ${getDiffColor(diff65)}`}>{diff65.toFixed(1)}%</td>
                          <td className={`border px-2 py-1 font-semibold ${getDiffColor(diff70)}`}>{diff70.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Tests Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* toggle buttons - moved above the tests button */}
          <div className="flex flex-wrap gap-3 mb-6">
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
          <button
            onClick={() => router.push(`/athlete/${athleteId}/forceplates/${selectedType}`)}
            className="inline-flex items-center mb-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-lg font-semibold text-blue-700 hover:bg-blue-100 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300 transition cursor-pointer shadow-sm"
            type="button"
          >
            {TEST_TYPES.find((t) => t.key === selectedType)?.label} Tests
            <span className="ml-2 text-blue-400">→</span>
          </button>

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
