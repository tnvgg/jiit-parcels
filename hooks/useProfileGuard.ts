import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

export function useProfileGuard() {
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true); // Starts true
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  useEffect(() => {
    let isMounted = true;
    console.log("ProfileGuard: Starting check...");

    // 1. SAFETY TIMER: Force stop loading after 5 seconds no matter what
    const safetyTimer = setTimeout(() => {
      if (isMounted && loading) {
        console.warn("ProfileGuard: Hit safety timeout!");
        setLoading(false); 
        // We don't set an error here, we just let the page render. 
        // If data is missing, the page will handle it.
      }
    }, 5000);

    const fetchProfile = async () => {
      try {
        // 2. Check Session
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.log("ProfileGuard: No user found, redirecting...");
          if (isMounted) router.push('/login');
          return;
        }

        // 3. Get Profile
        let { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        // 4. Self-Healing (Create if missing)
        if (!profileData) {
          console.log("ProfileGuard: Profile missing, creating now...");
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              name: user.email?.split('@')[0] || 'User',
              role: 'user',
              phone: '',
              hostel: 'H3'
            })
            .select()
            .single();
            
          if (createError) {
             console.error("ProfileGuard: Creation failed", createError);
             // Don't throw, just continue so page doesn't crash
          } else {
             profileData = newProfile;
          }
        }

        if (isMounted) {
          setProfile(profileData);
          setLoading(false); // Success!
        }

      } catch (err: any) {
        console.error('ProfileGuard Error:', err);
        if (isMounted) {
           setError(err.message);
           setLoading(false); // Stop spinning on error
        }
      } finally {
        clearTimeout(safetyTimer);
      }
    };

    fetchProfile();

    return () => { isMounted = false; clearTimeout(safetyTimer); };
  }, [router, supabase]);

  return { profile, loading, error };
}