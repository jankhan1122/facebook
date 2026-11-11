import React, { useState, useEffect } from 'react';
import {
  Users2, Plus, Globe, Lock, Shield, ArrowLeft, MessageSquare,
  Search, Check, UserPlus
} from 'lucide-react';
import { Group, Post, User } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { CreatePostBox } from './CreatePostBox.tsx';
import { PostCard } from './PostCard.tsx';

interface GroupsViewProps {
  onOpenProfile: (userId: string) => void;
}

export const GroupsView: React.FC<GroupsViewProps> = ({ onOpenProfile }) => {
  const { user, token } = useAuth();

  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedGroupData, setSelectedGroupData] = useState<{
    group: Group & { isMember: boolean; isAdmin: boolean };
    members: User[];
    posts: Post[];
  } | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupPrivacy, setNewGroupPrivacy] = useState<'public' | 'private'>('public');

  const fetchGroups = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/groups', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchGroupDetails = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/groups/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedGroupData(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [token]);

  useEffect(() => {
    if (selectedGroupId) {
      fetchGroupDetails(selectedGroupId);
    } else {
      setSelectedGroupData(null);
    }
  }, [selectedGroupId, token]);

  const handleJoinGroup = async (groupId: string) => {
    if (!token) return;
    try {
      await fetch(`/api/groups/${groupId}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchGroups();
      if (selectedGroupId === groupId) fetchGroupDetails(groupId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!confirm('Leave this group?')) return;
    if (!token) return;
    try {
      await fetch(`/api/groups/${groupId}/leave`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchGroups();
      if (selectedGroupId === groupId) fetchGroupDetails(groupId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !token) return;

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newGroupName.trim(),
          description: newGroupDesc.trim(),
          privacy: newGroupPrivacy
        })
      });

      if (res.ok) {
        const created = await res.json();
        setIsCreateOpen(false);
        setNewGroupName('');
        setNewGroupDesc('');
        fetchGroups();
        setSelectedGroupId(created.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 select-none">
      {/* If a group is selected, show group feed */}
      {selectedGroupId && selectedGroupData ? (
        <div className="space-y-4">
          <button
            onClick={() => setSelectedGroupId(null)}
            className="flex items-center gap-2 text-xs font-bold text-[#1877F2] hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Groups</span>
          </button>

          {/* Group Header Banner */}
          <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-xs border border-[#E4E6EB] dark:border-[#393A3B] overflow-hidden">
            <div className="h-44 sm:h-60 w-full overflow-hidden bg-gray-200">
              <img
                src={selectedGroupData.group.coverImage}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  {selectedGroupData.group.name}
                  {selectedGroupData.group.privacy === 'public' ? (
                    <Globe className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Lock className="w-4 h-4 text-gray-400" />
                  )}
                </h1>
                <p className="text-xs text-gray-500 mt-1 max-w-xl">
                  {selectedGroupData.group.description}
                </p>
                <div className="text-xs font-semibold text-gray-400 mt-1">
                  {selectedGroupData.members.length} members • {selectedGroupData.group.privacy} group
                </div>
              </div>

              <div>
                {selectedGroupData.group.isMember ? (
                  <button
                    onClick={() => handleLeaveGroup(selectedGroupData.group.id)}
                    className="px-4 py-2 bg-gray-200 dark:bg-[#3A3B3C] hover:bg-gray-300 text-gray-800 dark:text-gray-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Joined (Leave)
                  </button>
                ) : (
                  <button
                    onClick={() => handleJoinGroup(selectedGroupData.group.id)}
                    className="px-5 py-2 bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    + Join Group
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Group Posts & Content */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8 space-y-4">
              {selectedGroupData.group.isMember && (
                <CreatePostBox
                  onPostCreated={() => fetchGroupDetails(selectedGroupId)}
                  groupId={selectedGroupData.group.id}
                  groupName={selectedGroupData.group.name}
                />
              )}

              {selectedGroupData.posts.length === 0 ? (
                <div className="bg-white dark:bg-[#242526] rounded-xl p-8 text-center border border-[#E4E6EB] dark:border-[#393A3B]">
                  <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">No posts in this group yet. Be the first to start a conversation!</p>
                </div>
              ) : (
                selectedGroupData.posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onPostUpdated={() => fetchGroupDetails(selectedGroupId)}
                    onOpenProfile={onOpenProfile}
                  />
                ))
              )}
            </div>

            {/* Members List */}
            <div className="md:col-span-4">
              <div className="bg-white dark:bg-[#242526] rounded-xl p-4 shadow-xs border border-[#E4E6EB] dark:border-[#393A3B]">
                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-3">
                  Members ({selectedGroupData.members.length})
                </h3>
                <div className="space-y-2">
                  {selectedGroupData.members.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => onOpenProfile(m.id)}
                      className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-[#3A3B3C] cursor-pointer"
                    >
                      <img src={m.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                      <div className="truncate">
                        <span className="font-bold text-xs text-gray-800 dark:text-gray-200 block truncate">
                          {m.name}
                        </span>
                        <span className="text-[10px] text-gray-400 block truncate">@{m.username}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Explore Groups List */
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E4E6EB] dark:border-[#393A3B] mb-6">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">Groups</h1>
              <p className="text-xs text-gray-500">Connect with communities who share your passions</p>
            </div>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Group</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {groups.map((group) => (
              <div
                key={group.id}
                className="bg-white dark:bg-[#242526] rounded-2xl overflow-hidden shadow-xs border border-[#E4E6EB] dark:border-[#393A3B] flex flex-col justify-between"
              >
                <div>
                  <div className="h-36 overflow-hidden bg-gray-100">
                    <img
                      src={group.coverImage}
                      alt=""
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3
                      onClick={() => setSelectedGroupId(group.id)}
                      className="font-bold text-base text-gray-900 dark:text-gray-100 cursor-pointer hover:text-[#1877F2] transition-colors"
                    >
                      {group.name}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                      {group.description}
                    </p>
                    <div className="text-[11px] font-medium text-gray-400 mt-2">
                      {group.memberIds?.length || 1} members • {group.privacy}
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedGroupId(group.id)}
                      className="flex-1 py-2 bg-[#F0F2F5] dark:bg-[#3A3B3C] hover:bg-[#E4E6EB] font-bold text-xs text-gray-800 dark:text-gray-200 rounded-xl transition-colors cursor-pointer"
                    >
                      View Group
                    </button>
                    {group.isMember ? (
                      <button
                        onClick={() => handleLeaveGroup(group.id)}
                        className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-xs"
                      >
                        Leave
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinGroup(group.id)}
                        className="px-4 py-2 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-xl font-bold text-xs shadow-xs"
                      >
                        Join
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateGroup}
            className="bg-white dark:bg-[#242526] rounded-2xl max-w-md w-full p-5 shadow-2xl border border-gray-200 dark:border-[#393A3B] space-y-4"
          >
            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">Create Group</h3>

            <div>
              <label className="block text-xs font-semibold mb-1">Group Name</label>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g. Next.js & React Developers"
                required
                className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-[#393A3B] bg-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Description</label>
              <textarea
                value={newGroupDesc}
                onChange={(e) => setNewGroupDesc(e.target.value)}
                placeholder="What is this group about?"
                rows={3}
                className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-[#393A3B] bg-transparent text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Privacy</label>
              <select
                value={newGroupPrivacy}
                onChange={(e) => setNewGroupPrivacy(e.target.value as any)}
                className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-[#393A3B] bg-transparent text-sm"
              >
                <option value="public" className="bg-white dark:bg-[#242526]">Public (Anyone can see members & posts)</option>
                <option value="private" className="bg-white dark:bg-[#242526]">Private (Only members can see posts)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-[#393A3B]">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newGroupName.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-[#1877F2] hover:bg-[#166FE5] disabled:opacity-50 rounded-lg shadow-xs"
              >
                Create Group
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
