import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/router';
import { Container, Form, Button, Alert } from 'react-bootstrap';

export default function CreatePostPage() {
  const [dishName, setDishName] = useState('');
  const [description, setDescription] = useState('');
  const [recipeLink, setRecipeLink] = useState('');
  const [isOwnRecipe, setIsOwnRecipe] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      setError('Je moet ingelogd zijn om een post te maken.');
      return;
    }

    let photoURL = '';
    if (photo) {
      const uniqueFileName = `${Date.now()}-${photo.name}`;
      const path = `postImages/${user.id}/${uniqueFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(path, photo, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setError('Afbeelding upload mislukt: ' + uploadError.message);
        return;
      }

      const { data: publicData } = supabase.storage.from('images').getPublicUrl(path);
      photoURL = publicData?.publicUrl || '';
      console.log('✅ Upload gelukt:', photoURL);
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('gebruikersnaam')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('User data error:', userError);
      setError('Kon gebruikersgegevens niet ophalen.');
      return;
    }

    const { error: insertError } = await supabase
      .from('posts')
      .insert({
        dishname: dishName,
        description,
        recipe_link: isOwnRecipe ? null : recipeLink,
        isownrecipe: isOwnRecipe,
        image_url: photoURL,
        user_id: user.id,
        created_at: new Date(),
        likes: 0,
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      setError('Maken van post mislukt: ' + insertError.message);
    } else {
      setSuccess('Post succesvol aangemaakt!');
      setTimeout(() => router.push('/feed'), 2000);
    }
  };

  return (
    <Container className="mt-5">
      <h2>Nieuw gerecht toevoegen</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="dishName" className="mt-3">
          <Form.Label>Naam van gerecht</Form.Label>
          <Form.Control
            type="text"
            value={dishName}
            onChange={(e) => setDishName(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group controlId="description" className="mt-3">
          <Form.Label>Beschrijving</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group controlId="photo" className="mt-3">
          <Form.Label>Afbeelding uploaden</Form.Label>
          <Form.Control
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files[0])}
          />
        </Form.Group>

        <Form.Group controlId="isOwnRecipe" className="mt-3">
          <Form.Check
            type="checkbox"
            label="Dit is mijn eigen recept"
            checked={isOwnRecipe}
            onChange={(e) => setIsOwnRecipe(e.target.checked)}
          />
        </Form.Group>

        {!isOwnRecipe && (
          <Form.Group controlId="recipeLink" className="mt-3">
            <Form.Label>Link naar recept</Form.Label>
            <Form.Control
              type="url"
              value={recipeLink}
              onChange={(e) => setRecipeLink(e.target.value)}
              placeholder="https://voorbeeldrecept.com"
              required
            />
          </Form.Group>
        )}

        <Button variant="primary" type="submit" className="mt-4">
          Gerecht toevoegen
        </Button>
      </Form>
    </Container>
  );
}
