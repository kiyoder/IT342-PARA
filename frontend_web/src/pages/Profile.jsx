"use client";
import ProfileForm from "../components/auth/ProfileForm";
import ProfileMenu from "../components/layout/ProfileMenu";
import "../styles/Profile.css";

const Profile = () => {
  return (
    <div className="profile-page-container">
      <div className="profile-content">
        <ProfileForm />
      </div>
      <ProfileMenu />
    </div>
  );
};

export default Profile;
