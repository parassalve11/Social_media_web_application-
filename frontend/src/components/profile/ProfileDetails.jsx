"use client";

import { MapPin, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";

const ProfileDetails = ({ userData }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      {userData.bio && (
        <p className="text-gray-700 mb-4 leading-relaxed">{userData.bio}</p>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-gray-600">
        {userData.location && (
          <p className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {userData.location}
          </p>
        )}
        {userData.website && (
          <p className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5" />
            <a
              href={userData.website}
              className="text-blue-500 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {userData.website}
            </a>
          </p>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-6 text-gray-600">
        <p>
          <span className="font-medium text-gray-900">
            {userData.postsCount}
          </span>{" "}
          Posts
        </p>
        <p>
         <Link to={`/profile/${userData.username}/followers`}>
          <span className="font-medium text-gray-900">
            {userData.followers.length}
          </span>{" "}
          Followers
         </Link>
        </p>
        <p>
       <Link to={`/profile/${userData.username}/following`}>
          <span className="font-medium text-gray-900">
            {userData.following.length}
          </span>{" "}
          Following
       </Link>
        </p>
      </div>
    </div>
  );
};

export default ProfileDetails;
