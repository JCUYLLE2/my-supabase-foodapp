import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/router';
import { Container, Form, Button, Alert } from 'react-bootstrap';

export default function PostPage() {
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
      setError('You must be logged in to post.');
      return;
    }

    let photoURL = '';
    if (photo) {
      const path = `dishPhotos/${user.id}/${photo.name}`;
      const { error: uploadError } = await supabase.storage.from('images').upload(path, photo);
      if (!uploadError) {
        const { data: publicData } = supabase.storage.from('images').getPublicUrl(path);
        photoURL = publicData.publicUrl;
      }
    }

    const { data: userData } = await supabase.from('users').select('gebruikersnaam').eq('id', user.id).single();

    const { error: insertError } = await supabase.from('posts').insert({
      dishName,
      description,
      recipeLink: isOwnRecipe ? '' : recipeLink,
      isOwnRecipe,
      photoURL,
      userName: userData?.gebruikersnaam || user.email,
      userEmail: user.email,
      createdAt: new Date(),
    });

    if (insertError) {
      setError('Failed to create post. Please try again.');
    } else {
      setSuccess('Post created successfully!');
      setTimeout(() => router.push('/feed'), 2000);
    }
  };

  return (
    <Container className="mt-5">
      <h2>Create a New Post</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="dishName">
          <Form.Label>Dish Name</Form.Label>
          <Form.Control
            type="text"
            value={dishName}
            onChange={(e) => setDishName(e.target.value)}
            required
          />
        </Form.Group>
        <Form.Group controlId="description" className="mt-3">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </Form.Group>
        <Form.Group controlId="photo" className="mt-3">
          <Form.Label>Upload File</Form.Label>
          <Form.Control type="file" onChange={(e) => setPhoto(e.target.files[0])} />
        </Form.Group>
        <Form.Group controlId="isOwnRecipe" className="mt-3">
          <Form.Check
            type="checkbox"
            label="This is my own recipe"
            checked={isOwnRecipe}
            onChange={(e) => setIsOwnRecipe(e.target.checked)}
          />
        </Form.Group>
        {!isOwnRecipe && (
          <Form.Group controlId="recipeLink" className="mt-3">
            <Form.Label>Recipe Link</Form.Label>
            <Form.Control
              type="url"
              value={recipeLink}
              onChange={(e) => setRecipeLink(e.target.value)}
              required
            />
          </Form.Group>
        )}
        <Button variant="primary" type="submit" className="mt-4">
          Create Post
        </Button>
      </Form>
    </Container>
  );
}
