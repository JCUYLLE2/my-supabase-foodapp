import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';
import { Container, Button } from 'react-bootstrap';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      await supabase.auth.signOut();
      //setTimeout(() => router.push('/'), 3000);
    };
    logout();
  }, [router]);

  return (
    <Container className="mt-5 text-center">
      <h2>Logout</h2>
      <p>You have been logged out.</p>
      <Button variant="primary" onClick={() => router.push('/login')}>
        Go to Login
      </Button>
    </Container>
  );
}
