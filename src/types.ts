export type ReactionType = 'like' | 'love' | 'care' | 'haha' | 'wow' | 'sad' | 'angry';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  coverPhoto: string;
  bio: string;
  work?: string;
  education?: string;
  location?: string;
  relationshipStatus?: string;
  birthday?: string;
  gender?: string;
  joinedDate: string;
  role: 'user' | 'admin';
  isBlocked?: boolean;
  friendsCount?: number;
  followersCount?: number;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  mediaUrl?: string;
  createdAt: string;
  likes: string[]; // userIds
  replies?: Comment[];
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  privacy: 'public' | 'friends' | 'only_me';
  feeling?: string;
  location?: string;
  taggedFriends?: string[];
  hashtags?: string[];
  groupId?: string;
  groupName?: string;
  createdAt: string;
  reactions: Record<string, ReactionType>; // userId -> ReactionType
  commentsCount: number;
  comments: Comment[];
  sharesCount: number;
  isSaved?: boolean;
}

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  mediaUrl?: string;
  textContent?: string;
  backgroundGradient?: string;
  createdAt: string;
  expiresAt: string;
  viewers: string[]; // userIds
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string;
  toUserId: string;
  createdAt: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  mediaUrl?: string;
  fileType?: string;
  createdAt: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participants: string[]; // userIds
  lastMessage?: string;
  lastMessageTime?: string;
  lastMessageSenderId?: string;
  unreadCount?: number;
  otherUser?: User;
}

export interface Notification {
  id: string;
  userId: string; // recipient
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string;
  type: 'like' | 'comment' | 'reaction' | 'friend_request' | 'friend_accept' | 'share' | 'group';
  postId?: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  avatarImage: string;
  privacy: 'public' | 'private';
  createdBy: string;
  adminIds: string[];
  memberIds: string[];
  createdAt: string;
  postsCount: number;
}

export interface Report {
  id: string;
  reportedBy: string;
  reportedByName: string;
  targetType: 'post' | 'user' | 'comment';
  targetId: string;
  targetContent?: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  totalComments: number;
  totalFriends: number;
  totalReports: number;
  totalGroups: number;
}
