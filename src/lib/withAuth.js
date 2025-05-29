// lib/withAuth.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';

export default function withAuth(Component) {
  return function ProtectedComponent(props) {
    const router = useRouter();

    useEffect(() => {
      supabase.auth.getSession().then(({ data }) => {
        if (!data.session) {
          router.push('/login');
        }
      });
    }, [router]);

    return <Component {...props} />;
  };
}
