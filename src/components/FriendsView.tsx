import React, { useState, useEffect } from 'react';
import { UserCheck, UserPlus, UserX, Search, MessageCircle } from 'lucide-react';
import { User, FriendRequest } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useSocket } from '../context/SocketContext.tsx';

interface FriendsViewProps {
  onOpenProfile: (userId: string) => void;
}

export const FriendsView: React.FC<FriendsViewProps> = ({ onOpenProfile }) => {
  const { token } = useAuth();
  const { setActiveChatUserId } = useSocket();

  const [activeSubTab, setActiveSubTab] = useState<'requests' | 'suggestions' | 'all'>('requests');
  const [requests, setRequests] = useState<{ received: FriendRequest[]; sent: FriendRequest[] }>({ received: [], sent: [] });
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [searchFriend, setSearchFriend] = useState('');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const fetchAll = async () => {
    if (!token) return;
    try {
      const [reqRes, sugRes, friRes] = await Promise.all([
        fetch('/api/friends/requests', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/friends/suggestions', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/friends', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (reqRes.ok) setRequests(await reqRes.json());
      if (sugRes.ok) setSuggestions(await sugRes.json());
      if (friRes.ok) setFriends(await friRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [token]);

  const handleAccept = async (requestId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/friends/accept/${requestId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchAll();
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/friends/reject/${requestId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchAll();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendRequest = async (userId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/friends/request/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setAddedIds(prev => new Set(prev).add(userId));
        fetchAll();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUnfriend = async (userId: string) => {
    if (!confirm('Remove this user from your friends?')) return;
    if (!token) return;
    try {
      const res = await fetch(`/api/friends/unfriend/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchAll();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredFriends = friends.filter(f =>
    f.name.toLowerCase().includes(searchFriend.toLowerCase()) ||
    f.username.toLowerCase().includes(searchFriend.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#E4E6EB] dark:border-[#393A3B] gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">Friends</h1>
          <p className="text-xs text-gray-500">Manage your connections on TAIMOOR SOCIAL</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-[#E4E6EB]/70 dark:bg-[#3A3B3C] p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('requests')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'requests'
                ? 'bg-white dark:bg-[#242526] text-[#1877F2] shadow-xs'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            Friend Requests ({requests.received?.length || 0})
          </button>
          <button
            onClick={() => setActiveSubTab('suggestions')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'suggestions'
                ? 'bg-white dark:bg-[#242526] text-[#1877F2] shadow-xs'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            Suggestions ({suggestions.length})
          </button>
          <button
            onClick={() => setActiveSubTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'all'
                ? 'bg-white dark:bg-[#242526] text-[#1877F2] shadow-xs'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            All Friends ({friends.length})
          </button>
        </div>
      </div>

      {/* Tab: Friend Requests */}
      {activeSubTab === 'requests' && (
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4">
            Friend Requests ({requests.received?.length || 0})
          </h2>

          {requests.received.length === 0 ? (
            <div className="bg-white dark:bg-[#242526] rounded-xl p-8 text-center border border-[#E4E6EB] dark:border-[#393A3B]">
              <UserCheck className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <h3 className="font-bold text-base text-gray-800 dark:text-gray-200">No pending friend requests</h3>
              <p className="text-xs text-gray-500 mt-1">When someone sends you a friend request, it will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {requests.received.map((req) => (
                <div
                  key={req.id}
                  className="bg-white dark:bg-[#242526] rounded-xl overflow-hidden shadow-xs border border-[#E4E6EB] dark:border-[#393A3B] flex flex-col"
                >
                  <img
                    src={req.fromUserAvatar}
                    alt=""
                    onClick={() => onOpenProfile(req.fromUserId)}
                    className="w-full h-44 object-cover cursor-pointer hover:opacity-95"
                  />
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h4
                        onClick={() => onOpenProfile(req.fromUserId)}
                        className="font-bold text-sm text-gray-900 dark:text-gray-100 cursor-pointer hover:underline"
                      >
                        {req.fromUserName}
                      </h4>
                      <span className="text-[11px] text-gray-400">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="space-y-1.5 mt-3">
                      <button
                        onClick={() => handleAccept(req.id)}
                        className="w-full py-2 bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold text-xs rounded-lg shadow-xs"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        className="w-full py-2 bg-[#E4E6EB] hover:bg-[#D8DADF] dark:bg-[#3A3B3C] text-gray-800 dark:text-gray-200 font-bold text-xs rounded-lg"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Suggestions */}
      {activeSubTab === 'suggestions' && (
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4">
            People You May Know
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {suggestions.map((sug) => {
              const isAdded = addedIds.has(sug.id);
              return (
                <div
                  key={sug.id}
                  className="bg-white dark:bg-[#242526] rounded-xl overflow-hidden shadow-xs border border-[#E4E6EB] dark:border-[#393A3B] flex flex-col"
                >
                  <img
                    src={sug.avatar}
                    alt=""
                    onClick={() => onOpenProfile(sug.id)}
                    className="w-full h-44 object-cover cursor-pointer hover:opacity-95"
                  />
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h4
                        onClick={() => onOpenProfile(sug.id)}
                        className="font-bold text-sm text-gray-900 dark:text-gray-100 cursor-pointer hover:underline"
                      >
                        {sug.name}
                      </h4>
                      <p className="text-xs text-gray-500 truncate">{sug.work || sug.location || 'Global member'}</p>
                      <span className="text-[11px] text-gray-400 block mt-0.5">
                        {sug.mutualFriends || 1} mutual friends
                      </span>
                    </div>

                    <div className="space-y-1.5 mt-3">
                      <button
                        onClick={() => handleSendRequest(sug.id)}
                        disabled={isAdded}
                        className={`w-full py-2 font-bold text-xs rounded-lg shadow-xs flex items-center justify-center gap-1.5 ${
                          isAdded
                            ? 'bg-gray-200 text-gray-500'
                            : 'bg-[#1877F2] hover:bg-[#166FE5] text-white'
                        }`}
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>{isAdded ? 'Request Sent' : 'Add Friend'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: All Friends */}
      {activeSubTab === 'all' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              All Friends ({friends.length})
            </h2>
            <div className="flex items-center bg-[#F0F2F5] dark:bg-[#3A3B3C] rounded-lg px-3 py-1.5 text-xs text-gray-700 dark:text-gray-200 w-60">
              <Search className="w-3.5 h-3.5 text-gray-400 mr-2" />
              <input
                type="text"
                value={searchFriend}
                onChange={(e) => setSearchFriend(e.target.value)}
                placeholder="Search friends..."
                className="bg-transparent border-none outline-none w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredFriends.map((f) => (
              <div
                key={f.id}
                className="bg-white dark:bg-[#242526] p-3 rounded-xl border border-[#E4E6EB] dark:border-[#393A3B] flex items-center justify-between"
              >
                <div
                  onClick={() => onOpenProfile(f.id)}
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                >
                  <img src={f.avatar} alt="" className="w-14 h-14 rounded-lg object-cover" />
                  <div className="truncate">
                    <span className="font-bold text-sm text-gray-900 dark:text-gray-100 block truncate">
                      {f.name}
                    </span>
                    <span className="text-xs text-gray-500 truncate block">@{f.username}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 ml-2">
                  <button
                    onClick={() => setActiveChatUserId(f.id)}
                    className="p-2 rounded-lg bg-blue-50 text-[#1877F2] dark:bg-blue-950/60 hover:bg-blue-100"
                    title="Message"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleUnfriend(f.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Unfriend"
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
