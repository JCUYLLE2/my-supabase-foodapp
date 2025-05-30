import { useEffect, useState } from 'react';
import { Container, Card, Button, Spinner, Row, Col } from 'react-bootstrap';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/router';

export default function MyPostsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
      } else {
        setUserId(session.user.id);
      }
    };

    fetchSession();
  }, [router]);

  useEffect(() => {
    if (!userId) return;

    const fetchMyPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('id, dishname, description, image_url, recipe_link, created_at, likes(user_id)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fout bij ophalen:', error.message);
        setPosts([]);
      } else {
        setPosts(data);
      }

      setLoading(false);
    };

    fetchMyPosts();
  }, [userId]);

  const toggleLike = async (postId, likedByUser) => {
    if (!userId) return;

    if (likedByUser) {
      await supabase.from('likes').delete().match({ post_id: postId, user_id: userId });
    } else {
      await supabase.from('likes').insert([{ post_id: postId, user_id: userId }]);
    }

    const { data } = await supabase
      .from('posts')
      .select('id, dishname, description, image_url, recipe_link, created_at, likes(user_id)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    setPosts(data || []);
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" />
        <p>Bezig met laden van jouw posts…</p>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Mijn Gerechten</h2>
      {posts.length === 0 ? (
        <p>😕 Je hebt nog geen posts geplaatst.</p>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {posts.map((post) => {
            const hasLiked = post.likes?.some((like) => like.user_id === userId);

            return (
              <Col key={post.id}>
                <Card>
                  {post.image_url && <Card.Img variant="top" src={post.image_url} />}
                  <Card.Body>
                    <Card.Title
                      style={{ cursor: 'pointer', color: '#007bff', textDecoration: 'underline' }}
                      onClick={() => router.push(`/post/${post.id}`)}
                    >
                      {post.dishname}
                    </Card.Title>
                    <Card.Text>{post.description}</Card.Text>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => toggleLike(post.id, hasLiked)}
                      style={{ textDecoration: 'none', color: hasLiked ? 'red' : '#888' }}
                    >
                      {hasLiked ? '❤️' : '🤍'} {post.likes?.length || 0}
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </Container>
  );
}
