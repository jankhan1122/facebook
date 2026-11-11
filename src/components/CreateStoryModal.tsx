import React, { useState } from 'react';
import { X, Image, Type, Sparkles, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated: () => void;
}

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  isOpen,
  onClose,
  onStoryCreated
}) => {
  const { token } = useAuth();
  const [storyType, setStoryType] = useState<'photo' | 'text'>('photo');
  const [textContent, setTextContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [selectedGradient, setSelectedGradient] = useState('from-blue-600 via-indigo-600 to-purple-700');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const samplePhotos = [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80'
  ];

  const gradients = [
    'from-blue-600 via-indigo-600 to-purple-700',
    'from-rose-500 via-pink-600 to-purple-600',
    'from-amber-500 via-orange-600 to-red-600',
    'from-emerald-500 via-teal-600 to-cyan-700',
    'from-gray-900 via-purple-900 to-violet-950'
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

  const handleSubmit = async () => {
    if (storyType === 'photo' && !mediaUrl) return;
    if (storyType === 'text' && !textContent.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          mediaUrl: storyType === 'photo' ? mediaUrl : undefined,
          textContent: textContent.trim() || undefined,
          backgroundGradient: storyType === 'text' ? selectedGradient : undefined
        })
      });

      if (res.ok) {
        onStoryCreated();
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#242526] rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-gray-200 dark:border-[#393A3B] relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#393A3B]">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Create a Story</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#3A3B3C]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Story Type Selector */}
        <div className="flex gap-3 my-4">
          <button
            onClick={() => setStoryType('photo')}
            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all border ${
              storyType === 'photo'
                ? 'bg-blue-50 border-[#1877F2] text-[#1877F2] dark:bg-blue-950/60 dark:text-blue-300'
                : 'border-gray-200 dark:border-[#393A3B] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#3A3B3C]'
            }`}
          >
            <Image className="w-5 h-5" />
            Photo Story
          </button>
          <button
            onClick={() => setStoryType('text')}
            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all border ${
              storyType === 'text'
                ? 'bg-blue-50 border-[#1877F2] text-[#1877F2] dark:bg-blue-950/60 dark:text-blue-300'
                : 'border-gray-200 dark:border-[#393A3B] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#3A3B3C]'
            }`}
          >
            <Type className="w-5 h-5" />
            Text Story
          </button>
        </div>

        {/* Photo Story Options */}
        {storyType === 'photo' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Upload Image or Pick a Sample:
              </label>
              <label className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-[#1877F2] transition-colors">
                <Upload className="w-5 h-5 text-gray-500" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  {mediaUrl ? 'Change selected image' : 'Click to upload photo'}
                </span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {/* Sample selection */}
            <div>
              <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase">Or select demo photo:</span>
              <div className="grid grid-cols-4 gap-2 mt-1.5">
                {samplePhotos.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    onClick={() => setMediaUrl(url)}
                    className={`h-16 w-full object-cover rounded-lg cursor-pointer transition-all ${
                      mediaUrl === url ? 'ring-3 ring-[#1877F2] scale-95' : 'hover:opacity-80'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Optional caption */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Story Caption (optional)
              </label>
              <input
                type="text"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Add a comment to your story..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-[#393A3B] bg-transparent text-gray-900 dark:text-gray-100 outline-none focus:border-[#1877F2]"
              />
            </div>
          </div>
        ) : (
          /* Text Story Options */
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Story Message
              </label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={3}
                placeholder="Start typing your story..."
                className="w-full p-3 text-sm rounded-xl border border-gray-300 dark:border-[#393A3B] bg-transparent text-gray-900 dark:text-gray-100 outline-none focus:border-[#1877F2] resize-none"
              />
            </div>

            {/* Gradient Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Choose Gradient Background:
              </label>
              <div className="flex gap-2">
                {gradients.map((grad, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedGradient(grad)}
                    className={`h-9 w-9 rounded-full bg-linear-to-tr ${grad} transition-all cursor-pointer ${
                      selectedGradient === grad ? 'ring-3 ring-offset-2 ring-[#1877F2] scale-110' : 'hover:scale-105'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Live Preview */}
            <div className={`w-full h-32 rounded-xl bg-linear-to-br ${selectedGradient} flex items-center justify-center p-4 text-center text-white font-bold text-sm shadow-inner`}>
              {textContent || 'Preview of your story will appear here'}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-gray-100 dark:border-[#393A3B]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (storyType === 'photo' && !mediaUrl) || (storyType === 'text' && !textContent.trim())}
            className="px-5 py-2 text-xs font-bold text-white bg-[#1877F2] hover:bg-[#166FE5] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm cursor-pointer"
          >
            {isSubmitting ? 'Sharing...' : 'Share to Story'}
          </button>
        </div>
      </div>
    </div>
  );
};
