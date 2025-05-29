import 'bootstrap/dist/css/bootstrap.min.css';
import '@/components/Navbar.css'; // <- voeg dit toe
import '@/components/Topbar.css'; // <- voeg dit toe
import Layout from '@/components/Layout';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <Layout user={user}>
      <Component {...pageProps} user={user} />
    </Layout>
  );
}
