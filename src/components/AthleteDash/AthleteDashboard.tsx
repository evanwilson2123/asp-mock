// export default AthleteDashboard;
'use client';

import React, { useEffect, useState, Suspense, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import AthleteSidebar from '../Dash/AthleteSidebar';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';
import { IAthleteTag } from '@/models/athleteTag';
import { IGoal } from '@/models/goal';
import Loader from '../Loader';
import { useParams, useRouter } from 'next/navigation';
import { ICoachNote } from '@/models/coachesNote';

/* ---------- chart imports (only needed for Stats view) ---------- */
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

/* ---------- time‑range options ---------- */
const timeRanges = [
  'Past Week',
  'Past Month',
  'Past 3 Months',
  'Past 6 Months',
  'Past Year',
  'All',
];

/* ---------- type defs (mirrors admin dashboard) ---------- */
interface BlastSessionAvg {
  date: string;
  avgBatSpeed: number;
  avgHandSpeed: number;
}
interface BlastData {
  maxBatSpeed?: number;
  maxHandSpeed?: number;
  sessionAverages?: BlastSessionAvg[];
}

interface HitTraxSessionAvg {
  date: string;
  avgExitVelo: number;
}
interface HitTraxData {
  maxExitVelo?: number;
  maxDistance?: number;
  hardHitAverage?: number;
  sessionAverages?: HitTraxSessionAvg[];
}

interface TrackmanPitchStat {
  pitchType: string;
  peakSpeed: number;
}
interface TrackmanAvgSpeed {
  date: string;
  pitchType: string;
  avgSpeed: number;
}
interface TrackmanData {
  pitchStats?: TrackmanPitchStat[];
  avgPitchSpeeds?: TrackmanAvgSpeed[];
}

interface StatsPayload {
  blast: BlastData;
  hittrax: HitTraxData;
  trackman: TrackmanData;
}

/* ---------- HeightCard component ---------- */
const HeightCard: React.FC<{
  value: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (height: string) => Promise<void>;
  onCancel: () => void;
}> = ({ value, isEditing, onEdit, onSave, onCancel }) => {
  const [localHeight, setLocalHeight] = useState(value);

  const handleLocalHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Remove any non-digit characters
    const digits = inputValue.replace(/[^0-9]/g, '');
    
    if (digits.length > 0) {
      const feet = digits[0];
      const inches = digits.slice(1);
      
      // If we have more than one digit, automatically add the apostrophe
      if (digits.length > 1) {
        setLocalHeight(`${feet}'${inches}`);
      } else {
        setLocalHeight(feet);
      }
    } else {
      setLocalHeight('');
    }
  };

  const handleSave = async () => {
    // Format the height before saving
    let formattedHeight = localHeight;
    
    // Remove any non-digit characters
    const digits = localHeight.replace(/[^0-9]/g, '');
    
    if (digits.length > 0) {
      const feet = digits[0];
      const inches = digits.slice(1, 3); // Take up to 2 digits for inches
      
      if (parseInt(inches) <= 11) {
        formattedHeight = `${feet}'${inches}`;
      } else {
        alert('Inches must be 11 or less');
        return;
      }
    } else {
      alert('Please enter a valid height');
      return;
    }

    await onSave(formattedHeight);
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow p-6 border-2 border-gray-300">
        <h2 className="text-xl font-bold mb-4">Height</h2>
        <div className="flex items-center space-x-2 justify-center">
          <div className="relative">
            <input
              type="text"
              value={localHeight}
              onChange={handleLocalHeightChange}
              placeholder="5'11"
              className="border p-2 rounded w-24 text-center"
              maxLength={4}
            />
          </div>
          <button
            onClick={handleSave}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 border-2 border-gray-300">
      <h2 className="text-xl font-bold mb-4">Height</h2>
      <div className="flex flex-col items-center space-y-2">
        <p className="text-4xl font-semibold cursor-pointer hover:text-blue-600">
          {value}
        </p>
        <button
          onClick={onEdit}
          className="px-3 py-1 text-sm bg-gray-800 text-white rounded hover:bg-gray-900 transition"
        >
          Edit
        </button>
      </div>
    </div>
  );
};

