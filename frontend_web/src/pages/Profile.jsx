"use client";
import ProfileForm from "../components/auth/ProfileForm";
import ProfileMenu from "../components/layout/ProfileMenu";
import "../styles/ProfilePage.css";

const Profile = () => {
  return (
    <div className="profile-page-container">
      <div className="profile-page-content">
        <ProfileForm />
      </div>
      <ProfileMenu />
    </div>
  );
};

export default Profile;
