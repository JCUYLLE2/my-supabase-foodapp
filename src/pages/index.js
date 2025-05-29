// src/pages/index.js
import { useRouter } from 'next/router';
import { Button, Container } from 'react-bootstrap';
import Image from 'next/image';

export default function HomePage() {
  const router = useRouter();

  return (
    <Container className="mt-5 text-center">
      <Image src="/logo.png" alt="Food App Logo" width={150} height={150} />

      <h1>Welcome to the Food App</h1>
      <p>Discover and share your favorite dishes!</p>

      <div className="mt-4">
        <Button variant="primary" onClick={() => router.push('/login')} className="me-3">
          Login
        </Button>
        <Button variant="success" onClick={() => router.push('/register')}>
          Register
        </Button>
      </div>
    </Container>
  );
}