/* ========================================================================
 * AthleteDashboard
 * ===================================================================== */
const AthleteDashboard: React.FC = () => {
  /* ------------------------ hooks / auth ------------------------ */
  const router = useRouter();
  const params = useParams();
  const { user } = useUser();
  const role = user?.publicMetadata?.role as string | undefined;

  const resolvedAthleteId: string | undefined =
    role === 'ATHLETE'
      ? (user?.publicMetadata?.objectId as string)
      : (() => {
          const id = (params as Record<string, string | string[]>).athleteId;
          return Array.isArray(id) ? id[0] : id;
        })();

  /* --------------------------- state ---------------------------- */
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [swingCount, setSwingCount] = useState(0);
  const [pitchCount, setPitchCount] = useState(0);

  const [hitTags, setHitTags] = useState<IAthleteTag[]>([]);
  const [blastTags, setBlastTags] = useState<IAthleteTag[]>([]);
  const [trackTags, setTrackTags] = useState<IAthleteTag[]>([]);
  const [armTags, setArmTags] = useState<IAthleteTag[]>([]);
  const [forceTags, setForceTags] = useState<IAthleteTag[]>([]);
  const [assessmentTags, setAssessmentTags] = useState<IAthleteTag[]>([]);
  const [goals, setGoals] = useState<IGoal[]>([]);

  const [blastNotes, setBlastNotes] = useState<ICoachNote[]>([]);
  const [hittraxNotes, setHittraxNotes] = useState<ICoachNote[]>([]);
  const [trackmanNotes, setTrackmanNotes] = useState<ICoachNote[]>([]);
  const [profileNotes, setProfileNotes] = useState<ICoachNote[]>([]);

  const [height, setHeight] = useState<string>('');
  const [isEditingHeight, setIsEditingHeight] = useState(false);
  const [weight, setWeight] = useState<number | null>(null);
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [newWeight, setNewWeight] = useState<string>('');

  const [timeRange, setTimeRange] = useState<string>('All');

  /* ------ Summary ⟷ Stats toggle & cached stats payload ------ */
  const [view, setView] = useState<'summary' | 'stats'>('summary');
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    'blast' | 'hittrax' | 'trackman' | 'profile'
  >('blast');

  /* ---------------------- helpers ------------------------ */
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  /* -------------------- stats fetch (lazy) -------------------- */
  const fetchStats = useCallback(async () => {
    if (!resolvedAthleteId) return;
    setStatsLoading(true);
    setStatsError(null);
    try {
      const res = await fetch(
        `/api/athlete/${resolvedAthleteId}/stats?range=${encodeURIComponent(
          timeRange
        )}`
      );
      if (!res.ok) throw new Error('Error fetching stats');
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      setStatsError(err?.message ?? 'Error fetching stats');
    } finally {
      setStatsLoading(false);
    }
  }, [resolvedAthleteId, timeRange]);

  /* -------------------- summary fetch -------------------- */
  useEffect(() => {
    if (!resolvedAthleteId) return;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/athlete/${resolvedAthleteId}/dash?range=${encodeURIComponent(
            timeRange
          )}`
        );
        if (!res.ok) throw new Error('Error fetching athlete dashboard data');
        if (view === 'stats') {
          fetchStats();
        }
        const data = await res.json();

        setSwingCount(data.swingCount);
        setPitchCount(data.pitchCount);

        setHitTags(data.hitTags);
        setBlastTags(data.blastTags);
        setTrackTags(data.trackTags);
        setArmTags(data.armTags);
        setForceTags(data.forceTags);
        setAssessmentTags(data.assessmentTags);

        setGoals(data.goals);

        setBlastNotes(data.blastNotes);
        setHittraxNotes(data.hittraxNotes);
        setTrackmanNotes(data.trackmanNotes);
        setProfileNotes(data.profileNotes);

        setHeight(data.height);
        setWeight(data.weight);
        setNewWeight(data.weight?.toString() ?? '');
        setErrorMessage(null);
      } catch (err: any) {
        setErrorMessage(
          err?.message ?? 'Error fetching athlete dashboard data'
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [resolvedAthleteId, timeRange, view, fetchStats]);

  const toggleView = () => {
    if (view === 'summary') {
      if (!stats && !statsLoading) fetchStats();
      setView('stats');
    } else {
      setView('summary');
    }
  };

  /* ---------------------- weight handlers --------------------- */
  const handleWeightEdit = () => {
    setIsEditingWeight(true);
    setNewWeight(weight?.toString() ?? '');
  };
  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (/^[0-9]*\.?[0-9]*$/.test(v)) setNewWeight(v);
  };
  const handleWeightSave = async () => {
    const parsed = parseFloat(newWeight);
    if (Number.isNaN(parsed)) return alert('Please enter a valid number');
    try {
      const res = await fetch(`/api/athlete/${resolvedAthleteId}/weight`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight: parsed }),
      });
      if (!res.ok) throw new Error('Error updating weight');
      const data = await res.json();
      setWeight(data.weight);
      setIsEditingWeight(false);
    } catch (err: any) {
      alert(err?.message ?? 'Error updating weight');
    }
  };
  const handleWeightCancel = () => {
    setIsEditingWeight(false);
    setNewWeight(weight?.toString() ?? '');
  };

  /* ---------------------- render guards ---------------------- */
  if (loading) return <Loader />;
  if (errorMessage) return <div className="text-red-600">{errorMessage}</div>;

  /* ---------------------- sidebar selector ------------------- */
  const SidebarComponent =
    role === 'COACH'
      ? CoachSidebar
      : role === 'ATHLETE'
        ? AthleteSidebar
        : Sidebar;

  /* =====================================================================
   * StatsView – presentational sub‑component (charts & max stats)
   * =================================================================== */
  const StatsView: React.FC<{ payload: StatsPayload }> = ({ payload }) => {
    const { blast, hittrax, trackman } = payload;

    /* ---------- BLAST ---------- */
    const sortedBlast = blast.sessionAverages
      ? [...blast.sessionAverages].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )
      : [];
    const blastLabels = sortedBlast.map((s) => s.date);
    const blastChart = {
      labels: blastLabels,
      datasets: [
        {
          label: 'Avg Bat Speed',
          data: sortedBlast.map((s) => s.avgBatSpeed),
          borderColor: 'rgba(54,162,235,0.9)',
          backgroundColor: 'rgba(54,162,235,0.1)',
          fill: true,
          tension: 0.3,
        },
        {
          label: 'Avg Hand Speed',
          data: sortedBlast.map((s) => s.avgHandSpeed),
          borderColor: 'rgba(75,192,192,0.9)',
          backgroundColor: 'rgba(75,192,192,0.1)',
          fill: true,
          tension: 0.3,
        },
      ],
    };

    /* ---------- HITTRAX ---------- */
    const hitLabels = hittrax.sessionAverages?.map((s) => s.date) ?? [];
    const hitChart = {
      labels: hitLabels,
      datasets: [
        {
          label: 'Avg Exit Velo',
          data: hittrax.sessionAverages?.map((s) => s.avgExitVelo) ?? [],
          borderColor: 'rgba(255,99,132,0.9)',
          backgroundColor: 'rgba(255,99,132,0.1)',
          fill: true,
          tension: 0.3,
        },
      ],
    };

    /* ---------- TRACKMAN ---------- */
    const pitchStats = trackman.pitchStats ?? [];
    const avgPitch = trackman.avgPitchSpeeds ?? [];
    const allDates = Array.from(new Set(avgPitch.map((i) => i.date))).sort();

    const pitchMap: Record<string, Array<number | null>> = {};
    avgPitch.forEach((i) => {
      if (!pitchMap[i.pitchType])
        pitchMap[i.pitchType] = new Array(allDates.length).fill(null);
    });
    avgPitch.forEach((i) => {
      const idx = allDates.indexOf(i.date);
      pitchMap[i.pitchType][idx] = i.avgSpeed;
    });
    const colors = [
      '#FF6384',
      '#36A2EB',
      '#FFCE56',
      '#4BC0C0',
      '#9966FF',
      '#FF9F40',
    ];
    const trackmanDatasets = Object.entries(pitchMap).map(
      ([pitch, series], i) => ({
        label: pitch,
        data: series,
        borderColor: colors[i % colors.length],
        backgroundColor: `${colors[i % colors.length]}33`,
        fill: true,
        tension: 0.3,
      })
    );
    const trackmanChart = { labels: allDates, datasets: trackmanDatasets };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' as const },
        tooltip: {},
      },
      elements: { line: { borderWidth: 2 }, point: { radius: 2 } },
      scales: { x: { grid: { display: false } } },
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* BLAST */}
        <div className="bg-white rounded shadow p-4 flex flex-col border-2 border-gray-300">
          <h2 className="text-lg font-semibold mb-2">Blast Motion</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <StatBubble
              label="Max Bat Speed"
              value={blast.maxBatSpeed ?? 0}
              unit="mph"
              color="blue"
            />
            <StatBubble
              label="Max Hand Speed"
              value={blast.maxHandSpeed ?? 0}
              unit="mph"
              color="green"
            />
          </div>
          <ChartBox>
            {blastChart.labels.length ? (
              <Line data={blastChart} options={chartOptions} />
            ) : (
              // <NoData message="No Blast Motion Data." />
              <p>No Blast Motion Data</p>
            )}
          </ChartBox>
        </div>

        {/* HITTRAX */}
        <div className="bg-white rounded shadow p-4 flex flex-col border-2 border-gray-300">
          <h2 className="text-lg font-semibold mb-2">HitTrax</h2>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <StatBubble
              label="Max Exit Velo"
              value={hittrax.maxExitVelo ?? 0}
              unit="mph"
              color="blue"
              small
            />
            <StatBubble
              label="Max Distance"
              value={hittrax.maxDistance ?? 0}
              unit="ft"
              color="green"
              small
            />
            <StatBubble
              label="Hard‑Hit %"
              value={hittrax.hardHitAverage ? hittrax.hardHitAverage * 100 : 0}
              unit="%"
              color="red"
              small
            />
          </div>
          <ChartBox>
            {hitChart.labels.length ? (
              <Line data={hitChart} options={chartOptions} />
            ) : (
              // <NoData message="No HitTrax Data." />
              <p>No Hittrax Data</p>
            )}
          </ChartBox>
        </div>

        {/* TRACKMAN */}
        <div className="bg-white rounded shadow p-4 flex flex-col md:col-span-2 xl:col-span-1 border-2 border-gray-300">
          <h2 className="text-lg font-semibold mb-2">Trackman</h2>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {pitchStats.map((stat) => (
              <StatBubble
                key={stat.pitchType}
                label={`${stat.pitchType} Peak`}
                value={stat.peakSpeed}
                unit="mph"
                color="blue"
                small
              />
            ))}
          </div>
          <ChartBox>
            {trackmanChart.labels.length ? (
              <Line data={trackmanChart} options={chartOptions} />
            ) : (
              // <NoData message="No Trackman Data." />
              <p>No Trackman Data</p>
            )}
          </ChartBox>
        </div>
      </div>
    );
  };

  /* ------------ tiny UI helpers for StatsView ------------ */
  const StatBubble: React.FC<{
    label: string;
    value: number;
    unit: string;
    color: 'blue' | 'green' | 'red';
    small?: boolean;
  }> = ({ label, value, unit, color, small }) => (
    <div className="flex flex-col items-center bg-gray-50 p-2 rounded shadow border-2 border-gray-200">
      <span className="text-sm text-gray-600 font-medium">{label}</span>
      <div
        className={`mt-2 relative rounded-full ${
          small ? 'w-16 h-16' : 'w-20 h-20'
        } border-4 border-${color}-200 flex items-center justify-center`}
      >
        <span
          className={`${
            small ? 'text-lg' : 'text-xl'
          } font-bold text-${color}-600`}
        >
          {Number.isFinite(value) ? value.toFixed(1) : '0'}
        </span>
      </div>
      <p className={`mt-1 text-xs text-${color}-600 font-medium`}>{unit}</p>
    </div>
  );

  const ChartBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="relative w-full h-60 sm:h-64 md:h-72">{children}</div>
  );

  /* ===================================================================== */

  return (
    <div className="flex min-h-screen bg-gray-100 overflow-y-auto">
      {/* Sidebar */}
      <div className="md:hidden bg-gray-100">
        <SidebarComponent />
      </div>
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        <SidebarComponent />
      </div>

      {/* Main */}
      <div className="flex-1 p-4 pb-24 text-gray-800">
        {/* Top nav / toggle */}
        <div className="flex flex-wrap justify-between items-end mb-6 gap-4">
          <h1 className="text-3xl font-bold text-center flex-1">
            {view === 'summary' ? 'My Stats' : 'My Progress Over Time'}
          </h1>

          <button
            onClick={toggleView}
            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 transition self-start"
          >
            {view === 'summary' ? 'See Progress' : 'Back to Summary'}
          </button>
        </div>

        {/* Time‑range selector (shared) */}
        <div className="mb-6">
          <label className="block mb-2 text-lg font-semibold">
            Select Time Range
          </label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="p-2 rounded border-2 border-gray-300"
          >
            {timeRanges.map((tr) => (
              <option key={tr} value={tr}>
                {tr}
              </option>
            ))}
          </select>
        </div>

        {/* ---------------------------------------------------- */}
        {/* SUMMARY VIEW                                        */}
        {/* ---------------------------------------------------- */}
        {view === 'summary' && (
          <>
            {/* Height / weight / counts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <SimpleCard title="Height" value={height} />
              <WeightCard />
              <SimpleCard title="Swing Count" value={swingCount} />
              <SimpleCard title="Pitch Count" value={pitchCount} />
            </div>

            {/* Tags */}
            <TagsSection />

            {/* Goals */}
            <GoalsSection />

            {/* Notes */}
            <NotesSection />
          </>
        )}

        {/* ---------------------------------------------------- */}
        {/* STATS VIEW                                          */}
        {/* ---------------------------------------------------- */}
        {view === 'stats' && (
          <>
            {/* {statsLoading && <Loader />} */}
            {statsError && (
              <div className="text-red-600 mb-4">{statsError}</div>
            )}
            {stats && (
              <Suspense fallback={<Loader />}>
                <StatsView payload={stats} />
              </Suspense>
            )}
          </>
        )}
      </div>
    </div>
  );

  /* ---------- small sub‑components (summary view) ---------- */
  function SimpleCard({ title, value }: { title: string; value: any }) {
    if (title === 'Height') {
      const handleHeightSave = async (formattedHeight: string) => {
        try {
          const res = await fetch(`/api/athlete/${resolvedAthleteId}/height`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ height: formattedHeight }),
          });
          if (!res.ok) throw new Error('Error updating height');
          const data = await res.json();
          setHeight(data.height);
          setIsEditingHeight(false);
        } catch (error: any) {
          alert(error?.message ?? 'Error updating height');
        }
      };

      return (
        <HeightCard
          value={value}
          isEditing={isEditingHeight}
          onEdit={() => setIsEditingHeight(true)}
          onSave={handleHeightSave}
          onCancel={() => setIsEditingHeight(false)}
        />
      );
    }

    return (
      <div className="bg-white rounded-lg shadow p-6 border-2 border-gray-300">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <p className="text-4xl font-semibold text-center">{value}</p>
      </div>
    );
  }

  function WeightCard() {
    return (
      <div className="bg-white rounded-lg shadow p-6 border-2 border-gray-300">
        <h2 className="text-xl font-bold mb-4">Weight&nbsp;(lbs)</h2>
        {isEditingWeight ? (
          <div className="flex items-center space-x-2 justify-center">
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*"
              value={newWeight}
              onChange={handleWeightChange}
              className="border p-2 rounded w-24 text-center"
            />
            <button
              onClick={handleWeightSave}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              Save
            </button>
            <button
              onClick={handleWeightCancel}
              className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <p
              className="text-4xl font-semibold cursor-pointer hover:text-blue-600"
              onClick={() =>
                router.push(`/athlete/${resolvedAthleteId}/weight`)
              }
            >
              {weight}
            </p>
            <button
              onClick={handleWeightEdit}
              className="px-3 py-1 text-sm bg-gray-800 text-white rounded hover:bg-gray-900 transition"
            >
              Edit
            </button>
          </div>
        )}
      </div>
    );
  }

  function TagsSection() {
    return (
      <>
        <h2 className="text-2xl font-bold mb-4">Tags</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[
            { title: 'Hit Tags', tags: hitTags, path: 'hittrax' },
            { title: 'Blast Tags', tags: blastTags, path: 'blast' },
            { title: 'Track Tags', tags: trackTags, path: 'trackman' },
            { title: 'Arm Tags', tags: armTags, path: 'armcare' },
            { title: 'Force Tags', tags: forceTags, path: 'forceplates' },
            {
              title: 'Assessment Tags',
              tags: assessmentTags,
              path: 'assessment',
            },
          ].map(({ title, tags, path }) => (
            <div
              key={title}
              className="bg-white rounded-lg shadow p-4 border-2 border-gray-300"
            >
              <h3 className="font-semibold mb-2 text-center">{title}</h3>
              <ul>
                {tags.filter(Boolean).map((tag) => (
                  <li
                    key={tag._id.toString()}
                    className="py-1 border-b last:border-0 text-white bg-gray-700 hover:bg-gray-600 rounded-md cursor-pointer flex justify-center"
                    onClick={() =>
                      router.push(
                        `/athlete/${resolvedAthleteId}/tags/${path}/${tag._id}`
                      )
                    }
                  >
                    {tag.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </>
    );
  }

  function GoalsSection() {
    return (
      <>
        <h2 className="text-2xl font-bold mb-4">Goals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {goals.map((goal) => (
            <div
              key={goal._id.toString()}
              className="bg-white rounded-lg shadow p-6 border-2 border-gray-300 cursor-pointer hover:shadow-md transition"
              onClick={() =>
                router.push(`/athlete/${resolvedAthleteId}/goals/${goal._id}`)
              }
            >
              <h3 className="text-lg font-semibold mb-2 text-center">
                {goal.goalName}
              </h3>
              <p className="text-gray-700 text-center">{goal.tech}</p>
            </div>
          ))}
        </div>
      </>
    );
  }

  function NotesSection() {
    const noteTabs = [
      { key: 'blast', title: 'Blast', notes: blastNotes },
      { key: 'hittrax', title: 'HitTrax', notes: hittraxNotes },
      { key: 'trackman', title: 'Trackman', notes: trackmanNotes },
      { key: 'profile', title: 'Profile', notes: profileNotes },
    ] as const;

    return (
      <div className="rounded-lg ring-2 ring-offset-2 p-6 ring-offset-white ring-gray-300 bg-white">
        <h2 className="text-2xl font-bold mb-6">Coaches Notes</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {noteTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-4 py-2 rounded-md font-semibold transition-colors duration-150 ${
                activeTab === tab.key
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-300 text-gray-800 hover:bg-gray-400'
              }`}
            >
              {tab.title}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto border border-gray-300 rounded-md">
          {noteTabs.map((tab) => {
            if (tab.key !== activeTab) return null;
            if (!tab.notes.length)
              return (
                <p key={tab.key} className="p-4 text-gray-600 italic">
                  No notes for {tab.title}.
                </p>
              );
            return (
              <table
                key={tab.key}
                className="min-w-full divide-y divide-gray-300 bg-white"
              >
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left whitespace-nowrap">
                      Date
                    </th>
                    <th className="px-4 py-2 text-left whitespace-nowrap">
                      Coach
                    </th>
                    <th className="px-4 py-2 text-left">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tab.notes.map((n) => (
                    <tr key={n._id?.toString()}>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {formatDate(n.date.toString())}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {n.coachName}
                      </td>
                      <td className="px-4 py-2">{n.coachNote}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })}
        </div>
      </div>
    );
  }
};

export default AthleteDashboard;
