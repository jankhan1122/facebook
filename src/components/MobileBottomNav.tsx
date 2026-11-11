import React from 'react';
import { Home, Users, Tv, Store, MessageCircle, Menu } from 'lucide-react';
import { useSocket } from '../context/SocketContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface MobileBottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenProfile: (userId: string) => void;
  onOpenAdmin: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  setCurrentTab,
  onOpenProfile,
  onOpenAdmin
}) => {
  const { user } = useAuth();
  const { unreadMessagesCount } = useSocket();

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'friends', icon: Users, label: 'Friends' },
    { id: 'watch', icon: Tv, label: 'Watch' },
    { id: 'marketplace', icon: Store, label: 'Market' },
    { id: 'messenger', icon: MessageCircle, label: 'Chats', badge: unreadMessagesCount },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-white dark:bg-[#242526] border-t border-[#E4E6EB] dark:border-[#393A3B] flex items-center justify-around px-1 shadow-lg select-none backdrop-blur-md">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setCurrentTab(item.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-all relative ${
              isActive ? 'text-[#1877F2] dark:text-[#2D88FF]' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -right-2 bg-[#E41E3F] text-white text-[9px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </div>
            <span className={`text-[10px] mt-0.5 ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
            {isActive && (
              <span className="absolute top-0 w-8 h-0.5 bg-[#1877F2] rounded-full" />
            )}
          </button>
        );
      })}

      {/* User Profile Avatar item */}
      {user && (
        <button
          onClick={() => onOpenProfile(user.id)}
          className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-all relative ${
            currentTab === 'profile' ? 'text-[#1877F2] dark:text-[#2D88FF]' : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <div className="relative">
            <img
              src={user.avatar}
              alt=""
              className={`w-6 h-6 rounded-full object-cover border ${
                currentTab === 'profile' ? 'border-2 border-[#1877F2]' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
          </div>
          <span className={`text-[10px] mt-0.5 ${currentTab === 'profile' ? 'font-bold' : 'font-medium'}`}>
            Profile
          </span>
          {currentTab === 'profile' && (
            <span className="absolute top-0 w-8 h-0.5 bg-[#1877F2] rounded-full" />
          )}
        </button>
      )}
    </nav>
  );
};
