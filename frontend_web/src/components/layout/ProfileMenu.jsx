"use client"

import { useState } from "react"


const ProfileMenu = () => {

  const [loading] = useState(true)
  const [error] = useState(null)



  return (
      <div>
        {loading ? (
            <p>Loading profile...</p>
        ) : error ? (
            <p className="text-red-500">{error}</p>
        ) : profile ? (
            <p>Welcome!</p>
        ) : (
            <p>Welcome!</p>
        )}
        <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
          Logout
        </button>
      </div>
  )
}

export default ProfileMenu
