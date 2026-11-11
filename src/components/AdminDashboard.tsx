import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Users, MessageSquare, ThumbsUp, AlertTriangle,
  Trash2, UserX, UserCheck, Shield, RefreshCw, ArrowLeft,
  CheckCircle, XCircle, Search
} from 'lucide-react';
import { AdminStats, User, Report, Post } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface AdminDashboardProps {
  onBack: () => void;
  onOpenProfile: (userId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, onOpenProfile }) => {
  const { user, token } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'reports' | 'posts'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [reportsList, setReportsList] = useState<Report[]>([]);
  const [postsList, setPostsList] = useState<Post[]>([]);
  const [searchUser, setSearchUser] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [statsRes, usersRes, reportsRes, postsRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/reports', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/posts', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (usersRes.ok) setUsersList(await usersRes.json());
      if (reportsRes.ok) setReportsList(await reportsRes.json());
      if (postsRes.ok) setPostsList(await postsRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  const handleToggleBlock = async (targetUser: User) => {
    if (!token) return;
    const newStatus = !targetUser.isBlocked;
    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isBlocked: newStatus })
      });
      if (res.ok) fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleRole = async (targetUser: User) => {
    if (!token) return;
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Permanently delete this user and all their posts?')) return;
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolveReport = async (reportId: string, status: 'resolved' | 'dismissed', action?: 'delete_content') => {
    if (!token) return;
    try {
      await fetch(`/api/admin/reports/${reportId}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, action })
      });
      fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    if (!token) return;
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredUsers = usersList.filter(u =>
    u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.username.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#E4E6EB] dark:border-[#393A3B] gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#3A3B3C] cursor-pointer"
            title="Back to feed"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-[#1877F2]" />
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
                Admin Control Dashboard
              </h1>
            </div>
            <p className="text-xs text-gray-500">
              TAIMOOR SOCIAL platform moderation and analytics
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#E4E6EB]/70 dark:bg-[#3A3B3C] p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'overview' ? 'bg-white dark:bg-[#242526] text-[#1877F2] shadow-xs' : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'users' ? 'bg-white dark:bg-[#242526] text-[#1877F2] shadow-xs' : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            Users ({usersList.length})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'reports' ? 'bg-white dark:bg-[#242526] text-[#1877F2] shadow-xs' : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            Reports ({reportsList.length})
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'posts' ? 'bg-white dark:bg-[#242526] text-[#1877F2] shadow-xs' : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            All Posts ({postsList.length})
          </button>
        </div>
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-[#1877F2]' },
              { label: 'Active Users', value: stats?.activeUsers || 0, icon: UserCheck, color: 'text-emerald-500' },
              { label: 'Total Posts', value: stats?.totalPosts || 0, icon: MessageSquare, color: 'text-indigo-500' },
              { label: 'Total Comments', value: stats?.totalComments || 0, icon: ThumbsUp, color: 'text-amber-500' },
              { label: 'Friendships', value: stats?.totalFriends || 0, icon: Users, color: 'text-teal-500' },
              { label: 'Reports', value: stats?.totalReports || 0, icon: AlertTriangle, color: 'text-rose-500' }
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="bg-white dark:bg-[#242526] p-4 rounded-xl border border-[#E4E6EB] dark:border-[#393A3B] shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-gray-500 uppercase">{s.label}</span>
                    <Icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <div className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{s.value}</div>
                </div>
              );
            })}
          </div>

          {/* System Info Banner */}
          <div className="bg-white dark:bg-[#242526] p-6 rounded-2xl border border-[#E4E6EB] dark:border-[#393A3B] shadow-xs">
            <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 mb-2">
              Platform Status: Operational 🟢
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              TAIMOOR SOCIAL backend is running on Node.js/Express with WebSocket Socket.IO real-time delivery and JSON data storage. All user sessions, posts, friendships, and messages are synchronized.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-gray-50 dark:bg-[#18191A] rounded-xl border border-gray-100 dark:border-[#393A3B]">
                <span className="text-gray-400 block text-[10px]">LEAD ARCHITECT</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">Taimoor Khan (Founder)</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-[#18191A] rounded-xl border border-gray-100 dark:border-[#393A3B]">
                <span className="text-gray-400 block text-[10px]">AUTHENTICATION</span>
                <span className="font-bold text-emerald-600">JWT & bcrypt Hashing</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-[#18191A] rounded-xl border border-gray-100 dark:border-[#393A3B]">
                <span className="text-gray-400 block text-[10px]">REAL-TIME CHAT</span>
                <span className="font-bold text-[#1877F2]">Socket.IO WebSockets</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Users Management */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-[#242526] rounded-2xl border border-[#E4E6EB] dark:border-[#393A3B] p-4 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base text-gray-900 dark:text-gray-100">
              Registered Users Directory
            </h2>
            <div className="flex items-center bg-[#F0F2F5] dark:bg-[#3A3B3C] rounded-lg px-3 py-1.5 text-xs w-64">
              <Search className="w-3.5 h-3.5 text-gray-400 mr-2" />
              <input
                type="text"
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                placeholder="Search user by name or email..."
                className="bg-transparent border-none outline-none w-full"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-[#18191A] text-gray-500 font-bold uppercase text-[10px] border-b border-gray-200 dark:border-[#393A3B]">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Joined</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#393A3B]">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-[#3A3B3C]/50">
                    <td className="p-3">
                      <div
                        onClick={() => onOpenProfile(u.id)}
                        className="flex items-center gap-2.5 cursor-pointer"
                      >
                        <img src={u.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <span className="font-bold text-gray-900 dark:text-gray-100 block">
                            {u.name}
                          </span>
                          <span className="text-[10px] text-gray-400">@{u.username}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">{u.email}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleRole(u)}
                        disabled={u.id === user?.id}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'admin'
                            ? 'bg-blue-100 text-[#1877F2]'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {u.role.toUpperCase()}
                      </button>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.isBlocked
                          ? 'bg-rose-100 text-rose-600'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {u.isBlocked ? 'SUSPENDED' : 'ACTIVE'}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500">{u.joinedDate}</td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleToggleBlock(u)}
                        disabled={u.id === user?.id}
                        className={`px-2.5 py-1 rounded text-xs font-semibold ${
                          u.isBlocked
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        }`}
                      >
                        {u.isBlocked ? 'Unblock' : 'Block'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        disabled={u.id === user?.id}
                        className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded"
                        title="Delete User"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Reports */}
      {activeTab === 'reports' && (
        <div className="bg-white dark:bg-[#242526] rounded-2xl border border-[#E4E6EB] dark:border-[#393A3B] p-4 shadow-xs">
          <h2 className="font-bold text-base text-gray-900 dark:text-gray-100 mb-4">
            Moderation Reports ({reportsList.length})
          </h2>

          {reportsList.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No pending reports</p>
              <p className="text-xs text-gray-400">All user-flagged content has been addressed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reportsList.map((rep) => (
                <div
                  key={rep.id}
                  className="p-4 rounded-xl border border-gray-200 dark:border-[#393A3B] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-rose-600 uppercase">
                        [{rep.targetType}]
                      </span>
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                        Reason: {rep.reason}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        rep.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {rep.status}
                      </span>
                    </div>
                    {rep.targetContent && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 italic bg-gray-50 dark:bg-[#18191A] p-2 rounded">
                        "{rep.targetContent}"
                      </p>
                    )}
                    <span className="text-[10px] text-gray-400 block">
                      Reported by {rep.reportedByName} on {new Date(rep.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {rep.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleResolveReport(rep.id, 'resolved', 'delete_content')}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
                        >
                          Delete Content
                        </button>
                        <button
                          onClick={() => handleResolveReport(rep.id, 'dismissed')}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold"
                        >
                          Dismiss
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: All Posts */}
      {activeTab === 'posts' && (
        <div className="bg-white dark:bg-[#242526] rounded-2xl border border-[#E4E6EB] dark:border-[#393A3B] p-4 shadow-xs">
          <h2 className="font-bold text-base text-gray-900 dark:text-gray-100 mb-4">
            All Feed Posts ({postsList.length})
          </h2>

          <div className="space-y-3">
            {postsList.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-xl border border-gray-200 dark:border-[#393A3B] flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <img src={p.userAvatar} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-gray-900 dark:text-gray-100">{p.userName}</span>
                      <span className="text-[10px] text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-gray-800 dark:text-gray-200 line-clamp-2 mt-1">
                      {p.content}
                    </p>
                    <div className="text-[11px] text-gray-400 mt-1">
                      {Object.keys(p.reactions || {}).length} reactions • {p.commentsCount || 0} comments
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeletePost(p.id)}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg shrink-0 cursor-pointer"
                  title="Delete post"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
