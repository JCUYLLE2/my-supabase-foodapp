// src/pages/register.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';
import { Form, Button, Container, Alert, Spinner } from 'react-bootstrap';
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
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 1️⃣ Signup
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Haal userId direct uit signUpData
    const userId = signUpData.user?.id;
    if (!userId) {
      setError('Kon user ID niet ophalen na registratie.');
      setLoading(false);
      return;
    }

    // 2️⃣ Upload profielfoto (optioneel)
    let profilePicURL = '';
    if (form.profilePic) {
      const uniqueName = `${Date.now()}-${form.profilePic.name}`;
      const path = `avatars/${userId}/${uniqueName}`;
      const { error: uploadError } = await supabase
        .storage
        .from('avatars')
        .upload(path, form.profilePic, { cacheControl: '3600', upsert: true });
      if (uploadError) {
        setError('Afbeelding upload mislukt: ' + uploadError.message);
        setLoading(false);
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      profilePicURL = publicUrl;
    }

    // 3️⃣ Insert in users-tabel
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: userId,
        gebruikersnaam: form.gebruikersnaam,
        woonplaats: form.woonplaats,
        leeftijd: form.leeftijd,
        profile_pic: profilePicURL,
      });
    if (insertError) {
      setError('Opslaan in database mislukt: ' + insertError.message);
      setLoading(false);
      return;
    }

    // 4️⃣ Automatische login
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    if (loginError) {
      setError('Automatische login mislukt: ' + loginError.message);
      setLoading(false);
      return;
    }

    // 🚀 Doorsturen naar feed
    router.push('/feed');
  };

  return (
    <Container className="mt-5" style={{ maxWidth: '500px' }}>
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
          <div className="mb-2">
            {!form.profilePic ? (
              <FaUserCircle size={80} />
            ) : (
              <img
                src={URL.createObjectURL(form.profilePic)}
                alt="Voorbeeld"
                style={{ width: 80, height: 80, borderRadius: '50%' }}
              />
            )}
          </div>
          <Form.Control
            name="profilePic"
            type="file"
            accept="image/*"
            onChange={handleChange}
          />
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

        <Button
          type="submit"
          variant="primary"
          className="mt-4 w-100"
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              /> Even geduld…
            </>
          ) : (
            'Register'
          )}
        </Button>
      </Form>
    </Container>
  );
}
