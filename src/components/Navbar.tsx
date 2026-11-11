import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Home, Users, Tv, Store, Users2, MessageCircle, Bell,
  Menu, Moon, Sun, ShieldCheck, LogOut, Settings, HelpCircle,
  Check, X, Sparkles, ExternalLink, RefreshCw, UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useSocket } from '../context/SocketContext.tsx';
import { Notification, User } from '../types.ts';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenProfile: (userId: string) => void;
  onOpenAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenProfile,
  onOpenAdmin
}) => {
  const { user, logout, demoLogin, darkMode, setDarkMode, token } = useAuth();
  const { unreadMessagesCount, unreadNotificationsCount, setActiveChatUserId, refreshCounters } = useSocket();

  // Dropdowns state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ users: User[]; posts: any[]; groups: any[] }>({ users: [], posts: [], groups: [] });
  const [isSearching, setIsSearching] = useState(false);

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
  const [isMessengerMenuOpen, setIsMessengerMenuOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);

  const searchRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const messengerMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setIsNotifMenuOpen(false);
      }
      if (messengerMenuRef.current && !messengerMenuRef.current.contains(e.target as Node)) {
        setIsMessengerMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search API
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ users: [], posts: [], groups: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, token]);

  // Load notifications when opening dropdown
  const handleOpenNotifs = async () => {
    setIsNotifMenuOpen(!isNotifMenuOpen);
    setIsProfileMenuOpen(false);
    setIsMessengerMenuOpen(false);

    if (!isNotifMenuOpen && token) {
      try {
        const res = await fetch('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleMarkAllNotifsRead = async () => {
    if (!token) return;
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      refreshCounters();
    } catch (e) {
      console.error(e);
    }
  };

  // Load conversations when opening messenger menu
  const handleOpenMessenger = async () => {
    setIsMessengerMenuOpen(!isMessengerMenuOpen);
    setIsProfileMenuOpen(false);
    setIsNotifMenuOpen(false);

    if (!isMessengerMenuOpen && token) {
      try {
        const res = await fetch('/api/messages/conversations', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setConversations(data);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 h-14 bg-white dark:bg-[#242526] border-b border-[#E4E6EB] dark:border-[#393A3B] px-3 sm:px-4 flex items-center justify-between select-none shadow-xs">
        {/* Left Section: Logo & Search */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-xs md:max-w-sm">
          {/* TAIMOOR SOCIAL Logo */}
          <button
            onClick={() => setCurrentTab('home')}
            className="flex items-center gap-2 group text-left cursor-pointer transition-transform active:scale-95"
            title="TAIMOOR SOCIAL - Connect • Share • Communicate"
          >
            <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white font-extrabold text-xl shadow-sm tracking-tighter group-hover:bg-[#166FE5] transition-colors">
              ts
            </div>
            <div className="hidden lg:flex flex-col leading-tight">
              <span className="font-extrabold text-lg tracking-tight text-[#1877F2] dark:text-[#2D88FF]">
                TAIMOOR
              </span>
              <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 tracking-widest uppercase">
                SOCIAL
              </span>
            </div>
          </button>

          {/* Search Box */}
          <div ref={searchRef} className="relative flex-1">
            <div className="flex items-center bg-[#F0F2F5] dark:bg-[#3A3B3C] rounded-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus-within:ring-2 focus-within:ring-[#1877F2]/40">
              <Search className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Search Taimoor Social..."
                className="bg-transparent border-none outline-none w-full ml-2 text-xs sm:text-sm placeholder-gray-500 dark:placeholder-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Search Dropdown Results */}
            {isSearchOpen && searchQuery.trim() && (
              <div className="absolute top-12 left-0 w-[calc(100vw-24px)] sm:w-96 max-w-sm bg-white dark:bg-[#242526] rounded-xl shadow-2xl border border-gray-200 dark:border-[#393A3B] p-2 z-50 max-h-96 overflow-y-auto">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-1.5 uppercase tracking-wider">
                  Search Results
                </div>

                {isSearching ? (
                  <div className="p-4 text-center text-xs text-gray-500 dark:text-gray-400">Searching...</div>
                ) : (
                  <>
                    {searchResults.users.length === 0 && searchResults.posts.length === 0 && searchResults.groups.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No results found for "{searchQuery}"
                      </div>
                    ) : (
                      <>
                        {/* Users */}
                        {searchResults.users.length > 0 && (
                          <div className="mb-2">
                            <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 px-3">PEOPLE</span>
                            {searchResults.users.map((u) => (
                              <button
                                key={u.id}
                                onClick={() => {
                                  onOpenProfile(u.id);
                                  setIsSearchOpen(false);
                                  setSearchQuery('');
                                }}
                                className="w-full flex items-center gap-3 p-2 hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C] rounded-lg text-left transition-colors"
                              >
                                <img src={u.avatar} alt={u.name} className="w-9 h-9 rounded-full object-cover" />
                                <div>
                                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1">
                                    {u.name}
                                    {u.role === 'admin' && (
                                      <span className="bg-[#1877F2]/10 text-[#1877F2] text-[10px] px-1.5 py-0.5 rounded font-bold">Admin</span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">@{u.username} • {u.location || 'Global'}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Groups */}
                        {searchResults.groups.length > 0 && (
                          <div className="mb-2">
                            <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 px-3">GROUPS</span>
                            {searchResults.groups.map((g) => (
                              <button
                                key={g.id}
                                onClick={() => {
                                  setCurrentTab('groups');
                                  setIsSearchOpen(false);
                                  setSearchQuery('');
                                }}
                                className="w-full flex items-center gap-3 p-2 hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C] rounded-lg text-left transition-colors"
                              >
                                <img src={g.avatarImage} alt={g.name} className="w-9 h-9 rounded-lg object-cover" />
                                <div>
                                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{g.name}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">{g.memberIds?.length || 1} members</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Posts */}
                        {searchResults.posts.length > 0 && (
                          <div>
                            <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 px-3">POSTS</span>
                            {searchResults.posts.slice(0, 3).map((p) => (
                              <div
                                key={p.id}
                                onClick={() => {
                                  setCurrentTab('home');
                                  setIsSearchOpen(false);
                                }}
                                className="p-2 hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C] rounded-lg cursor-pointer text-xs text-gray-800 dark:text-gray-200 line-clamp-2"
                              >
                                <span className="font-semibold text-[#1877F2]">{p.userName}: </span>
                                {p.content}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center Tabs (Facebook 5 primary icons) */}
        <nav className="hidden md:flex items-center justify-center flex-1 max-w-2xl h-full px-2">
          {[
            { id: 'home', label: 'Home', icon: Home },
            { id: 'friends', label: 'Friends', icon: Users },
            { id: 'watch', label: 'Watch', icon: Tv },
            { id: 'marketplace', label: 'Marketplace', icon: Store },
            { id: 'groups', label: 'Groups', icon: Users2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                title={tab.label}
                className={`relative flex items-center justify-center flex-1 h-full max-w-[110px] rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#1877F2] dark:text-[#2D88FF]'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C]'
                }`}
              >
                <Icon className={`w-7 h-7 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1877F2] dark:bg-[#2D88FF] rounded-t-md" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Section: Menu, Messenger, Notifications, User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Admin Shortcut if admin */}
          {user?.role === 'admin' && (
            <button
              onClick={onOpenAdmin}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-[#1877F2] dark:bg-blue-950/50 dark:hover:bg-blue-900/50 dark:text-blue-300 font-semibold text-xs transition-colors cursor-pointer border border-[#1877F2]/20 shadow-xs"
              title="Open Admin Dashboard"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Panel</span>
            </button>
          )}

          {/* Quick Menu (Create post/group/story) */}
          <div className="relative">
            <button
              onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
              className="w-10 h-10 rounded-full bg-[#E4E6EB] dark:bg-[#3A3B3C] hover:bg-[#D8DADF] dark:hover:bg-[#4E4F50] flex items-center justify-center text-gray-800 dark:text-gray-200 transition-colors cursor-pointer"
              title="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {isCreateMenuOpen && (
              <div className="absolute right-0 top-12 w-64 bg-white dark:bg-[#242526] rounded-xl shadow-2xl border border-gray-200 dark:border-[#393A3B] p-2 z-50">
                <div className="px-3 py-2 text-sm font-bold text-gray-800 dark:text-gray-100 border-b border-gray-100 dark:border-[#393A3B]">
                  Quick Actions
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { setCurrentTab('home'); setIsCreateMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C] rounded-lg text-gray-700 dark:text-gray-200"
                  >
                    <span className="w-8 h-8 rounded-full bg-blue-100 text-[#1877F2] flex items-center justify-center font-bold text-lg">+</span>
                    <div>
                      <div className="font-semibold text-xs">Create Post</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">Share what is on your mind</div>
                    </div>
                  </button>
                  <button
                    onClick={() => { setCurrentTab('groups'); setIsCreateMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C] rounded-lg text-gray-700 dark:text-gray-200"
                  >
                    <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">👥</span>
                    <div>
                      <div className="font-semibold text-xs">Create Group</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">Connect with people who share interests</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Messenger Icon & Dropdown */}
          <div ref={messengerMenuRef} className="relative">
            <button
              onClick={handleOpenMessenger}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer relative ${
                isMessengerMenuOpen
                  ? 'bg-blue-100 text-[#1877F2] dark:bg-blue-900/60 dark:text-blue-300'
                  : 'bg-[#E4E6EB] dark:bg-[#3A3B3C] hover:bg-[#D8DADF] dark:hover:bg-[#4E4F50] text-gray-800 dark:text-gray-200'
              }`}
              title="Messenger"
            >
              <MessageCircle className="w-5 h-5" />
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#E41E3F] text-white text-[11px] font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center shadow-xs">
                  {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                </span>
              )}
            </button>

            {isMessengerMenuOpen && (
              <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto sm:right-0 top-14 sm:top-12 w-auto sm:w-88 max-w-sm bg-white dark:bg-[#242526] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#393A3B] p-3 z-50 mx-auto">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-[#393A3B]">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">Chats</h3>
                  <button
                    onClick={() => {
                      setCurrentTab('messenger');
                      setIsMessengerMenuOpen(false);
                    }}
                    className="text-xs text-[#1877F2] font-semibold hover:underline"
                  >
                    See all in Messenger
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto mt-2 space-y-1">
                  {conversations.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                      No active conversations. Start chatting with your friends!
                    </div>
                  ) : (
                    conversations.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (c.otherUser) {
                            setActiveChatUserId(c.otherUser.id);
                            setIsMessengerMenuOpen(false);
                          }
                        }}
                        className="w-full flex items-center gap-3 p-2 hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C] rounded-lg transition-colors text-left"
                      >
                        <div className="relative">
                          <img
                            src={c.otherUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
                            alt={c.otherUser?.name}
                            className="w-11 h-11 rounded-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                              {c.otherUser?.name}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(c.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {c.lastMessage}
                          </div>
                        </div>
                        {c.unreadCount > 0 && (
                          <div className="w-2.5 h-2.5 bg-[#1877F2] rounded-full shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Notifications Bell & Dropdown */}
          <div ref={notifMenuRef} className="relative">
            <button
              onClick={handleOpenNotifs}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer relative ${
                isNotifMenuOpen
                  ? 'bg-blue-100 text-[#1877F2] dark:bg-blue-900/60 dark:text-blue-300'
                  : 'bg-[#E4E6EB] dark:bg-[#3A3B3C] hover:bg-[#D8DADF] dark:hover:bg-[#4E4F50] text-gray-800 dark:text-gray-200'
              }`}
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#E41E3F] text-white text-[11px] font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center shadow-xs">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>

            {isNotifMenuOpen && (
              <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto sm:right-0 top-14 sm:top-12 w-auto sm:w-92 max-w-sm bg-white dark:bg-[#242526] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#393A3B] p-3 z-50 mx-auto">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-[#393A3B]">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">Notifications</h3>
                  {unreadNotificationsCount > 0 && (
                    <button
                      onClick={handleMarkAllNotifsRead}
                      className="text-xs text-[#1877F2] font-semibold hover:underline"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto mt-2 space-y-1">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors cursor-pointer ${
                          !n.isRead ? 'bg-blue-50/70 dark:bg-blue-950/30' : 'hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C]'
                        }`}
                        onClick={() => {
                          if (n.postId) setCurrentTab('home');
                          else if (n.type.includes('friend')) setCurrentTab('friends');
                        }}
                      >
                        <img src={n.fromUserAvatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 mt-0.5" />
                        <div className="flex-1 text-xs leading-snug">
                          <span className="font-bold text-gray-900 dark:text-gray-100">{n.fromUserName} </span>
                          <span className="text-gray-600 dark:text-gray-300">{n.content}</span>
                          <div className="text-[10px] text-gray-400 mt-1">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        {!n.isRead && (
                          <div className="w-2.5 h-2.5 bg-[#1877F2] rounded-full shrink-0 self-center" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu Dropdown */}
          <div ref={profileMenuRef} className="relative">
            <button
              onClick={() => {
                setIsProfileMenuOpen(!isProfileMenuOpen);
                setIsNotifMenuOpen(false);
                setIsMessengerMenuOpen(false);
              }}
              className="flex items-center gap-1.5 p-0.5 rounded-full hover:ring-2 hover:ring-[#1877F2]/50 transition-all cursor-pointer"
              title="Account"
            >
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                alt={user?.name}
                className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"
              />
            </button>

            {isProfileMenuOpen && (
              <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto sm:right-0 top-14 sm:top-12 w-auto sm:w-80 max-w-sm bg-white dark:bg-[#242526] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#393A3B] p-3 z-50 mx-auto">
                {/* Profile Card */}
                <button
                  onClick={() => {
                    if (user) onOpenProfile(user.id);
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-2 hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C] rounded-lg transition-colors text-left border-b border-gray-100 dark:border-[#393A3B] pb-3"
                >
                  <img
                    src={user?.avatar}
                    alt={user?.name}
                    className="w-12 h-12 rounded-full object-cover border"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-base text-gray-900 dark:text-gray-100 truncate">
                      {user?.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">See your profile</div>
                  </div>
                </button>

                {/* Quick Demo Switcher Section */}
                <div className="py-2 border-b border-gray-100 dark:border-[#393A3B]">
                  <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase px-2 mb-1">
                    Switch Active User (Instant Demo)
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 px-1">
                    {[
                      { id: 'user_taimoor', name: 'Taimoor (Admin)', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80' },
                      { id: 'user_sarah', name: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80' },
                      { id: 'user_alex', name: 'Alex Rivera', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80' },
                      { id: 'user_marcus', name: 'Marcus Vance', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80' }
                    ].map((demo) => (
                      <button
                        key={demo.id}
                        onClick={() => {
                          demoLogin(demo.id);
                          setIsProfileMenuOpen(false);
                        }}
                        className={`flex items-center gap-1.5 p-1.5 rounded-md text-xs font-medium text-left transition-colors ${
                          user?.id === demo.id
                            ? 'bg-blue-50 text-[#1877F2] font-bold border border-blue-200 dark:bg-blue-950/60'
                            : 'hover:bg-gray-100 dark:hover:bg-[#3A3B3C] text-gray-700 dark:text-gray-200'
                        }`}
                      >
                        <img src={demo.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                        <span className="truncate">{demo.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-2 space-y-1">
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => {
                        onOpenAdmin();
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C] rounded-lg font-semibold"
                    >
                      <ShieldCheck className="w-5 h-5 text-[#1877F2]" />
                      <span>Admin Control Panel</span>
                    </button>
                  )}

                  {/* Dark Mode Toggle */}
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C] rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
                      <span>Dark Display Mode</span>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700">
                      {darkMode ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  {/* Developer Info */}
                  <button
                    onClick={() => {
                      setShowDeveloperModal(true);
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C] rounded-lg"
                  >
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    <span>About Developer (Taimoor Khan)</span>
                  </button>

                  {/* Logout */}
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg font-medium"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Log Out</span>
                  </button>
                </div>

                <div className="text-[11px] text-gray-400 text-center pt-2 border-t border-gray-100 dark:border-[#393A3B]">
                  TAIMOOR SOCIAL • Connect • Share • Communicate
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Developer Modal */}
      {showDeveloperModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#242526] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-[#393A3B] relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowDeveloperModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#3A3B3C]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-linear-to-tr from-[#1877F2] to-indigo-600 text-white font-extrabold text-3xl flex items-center justify-center mx-auto shadow-lg mb-3">
                TK
              </div>
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">
                Taimoor Khan
              </h2>
              <p className="text-sm font-semibold text-[#1877F2] dark:text-[#2D88FF]">
                Full Stack Website Developer
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Founder & Architect of TAIMOOR SOCIAL
              </p>

              <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-[#18191A] text-left text-xs text-gray-600 dark:text-gray-300 space-y-2 border border-gray-200/60 dark:border-[#393A3B]">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-500">Project:</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">TAIMOOR SOCIAL</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-500">Tagline:</span>
                  <span className="font-semibold text-[#1877F2]">Connect • Share • Communicate</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-500">Architecture:</span>
                  <span>React 19, Node Express, Socket.IO</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-500">Styling:</span>
                  <span>Tailwind CSS (Facebook Modern Design)</span>
                </div>
              </div>

              <button
                onClick={() => setShowDeveloperModal(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold text-sm shadow-md transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
