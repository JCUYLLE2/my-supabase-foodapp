import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';
import { Form, Button, Container, Alert } from 'react-bootstrap';
import { FaUserCircle } from 'react-icons/fa';

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    gebruikersnaam: '',
    woonplaats: '',
    leeftijd: '',
    profilePic: null,
  });
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // Haal zeker de ingelogde user op
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setError("Kon user info niet ophalen.");
      return;
    }

    const userId = userData.user.id;
    let profilePicURL = '';

    if (form.profilePic) {
      const filePath = `profilePics/${userId}/${form.profilePic.name}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, form.profilePic);

      if (!uploadError) {
        const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(filePath);
        profilePicURL = publicUrl.publicUrl;
      }
    }

    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: userId,
        gebruikersnaam: form.gebruikersnaam,
        woonplaats: form.woonplaats,
        leeftijd: form.leeftijd,
        profilePic: profilePicURL,
      });

    if (insertError) {
      setError('Fout bij opslaan in database: ' + insertError.message);
      return;
    }

    router.push('/feed');
  };

  return (
    <Container className="mt-5">
      <h2>Register</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleRegister}>
        <Form.Group controlId="gebruikersnaam">
          <Form.Label>Gebruikersnaam</Form.Label>
          <Form.Control
            name="gebruikersnaam"
            value={form.gebruikersnaam}
            onChange={handleChange}
            required
          />
        </Form.Group>
        <Form.Group controlId="woonplaats" className="mt-3">
          <Form.Label>Woonplaats</Form.Label>
          <Form.Control
            name="woonplaats"
            value={form.woonplaats}
            onChange={handleChange}
            required
          />
        </Form.Group>
        <Form.Group controlId="leeftijd" className="mt-3">
          <Form.Label>Leeftijd</Form.Label>
          <Form.Control
            name="leeftijd"
            type="number"
            value={form.leeftijd}
            onChange={handleChange}
            required
          />
        </Form.Group>
        <Form.Group controlId="profilePic" className="mt-3">
          <Form.Label>Profielfoto</Form.Label>
          <div>
            {!form.profilePic && <FaUserCircle size={100} />}
            <Form.Control
              name="profilePic"
              type="file"
              onChange={handleChange}
              accept="image/*"
            />
          </div>
        </Form.Group>
        <Form.Group controlId="email" className="mt-3">
          <Form.Label>Email</Form.Label>
          <Form.Control
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </Form.Group>
        <Form.Group controlId="password" className="mt-3">
          <Form.Label>Wachtwoord</Form.Label>
          <Form.Control
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </Form.Group>
        <Button type="submit" variant="primary" className="mt-4 w-100">
          Register
        </Button>
      </Form>
    </Container>
  );
}
