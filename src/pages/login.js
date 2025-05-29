// src/pages/login.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Container, Form, Button, Alert } from 'react-bootstrap';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      router.push('/feed');
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.push('/feed');
    });
  }, [router]);

  return (
    <Container className="mt-5" style={{ maxWidth: '400px' }}>
      <h2 className="text-center mb-4">Login</h2>

      {error && (
        <>
          <Alert variant="danger">{error}</Alert>
          <div className="text-center mb-4">
            <Link href="/" passHref>
              <Button variant="outline-secondary">Terug naar homepage</Button>
            </Link>
          </div>
        </>
      )}

      <Form onSubmit={handleLogin}>
        <Form.Group controlId="email">
          <Form.Label>Emailadres</Form.Label>
          <Form.Control
            type="email"
            placeholder="Voer je email in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group controlId="password" className="mt-3">
          <Form.Label>Wachtwoord</Form.Label>
          <Form.Control
            type="password"
            placeholder="Wachtwoord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Form.Group>

        <Button variant="primary" type="submit" className="mt-4 w-100">
          Log in
        </Button>
      </Form>
    </Container>
  );
}
