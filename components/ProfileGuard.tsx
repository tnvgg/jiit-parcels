'use client'
import { ReactNode } from 'react';
import { useProfileGuard } from '@/hooks/useProfileGuard';

export function ProfileGuard({ children }: { children: ReactNode }) {
  const { profile, loading, error } = useProfileGuard();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-500 text-sm">Loading your profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center bg-neutral-900 p-8 rounded-xl border border-red-900/50">
          <h2 className="text-xl font-bold text-red-500 mb-2">Connection Issue</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg transition"
            >
              Reload Page
            </button>
            <button 
              onClick={() => window.location.href = '/'} 
              className="bg-neutral-800 hover:bg-neutral-700 text-gray-300 px-6 py-2 rounded-lg transition"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}