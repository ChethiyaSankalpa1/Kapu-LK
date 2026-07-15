import React from 'react';
import { User, MapPin, Briefcase, GraduationCap, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserCard = ({ user }) => {
    const navigate = useNavigate();

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 w-full max-w-xs mx-auto">
            <div className="relative h-40 sm:h-48 bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center">
                {user.profileImageUrl ? (
                    <img
                        src={user.profileImageUrl}
                        alt={user.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <User className="w-16 h-16 sm:w-24 sm:h-24 text-white" />
                )}
            </div>

            <div className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white mb-2">{user.name}</h3>

                <div className="space-y-1.5 sm:space-y-2 text-gray-600 dark:text-gray-300">
                    {user.age && (
                        <p className="text-xs sm:text-sm">
                            <span className="font-semibold">Age:</span> {user.age} years
                        </p>
                    )}

                    {user.location && (
                        <p className="flex items-center text-xs sm:text-sm">
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                            <span className="text-xs sm:text-sm">{user.location}</span>
                        </p>
                    )}

                    {user.occupation && (
                        <p className="flex items-center text-xs sm:text-sm">
                            <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                            <span className="text-xs sm:text-sm">{user.occupation}</span>
                        </p>
                    )}

                    {user.education && (
                        <p className="flex items-center text-xs sm:text-sm">
                            <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                            <span className="text-xs sm:text-sm">{user.education}</span>
                        </p>
                    )}
                </div>

                {user.bio && (
                    <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{user.bio}</p>
                )}

                <button
                    onClick={() => navigate(`/users/${user._id}`)}
                    className="mt-3 sm:mt-4 w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 sm:py-2.5 rounded-lg hover:opacity-90 transition flex items-center justify-center space-x-2 text-xs sm:text-sm font-semibold"
                >
                    <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>View Profile</span>
                </button>
            </div>
        </div>
    );
};

export default UserCard;
