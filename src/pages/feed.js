import { useEffect, useState } from 'react';
import { Container, Card, Button, Spinner, Row, Col, Form } from 'react-bootstrap';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
      } else {
        setCurrentUserId(session.user.id);
        setSessionChecked(true);
      }
    };

    checkSession();
  }, [router]);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        dishname,
        description,
        image_url,
        recipe_link,
        created_at,
        user_id,
        users (
          gebruikersnaam,
          profile_pic
        ),
        likes (
          user_id
        )
      `)
      .order('created_at', { ascending: sortOrder === 'asc' });

    if (error) {
      console.error('Fout bij ophalen van posts:', error.message);
      setPosts([]);
    } else {
      setPosts(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (sessionChecked) {
      fetchPosts();
    }
  }, [sessionChecked, sortOrder]);

  const toggleLike = async (postId, likedByUser) => {
    if (!currentUserId) return;

    if (likedByUser) {
      await supabase
        .from('likes')
        .delete()
        .match({ post_id: postId, user_id: currentUserId });
    } else {
      await supabase.from('likes').insert([{ post_id: postId, user_id: currentUserId }]);
    }

    fetchPosts();
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.dishname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.description?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

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

      <Form className="mb-4">
        <Row>
          <Col md={9} className="mb-2">
            <Form.Control
              type="text"
              placeholder="Zoek op gerecht of beschrijving..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Col>
          <Col md={3} className="mb-2">
            <Form.Select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="desc">Nieuwste eerst</option>
              <option value="asc">Oudste eerst</option>
            </Form.Select>
          </Col>
        </Row>
      </Form>

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p>Gerechten aan het laden…</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <p>😕 Geen posts gevonden.</p>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {filteredPosts.map((post) => {
            const hasLiked = post.likes?.some((like) => like.user_id === currentUserId);

            return (
              <Col key={post.id}>
                <Card>
                  {post.image_url && (
                    <Card.Img variant="top" src={post.image_url} alt={post.dishname} />
                  )}
                  <Card.Body>
                    <Card.Title
                      style={{ cursor: 'pointer', color: '#007bff', textDecoration: 'underline' }}
                      onClick={() => router.push(`/post/${post.id}`)}
                    >
                      {post.dishname}
                    </Card.Title>

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

                    <div className="d-flex align-items-center justify-content-between mt-3">
                      <div className="d-flex align-items-center">
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

                        {/* 👇 Klikbare gebruikersnaam */}
                        <small
                          className="text-muted"
                          style={{ cursor: 'pointer', textDecoration: 'underline', color: '#007bff' }}
                          onClick={() => router.push(`/user/${post.user_id}`)}
                        >
                          Geplaatst door {post.users?.gebruikersnaam || 'Onbekend'}
                        </small>
                      </div>

                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => toggleLike(post.id, hasLiked)}
                        style={{ textDecoration: 'none', color: hasLiked ? 'red' : '#888' }}
                      >
                        {hasLiked ? '❤️' : '🤍'} {post.likes?.length || 0}
                      </Button>
                    </div>
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
