import React, { useState, useEffect } from 'react';
import { Gift, UserPlus, ExternalLink, Search, MoreHorizontal, Video } from 'lucide-react';
import { User } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useSocket } from '../context/SocketContext.tsx';

interface RightSidebarProps {
  onOpenProfile: (userId: string) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ onOpenProfile }) => {
  const { user, token } = useAuth();
  const { onlineUserIds, setActiveChatUserId } = useSocket();

  const [friends, setFriends] = useState<User[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!token) return;

    // Fetch friends
    fetch('/api/friends', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setFriends(data))
      .catch(console.error);

    // Fetch suggestions
    fetch('/api/friends/suggestions', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setSuggestions(data.slice(0, 3)))
      .catch(console.error);
  }, [token, user?.id]);

  const handleSendFriendRequest = async (targetId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/friends/request/${targetId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setAddedIds(prev => new Set(prev).add(targetId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <aside className="w-64 lg:w-72 hidden xl:block shrink-0 h-[calc(100vh-3.5rem)] sticky top-14 overflow-y-auto px-2 py-3 select-none text-gray-800 dark:text-gray-200">
      {/* Sponsored Ad */}
      <div className="mb-4">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Sponsored
          </span>
        </div>
        <a
          href="#promo"
          onClick={(e) => e.preventDefault()}
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#E4E6EB]/60 dark:hover:bg-[#3A3B3C] transition-colors group cursor-pointer"
        >
          <img
            src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=300&q=80"
            alt="Sponsored"
            className="w-24 h-24 rounded-lg object-cover"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#1877F2] transition-colors line-clamp-2">
              Next-Gen Cloud Solutions & Dev Platforms
            </h4>
            <span className="text-[11px] text-gray-400 block mt-1">taimoorcloud.io</span>
          </div>
        </a>
      </div>

      <hr className="my-2 border-[#CED0D4] dark:border-[#393A3B]" />

      {/* Birthdays Card */}
      <div className="mb-4">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Birthdays
          </span>
        </div>
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#E4E6EB]/60 dark:hover:bg-[#3A3B3C] transition-colors cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-[#1877F2] shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div className="text-xs leading-snug">
            <span className="font-bold text-gray-900 dark:text-gray-100">Sarah Jenkins</span> and <span className="font-bold">1 other</span> have birthdays today.
          </div>
        </div>
      </div>

      <hr className="my-2 border-[#CED0D4] dark:border-[#393A3B]" />

      {/* Friend Suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Friend Suggestions
            </span>
          </div>
          <div className="space-y-2">
            {suggestions.map((sug) => {
              const isSent = addedIds.has(sug.id);
              return (
                <div key={sug.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-[#E4E6EB]/60 dark:hover:bg-[#3A3B3C]">
                  <div
                    onClick={() => onOpenProfile(sug.id)}
                    className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                  >
                    <img src={sug.avatar} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                    <div className="truncate">
                      <div className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{sug.name}</div>
                      <div className="text-[10px] text-gray-500">{sug.mutualFriends || 1} mutual friends</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSendFriendRequest(sug.id)}
                    disabled={isSent}
                    className={`ml-2 px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                      isSent
                        ? 'bg-gray-200 text-gray-500 cursor-default'
                        : 'bg-blue-50 text-[#1877F2] hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60'
                    }`}
                  >
                    {isSent ? 'Sent' : 'Add'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <hr className="my-2 border-[#CED0D4] dark:border-[#393A3B]" />

      {/* Contacts / Online Friends */}
      <div>
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Contacts ({friends.length})
          </span>
          <div className="flex items-center gap-2 text-gray-500">
            <Video className="w-4 h-4 cursor-pointer hover:text-gray-800" />
            <Search className="w-4 h-4 cursor-pointer hover:text-gray-800" />
          </div>
        </div>

        <div className="space-y-0.5">
          {friends.length === 0 ? (
            <div className="p-3 text-xs text-gray-500 text-center">
              No contacts yet. Connect with people!
            </div>
          ) : (
            friends.map((friend) => {
              const isOnline = onlineUserIds.includes(friend.id) || true; // simulate active contacts
              return (
                <button
                  key={friend.id}
                  onClick={() => setActiveChatUserId(friend.id)}
                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[#E4E6EB]/60 dark:hover:bg-[#3A3B3C] transition-colors cursor-pointer text-left"
                >
                  <div className="relative shrink-0">
                    <img
                      src={friend.avatar}
                      alt={friend.name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#242526] rounded-full" />
                    )}
                  </div>
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate flex-1">
                    {friend.name}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
};
