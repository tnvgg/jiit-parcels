import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

export function useProfileGuard() {
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/login');
          return;
        }

        let { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!profileData) {
          console.log("Profile missing, creating on the fly...");
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
            
          if (createError) throw createError;
          profileData = newProfile;
        }

        setProfile(profileData);
      } catch (err: any) {
        console.error('Profile Guard Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router, supabase]);

  return { profile, loading, error };
}