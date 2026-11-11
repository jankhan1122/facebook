import React, { useState } from 'react';
import {
  ThumbsUp, MessageCircle, Share2, MoreHorizontal, Globe,
  Users, Lock, Bookmark, Trash2, Edit3, Flag, Copy, Check,
  Send, Image as ImageIcon, CornerDownRight, X
} from 'lucide-react';
import { Post, ReactionType, Comment } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface PostCardProps {
  post: Post;
  onPostUpdated: () => void;
  onOpenProfile: (userId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onPostUpdated,
  onOpenProfile
}) => {
  const { user, token } = useAuth();

  // Menu & Modals
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Inappropriate content');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Reactions
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [currentReactions, setCurrentReactions] = useState<Record<string, ReactionType>>(post.reactions || {});

  // Comments
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [commentsCount, setCommentsCount] = useState<number>(post.commentsCount || 0);
  const [showComments, setShowComments] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(!!post.isSaved);

  const myReaction: ReactionType | undefined = user ? currentReactions[user.id] : undefined;

  const reactionDetails: Record<ReactionType, { label: string; emoji: string; color: string }> = {
    like: { label: 'Like', emoji: '👍', color: 'text-[#1877F2]' },
    love: { label: 'Love', emoji: '❤️', color: 'text-rose-500' },
    care: { label: 'Care', emoji: '🥰', color: 'text-amber-500' },
    haha: { label: 'Haha', emoji: '😆', color: 'text-amber-500' },
    wow: { label: 'Wow', emoji: '😮', color: 'text-amber-500' },
    sad: { label: 'Sad', emoji: '😢', color: 'text-amber-500' },
    angry: { label: 'Angry', emoji: '😡', color: 'text-rose-600' }
  };

  const handleReact = async (reaction: ReactionType) => {
    if (!token || !user) return;
    setShowReactionPicker(false);

    const isRemoving = myReaction === reaction;
    const nextReactions = { ...currentReactions };
    if (isRemoving) {
      delete nextReactions[user.id];
    } else {
      nextReactions[user.id] = reaction;
    }
    setCurrentReactions(nextReactions);

    try {
      await fetch(`/api/posts/${post.id}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reaction: isRemoving ? 'remove' : reaction })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleSave = async () => {
    if (!token) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/save`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIsSaved(data.isSaved);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
      setIsMenuOpen(false);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    if (!token) return;
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        onPostUpdated();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveEdit = async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: editContent })
      });
      if (res.ok) {
        setIsEditing(false);
        onPostUpdated();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleShare = async () => {
    if (!token) return;
    const quote = prompt('Add a caption to your shared post (optional):') || '';
    try {
      const res = await fetch(`/api/posts/${post.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ quote })
      });
      if (res.ok) {
        alert('Post shared to your timeline!');
        onPostUpdated();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.origin + `#post-${post.id}`);
    setCopiedLink(true);
    setTimeout(() => {
      setCopiedLink(false);
      setIsMenuOpen(false);
    }, 1500);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !token || !user) return;

    try {
      const res = await fetch(`/api/posts/${post.id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: commentText.trim(),
          parentCommentId: replyToId || undefined
        })
      });

      if (res.ok) {
        const newComm = await res.json();
        if (replyToId) {
          setComments(prev =>
            prev.map(c => {
              if (c.id === replyToId) {
                return { ...c, replies: [...(c.replies || []), newComm] };
              }
              return c;
            })
          );
        } else {
          setComments(prev => [...prev, newComm]);
        }
        setCommentsCount(prev => prev + 1);
        setCommentText('');
        setReplyToId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/posts/${post.id}/comment/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId));
        setCommentsCount(prev => Math.max(0, prev - 1));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReport = async () => {
    if (!token) return;
    try {
      await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          targetType: 'post',
          targetId: post.id,
          targetContent: post.content,
          reason: reportReason
        })
      });
      alert('Post reported to administrators for review.');
      setIsReportOpen(false);
      setIsMenuOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  // Reactions calculations
  const totalReactions = Object.keys(currentReactions).length;
  const uniqueReactionTypes = Array.from(new Set(Object.values(currentReactions)));

  const isAuthor = user?.id === post.userId;
  const isAdmin = user?.role === 'admin';

  return (
    <article className="bg-white dark:bg-[#242526] rounded-xl shadow-xs border border-[#E4E6EB] dark:border-[#393A3B] mb-4 overflow-hidden">
      {/* Post Header */}
      <div className="p-3 sm:p-4 flex items-start justify-between relative">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenProfile(post.userId)}
            className="w-10 h-10 rounded-full overflow-hidden cursor-pointer hover:opacity-90 transition-opacity shrink-0"
          >
            <img
              src={post.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
              alt={post.userName}
              className="w-full h-full object-cover"
            />
          </button>
          <div>
            <div className="flex items-center flex-wrap gap-1 leading-snug">
              <button
                onClick={() => onOpenProfile(post.userId)}
                className="font-bold text-sm text-gray-900 dark:text-gray-100 hover:underline cursor-pointer"
              >
                {post.userName}
              </button>
              {post.feeling && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  is feeling <span className="font-semibold text-gray-700 dark:text-gray-200">{post.feeling}</span>
                </span>
              )}
              {post.groupName && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  in <span className="font-semibold text-[#1877F2]">{post.groupName}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span>{new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              <span>•</span>
              {post.privacy === 'public' && <Globe className="w-3 h-3" />}
              {post.privacy === 'friends' && <Users className="w-3 h-3" />}
              {post.privacy === 'only_me' && <Lock className="w-3 h-3" />}
            </div>
          </div>
        </div>

        {/* 3-Dots Menu */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-[#3A3B3C] flex items-center justify-center text-gray-500 dark:text-gray-400 cursor-pointer"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-9 w-52 bg-white dark:bg-[#242526] rounded-xl shadow-xl border border-gray-200 dark:border-[#393A3B] p-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
              <button
                onClick={handleToggleSave}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] rounded-lg"
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#1877F2] text-[#1877F2]' : ''}`} />
                <span>{isSaved ? 'Unsave post' : 'Save post'}</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] rounded-lg"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Link copied!' : 'Copy post link'}</span>
              </button>

              {(isAuthor || isAdmin) && (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] rounded-lg"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit post</span>
                  </button>

                  <button
                    onClick={handleDeletePost}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete post</span>
                  </button>
                </>
              )}

              <button
                onClick={() => setIsReportOpen(true)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] rounded-lg border-t border-gray-100 dark:border-[#393A3B] mt-1 pt-1.5"
              >
                <Flag className="w-4 h-4" />
                <span>Report post</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Post Content Body */}
      <div className="px-3 sm:px-4 pb-2">
        {isEditing ? (
          <div className="space-y-2 mb-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              className="w-full p-2.5 text-sm rounded-lg border border-gray-300 dark:border-[#393A3B] bg-transparent text-gray-900 dark:text-gray-100 outline-none focus:border-[#1877F2]"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1 text-xs font-bold text-white bg-[#1877F2] rounded"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm sm:text-base text-gray-900 dark:text-gray-100 whitespace-pre-line leading-relaxed">
            {post.content}
          </p>
        )}
      </div>

      {/* Media Attachment (Photo or Video) */}
      {post.mediaUrl && (
        <div
          onClick={() => setIsLightboxOpen(true)}
          className="cursor-pointer overflow-hidden bg-black/5 dark:bg-black/40 border-y border-gray-100 dark:border-[#393A3B]"
        >
          <img
            src={post.mediaUrl}
            alt="Post media"
            className="w-full max-h-[500px] object-cover hover:opacity-98 transition-opacity"
            loading="lazy"
          />
        </div>
      )}

      {/* Reactions & Comments Counter Summary */}
      <div className="px-3 sm:px-4 py-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-b border-[#E4E6EB] dark:border-[#393A3B]">
        <div className="flex items-center gap-1.5">
          {totalReactions > 0 ? (
            <>
              <div className="flex -space-x-1 items-center">
                {uniqueReactionTypes.slice(0, 3).map((r) => (
                  <span
                    key={r}
                    className="w-5 h-5 rounded-full bg-white dark:bg-[#242526] flex items-center justify-center text-xs shadow-xs ring-1 ring-white"
                  >
                    {reactionDetails[r]?.emoji}
                  </span>
                ))}
              </div>
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {myReaction ? (totalReactions === 1 ? 'You' : `You and ${totalReactions - 1} others`) : totalReactions}
              </span>
            </>
          ) : (
            <span>Be the first to react</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowComments(!showComments)}
            className="hover:underline cursor-pointer"
          >
            {commentsCount} comments
          </button>
          <span>•</span>
          <button onClick={handleShare} className="hover:underline cursor-pointer">
            {post.sharesCount || 0} shares
          </button>
        </div>
      </div>

      {/* Action Buttons (Like / Comment / Share) */}
      <div className="px-2 py-1 flex items-center justify-between relative border-b border-[#E4E6EB] dark:border-[#393A3B]">
        {/* Floating Reaction Picker on Hover or Hold */}
        {showReactionPicker && (
          <div
            onMouseEnter={() => setShowReactionPicker(true)}
            onMouseLeave={() => setShowReactionPicker(false)}
            className="absolute -top-12 left-1 sm:left-2 z-30 bg-white dark:bg-[#242526] shadow-2xl rounded-full px-2 py-1.5 flex items-center gap-1 sm:gap-2 border border-gray-200 dark:border-[#393A3B] reaction-pop max-w-[calc(100vw-20px)]"
          >
            {(Object.keys(reactionDetails) as ReactionType[]).map((r) => (
              <button
                key={r}
                onClick={() => handleReact(r)}
                className="transform hover:scale-130 active:scale-125 transition-transform duration-150 p-1 text-lg sm:text-xl cursor-pointer"
                title={reactionDetails[r].label}
              >
                {reactionDetails[r].emoji}
              </button>
            ))}
          </div>
        )}

        {/* Like Button */}
        <div
          className="relative flex-1"
          onMouseEnter={() => setShowReactionPicker(true)}
          onMouseLeave={() => setShowReactionPicker(false)}
          onTouchStart={() => {
            // Mobile touch: quick hold to show reactions
            const timer = setTimeout(() => setShowReactionPicker(true), 350);
            (window as any)._touchTimer = timer;
          }}
          onTouchEnd={() => {
            if ((window as any)._touchTimer) clearTimeout((window as any)._touchTimer);
          }}
        >
          <button
            onClick={() => handleReact(myReaction || 'like')}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg font-semibold text-xs sm:text-sm hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C] transition-colors cursor-pointer ${
              myReaction ? reactionDetails[myReaction].color : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            {myReaction ? (
              <span className="text-base">{reactionDetails[myReaction].emoji}</span>
            ) : (
              <ThumbsUp className="w-5 h-5 stroke-[2]" />
            )}
            <span>{myReaction ? reactionDetails[myReaction].label : 'Like'}</span>
          </button>
        </div>

        {/* Comment Button */}
        <button
          onClick={() => setShowComments(true)}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-semibold text-xs sm:text-sm text-gray-600 dark:text-gray-300 hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C] transition-colors cursor-pointer"
        >
          <MessageCircle className="w-5 h-5 stroke-[2]" />
          <span>Comment</span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-semibold text-xs sm:text-sm text-gray-600 dark:text-gray-300 hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C] transition-colors cursor-pointer"
        >
          <Share2 className="w-5 h-5 stroke-[2]" />
          <span>Share</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="p-3 sm:p-4 bg-gray-50/50 dark:bg-[#1E1F20]/50 space-y-3">
          {/* Add Comment Input Bar */}
          <form onSubmit={handleAddComment} className="flex items-start gap-2">
            <img
              src={user?.avatar}
              alt={user?.name}
              className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5"
            />
            <div className="flex-1 relative">
              {replyToId && (
                <div className="text-[11px] text-gray-500 mb-1 flex items-center justify-between bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
                  <span>Replying to comment...</span>
                  <button onClick={() => setReplyToId(null)} className="font-bold text-gray-400 hover:text-gray-600">×</button>
                </div>
              )}
              <div className="flex items-center bg-[#F0F2F5] dark:bg-[#3A3B3C] rounded-2xl px-3 py-1.5 border border-transparent focus-within:border-gray-300">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="bg-transparent border-none outline-none w-full text-xs sm:text-sm text-gray-800 dark:text-gray-200 placeholder-gray-500"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="text-[#1877F2] hover:text-[#166FE5] disabled:opacity-40 ml-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-3 pt-1">
            {comments.map((comm) => (
              <div key={comm.id} className="space-y-2">
                <div className="flex items-start gap-2 group">
                  <button
                    onClick={() => onOpenProfile(comm.userId)}
                    className="w-8 h-8 rounded-full overflow-hidden shrink-0 mt-0.5"
                  >
                    <img src={comm.userAvatar} alt="" className="w-full h-full object-cover" />
                  </button>
                  <div className="flex-1">
                    <div className="bg-[#F0F2F5] dark:bg-[#3A3B3C] rounded-2xl px-3 py-2 w-fit max-w-[90%]">
                      <button
                        onClick={() => onOpenProfile(comm.userId)}
                        className="font-bold text-xs text-gray-900 dark:text-gray-100 hover:underline block cursor-pointer"
                      >
                        {comm.userName}
                      </button>
                      <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                        {comm.content}
                      </p>
                    </div>

                    {/* Comment sub-actions */}
                    <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400 mt-1 ml-2">
                      <button
                        onClick={() => {
                          setReplyToId(comm.id);
                        }}
                        className="font-bold hover:underline cursor-pointer"
                      >
                        Reply
                      </button>
                      <span>{new Date(comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {(comm.userId === user?.id || isAuthor || isAdmin) && (
                        <button
                          onClick={() => handleDeleteComment(comm.id)}
                          className="opacity-0 group-hover:opacity-100 text-rose-500 hover:underline cursor-pointer"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Nested Replies */}
                {comm.replies && comm.replies.length > 0 && (
                  <div className="ml-10 space-y-2 border-l-2 border-gray-200 dark:border-[#393A3B] pl-3">
                    {comm.replies.map((reply) => (
                      <div key={reply.id} className="flex items-start gap-2 group">
                        <button
                          onClick={() => onOpenProfile(reply.userId)}
                          className="w-7 h-7 rounded-full overflow-hidden shrink-0 mt-0.5"
                        >
                          <img src={reply.userAvatar} alt="" className="w-full h-full object-cover" />
                        </button>
                        <div className="flex-1">
                          <div className="bg-[#F0F2F5] dark:bg-[#3A3B3C] rounded-2xl px-3 py-1.5 w-fit max-w-[90%]">
                            <button
                              onClick={() => onOpenProfile(reply.userId)}
                              className="font-bold text-xs text-gray-900 dark:text-gray-100 hover:underline block"
                            >
                              {reply.userName}
                            </button>
                            <p className="text-xs text-gray-800 dark:text-gray-200">{reply.content}</p>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5 ml-2">
                            <span>{new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {(reply.userId === user?.id || isAuthor || isAdmin) && (
                              <button
                                onClick={() => handleDeleteComment(reply.id)}
                                className="opacity-0 group-hover:opacity-100 text-rose-500 hover:underline"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && post.mediaUrl && (
        <div
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm cursor-zoom-out"
        >
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={post.mediaUrl}
            alt=""
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}

      {/* Report Modal */}
      {isReportOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#242526] rounded-xl max-w-sm w-full p-5 shadow-2xl border border-gray-200 dark:border-[#393A3B]">
            <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 mb-2">Report Post</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Why are you reporting this post to TAIMOOR SOCIAL moderation?
            </p>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-[#393A3B] bg-transparent text-xs text-gray-800 dark:text-gray-200 mb-4"
            >
              <option value="Inappropriate content">Inappropriate content</option>
              <option value="Harassment or bullying">Harassment or bullying</option>
              <option value="Spam or scam">Spam or scam</option>
              <option value="False information">False information</option>
              <option value="Hate speech">Hate speech</option>
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsReportOpen(false)}
                className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};
