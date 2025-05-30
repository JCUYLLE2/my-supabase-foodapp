import { useEffect, useState } from 'react';
import { Container, Card, Button, Spinner, Row, Col } from 'react-bootstrap';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
      } else {
        setSessionChecked(true);
      }
    };

    checkSession();
  }, [router]);

  useEffect(() => {
    if (!sessionChecked) return;

    const fetchPosts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          users (
            gebruikersnaam,
            profile_pic
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fout bij ophalen van posts:', error.message);
        setPosts([]);
      } else {
        setPosts(data);
      }
      setLoading(false);
    };

    fetchPosts();
  }, [sessionChecked]);

  if (!sessionChecked) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p>Sessie wordt gecontroleerd…</p>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Feed</h2>

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p>Gerechten aan het laden…</p>
        </div>
      ) : posts.length === 0 ? (
        <p>😕 Geen posts gevonden.</p>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {posts.map((post) => (
            <Col key={post.id}>
              <Card>
                {post.image_url && (
                  <Card.Img variant="top" src={post.image_url} alt={post.dishname} />
                )}
                <Card.Body>
                  <Card.Title>{post.dishname}</Card.Title>
                  <Card.Text>{post.description}</Card.Text>

                  {post.recipe_link && (
                    <Button
                      variant="primary"
                      href={post.recipe_link}
                      target="_blank"
                      className="mb-2"
                    >
                      Bekijk recept
                    </Button>
                  )}

                  <div className="d-flex align-items-center mt-3">
                    {post.users?.profile_pic ? (
                      <img
                        src={post.users.profile_pic}
                        alt="Profielfoto"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          marginRight: 10,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: '#ccc',
                          marginRight: 10,
                        }}
                      />
                    )}
                    <small className="text-muted">
                      Geplaatst door {post.users?.gebruikersnaam || 'Onbekend'}
                    </small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
}
