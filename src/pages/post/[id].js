import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Container, Spinner, Card, Button } from 'react-bootstrap';

export default function PostDetails() {
  const router = useRouter();
  const { id } = router.query;

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData.session?.user || null;
      setUser(currentUser);

      if (currentUser && currentUser.id === process.env.NEXT_PUBLIC_ADMIN_ID) {
        setIsAdmin(true);
      }
    };
    fetchSession();
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchPost = async () => {
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
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Fout bij ophalen van post:', error.message);
      } else {
        setPost(data);
      }
    };

    const fetchLikes = async () => {
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', id);
      setLikeCount(count || 0);

      if (user) {
        const { data: existing } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', id)
          .eq('user_id', user.id)
          .maybeSingle();
        setHasLiked(!!existing);
      }
    };

    const loadData = async () => {
      setLoading(true);
      await fetchPost();
      await fetchLikes();
      setLoading(false);
    };

    loadData();
  }, [id, user]);

  const handleLikeToggle = async () => {
    if (!user || !id) return;

    if (hasLiked) {
      await supabase.from('likes').delete().eq('post_id', id).eq('user_id', user.id);
    } else {
      await supabase.from('likes').insert({ post_id: id, user_id: user.id });
    }

    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', id);
    setLikeCount(count || 0);

    setHasLiked(!hasLiked);
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" />
        <p>Post wordt geladen…</p>
      </Container>
    );
  }

  if (!post) {
    return (
      <Container className="mt-5 text-center">
        <p>😕 Geen post gevonden.</p>
      </Container>
    );
  }

  return (
    <Container className="mt-4" style={{ maxWidth: 600 }}>
      <div className="d-flex justify-content-between mb-3">
        <Button variant="secondary" onClick={() => router.back()}>
          ← Terug naar feed
        </Button>
        {isAdmin && (
          <Button variant="warning" onClick={() => router.push('/admin')}>
            ↩ Terug naar Admin
          </Button>
        )}
      </div>

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
              className="mb-3"
            >
              Bekijk recept
            </Button>
          )}

          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center">
              {post.users?.profile_pic ? (
                <img
                  src={post.users.profile_pic}
                  alt="Profielfoto"
                  onClick={() => router.push(`/user/${post.user_id}`)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    marginRight: 10,
                    cursor: 'pointer',
                  }}
                />
              ) : (
                <div
                  onClick={() => router.push(`/user/${post.user_id}`)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: '#ccc',
                    marginRight: 10,
                    cursor: 'pointer',
                  }}
                />
              )}
              <small
                className="text-muted"
                style={{ cursor: 'pointer' }}
                onClick={() => router.push(`/user/${post.user_id}`)}
              >
                Geplaatst door {post.users?.gebruikersnaam || 'Onbekend'} op{' '}
                {new Date(post.created_at).toLocaleDateString()}
              </small>
            </div>

            <Button
              variant="link"
              size="sm"
              onClick={handleLikeToggle}
              style={{
                textDecoration: 'none',
                color: hasLiked ? 'red' : '#888',
              }}
            >
              {hasLiked ? '❤️' : '🤍'} {likeCount}
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
