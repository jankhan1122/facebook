import React from 'react';
import {
  Users, Bookmark, Clock, Users2, Store, Tv, Calendar,
  ChevronDown, ShieldCheck, Sparkles, ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface LeftSidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenProfile: (userId: string) => void;
  onOpenAdmin: () => void;
  feedFilter: string;
  setFeedFilter: (filter: string) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenProfile,
  onOpenAdmin,
  feedFilter,
  setFeedFilter
}) => {
  const { user } = useAuth();

  const menuItems = [
    {
      id: 'friends',
      label: 'Friends',
      icon: Users,
      color: 'text-[#1877F2]',
      action: () => setCurrentTab('friends')
    },
    {
      id: 'groups',
      label: 'Groups',
      icon: Users2,
      color: 'text-indigo-500',
      action: () => setCurrentTab('groups')
    },
    {
      id: 'marketplace',
      label: 'Marketplace',
      icon: Store,
      color: 'text-teal-500',
      action: () => setCurrentTab('marketplace')
    },
    {
      id: 'watch',
      label: 'Watch',
      icon: Tv,
      color: 'text-rose-500',
      action: () => setCurrentTab('watch')
    },
    {
      id: 'saved',
      label: 'Saved Posts',
      icon: Bookmark,
      color: 'text-purple-500',
      badge: feedFilter === 'saved' ? 'Active' : undefined,
      action: () => {
        setCurrentTab('home');
        setFeedFilter(feedFilter === 'saved' ? 'all' : 'saved');
      }
    },
    {
      id: 'friends_feed',
      label: 'Friends Feed',
      icon: Users,
      color: 'text-emerald-500',
      badge: feedFilter === 'friends' ? 'Active' : undefined,
      action: () => {
        setCurrentTab('home');
        setFeedFilter(feedFilter === 'friends' ? 'all' : 'friends');
      }
    }
  ];

  const shortcuts = [
    {
      id: 'group_1',
      name: 'Full Stack Web Developers',
      avatar: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=100&q=80',
      action: () => setCurrentTab('groups')
    },
    {
      id: 'group_2',
      name: 'UI/UX & Modern Product Design',
      avatar: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=100&q=80',
      action: () => setCurrentTab('groups')
    },
    {
      id: 'group_3',
      name: 'Global Photographers & Travelers',
      avatar: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=100&q=80',
      action: () => setCurrentTab('groups')
    }
  ];

  return (
    <aside className="w-64 lg:w-72 hidden md:block shrink-0 h-[calc(100vh-3.5rem)] sticky top-14 overflow-y-auto px-2 py-3 select-none text-gray-800 dark:text-gray-200">
      {/* User Profile item */}
      {user && (
        <button
          onClick={() => onOpenProfile(user.id)}
          className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#E4E6EB]/60 dark:hover:bg-[#3A3B3C] transition-colors cursor-pointer text-left mb-1"
        >
          <img
            src={user.avatar}
            alt={user.name}
            className="w-9 h-9 rounded-full object-cover border border-gray-300 dark:border-gray-600"
          />
          <div className="flex-1 min-w-0">
            <span className="font-bold text-sm block truncate">{user.name}</span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">View your profile</span>
          </div>
        </button>
      )}

      {/* Admin Panel Link if admin */}
      {user?.role === 'admin' && (
        <button
          onClick={onOpenAdmin}
          className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-blue-50/70 hover:bg-blue-100/70 text-[#1877F2] dark:bg-blue-950/40 dark:hover:bg-blue-900/40 dark:text-blue-300 transition-colors cursor-pointer text-left mb-1 font-semibold text-xs border border-blue-200/50"
        >
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <span>Admin Dashboard</span>
        </button>
      )}

      {/* Main navigation list */}
      <div className="space-y-0.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#E4E6EB]/60 dark:hover:bg-[#3A3B3C] transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-6 h-6 ${item.color}`} />
                <span className="text-sm font-semibold">{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] bg-[#1877F2] text-white font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <hr className="my-3 border-[#CED0D4] dark:border-[#393A3B]" />

      {/* Your Shortcuts */}
      <div className="px-2 mb-2 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Your Shortcuts
        </span>
      </div>

      <div className="space-y-0.5">
        {shortcuts.map((sc) => (
          <button
            key={sc.id}
            onClick={sc.action}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#E4E6EB]/60 dark:hover:bg-[#3A3B3C] transition-colors cursor-pointer text-left"
          >
            <img src={sc.avatar} alt="" className="w-8 h-8 rounded-lg object-cover" />
            <span className="text-xs font-semibold truncate">{sc.name}</span>
          </button>
        ))}
      </div>

      <hr className="my-3 border-[#CED0D4] dark:border-[#393A3B]" />

      {/* Footer & Developer Credits */}
      <div className="px-3 text-[11px] text-gray-400 leading-normal space-y-1">
        <p>
          Privacy · Terms · Advertising · Cookies · Ad Choices · More
        </p>
        <p className="font-semibold text-gray-500 dark:text-gray-400 pt-1">
          TAIMOOR SOCIAL © 2026
        </p>
        <p className="text-[10px] text-[#1877F2] font-semibold">
          Developer: Taimoor Khan
        </p>
      </div>
    </aside>
  );
};
