import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';
import { Container, Nav, Tab, Table, Button, Spinner } from 'react-bootstrap';

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user || user.id !== process.env.NEXT_PUBLIC_ADMIN_ID) {
        router.push('/');
        return;
      }
      setCurrentUser(user);
      fetchAllData();
    };

    const fetchAllData = async () => {
      setLoading(true);
      const { data: postsData } = await supabase.from('posts').select(`
        id, dishname, description, image_url, created_at, user_id
      `);

      const { data: usersData } = await supabase.from('users').select(`
        id, gebruikersnaam, profile_pic, woonplaats, leeftijd
      `);

      setPosts(postsData || []);
      setUsers(usersData || []);
      setLoading(false);
    };

    checkAdmin();
  }, [router]);

  const deletePost = async (id) => {
    await supabase.from('posts').delete().eq('id', id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const deleteUser = async (id) => {
    await supabase.from('users').delete().eq('id', id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" />
        <p>Admin dashboard laden…</p>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Admin Dashboard</h2>
      <Tab.Container defaultActiveKey="posts">
        <Nav variant="tabs">
          <Nav.Item>
            <Nav.Link eventKey="posts">📋 Posts</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="users">👤 Users</Nav.Link>
          </Nav.Item>
        </Nav>
        <Tab.Content className="mt-4">
          <Tab.Pane eventKey="posts">
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Gerecht</th>
                  <th>Beschrijving</th>
                  <th>Gebruiker</th>
                  <th>Datum</th>
                  <th>Acties</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td>{post.dishname}</td>
                    <td>{post.description}</td>
                    <td>{post.user_id}</td>
                    <td>{new Date(post.created_at).toLocaleDateString()}</td>
                    <td>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => deletePost(post.id)}
                      >
                        Verwijder
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Tab.Pane>

          <Tab.Pane eventKey="users">
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Gebruikersnaam</th>
                  <th>Woonplaats</th>
                  <th>Leeftijd</th>
                  <th>Acties</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.gebruikersnaam}</td>
                    <td>{user.woonplaats}</td>
                    <td>{user.leeftijd}</td>
                    <td>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => deleteUser(user.id)}
                      >
                        Verwijder
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    </Container>
  );
}
