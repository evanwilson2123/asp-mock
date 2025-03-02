'use client';

import React, { useState, FormEvent } from 'react';
// import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';

interface StuffPlusResponse {
  stuff_plus: number;
}

const StuffPlus: React.FC = () => {
  const [pitchType, setPitchType] = useState<string>('Fastball');
  const [relSpeed, setRelSpeed] = useState<number | ''>('');
  const [spinRate, setSpinRate] = useState<number | ''>('');
  const [relHeight, setRelHeight] = useState<number | ''>('');
  const [absRelSide, setAbsRelSide] = useState<number | ''>('');
  const [extension, setExtension] = useState<number | ''>('');
  const [absHorizontal, setAbsHorizontal] = useState<number | ''>('');
  const [inducedVertBreak, setInducedVertBreak] = useState<number | ''>('');
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  //   const router = useRouter();
  //   const { athleteId } = useParams();
  const { user } = useUser();
  const role = user?.publicMetadata?.role || 'COACH';

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    const payload = {
      Pitch_Type: pitchType,
      RelSpeed: Number(relSpeed),
      SpinRate: Number(spinRate),
      RelHeight: Number(relHeight),
      ABS_RelSide: Number(absRelSide),
      Extension: Number(extension),
      ABS_Horizontal: Number(absHorizontal),
      InducedVertBreak: Number(inducedVertBreak),
    };

    console.log('Sending payload:', payload);

    try {
      const res = await fetch('http://127.0.0.1:8080/calculate-stuff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Request failed');
      }
      const data: StuffPlusResponse = await res.json();
      console.log('Received response:', data);
      setResult(data.stuff_plus);
    } catch (err: any) {
      console.error('Error in fetch:', err);
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Conditional Sidebar */}
      <div className="md:hidden bg-gray-100">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 bg-gray-100 flex-col overflow-x-hidden">
        <h1 className="text-3xl font-bold text-blue-900 mb-6 text-center">
          Calculate Stuff+
        </h1>
        <form
          onSubmit={handleSubmit}
          className="max-w-lg mx-auto bg-white p-6 rounded shadow"
        >
          <div className="mb-4">
            <label
              htmlFor="pitchType"
              className="block text-blue-900 font-semibold mb-1"
            >
              Pitch Type:
            </label>
            <select
              id="pitchType"
              value={pitchType}
              onChange={(e) => setPitchType(e.target.value)}
              required
              className="w-full border border-gray-300 rounded p-2 text-black"
            >
              <option value="Fastball">Fastball</option>
              <option value="Sinker">Sinker</option>
              <option value="Curveball">Curveball</option>
              <option value="Slider">Slider</option>
              <option value="Cutter">Cutter</option>
              <option value="ChangeUp">ChangeUp</option>
            </select>
          </div>
          <div className="mb-4">
            <label
              htmlFor="relSpeed"
              className="block text-blue-900 font-semibold mb-1"
            >
              Release Speed (MPH):
            </label>
            <input
              id="relSpeed"
              type="number"
              step="0.1"
              value={relSpeed}
              onChange={(e) =>
                setRelSpeed(e.target.value === '' ? '' : Number(e.target.value))
              }
              required
              className="w-full border border-gray-300 rounded p-2 text-black"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="spinRate"
              className="block text-blue-900 font-semibold mb-1"
            >
              Spin Rate:
            </label>
            <input
              id="spinRate"
              type="number"
              step="1"
              value={spinRate}
              onChange={(e) =>
                setSpinRate(e.target.value === '' ? '' : Number(e.target.value))
              }
              required
              className="w-full border border-gray-300 rounded p-2 text-black"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="relHeight"
              className="block text-blue-900 font-semibold mb-1"
            >
              Release Height:
            </label>
            <input
              id="relHeight"
              type="number"
              step="0.1"
              value={relHeight}
              onChange={(e) =>
                setRelHeight(
                  e.target.value === '' ? '' : Number(e.target.value)
                )
              }
              required
              className="w-full border border-gray-300 rounded p-2 text-black"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="absRelSide"
              className="block text-blue-900 font-semibold mb-1"
            >
              ABS Release Side:
            </label>
            <input
              id="absRelSide"
              type="number"
              step="0.1"
              value={absRelSide}
              onChange={(e) =>
                setAbsRelSide(
                  e.target.value === '' ? '' : Number(e.target.value)
                )
              }
              required
              className="w-full border border-gray-300 rounded p-2 text-black"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="extension"
              className="block text-blue-900 font-semibold mb-1"
            >
              Extension:
            </label>
            <input
              id="extension"
              type="number"
              step="0.1"
              value={extension}
              onChange={(e) =>
                setExtension(
                  e.target.value === '' ? '' : Number(e.target.value)
                )
              }
              required
              className="w-full border border-gray-300 rounded p-2 text-black"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="absHorizontal"
              className="block text-blue-900 font-semibold mb-1"
            >
              ABS Horizontal:
            </label>
            <input
              id="absHorizontal"
              type="number"
              step="0.1"
              value={absHorizontal}
              onChange={(e) =>
                setAbsHorizontal(
                  e.target.value === '' ? '' : Number(e.target.value)
                )
              }
              required
              className="w-full border border-gray-300 rounded p-2 text-black"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="inducedVertBreak"
              className="block text-blue-900 font-semibold mb-1"
            >
              Induced Vertical Break:
            </label>
            <input
              id="inducedVertBreak"
              type="number"
              step="0.1"
              value={inducedVertBreak}
              onChange={(e) =>
                setInducedVertBreak(
                  e.target.value === '' ? '' : Number(e.target.value)
                )
              }
              required
              className="w-full border border-gray-300 rounded p-2 text-black"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-900 text-white font-bold py-2 px-4 rounded hover:bg-blue-800 transition"
          >
            Calculate Stuff+
          </button>
        </form>
        {result !== null && (
          <div className="mt-6 text-center">
            <h2 className="text-xl font-bold text-blue-900">Stuff+ Value:</h2>
            <p className="text-lg text-black">{result}</p>
          </div>
        )}
        {error && (
          <div className="mt-6 text-center text-red-600">
            <h2 className="text-xl font-bold">Error:</h2>
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StuffPlus;
