import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Container, Spinner, Row, Col, Card, Button } from 'react-bootstrap';

export default function UserPostsPage() {
  const router = useRouter();
  const { id } = router.query;

  const [userInfo, setUserInfo] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      setCurrentUserId(data.session?.user?.id || null);
    };
    fetchSession();
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);

      const { data: userData } = await supabase
        .from('users')
        .select('gebruikersnaam, profile_pic')
        .eq('id', id)
        .single();
      setUserInfo(userData);

      const { data: postData } = await supabase
        .from('posts')
        .select(`
          id, dishname, description, image_url, created_at,
          likes(user_id)
        `)
        .eq('user_id', id)
        .order('created_at', { ascending: false });

      setPosts(postData || []);
      setLoading(false);
    };

    fetchData();
  }, [id]);

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

    const { data: updatedPosts } = await supabase
      .from('posts')
      .select('id, dishname, description, image_url, created_at, likes(user_id)')
      .eq('user_id', id)
      .order('created_at', { ascending: false });

    setPosts(updatedPosts || []);
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" />
        <p>Gebruiker wordt geladen…</p>
      </Container>
    );
  }

  if (!userInfo) {
    return (
      <Container className="mt-5 text-center">
        <p>Gebruiker niet gevonden.</p>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Button variant="secondary" onClick={() => router.push('/feed')} className="mb-4">
        ← Terug naar feed
      </Button>

      <div className="d-flex align-items-center mb-4">
        {userInfo.profile_pic ? (
          <img
            src={userInfo.profile_pic}
            alt="Profiel"
            style={{ width: 60, height: 60, borderRadius: '50%', marginRight: 15 }}
          />
        ) : (
          <div style={{ width: 60, height: 60, borderRadius: '50%', backgroundColor: '#ccc', marginRight: 15 }} />
        )}
        <h3 className="mb-0">{userInfo.gebruikersnaam}</h3>
      </div>

      {posts.length === 0 ? (
        <p>Deze gebruiker heeft nog geen posts.</p>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {posts.map((post) => {
            const hasLiked = post.likes?.some((like) => like.user_id === currentUserId);

            return (
              <Col key={post.id}>
                <Card>
                  {post.image_url && <Card.Img variant="top" src={post.image_url} />}
                  <Card.Body>
                    <Card.Title>{post.dishname}</Card.Title>
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
