import React, { useState, useEffect } from 'react';
import { LeftSidebar } from './LeftSidebar.tsx';
import { RightSidebar } from './RightSidebar.tsx';
import { StoriesBar } from './StoriesBar.tsx';
import { CreatePostBox } from './CreatePostBox.tsx';
import { PostCard } from './PostCard.tsx';
import { CreateStoryModal } from './CreateStoryModal.tsx';
import { Post } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useSocket } from '../context/SocketContext.tsx';
import { Filter, Bookmark, Users, Sparkles, RefreshCw } from 'lucide-react';

interface HomeFeedProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenProfile: (userId: string) => void;
  onOpenAdmin: () => void;
}

export const HomeFeed: React.FC<HomeFeedProps> = ({
  currentTab,
  setCurrentTab,
  onOpenProfile,
  onOpenAdmin
}) => {
  const { token } = useAuth();
  const { socket } = useSocket();

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedFilter, setFeedFilter] = useState<'all' | 'friends' | 'saved'>('all');
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);

  const fetchPosts = async () => {
    if (!token) return;
    try {
      const url = feedFilter === 'all' ? '/api/posts' : `/api/posts?filter=${feedFilter}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [token, feedFilter]);

  // Real-time socket events for posts
  useEffect(() => {
    if (!socket) return;

    socket.on('new_post', (newPost: Post) => {
      setPosts(prev => [newPost, ...prev]);
    });

    socket.on('delete_post', ({ postId }: { postId: string }) => {
      setPosts(prev => prev.filter(p => p.id !== postId));
    });

    return () => {
      socket.off('new_post');
      socket.off('delete_post');
    };
  }, [socket]);

  return (
    <div className="flex justify-center w-full max-w-7xl mx-auto">
      {/* Left Sidebar */}
      <LeftSidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenProfile={onOpenProfile}
        onOpenAdmin={onOpenAdmin}
        feedFilter={feedFilter}
        setFeedFilter={(f) => setFeedFilter(f as any)}
      />

      {/* Main Center News Feed */}
      <main className="flex-1 max-w-[620px] px-2 sm:px-4 py-4 min-w-0">
        {/* Stories Section */}
        <StoriesBar onOpenCreateStory={() => setIsStoryModalOpen(true)} />

        {/* Create Post Box */}
        <CreatePostBox onPostCreated={fetchPosts} />

        {/* Feed Filter Bar */}
        <div className="flex items-center justify-between bg-white dark:bg-[#242526] rounded-xl px-3 py-2 mb-4 border border-[#E4E6EB] dark:border-[#393A3B] shadow-xs text-xs font-semibold">
          <div className="flex items-center gap-1">
            <span className="text-gray-500 dark:text-gray-400 mr-1">Feed:</span>
            <button
              onClick={() => setFeedFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                feedFilter === 'all'
                  ? 'bg-blue-50 text-[#1877F2] font-bold dark:bg-blue-950/60 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3A3B3C]'
              }`}
            >
              All Posts
            </button>
            <button
              onClick={() => setFeedFilter('friends')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                feedFilter === 'friends'
                  ? 'bg-blue-50 text-[#1877F2] font-bold dark:bg-blue-950/60 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3A3B3C]'
              }`}
            >
              Friends Only
            </button>
            <button
              onClick={() => setFeedFilter('saved')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                feedFilter === 'saved'
                  ? 'bg-blue-50 text-[#1877F2] font-bold dark:bg-blue-950/60 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3A3B3C]'
              }`}
            >
              Saved
            </button>
          </div>

          <button
            onClick={fetchPosts}
            className="text-gray-400 hover:text-[#1877F2] p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#3A3B3C] cursor-pointer"
            title="Refresh Feed"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Posts Feed */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-[#242526] rounded-xl p-4 shadow-xs animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="space-y-1.5 flex-1">
                    <div className="w-28 h-3.5 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="w-16 h-2.5 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                </div>
                <div className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="w-full h-44 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white dark:bg-[#242526] rounded-xl p-8 text-center border border-[#E4E6EB] dark:border-[#393A3B] shadow-xs">
            <Bookmark className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2 stroke-[1.5]" />
            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-base">No posts found</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs mx-auto">
              {feedFilter === 'saved'
                ? "You haven't saved any posts yet. Click the 3 dots on any post to bookmark it."
                : 'Share what is on your mind or add friends to see their updates!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onPostUpdated={fetchPosts}
                onOpenProfile={onOpenProfile}
              />
            ))}
          </div>
        )}
      </main>

      {/* Right Sidebar */}
      <RightSidebar onOpenProfile={onOpenProfile} />

      {/* Create Story Modal */}
      <CreateStoryModal
        isOpen={isStoryModalOpen}
        onClose={() => setIsStoryModalOpen(false)}
        onStoryCreated={fetchPosts}
      />
    </div>
  );
};
