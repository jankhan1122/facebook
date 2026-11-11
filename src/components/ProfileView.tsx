import React, { useState, useEffect, useRef } from 'react';
import {
  Camera, Plus, Edit2, MessageCircle, UserPlus, UserCheck,
  UserX, Briefcase, GraduationCap, MapPin, Heart, Calendar,
  Globe, Image as ImageIcon, Users, X, Check, ArrowLeft,
  Upload, Sparkles
} from 'lucide-react';
import { User, Post } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useSocket } from '../context/SocketContext.tsx';
import { PostCard } from './PostCard.tsx';
import { CreatePostBox } from './CreatePostBox.tsx';

interface ProfileViewProps {
  userId: string;
  onOpenProfile: (id: string) => void;
  onBack: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userId,
  onOpenProfile,
  onBack
}) => {
  const { user: currentUser, token, updateUser } = useAuth();
  const { setActiveChatUserId } = useSocket();

  const [profileData, setProfileData] = useState<{
    user: User;
    isSelf: boolean;
    isFriend: boolean;
    friendRequestStatus: 'sent' | 'received' | null;
    pendingRequestId?: string;
    friends: User[];
    posts: Post[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'about' | 'friends' | 'photos'>('posts');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);

  // Upload previews
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  // Edit fields
  const [editBio, setEditBio] = useState('');
  const [editWork, setEditWork] = useState('');
  const [editEducation, setEditEducation] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editCover, setEditCover] = useState('');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
  ];

  const sampleCovers = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80'
  ];

  const fetchProfile = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
        setEditBio(data.user.bio || '');
        setEditWork(data.user.work || '');
        setEditEducation(data.user.education || '');
        setEditLocation(data.user.location || '');
        setEditName(data.user.name || '');
        setEditAvatar(data.user.avatar || '');
        setEditCover(data.user.coverPhoto || '');
        setAvatarPreview(data.user.avatar || '');
        setCoverPreview(data.user.coverPhoto || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userId, token]);

  // Handle direct file upload for profile picture
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAvatarPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle direct file upload for cover photo
  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCoverPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Save uploaded avatar
  const handleSaveAvatar = async () => {
    if (!avatarPreview || !token) return;
    setIsUploading(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ avatar: avatarPreview })
      });
      if (res.ok) {
        const data = await res.json();
        updateUser({ avatar: data.user.avatar });
        setIsAvatarModalOpen(false);
        fetchProfile();
      }
    } catch (err) {
      console.error('Error saving avatar:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Save uploaded cover
  const handleSaveCover = async () => {
    if (!coverPreview || !token) return;
    setIsUploading(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ coverPhoto: coverPreview })
      });
      if (res.ok) {
        const data = await res.json();
        updateUser({ coverPhoto: data.user.coverPhoto });
        setIsCoverModalOpen(false);
        fetchProfile();
      }
    } catch (err) {
      console.error('Error saving cover:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFriendAction = async (action: 'request' | 'accept' | 'cancel' | 'unfriend') => {
    if (!token) return;
    try {
      if (action === 'request') {
        await fetch(`/api/friends/request/${userId}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } else if (action === 'accept' && profileData?.pendingRequestId) {
        await fetch(`/api/friends/accept/${profileData.pendingRequestId}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } else if (action === 'cancel') {
        await fetch(`/api/friends/cancel/${userId}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } else if (action === 'unfriend') {
        if (!confirm('Are you sure you want to remove this friend?')) return;
        await fetch(`/api/friends/unfriend/${userId}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      fetchProfile();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName,
          bio: editBio,
          work: editWork,
          education: editEducation,
          location: editLocation,
          avatar: editAvatar,
          coverPhoto: editCover
        })
      });

      if (res.ok) {
        const data = await res.json();
        updateUser(data.user);
        setIsEditModalOpen(false);
        fetchProfile();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading || !profileData) {
    return (
      <div className="max-w-5xl mx-auto p-4 animate-pulse space-y-4">
        <div className="h-48 sm:h-72 bg-gray-200 dark:bg-gray-700 rounded-b-2xl" />
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
    );
  }

  const { user, isSelf, isFriend, friendRequestStatus, friends, posts } = profileData;
  const userPhotos = posts.filter(p => p.mediaUrl).map(p => p.mediaUrl!);

  return (
    <div className="max-w-5xl mx-auto pb-16 md:pb-12 select-none">
      {/* Top Banner & Cover Photo */}
      <div className="bg-white dark:bg-[#242526] shadow-xs border-b border-[#E4E6EB] dark:border-[#393A3B]">
        {/* Cover image container */}
        <div className="relative h-44 sm:h-72 md:h-80 w-full overflow-hidden bg-gray-200 dark:bg-gray-800">
          <img
            src={user.coverPhoto}
            alt="Cover"
            className="w-full h-full object-cover"
          />

          {/* Edit cover button */}
          {isSelf && (
            <button
              onClick={() => {
                setCoverPreview(user.coverPhoto);
                setIsCoverModalOpen(true);
              }}
              className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-white/95 hover:bg-white dark:bg-black/70 dark:hover:bg-black/90 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5 shadow-md transition-all cursor-pointer backdrop-blur-xs"
            >
              <Camera className="w-4 h-4 text-gray-700 dark:text-gray-200" />
              <span className="hidden sm:inline">Edit cover photo</span>
              <span className="sm:hidden">Cover</span>
            </button>
          )}

          <button
            onClick={onBack}
            className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full cursor-pointer transition-all backdrop-blur-xs"
            title="Back to feed"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Avatar & Info Row */}
        <div className="px-4 sm:px-8 pb-3">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between -mt-16 sm:-mt-20 gap-3 sm:gap-4">
            {/* Avatar & Names */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-3 sm:gap-4 text-center sm:text-left">
              <div className="relative group">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white dark:border-[#242526] object-cover shadow-xl bg-white"
                />
                {isSelf && (
                  <button
                    onClick={() => {
                      setAvatarPreview(user.avatar);
                      setIsAvatarModalOpen(true);
                    }}
                    className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E4E6EB] hover:bg-[#D8DADF] dark:bg-[#3A3B3C] dark:hover:bg-[#4E4F50] text-gray-800 dark:text-gray-100 flex items-center justify-center border-2 border-white dark:border-[#242526] shadow-md cursor-pointer transition-transform hover:scale-105 active:scale-95"
                    title="Update Profile Picture"
                  >
                    <Camera className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                  </button>
                )}
              </div>

              <div className="pb-1 sm:pb-2">
                <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <span>{user.name}</span>
                  {user.role === 'admin' && (
                    <span className="bg-[#1877F2]/10 text-[#1877F2] text-[11px] sm:text-xs px-2 py-0.5 rounded-full font-bold">
                      Admin
                    </span>
                  )}
                </h1>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  @{user.username} • <span className="font-semibold text-gray-700 dark:text-gray-300">{friends.length} friends</span>
                </div>

                {/* Friends avatar stack */}
                {friends.length > 0 && (
                  <div className="flex -space-x-1.5 mt-2 justify-center sm:justify-start">
                    {friends.slice(0, 5).map((f) => (
                      <img
                        key={f.id}
                        src={f.avatar}
                        alt=""
                        className="w-7 h-7 rounded-full border-2 border-white dark:border-[#242526] object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Profile Action Buttons */}
            <div className="flex items-center gap-2 pb-2 w-full sm:w-auto justify-center sm:justify-end">
              {isSelf ? (
                <>
                  <button
                    onClick={() => {
                      setAvatarPreview(user.avatar);
                      setIsAvatarModalOpen(true);
                    }}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold text-xs sm:text-sm shadow-sm cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Upload Picture</span>
                  </button>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E4E6EB] hover:bg-[#D8DADF] dark:bg-[#3A3B3C] dark:hover:bg-[#4E4F50] font-bold text-xs sm:text-sm text-gray-800 dark:text-gray-200 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit profile</span>
                  </button>
                </>
              ) : (
                <>
                  {isFriend ? (
                    <button
                      onClick={() => handleFriendAction('unfriend')}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E4E6EB] hover:bg-[#D8DADF] dark:bg-[#3A3B3C] font-semibold text-xs text-gray-800 dark:text-gray-200"
                    >
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span>Friends</span>
                    </button>
                  ) : friendRequestStatus === 'sent' ? (
                    <button
                      onClick={() => handleFriendAction('cancel')}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-200 dark:bg-[#3A3B3C] font-semibold text-xs text-gray-600 dark:text-gray-300"
                    >
                      <UserX className="w-4 h-4" />
                      <span>Cancel Request</span>
                    </button>
                  ) : friendRequestStatus === 'received' ? (
                    <button
                      onClick={() => handleFriendAction('accept')}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1877F2] text-white font-bold text-xs shadow-sm hover:bg-[#166FE5]"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Accept Request</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleFriendAction('request')}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1877F2] text-white font-bold text-xs sm:text-sm shadow-sm hover:bg-[#166FE5] cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Add Friend</span>
                    </button>
                  )}

                  {/* Message button */}
                  <button
                    onClick={() => setActiveChatUserId(user.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-[#1877F2] dark:bg-blue-950/60 hover:bg-blue-100 font-bold text-xs sm:text-sm cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Message</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <hr className="my-3 border-[#E4E6EB] dark:border-[#393A3B]" />

          {/* Profile Navigation Tabs */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
            {[
              { id: 'posts', label: 'Posts' },
              { id: 'about', label: 'About' },
              { id: 'friends', label: `Friends (${friends.length})` },
              { id: 'photos', label: `Photos (${userPhotos.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 sm:px-4 py-2.5 sm:py-3 font-bold text-xs sm:text-sm rounded-lg transition-colors cursor-pointer shrink-0 ${
                  activeTab === tab.id
                    ? 'text-[#1877F2] dark:text-[#2D88FF] border-b-3 border-[#1877F2] dark:border-[#2D88FF] rounded-b-none'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Profile Body Content */}
      <div className="max-w-5xl mx-auto px-2 sm:px-4 mt-4">
        {activeTab === 'posts' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Left Intro Column */}
            <div className="md:col-span-5 space-y-4">
              {/* Intro Card */}
              <div className="bg-white dark:bg-[#242526] rounded-xl p-4 shadow-xs border border-[#E4E6EB] dark:border-[#393A3B]">
                <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 mb-2">Intro</h3>
                {user.bio && (
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 text-center py-2 italic border-b border-gray-100 dark:border-[#393A3B] mb-3">
                    "{user.bio}"
                  </p>
                )}

                <div className="space-y-2.5 text-xs text-gray-700 dark:text-gray-300">
                  {user.work && (
                    <div className="flex items-center gap-2.5">
                      <Briefcase className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>Works as <span className="font-semibold">{user.work}</span></span>
                    </div>
                  )}
                  {user.education && (
                    <div className="flex items-center gap-2.5">
                      <GraduationCap className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>Studied at <span className="font-semibold">{user.education}</span></span>
                    </div>
                  )}
                  {user.location && (
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>Lives in <span className="font-semibold">{user.location}</span></span>
                    </div>
                  )}
                  {user.relationshipStatus && (
                    <div className="flex items-center gap-2.5">
                      <Heart className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{user.relationshipStatus}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 text-gray-500">
                    <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>Joined {user.joinedDate}</span>
                  </div>
                </div>

                {isSelf && (
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="w-full mt-4 py-2 rounded-xl bg-[#E4E6EB] dark:bg-[#3A3B3C] hover:bg-[#D8DADF] text-xs font-bold text-gray-800 dark:text-gray-200 transition-colors"
                  >
                    Edit details
                  </button>
                )}
              </div>

              {/* Photos Preview Card */}
              {userPhotos.length > 0 && (
                <div className="bg-white dark:bg-[#242526] rounded-xl p-4 shadow-xs border border-[#E4E6EB] dark:border-[#393A3B]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">Photos</h3>
                    <button onClick={() => setActiveTab('photos')} className="text-xs text-[#1877F2] font-semibold hover:underline">
                      See all photos
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 rounded-lg overflow-hidden">
                    {userPhotos.slice(0, 6).map((img, i) => (
                      <img key={i} src={img} alt="" className="h-20 w-full object-cover" />
                    ))}
                  </div>
                </div>
              )}

              {/* Friends Preview Card */}
              <div className="bg-white dark:bg-[#242526] rounded-xl p-4 shadow-xs border border-[#E4E6EB] dark:border-[#393A3B]">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">Friends</h3>
                  <button onClick={() => setActiveTab('friends')} className="text-xs text-[#1877F2] font-semibold hover:underline">
                    See all friends
                  </button>
                </div>
                <div className="text-[11px] text-gray-500 mb-3">{friends.length} friends</div>
                <div className="grid grid-cols-3 gap-2">
                  {friends.slice(0, 6).map((f) => (
                    <div
                      key={f.id}
                      onClick={() => onOpenProfile(f.id)}
                      className="cursor-pointer group"
                    >
                      <img
                        src={f.avatar}
                        alt={f.name}
                        className="w-full h-20 rounded-lg object-cover group-hover:opacity-90 transition-opacity"
                      />
                      <span className="text-[11px] font-semibold text-gray-800 dark:text-gray-200 truncate block mt-1">
                        {f.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Posts Feed Column */}
            <div className="md:col-span-7 space-y-4">
              {isSelf && <CreatePostBox onPostCreated={fetchProfile} />}

              {posts.length === 0 ? (
                <div className="bg-white dark:bg-[#242526] rounded-xl p-8 text-center border border-[#E4E6EB] dark:border-[#393A3B]">
                  <p className="text-sm text-gray-500">No posts from {user.name} yet.</p>
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onPostUpdated={fetchProfile}
                    onOpenProfile={onOpenProfile}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* About Tab */}
        {activeTab === 'about' && (
          <div className="bg-white dark:bg-[#242526] rounded-xl p-4 sm:p-6 shadow-xs border border-[#E4E6EB] dark:border-[#393A3B] space-y-6">
            <div>
              <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-gray-100 mb-3">Overview</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs text-gray-700 dark:text-gray-300">
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#18191A] flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-[#1877F2]" />
                  <div>
                    <div className="text-[10px] text-gray-400">Occupation</div>
                    <div className="font-bold text-sm">{user.work || 'Not specified'}</div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#18191A] flex items-center gap-3">
                  <GraduationCap className="w-5 h-5 text-indigo-500" />
                  <div>
                    <div className="text-[10px] text-gray-400">Education</div>
                    <div className="font-bold text-sm">{user.education || 'Not specified'}</div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#18191A] flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-rose-500" />
                  <div>
                    <div className="text-[10px] text-gray-400">Current City</div>
                    <div className="font-bold text-sm">{user.location || 'Global'}</div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#18191A] flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-emerald-500" />
                  <div>
                    <div className="text-[10px] text-gray-400">Joined TAIMOOR SOCIAL</div>
                    <div className="font-bold text-sm">{user.joinedDate}</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-gray-100 mb-2">Bio</h3>
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-[#18191A] p-4 rounded-xl">
                {user.bio || 'No bio provided yet.'}
              </p>
            </div>
          </div>
        )}

        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <div className="bg-white dark:bg-[#242526] rounded-xl p-4 sm:p-6 shadow-xs border border-[#E4E6EB] dark:border-[#393A3B]">
            <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-gray-100 mb-4">
              All Friends ({friends.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {friends.map((f) => (
                <div
                  key={f.id}
                  onClick={() => onOpenProfile(f.id)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-[#393A3B] hover:shadow-md transition-all cursor-pointer"
                >
                  <img src={f.avatar} alt="" className="w-14 h-14 rounded-xl object-cover" />
                  <div className="truncate">
                    <span className="font-bold text-sm text-gray-900 dark:text-gray-100 block truncate">
                      {f.name}
                    </span>
                    <span className="text-xs text-gray-500 block truncate">{f.location || 'Global'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photos Tab */}
        {activeTab === 'photos' && (
          <div className="bg-white dark:bg-[#242526] rounded-xl p-4 sm:p-6 shadow-xs border border-[#E4E6EB] dark:border-[#393A3B]">
            <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-gray-100 mb-4">Photos</h3>
            {userPhotos.length === 0 ? (
              <p className="text-sm text-gray-500">No photos uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {userPhotos.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt=""
                    className="w-full h-32 sm:h-36 object-cover rounded-xl hover:scale-102 transition-transform cursor-pointer"
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* DEDICATED MODAL: Update Profile Picture (Direct File Upload & Preview) */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-[#242526] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-gray-200 dark:border-[#393A3B] relative animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#393A3B]">
              <div>
                <h3 className="font-black text-lg sm:text-xl text-gray-900 dark:text-gray-100">
                  Update Profile Picture
                </h3>
                <p className="text-xs text-gray-500">Your profile picture is visible to everyone on TAIMOOR SOCIAL.</p>
              </div>
              <button
                onClick={() => setIsAvatarModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#3A3B3C] hover:bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              {/* Live Preview Circle */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative">
                  <img
                    src={avatarPreview || user.avatar}
                    alt="Preview"
                    className="w-36 h-36 sm:w-44 sm:h-44 rounded-full object-cover border-4 border-[#1877F2] shadow-xl"
                  />
                  <div className="absolute inset-0 rounded-full ring-2 ring-white/50 pointer-events-none" />
                </div>
                <span className="text-xs text-gray-500 mt-2">Live Circular Preview</span>
              </div>

              {/* Direct File Upload Button */}
              <div>
                <input
                  type="file"
                  ref={avatarInputRef}
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-[#1877F2] bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100/60 text-[#1877F2] dark:text-blue-300 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                >
                  <Upload className="w-5 h-5" />
                  <span>Choose Photo from Device / Camera</span>
                </button>
              </div>

              {/* Or Choose From Presets */}
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                  Or select preset avatar:
                </span>
                <div className="grid grid-cols-6 gap-2">
                  {sampleAvatars.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt=""
                      onClick={() => setAvatarPreview(url)}
                      className={`h-12 w-12 rounded-full object-cover cursor-pointer transition-all mx-auto ${
                        avatarPreview === url
                          ? 'ring-3 ring-[#1877F2] scale-105 shadow-md'
                          : 'opacity-70 hover:opacity-100 hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-[#393A3B]">
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAvatar}
                disabled={isUploading || !avatarPreview}
                className="px-6 py-2 text-xs font-bold text-white bg-[#1877F2] hover:bg-[#166FE5] disabled:opacity-50 rounded-xl shadow-md cursor-pointer transition-colors"
              >
                {isUploading ? 'Saving...' : 'Save as Profile Picture'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED MODAL: Update Cover Photo (Direct File Upload & Preview) */}
      {isCoverModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-[#242526] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-gray-200 dark:border-[#393A3B] relative animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#393A3B]">
              <div>
                <h3 className="font-black text-lg sm:text-xl text-gray-900 dark:text-gray-100">
                  Update Cover Photo
                </h3>
                <p className="text-xs text-gray-500">Upload your own cover photo for your profile background.</p>
              </div>
              <button
                onClick={() => setIsCoverModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#3A3B3C] hover:bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              {/* Cover Live Preview */}
              <div className="relative h-44 rounded-xl overflow-hidden border border-gray-200 dark:border-[#393A3B] shadow-inner bg-gray-100">
                <img
                  src={coverPreview || user.coverPhoto}
                  alt="Cover Preview"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Direct File Upload Button */}
              <div>
                <input
                  type="file"
                  ref={coverInputRef}
                  accept="image/*"
                  onChange={handleCoverFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-[#1877F2] bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100/60 text-[#1877F2] dark:text-blue-300 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                >
                  <Upload className="w-5 h-5" />
                  <span>Choose Cover Photo from Device</span>
                </button>
              </div>

              {/* Preset Covers */}
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                  Or choose scenic wallpaper:
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {sampleCovers.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt=""
                      onClick={() => setCoverPreview(url)}
                      className={`h-16 w-full rounded-lg object-cover cursor-pointer transition-all ${
                        coverPreview === url
                          ? 'ring-3 ring-[#1877F2] scale-95 shadow-md'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-[#393A3B]">
              <button
                type="button"
                onClick={() => setIsCoverModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCover}
                disabled={isUploading || !coverPreview}
                className="px-6 py-2 text-xs font-bold text-white bg-[#1877F2] hover:bg-[#166FE5] disabled:opacity-50 rounded-xl shadow-md cursor-pointer transition-colors"
              >
                {isUploading ? 'Saving...' : 'Save Cover Photo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Details Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-[#242526] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-gray-200 dark:border-[#393A3B] max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#393A3B]">
              <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-gray-100">Edit Profile</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-[#393A3B] bg-transparent text-sm"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-[#393A3B] bg-transparent text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Work / Role</label>
                  <input
                    type="text"
                    value={editWork}
                    onChange={(e) => setEditWork(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-[#393A3B] bg-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Education</label>
                  <input
                    type="text"
                    value={editEducation}
                    onChange={(e) => setEditEducation(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-[#393A3B] bg-transparent text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">City / Location</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-[#393A3B] bg-transparent text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-[#393A3B]">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-5 py-2 text-xs font-bold text-white bg-[#1877F2] hover:bg-[#166FE5] rounded-xl shadow cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
