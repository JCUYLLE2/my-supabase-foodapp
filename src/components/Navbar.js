import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from 'react-bootstrap';
import { supabase } from '@/lib/supabaseClient';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      const adminId = process.env.NEXT_PUBLIC_ADMIN_ID;
      setIsAdmin(userId === adminId);
    };

    checkAdmin();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/logout');
    } catch (error) {
      console.error('Error logging out: ', error);
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="navbar-bottom">
      <div className="hamburger" onClick={toggleMenu}>
        &#9776;
      </div>
      <ul className={`navbar-links ${isOpen ? 'open' : ''}`}>
        <li>
          <Button
            variant="outline-primary"
            size="lg"
            className="navbar-button"
            onClick={() => router.push('/profile')}
          >
            Edit Profile
          </Button>
        </li>
        <li>
          <Button
            variant="outline-info"
            size="lg"
            className="navbar-button"
            onClick={() => router.push('/myposts')}
          >
            My Recipes
          </Button>
        </li>
        <li>
          <Button
            variant="success"
            size="lg"
            className="navbar-button create-post-button"
            onClick={() => router.push('/create-post')}
          >
            + Create Post
          </Button>
        </li>
        <li>
          <Button
            variant="outline-success"
            size="lg"
            className="navbar-button"
            onClick={() => router.push('/feed')}
          >
            Feed
          </Button>
        </li>

        {isAdmin && (
          <li>
            <Button
              variant="warning"
              size="lg"
              className="navbar-button"
              onClick={() => router.push('/admin')}
            >
              Admin
            </Button>
          </li>
        )}

        <li>
          <Button
            variant="outline-danger"
            size="lg"
            className="navbar-button"
            onClick={handleLogout}
          >
            Log out
          </Button>
        </li>
      </ul>
    </nav>
  );
}
