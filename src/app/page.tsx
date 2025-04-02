'use client';
import AthleteDashboard from '@/components/AthleteDash/AthleteDashboard';
import Dashboard from '@/components/Dash/DashBoard';
import { useUser } from '@clerk/nextjs';

export default function Home() {
  const { user, isLoaded } = useUser(); // assuming isLoaded is provided by your auth hook
  if (!isLoaded) return <div>Loading...</div>;

  const role = user?.publicMetadata?.role;
  return (
    <div className="h-screen w-screen flex flex-col">
      {role === 'ATHLETE' ? <AthleteDashboard /> : <Dashboard />}
    </div>
  );
}
