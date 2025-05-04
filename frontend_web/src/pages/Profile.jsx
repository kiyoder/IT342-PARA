"use client";

import { useState } from "react";
import ProfileForm from "../components/auth/ProfileForm";
import ProfileMenu from "../components/layout/ProfileMenu";
import styles from "../styles/Profile.css";

const Profile = () => {
  const [showMenu, setShowMenu] = useState(false);

  const toggleProfileMenu = () => {
    setShowMenu(!showMenu);
  };

  return (
    <div className={styles.profileContainer}>
      <ProfileForm />

      <div
        className={styles.menuButtonContainer}
        style={{ position: "fixed", top: "1rem", right: "1rem" }}
      >
        <button
          onClick={toggleProfileMenu}
          className={`${styles.button} ${styles.primaryButton}`}
          style={{
            borderRadius: "50%",
            width: "50px",
            height: "50px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "1.5rem" }}>≡</span>
        </button>
      </div>

      {showMenu && <ProfileMenu onClose={() => setShowMenu(false)} />}
    </div>
  );
};

export default Profile;
