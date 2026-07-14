import React from 'react';
import { User, MapPin, Briefcase, GraduationCap, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserCard = ({ user }) => {
    const navigate = useNavigate();

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <div className="relative h-48 bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center">
                {user.profileImageUrl ? (
                    <img
                        src={user.profileImageUrl}
                        alt={user.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <User className="w-24 h-24 text-white" />
                )}
            </div>

            <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{user.name}</h3>

                <div className="space-y-2 text-gray-600">
                    {user.age && (
                        <p className="text-sm">
                            <span className="font-semibold">Age:</span> {user.age} years
                        </p>
                    )}

                    {user.location && (
                        <p className="flex items-center text-sm">
                            <MapPin className="w-4 h-4 mr-2" />
                            {user.location}
                        </p>
                    )}

                    {user.occupation && (
                        <p className="flex items-center text-sm">
                            <Briefcase className="w-4 h-4 mr-2" />
                            {user.occupation}
                        </p>
                    )}

                    {user.education && (
                        <p className="flex items-center text-sm">
                            <GraduationCap className="w-4 h-4 mr-2" />
                            {user.education}
                        </p>
                    )}
                </div>

                {user.bio && (
                    <p className="mt-4 text-sm text-gray-600 line-clamp-2">{user.bio}</p>
                )}

                <button
                    onClick={() => navigate(`/users/${user._id}`)}
                    className="mt-4 w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition flex items-center justify-center space-x-2"
                >
                    <Heart className="w-4 h-4" />
                    <span>View Profile</span>
                </button>
            </div>
        </div>
    );
};

export default UserCard;
