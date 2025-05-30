// src/pages/profile.js
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Container, Form, Button, Alert, Spinner } from 'react-bootstrap';

export default function ProfilePage() {
  const [form, setForm] = useState({
    gebruikersnaam: '',
    woonplaats: '',
    leeftijd: '',
    profile_pic: '',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        setError('Niet ingelogd.');
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        setError('Kon gebruikersgegevens niet ophalen.');
      } else {
        setForm({
          gebruikersnaam: data.gebruikersnaam || '',
          woonplaats: data.woonplaats || '',
          leeftijd: data.leeftijd || '',
          profile_pic: data.profile_pic || '',
        });
      }

      setLoading(false);
    };

    fetchUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setPhotoFile(files[0]);
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      setError('Geen actieve sessie.');
      return;
    }

    let profilePicURL = form.profile_pic;

    if (photoFile) {
      const path = `profilePics/${user.id}/${Date.now()}-${photoFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, photoFile, { upsert: true });

      if (uploadError) {
        setError('Upload mislukt: ' + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      profilePicURL = urlData.publicUrl;
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({
        gebruikersnaam: form.gebruikersnaam,
        woonplaats: form.woonplaats,
        leeftijd: form.leeftijd,
        profile_pic: profilePicURL,
      })
      .eq('id', user.id);

    if (updateError) {
      setError('Update mislukt: ' + updateError.message);
    } else {
      setSuccess('Profiel bijgewerkt.');
      setForm((prev) => ({ ...prev, profile_pic: profilePicURL }));
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" />
        <p>Gegevens worden geladen…</p>
      </Container>
    );
  }

  return (
    <Container className="mt-5" style={{ maxWidth: 500 }}>
      <h2>Profiel</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Form onSubmit={handleUpdate}>
        <Form.Group className="mt-3">
          <Form.Label>Gebruikersnaam</Form.Label>
          <Form.Control
            name="gebruikersnaam"
            value={form.gebruikersnaam}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mt-3">
          <Form.Label>Woonplaats</Form.Label>
          <Form.Control
            name="woonplaats"
            value={form.woonplaats}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mt-3">
          <Form.Label>Leeftijd</Form.Label>
          <Form.Control
            name="leeftijd"
            type="number"
            value={form.leeftijd}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mt-3">
          <Form.Label>Profielfoto</Form.Label>
          {form.profile_pic && (
            <div className="mb-2">
              <img
                src={form.profile_pic}
                alt="Profiel"
                style={{ width: 80, height: 80, borderRadius: '50%' }}
              />
            </div>
          )}
          <Form.Control type="file" name="profile_pic" onChange={handleChange} />
        </Form.Group>

        <Button type="submit" className="mt-4" variant="primary" disabled={loading}>
          {loading ? 'Bijwerken…' : 'Profiel bijwerken'}
        </Button>
      </Form>
    </Container>
  );
}
