"use client";

import { useState } from "react";
import ProfileForm from "../components/auth/ProfileForm";
import ProfileMenu from "../components/layout/ProfileMenu";
import "../components/styles/Profile.css";

const Profile = () => {
  const [showMenu, setShowMenu] = useState(false);

  const toggleProfileMenu = () => {
    setShowMenu(!showMenu);
  };

  return (
    <div className="profile-container">
      <ProfileForm />

      <button
        onClick={toggleProfileMenu}
        className="btn btn-primary menu-button"
      >
        <span className="menu-icon">≡</span>
      </button>

      {showMenu && <ProfileMenu onClose={() => setShowMenu(false)} />}
    </div>
  );
};

export default Profile;
