import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import { FaUserCircle } from 'react-icons/fa';

export default function ProfilePage() {
  const [form, setForm] = useState({
    gebruikersnaam: '',
    woonplaats: '',
    leeftijd: '',
  });
  const [profilePic, setProfilePic] = useState('');
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        setError('Not logged in.');
        return;
      }

      const { data, error } = await supabase.from('users').select().eq('id', user.id).single();
      if (!error && data) {
        setForm({
          gebruikersnaam: data.gebruikersnaam || '',
          woonplaats: data.woonplaats || '',
          leeftijd: data.leeftijd || '',
        });
        setProfilePic(data.profilePic || '');
      }
    };

    loadUser();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setProfilePicFile(files[0]);
      setProfilePic(URL.createObjectURL(files[0]));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return;

    let profilePicUrl = profilePic;

    if (profilePicFile) {
      const filePath = `profilePics/${user.id}`;
      await supabase.storage.from('avatars').upload(filePath, profilePicFile, { upsert: true });
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      profilePicUrl = data.publicUrl;
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ ...form, profilePic: profilePicUrl, updatedAt: new Date() })
      .eq('id', user.id);

    if (updateError) {
      setError('Failed to update profile.');
    } else {
      setSuccess('Profile updated successfully!');
    }
  };

  return (
    <Container className="mt-5">
      <h2>Profile</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      <Form onSubmit={handleUpdate}>
        <Form.Group>
          <Form.Label>Gebruikersnaam</Form.Label>
          <Form.Control name="gebruikersnaam" value={form.gebruikersnaam} onChange={handleChange} required />
        </Form.Group>
        <Form.Group className="mt-3">
          <Form.Label>Woonplaats</Form.Label>
          <Form.Control name="woonplaats" value={form.woonplaats} onChange={handleChange} required />
        </Form.Group>
        <Form.Group className="mt-3">
          <Form.Label>Leeftijd</Form.Label>
          <Form.Control name="leeftijd" type="number" value={form.leeftijd} onChange={handleChange} required />
        </Form.Group>
        <Form.Group className="mt-3">
          <Form.Label>Profielfoto</Form.Label>
          <div>
            {profilePic ? (
              <img src={profilePic} alt="Profile" style={{ width: 100, height: 100, borderRadius: '50%' }} />
            ) : (
              <FaUserCircle size={100} />
            )}
            <Form.Control name="profilePic" type="file" onChange={handleChange} accept="image/*" />
          </div>
        </Form.Group>
        <Button variant="primary" type="submit" className="mt-4">
          Update Profile
        </Button>
      </Form>
    </Container>
  );
}
