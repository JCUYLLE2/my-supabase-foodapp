// src/components/Topbar.js
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { FaUserCircle } from 'react-icons/fa';
import { supabase } from '@/lib/supabaseClient';


export default function TopBar() {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData.session?.user;

      if (currentUser) {
        setUser(currentUser);
        const { data } = await supabase
          .from('users')
          .select('gebruikersnaam, profilePic')
          .eq('id', currentUser.id)
          .single();

        if (data) {
          setUserName(data.gebruikersnaam || currentUser.email);
          setProfilePic(data.profilePic || '');
        }
      }
    };

    fetchUser();
  }, []);

  const handleLogoClick = () => {
    router.push(user ? '/feed' : '/');
  };

  return (
    <div className="top-bar">
      <div className="logo" onClick={handleLogoClick}>
        <img src="/logo.png" alt="App Logo" className="logo-img" />
      </div>
      {user && (
        <div className="user-info">
          {profilePic ? (
            <img
              src={profilePic}
              alt="Profile"
              className="profile-pic"
              style={{ width: 50, height: 50, borderRadius: '50%' }}
            />
          ) : (
            <FaUserCircle size={50} className="profile-icon" />
          )}
          <span className="user-name">{userName}</span>
        </div>
      )}
    </div>
  );
}
