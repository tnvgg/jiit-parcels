'use client'
import { ReactNode } from 'react';
import { useProfileGuard } from '@/hooks/useProfileGuard';

export function ProfileGuard({ children }: { children: ReactNode }) {
  const { profile, loading, error } = useProfileGuard();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-500 mb-2">Connection Error</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-blue-600 px-4 py-2 rounded">Retry</button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}