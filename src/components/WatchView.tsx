import React, { useState } from 'react';
import {
  Play, Pause, Volume2, VolumeX, ThumbsUp, MessageCircle, Share2,
  Tv, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export const WatchView: React.FC = () => {
  const { user } = useAuth();

  const videos = [
    {
      id: 'vid_1',
      title: 'Building Real-Time Full-Stack Applications in 2026 ⚡ (Live Demo)',
      channel: 'Taimoor Khan Tech',
      channelAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-in-the-office-42564-large.mp4',
      views: '42K views',
      timeAgo: '3 hours ago',
      likes: 1240,
      comments: 184
    },
    {
      id: 'vid_2',
      title: 'Cinematic Drone Footage - Coastal Mountains & Sunset Horizon 🌲🌊',
      channel: 'Alex Rivera Expeditions',
      channelAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-waves-crashing-on-a-rocky-beach-42998-large.mp4',
      views: '88K views',
      timeAgo: '1 day ago',
      likes: 3120,
      comments: 420
    },
    {
      id: 'vid_3',
      title: 'Modern UI/UX Design System Walkthrough & Component Micro-interactions',
      channel: 'Sarah Jenkins Design',
      channelAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-smartphone-scrolling-through-social-network-41584-large.mp4',
      views: '19K views',
      timeAgo: '2 days ago',
      likes: 890,
      comments: 95
    }
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 select-none">
      <div className="flex items-center gap-2 pb-4 border-b border-[#E4E6EB] dark:border-[#393A3B] mb-6">
        <Tv className="w-6 h-6 text-[#1877F2]" />
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">Watch</h1>
          <p className="text-xs text-gray-500">Trending videos, tutorials, and creators on TAIMOOR SOCIAL</p>
        </div>
      </div>

      <div className="space-y-6">
        {videos.map((vid) => (
          <div
            key={vid.id}
            className="bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-[#E4E6EB] dark:border-[#393A3B] overflow-hidden"
          >
            {/* Creator Header */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={vid.channelAvatar}
                  alt={vid.channel}
                  className="w-10 h-10 rounded-full object-cover border"
                />
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                    {vid.channel}
                  </h3>
                  <div className="text-xs text-gray-500">
                    {vid.timeAgo} • {vid.views}
                  </div>
                </div>
              </div>
              <button className="px-3.5 py-1.5 rounded-lg bg-blue-50 text-[#1877F2] dark:bg-blue-950/60 font-bold text-xs hover:bg-blue-100">
                Follow
              </button>
            </div>

            {/* Video Title */}
            <p className="px-4 pb-3 text-sm font-semibold text-gray-800 dark:text-gray-200">
              {vid.title}
            </p>

            {/* Video Player */}
            <div className="relative bg-black w-full overflow-hidden max-h-[480px]">
              <video
                src={vid.videoUrl}
                controls
                playsInline
                preload="metadata"
                className="w-full h-full object-contain max-h-[480px]"
              />
            </div>

            {/* Video Interactions */}
            <div className="px-4 py-2 border-t border-[#E4E6EB] dark:border-[#393A3B] flex items-center justify-between text-xs text-gray-500">
              <span>{vid.likes} likes</span>
              <span>{vid.comments} comments</span>
            </div>

            <div className="px-2 py-1 flex items-center justify-between border-t border-[#E4E6EB] dark:border-[#393A3B]">
              <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C] rounded-lg font-semibold text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                <ThumbsUp className="w-5 h-5" />
                <span>Like</span>
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C] rounded-lg font-semibold text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                <MessageCircle className="w-5 h-5" />
                <span>Comment</span>
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C] rounded-lg font-semibold text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                <Share2 className="w-5 h-5" />
                <span>Share</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
