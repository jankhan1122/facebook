import React, { useState, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight, X, Eye, Play, Pause } from 'lucide-react';
import { Story } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useSocket } from '../context/SocketContext.tsx';

interface StoriesBarProps {
  onOpenCreateStory: () => void;
}

export const StoriesBar: React.FC<StoriesBarProps> = ({ onOpenCreateStory }) => {
  const { user, token } = useAuth();
  const { socket } = useSocket();
  const [stories, setStories] = useState<Story[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const fetchStories = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/stories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStories(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStories();

    if (socket) {
      socket.on('new_story', (newStory: Story) => {
        setStories(prev => [newStory, ...prev]);
      });
    }
  }, [token, socket]);

  // Story viewer timer
  useEffect(() => {
    if (activeStoryIndex === null) {
      setProgress(0);
      return;
    }

    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Advance to next story or close
          if (activeStoryIndex < stories.length - 1) {
            setActiveStoryIndex(activeStoryIndex + 1);
            return 0;
          } else {
            setActiveStoryIndex(null);
            return 0;
          }
        }
        return prev + 2; // ~5 seconds per story
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeStoryIndex, isPaused, stories.length]);

  // Record view
  const openStory = async (idx: number) => {
    setActiveStoryIndex(idx);
    setProgress(0);
    const story = stories[idx];
    if (story && token) {
      try {
        await fetch(`/api/stories/${story.id}/view`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleNext = () => {
    if (activeStoryIndex !== null && activeStoryIndex < stories.length - 1) {
      setActiveStoryIndex(activeStoryIndex + 1);
      setProgress(0);
    } else {
      setActiveStoryIndex(null);
    }
  };

  const handlePrev = () => {
    if (activeStoryIndex !== null && activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1);
      setProgress(0);
    }
  };

  return (
    <>
      <div className="relative mb-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {/* Create Story Card */}
          <div
            onClick={onOpenCreateStory}
            className="w-28 sm:w-32 h-44 sm:h-48 rounded-xl overflow-hidden bg-white dark:bg-[#242526] shadow-xs hover:shadow-md transition-all cursor-pointer relative shrink-0 flex flex-col group border border-gray-200/80 dark:border-[#393A3B]"
          >
            <div className="h-32 sm:h-36 overflow-hidden bg-gray-100">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                alt={user?.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="absolute top-28 sm:top-32 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#1877F2] border-3 border-white dark:border-[#242526] flex items-center justify-center text-white shadow-sm group-hover:bg-[#166FE5]">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="flex-1 flex items-end justify-center pb-2 px-1">
              <span className="text-[11px] sm:text-xs font-semibold text-gray-800 dark:text-gray-200 text-center">
                Create Story
              </span>
            </div>
          </div>

          {/* User Stories */}
          {stories.map((story, idx) => (
            <div
              key={story.id}
              onClick={() => openStory(idx)}
              className="w-28 sm:w-32 h-44 sm:h-48 rounded-xl overflow-hidden shadow-xs hover:shadow-lg transition-all cursor-pointer relative shrink-0 group border border-gray-200/50 dark:border-[#393A3B]"
            >
              {story.mediaUrl ? (
                <img
                  src={story.mediaUrl}
                  alt={story.userName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className={`w-full h-full bg-linear-to-br ${story.backgroundGradient || 'from-blue-600 to-indigo-700'} flex items-center justify-center p-3 text-center text-white text-xs font-semibold`}>
                  <p className="line-clamp-4">{story.textContent}</p>
                </div>
              )}

              {/* Gradient Dark Overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

              {/* Story creator avatar */}
              <div className="absolute top-2.5 left-2.5 w-9 h-9 rounded-full ring-3 ring-[#1877F2] overflow-hidden bg-white shadow-md">
                <img
                  src={story.userAvatar}
                  alt={story.userName}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Creator Name */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white font-semibold text-xs leading-tight drop-shadow truncate">
                {story.userName}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Screen Facebook Story Viewer */}
      {activeStoryIndex !== null && stories[activeStoryIndex] && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center select-none backdrop-blur-md">
          {/* Top Controls */}
          <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={stories[activeStoryIndex].userAvatar}
                alt=""
                className="w-10 h-10 rounded-full border-2 border-white object-cover shadow"
              />
              <div>
                <span className="text-white font-bold text-sm block">
                  {stories[activeStoryIndex].userName}
                </span>
                <span className="text-gray-300 text-[11px]">
                  {new Date(stories[activeStoryIndex].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="text-white hover:bg-white/20 p-2 rounded-full cursor-pointer"
              >
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setActiveStoryIndex(null)}
                className="text-white hover:bg-white/20 p-2 rounded-full cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Navigation arrows */}
          {activeStoryIndex > 0 && (
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white bg-black/40 hover:bg-black/70 p-3 rounded-full cursor-pointer hidden sm:block"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
          )}

          {activeStoryIndex < stories.length - 1 && (
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white bg-black/40 hover:bg-black/70 p-3 rounded-full cursor-pointer hidden sm:block"
            >
              <ChevronRight className="w-7 h-7" />
            </button>
          )}

          {/* Story Container Card */}
          <div className="relative w-full max-w-sm h-[80vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between bg-zinc-900 border border-white/10">
            {/* Progress Bars */}
            <div className="absolute top-2 left-3 right-3 z-40 flex gap-1.5">
              {stories.map((_, i) => (
                <div key={i} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-100"
                    style={{
                      width: i < activeStoryIndex ? '100%' : i === activeStoryIndex ? `${progress}%` : '0%'
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Story Content */}
            <div className="relative w-full h-full flex items-center justify-center">
              {stories[activeStoryIndex].mediaUrl ? (
                <>
                  <img
                    src={stories[activeStoryIndex].mediaUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  {stories[activeStoryIndex].textContent && (
                    <div className="absolute bottom-12 inset-x-4 bg-black/60 backdrop-blur-sm p-3 rounded-xl text-white text-center text-sm font-medium">
                      {stories[activeStoryIndex].textContent}
                    </div>
                  )}
                </>
              ) : (
                <div className={`w-full h-full bg-linear-to-br ${stories[activeStoryIndex].backgroundGradient || 'from-indigo-600 via-purple-600 to-pink-600'} flex items-center justify-center p-8 text-center text-white text-xl font-bold`}>
                  {stories[activeStoryIndex].textContent}
                </div>
              )}
            </div>

            {/* Viewer Count & Reactions */}
            <div className="absolute bottom-3 left-4 right-4 z-40 flex items-center justify-between text-white/90 text-xs">
              <div className="flex items-center gap-1.5 bg-black/50 px-2.5 py-1 rounded-full">
                <Eye className="w-3.5 h-3.5" />
                <span>{stories[activeStoryIndex].viewers?.length || 1} views</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
