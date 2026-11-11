import React, { useState } from 'react';
import {
  Video, Image, Smile, Globe, Users, Lock, X, Upload, Tag,
  MapPin, Sparkles, Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface CreatePostBoxProps {
  onPostCreated: () => void;
  groupId?: string;
  groupName?: string;
}

export const CreatePostBox: React.FC<CreatePostBoxProps> = ({
  onPostCreated,
  groupId,
  groupName
}) => {
  const { user, token } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'only_me'>('public');
  const [feeling, setFeeling] = useState<string>('');
  const [showFeelingPicker, setShowFeelingPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sampleImages = [
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'
  ];

  const feelings = [
    { label: 'excited', emoji: '🚀' },
    { label: 'happy', emoji: '😊' },
    { label: 'blessed', emoji: '✨' },
    { label: 'loved', emoji: '❤️' },
    { label: 'creative', emoji: '🎨' },
    { label: 'thoughtful', emoji: '🤔' },
    { label: 'crazy', emoji: '🤪' },
    { label: 'peaceful', emoji: '🌿' }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setMediaUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddHashtag = (tag: string) => {
    setContent(prev => (prev ? `${prev} ${tag}` : tag));
  };

  const handleSubmit = async () => {
    if (!content.trim() && !mediaUrl) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: content.trim(),
          mediaUrl: mediaUrl || undefined,
          privacy,
          feeling: feeling || undefined,
          groupId: groupId || undefined,
          groupName: groupName || undefined
        })
      });

      if (res.ok) {
        setContent('');
        setMediaUrl('');
        setFeeling('');
        setIsModalOpen(false);
        onPostCreated();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-[#E4E6EB] dark:border-[#393A3B] p-3 sm:p-4 mb-4">
      {/* Top Bar with Avatar and Clickable Input */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-[#E4E6EB] dark:border-[#393A3B]">
        <img
          src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
          alt={user?.name}
          className="w-10 h-10 rounded-full object-cover shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
        />
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex-1 bg-[#F0F2F5] dark:bg-[#3A3B3C] hover:bg-[#E4E6EB] dark:hover:bg-[#4E4F50] rounded-full py-2.5 px-4 text-left text-gray-500 dark:text-gray-300 text-sm transition-colors cursor-pointer"
        >
          {groupId ? `Post to ${groupName}...` : `What's on your mind, ${user?.name?.split(' ')[0] || 'friend'}?`}
        </button>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C] rounded-lg text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
        >
          <Video className="w-5 h-5 text-rose-500" />
          <span className="hidden sm:inline">Live Video</span>
        </button>
        <button
          onClick={() => {
            setIsModalOpen(true);
          }}
          className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C] rounded-lg text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
        >
          <Image className="w-5 h-5 text-emerald-500" />
          <span>Photo/video</span>
        </button>
        <button
          onClick={() => {
            setIsModalOpen(true);
            setShowFeelingPicker(true);
          }}
          className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C] rounded-lg text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
        >
          <Smile className="w-5 h-5 text-amber-500" />
          <span className="hidden sm:inline">Feeling/activity</span>
        </button>
      </div>

      {/* Facebook Create Post Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#242526] rounded-2xl max-w-lg w-full p-4 sm:p-5 shadow-2xl border border-gray-200 dark:border-[#393A3B] relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#393A3B]">
              <div className="w-7" />
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 text-center">
                Create post
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#3A3B3C] hover:bg-gray-200 dark:hover:bg-[#4E4F50] flex items-center justify-center text-gray-600 dark:text-gray-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-3 space-y-3">
              {/* User Info & Privacy selector */}
              <div className="flex items-center gap-3">
                <img
                  src={user?.avatar}
                  alt={user?.name}
                  className="w-11 h-11 rounded-full object-cover border"
                />
                <div>
                  <div className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                    {user?.name}
                    {feeling && (
                      <span className="font-normal text-xs text-gray-500 dark:text-gray-400">
                        is feeling <span className="font-semibold text-gray-800 dark:text-gray-200">{feeling}</span>
                      </span>
                    )}
                  </div>
                  {/* Privacy Selector */}
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#3A3B3C] rounded-md px-2 py-0.5 text-[11px] font-semibold text-gray-700 dark:text-gray-300 mt-0.5 w-fit">
                    {privacy === 'public' && <Globe className="w-3 h-3" />}
                    {privacy === 'friends' && <Users className="w-3 h-3" />}
                    {privacy === 'only_me' && <Lock className="w-3 h-3" />}
                    <select
                      value={privacy}
                      onChange={(e) => setPrivacy(e.target.value as any)}
                      className="bg-transparent border-none outline-none cursor-pointer"
                    >
                      <option value="public" className="bg-white dark:bg-[#242526]">Public</option>
                      <option value="friends" className="bg-white dark:bg-[#242526]">Friends</option>
                      <option value="only_me" className="bg-white dark:bg-[#242526]">Only me</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Textarea */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`What's on your mind, ${user?.name?.split(' ')[0]}?`}
                rows={4}
                className="w-full text-base sm:text-lg bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 resize-none font-normal"
              />

              {/* Image Preview if present */}
              {mediaUrl && (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-[#393A3B] max-h-60 group">
                  <img src={mediaUrl} alt="Upload preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setMediaUrl('')}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Feeling Picker Drawer */}
              {showFeelingPicker && (
                <div className="p-3 bg-gray-50 dark:bg-[#18191A] rounded-xl border border-gray-200 dark:border-[#393A3B]">
                  <div className="text-xs font-bold text-gray-500 mb-2">How are you feeling?</div>
                  <div className="grid grid-cols-4 gap-2">
                    {feelings.map((f) => (
                      <button
                        key={f.label}
                        onClick={() => {
                          setFeeling(f.label);
                          setShowFeelingPicker(false);
                        }}
                        className={`flex items-center gap-1.5 p-2 rounded-lg text-xs font-medium border ${
                          feeling === f.label
                            ? 'bg-blue-50 border-[#1877F2] text-[#1877F2]'
                            : 'bg-white dark:bg-[#242526] border-gray-200 dark:border-[#393A3B]'
                        }`}
                      >
                        <span>{f.emoji}</span>
                        <span className="capitalize">{f.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sample Images Picker / Upload */}
              <div className="p-3 border border-gray-200 dark:border-[#393A3B] rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Add Media to your post:
                  </span>
                  <label className="text-xs text-[#1877F2] font-bold cursor-pointer hover:underline flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload from device</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {sampleImages.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt=""
                      onClick={() => setMediaUrl(img)}
                      className={`h-12 w-full object-cover rounded-md cursor-pointer transition-all ${
                        mediaUrl === img ? 'ring-2 ring-[#1877F2] scale-95' : 'hover:opacity-80'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Hashtag suggestions */}
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase">Tags:</span>
                {['#TaimoorSocial', '#WebDev', '#Connect', '#FullStack', '#Design'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleAddHashtag(tag)}
                    className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-[#1877F2] dark:bg-blue-950/60 font-medium hover:bg-blue-100 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Post Button */}
            <div className="pt-3 border-t border-gray-100 dark:border-[#393A3B]">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || (!content.trim() && !mediaUrl)}
                className="w-full py-2.5 rounded-lg bg-[#1877F2] hover:bg-[#166FE5] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md transition-colors cursor-pointer"
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
