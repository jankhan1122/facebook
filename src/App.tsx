import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { SocketProvider } from './context/SocketContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { HomeFeed } from './components/HomeFeed.tsx';
import { ProfileView } from './components/ProfileView.tsx';
import { FriendsView } from './components/FriendsView.tsx';
import { MessengerView } from './components/MessengerView.tsx';
import { GroupsView } from './components/GroupsView.tsx';
import { MarketplaceView } from './components/MarketplaceView.tsx';
import { WatchView } from './components/WatchView.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { FloatingChat } from './components/FloatingChat.tsx';
import { MobileBottomNav } from './components/MobileBottomNav.tsx';
import { AuthModal } from './components/AuthModal.tsx';

function MainLayout() {
  const { user, isLoading } = useAuth();

  const [currentTab, setCurrentTab] = useState<string>('home');
  const [viewingProfileUserId, setViewingProfileUserId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#18191A] flex flex-col items-center justify-center select-none">
        <div className="w-16 h-16 rounded-full bg-[#1877F2] text-white font-extrabold text-3xl flex items-center justify-center animate-pulse shadow-xl mb-4">
          ts
        </div>
        <h2 className="text-lg font-extrabold text-gray-800 dark:text-gray-100 tracking-tight">
          TAIMOOR SOCIAL
        </h2>
        <p className="text-xs text-gray-500 mt-1 font-medium">
          Connect • Share • Communicate
        </p>
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  const handleOpenProfile = (userId: string) => {
    setViewingProfileUserId(userId);
    setCurrentTab('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAdmin = () => {
    setCurrentTab('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#18191A] text-[#050505] dark:text-[#E4E6EB] flex flex-col">
      {/* Top Fixed Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          if (tab !== 'profile') setViewingProfileUserId(null);
        }}
        onOpenProfile={handleOpenProfile}
        onOpenAdmin={handleOpenAdmin}
      />

      {/* Main Content Area */}
      <div className="flex-1 pb-20 md:pb-6">
        {currentTab === 'home' && (
          <HomeFeed
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            onOpenProfile={handleOpenProfile}
            onOpenAdmin={handleOpenAdmin}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileView
            userId={viewingProfileUserId || user.id}
            onOpenProfile={handleOpenProfile}
            onBack={() => {
              setCurrentTab('home');
              setViewingProfileUserId(null);
            }}
          />
        )}

        {currentTab === 'friends' && (
          <FriendsView onOpenProfile={handleOpenProfile} />
        )}

        {currentTab === 'messenger' && (
          <MessengerView onOpenProfile={handleOpenProfile} />
        )}

        {currentTab === 'groups' && (
          <GroupsView onOpenProfile={handleOpenProfile} />
        )}

        {currentTab === 'marketplace' && (
          <MarketplaceView />
        )}

        {currentTab === 'watch' && (
          <WatchView />
        )}

        {currentTab === 'admin' && (
          <AdminDashboard
            onBack={() => setCurrentTab('home')}
            onOpenProfile={handleOpenProfile}
          />
        )}
      </div>

      {/* Floating Messenger Window (docked bottom-right like Facebook) */}
      <FloatingChat />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          if (tab !== 'profile') setViewingProfileUserId(null);
        }}
        onOpenProfile={handleOpenProfile}
        onOpenAdmin={handleOpenAdmin}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <MainLayout />
      </SocketProvider>
    </AuthProvider>
  );
}
