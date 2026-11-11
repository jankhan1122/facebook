import http from 'http';
import path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { createServer as createViteServer } from 'vite';
import { dbManager } from './server/db.ts';
import { User, Post, Story, FriendRequest, Message, Notification, Group, Report, ReactionType } from './src/types.ts';

const app = express();
const server = http.createServer(app);

// Socket.IO with CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Tracking connected online users
const onlineUsers = new Map<string, string>(); // userId -> socketId

io.on('connection', (socket) => {
  let authenticatedUserId: string | null = null;

  socket.on('register_user', (userId: string) => {
    if (!userId) return;
    authenticatedUserId = userId;
    onlineUsers.set(userId, socket.id);
    io.emit('online_users', Array.from(onlineUsers.keys()));
  });

  socket.on('typing', ({ senderId, receiverId }: { senderId: string; receiverId: string }) => {
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_typing', { senderId });
    }
  });

  socket.on('stop_typing', ({ senderId, receiverId }: { senderId: string; receiverId: string }) => {
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_stop_typing', { senderId });
    }
  });

  socket.on('disconnect', () => {
    if (authenticatedUserId) {
      onlineUsers.delete(authenticatedUserId);
      io.emit('online_users', Array.from(onlineUsers.keys()));
    }
  });
});

// Auth helper middleware
interface AuthRequest extends Request {
  user?: User;
}

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = dbManager.verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
    return;
  }

  const user = dbManager.findUserById(payload.id);
  if (!user) {
    res.status(401).json({ error: 'User no longer exists' });
    return;
  }

  if (user.isBlocked) {
    res.status(403).json({ error: 'Your account has been suspended by an administrator.' });
    return;
  }

  req.user = user;
  next();
};

const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: Admin access required' });
    return;
  }
  next();
};

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

// Register
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { name, email, password, username, bio, work, location, gender, birthday, avatar } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = dbManager.findUserWithPassword(email);
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const autoUsername = username || email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const defaultAvatars = [
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80'
    ];
    const userAvatar = avatar || defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const newUser: User & { passwordHash: string } = {
      id: `user_${uuidv4().substring(0, 8)}`,
      name: name.trim(),
      username: autoUsername,
      email: email.toLowerCase().trim(),
      passwordHash,
      avatar: userAvatar,
      coverPhoto: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80',
      bio: bio || 'Hello, I am on TAIMOOR SOCIAL!',
      work: work || '',
      education: '',
      location: location || '',
      gender: gender || 'Not specified',
      birthday: birthday || '',
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      role: 'user',
      friendsCount: 0,
      followersCount: 0
    };

    dbManager.db.users.push(newUser);
    dbManager.persist();

    const { passwordHash: _, ...cleanUser } = newUser;
    const token = dbManager.generateToken(cleanUser);

    return res.status(201).json({
      message: 'Account created successfully',
      user: cleanUser,
      token
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'Please enter your email/username and password' });
    }

    const userWithHash = dbManager.findUserWithPassword(emailOrUsername);
    if (!userWithHash) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    if (userWithHash.isBlocked) {
      return res.status(403).json({ error: 'Your account has been suspended by an administrator.' });
    }

    const isMatch = bcrypt.compareSync(password, userWithHash.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password. Please try again.' });
    }

    const { passwordHash, ...cleanUser } = userWithHash;
    const token = dbManager.generateToken(cleanUser);

    return res.json({
      message: 'Logged in successfully',
      user: cleanUser,
      token
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Login failed' });
  }
});

// Quick Switcher / Demo Login
app.post('/api/auth/demo-login', (req: Request, res: Response) => {
  const { userId } = req.body;
  const targetId = userId || 'user_taimoor';
  const user = dbManager.findUserById(targetId);
  if (!user) {
    return res.status(404).json({ error: 'Demo user not found' });
  }

  const token = dbManager.generateToken(user);
  return res.json({
    message: `Logged in as ${user.name}`,
    user,
    token
  });
});

// Current User Profile
app.get('/api/auth/me', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  // update friends count dynamically
  const friendsCount = dbManager.getFriendIds(user.id).length;
  res.json({
    user: {
      ...user,
      friendsCount
    }
  });
});

// Forgot & Reset Password
app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  const user = dbManager.findUserWithPassword(email);
  if (!user) {
    return res.status(404).json({ error: 'No user registered with this email' });
  }
  // Return simulated recovery code
  return res.json({
    message: 'Reset verification code sent to your email',
    resetCode: '187742'
  });
});

app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'Email, code, and new password are required' });
  }

  const user = dbManager.findUserWithPassword(email);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (code !== '187742' && code !== '123456') {
    return res.status(400).json({ error: 'Invalid verification code' });
  }

  const salt = bcrypt.genSaltSync(10);
  user.passwordHash = bcrypt.hashSync(newPassword, salt);
  dbManager.persist();

  return res.json({ message: 'Password has been reset successfully. You can now login.' });
});

// ==========================================
// 2. USER & PROFILE ROUTES
// ==========================================

// Get user profile by ID
app.get('/api/users/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const targetId = req.params.id;
  const user = dbManager.findUserById(targetId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const currentUserId = req.user!.id;
  const isFriend = dbManager.areFriends(currentUserId, targetId);
  const friendIds = dbManager.getFriendIds(targetId);
  const friends = friendIds.map(id => dbManager.findUserById(id)).filter(Boolean);

  const pendingRequest = dbManager.db.friendRequests.find(
    r => ((r.fromUserId === currentUserId && r.toUserId === targetId) ||
          (r.fromUserId === targetId && r.toUserId === currentUserId)) &&
         r.status === 'pending'
  );

  const userPosts = dbManager.db.posts.filter(p => p.userId === targetId);

  res.json({
    user: {
      ...user,
      friendsCount: friends.length
    },
    isSelf: currentUserId === targetId,
    isFriend,
    friendRequestStatus: pendingRequest ? (pendingRequest.fromUserId === currentUserId ? 'sent' : 'received') : null,
    pendingRequestId: pendingRequest?.id,
    friends,
    posts: userPosts
  });
});

// Update Profile
app.put('/api/users/profile', authMiddleware, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userInDb = dbManager.db.users.find(u => u.id === userId);
  if (!userInDb) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { name, bio, work, education, location, relationshipStatus, avatar, coverPhoto } = req.body;
  if (name) userInDb.name = name.trim();
  if (bio !== undefined) userInDb.bio = bio;
  if (work !== undefined) userInDb.work = work;
  if (education !== undefined) userInDb.education = education;
  if (location !== undefined) userInDb.location = location;
  if (relationshipStatus !== undefined) userInDb.relationshipStatus = relationshipStatus;
  if (avatar) userInDb.avatar = avatar;
  if (coverPhoto) userInDb.coverPhoto = coverPhoto;

  // Also update user's existing posts with new name/avatar
  dbManager.db.posts.forEach(p => {
    if (p.userId === userId) {
      if (name) p.userName = name.trim();
      if (avatar) p.userAvatar = avatar;
    }
  });

  dbManager.persist();

  const { passwordHash, ...cleanUser } = userInDb;
  res.json({ message: 'Profile updated successfully', user: cleanUser });
});

// Search users, posts, groups
app.get('/api/search', authMiddleware, (req: AuthRequest, res: Response) => {
  const query = (req.query.q as string || '').toLowerCase().trim();
  if (!query) {
    return res.json({ users: [], posts: [], groups: [] });
  }

  const users = dbManager.db.users
    .filter(u => u.name.toLowerCase().includes(query) || u.username.toLowerCase().includes(query))
    .map(({ passwordHash, ...u }) => u);

  const posts = dbManager.db.posts
    .filter(p => p.content.toLowerCase().includes(query) || p.hashtags?.some(h => h.toLowerCase().includes(query)));

  const groups = dbManager.db.groups
    .filter(g => g.name.toLowerCase().includes(query) || g.description.toLowerCase().includes(query));

  res.json({ users, posts, groups });
});

// Suggestions
app.get('/api/friends/suggestions', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const myFriendIds = new Set(dbManager.getFriendIds(currentUserId));
  myFriendIds.add(currentUserId);

  // Exclude those with pending requests
  const pendingUserIds = new Set(
    dbManager.db.friendRequests
      .filter(r => r.status === 'pending' && (r.fromUserId === currentUserId || r.toUserId === currentUserId))
      .map(r => r.fromUserId === currentUserId ? r.toUserId : r.fromUserId)
  );

  const suggestions = dbManager.db.users
    .filter(u => !myFriendIds.has(u.id) && !pendingUserIds.has(u.id) && !u.isBlocked)
    .map(({ passwordHash, ...clean }) => {
      const mutualFriends = dbManager.getFriendIds(clean.id).filter(id => myFriendIds.has(id)).length;
      return { ...clean, mutualFriends };
    });

  res.json(suggestions);
});

// ==========================================
// 3. FRIENDS SYSTEM
// ==========================================

// List friends
app.get('/api/friends', authMiddleware, (req: AuthRequest, res: Response) => {
  const userId = (req.query.userId as string) || req.user!.id;
  const friendIds = dbManager.getFriendIds(userId);
  const friends = friendIds.map(id => dbManager.findUserById(id)).filter(Boolean);
  res.json(friends);
});

// List friend requests
app.get('/api/friends/requests', authMiddleware, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const received = dbManager.db.friendRequests.filter(
    r => r.toUserId === userId && r.status === 'pending'
  );
  const sent = dbManager.db.friendRequests.filter(
    r => r.fromUserId === userId && r.status === 'pending'
  );
  res.json({ received, sent });
});

// Send friend request
app.post('/api/friends/request/:targetUserId', authMiddleware, (req: AuthRequest, res: Response) => {
  const fromUser = req.user!;
  const toUserId = req.params.targetUserId;

  if (fromUser.id === toUserId) {
    return res.status(400).json({ error: 'You cannot add yourself as a friend' });
  }

  if (dbManager.areFriends(fromUser.id, toUserId)) {
    return res.status(400).json({ error: 'You are already friends' });
  }

  const existing = dbManager.db.friendRequests.find(
    r => ((r.fromUserId === fromUser.id && r.toUserId === toUserId) ||
          (r.fromUserId === toUserId && r.toUserId === fromUser.id)) &&
         r.status === 'pending'
  );

  if (existing) {
    return res.status(400).json({ error: 'A friend request is already pending' });
  }

  const request: FriendRequest = {
    id: `freq_${uuidv4().substring(0, 8)}`,
    fromUserId: fromUser.id,
    fromUserName: fromUser.name,
    fromUserAvatar: fromUser.avatar,
    toUserId,
    createdAt: new Date().toISOString(),
    status: 'pending'
  };

  dbManager.db.friendRequests.push(request);

  // Send notification to recipient
  const notif: Notification = {
    id: `notif_${uuidv4().substring(0, 8)}`,
    userId: toUserId,
    fromUserId: fromUser.id,
    fromUserName: fromUser.name,
    fromUserAvatar: fromUser.avatar,
    type: 'friend_request',
    content: 'sent you a friend request.',
    isRead: false,
    createdAt: new Date().toISOString()
  };
  dbManager.db.notifications.unshift(notif);

  dbManager.persist();

  // Socket notification
  const targetSocketId = onlineUsers.get(toUserId);
  if (targetSocketId) {
    io.to(targetSocketId).emit('notification', notif);
  }

  res.json({ message: 'Friend request sent', request });
});

// Accept friend request
app.post('/api/friends/accept/:requestId', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const requestId = req.params.requestId;

  const request = dbManager.db.friendRequests.find(r => r.id === requestId && r.toUserId === currentUserId);
  if (!request) {
    return res.status(404).json({ error: 'Friend request not found' });
  }

  request.status = 'accepted';
  dbManager.db.friendships.push({
    user1Id: request.fromUserId,
    user2Id: currentUserId,
    createdAt: new Date().toISOString()
  });

  // Notification for sender
  const notif: Notification = {
    id: `notif_${uuidv4().substring(0, 8)}`,
    userId: request.fromUserId,
    fromUserId: currentUserId,
    fromUserName: req.user!.name,
    fromUserAvatar: req.user!.avatar,
    type: 'friend_accept',
    content: 'accepted your friend request.',
    isRead: false,
    createdAt: new Date().toISOString()
  };
  dbManager.db.notifications.unshift(notif);

  dbManager.persist();

  const targetSocketId = onlineUsers.get(request.fromUserId);
  if (targetSocketId) {
    io.to(targetSocketId).emit('notification', notif);
  }

  res.json({ message: 'Friend request accepted' });
});

// Reject friend request
app.post('/api/friends/reject/:requestId', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const requestId = req.params.requestId;

  const index = dbManager.db.friendRequests.findIndex(r => r.id === requestId && r.toUserId === currentUserId);
  if (index === -1) {
    return res.status(404).json({ error: 'Friend request not found' });
  }

  dbManager.db.friendRequests.splice(index, 1);
  dbManager.persist();
  res.json({ message: 'Friend request removed' });
});

// Cancel sent friend request
app.post('/api/friends/cancel/:targetUserId', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const targetUserId = req.params.targetUserId;

  const index = dbManager.db.friendRequests.findIndex(
    r => r.fromUserId === currentUserId && r.toUserId === targetUserId && r.status === 'pending'
  );

  if (index !== -1) {
    dbManager.db.friendRequests.splice(index, 1);
    dbManager.persist();
  }

  res.json({ message: 'Friend request canceled' });
});

// Unfriend
app.post('/api/friends/unfriend/:targetUserId', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const targetUserId = req.params.targetUserId;

  const initialLength = dbManager.db.friendships.length;
  dbManager.db.friendships = dbManager.db.friendships.filter(
    f => !((f.user1Id === currentUserId && f.user2Id === targetUserId) ||
           (f.user1Id === targetUserId && f.user2Id === currentUserId))
  );

  if (dbManager.db.friendships.length < initialLength) {
    dbManager.persist();
    return res.json({ message: 'Friend removed successfully' });
  }

  res.status(400).json({ error: 'You are not friends with this user' });
});

// ==========================================
// 4. POSTS & NEWS FEED ROUTES
// ==========================================

// Get feed posts
app.get('/api/posts', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const filter = req.query.filter as string; // 'all', 'friends', 'saved'
  const groupId = req.query.groupId as string;
  const userId = req.query.userId as string;

  let posts = [...dbManager.db.posts];

  if (groupId) {
    posts = posts.filter(p => p.groupId === groupId);
  } else if (userId) {
    posts = posts.filter(p => p.userId === userId);
  } else if (filter === 'saved') {
    const savedIds = new Set(
      dbManager.db.savedPosts.filter(s => s.userId === currentUserId).map(s => s.postId)
    );
    posts = posts.filter(p => savedIds.has(p.id));
  } else if (filter === 'friends') {
    const friendIds = new Set(dbManager.getFriendIds(currentUserId));
    friendIds.add(currentUserId);
    posts = posts.filter(p => friendIds.has(p.userId));
  }

  // Enrich with saved state
  const savedPostIds = new Set(
    dbManager.db.savedPosts.filter(s => s.userId === currentUserId).map(s => s.postId)
  );

  const enrichedPosts = posts.map(p => ({
    ...p,
    isSaved: savedPostIds.has(p.id)
  }));

  // Sort newest first
  enrichedPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(enrichedPosts);
});

// Create Post
app.post('/api/posts', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { content, mediaUrl, mediaType, privacy, feeling, location, taggedFriends, groupId, groupName } = req.body;

    if (!content && !mediaUrl) {
      return res.status(400).json({ error: 'Post must contain text or media' });
    }

    // Extract hashtags
    const hashtags = content ? (content.match(/#[a-zA-Z0-9_]+/g) || []) : [];

    const newPost: Post = {
      id: `post_${uuidv4().substring(0, 8)}`,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      content: content || '',
      mediaUrl: mediaUrl || undefined,
      mediaType: mediaType || (mediaUrl ? 'image' : undefined),
      privacy: privacy || 'public',
      feeling: feeling || undefined,
      location: location || undefined,
      taggedFriends: taggedFriends || [],
      hashtags,
      groupId: groupId || undefined,
      groupName: groupName || undefined,
      createdAt: new Date().toISOString(),
      reactions: {},
      commentsCount: 0,
      comments: [],
      sharesCount: 0,
      isSaved: false
    };

    dbManager.db.posts.unshift(newPost);
    dbManager.persist();

    // Broadcast new post via Socket.IO
    io.emit('new_post', newPost);

    res.status(201).json(newPost);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create post' });
  }
});

// Edit Post
app.put('/api/posts/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const postId = req.params.id;
  const { content, privacy, feeling } = req.body;

  const post = dbManager.db.posts.find(p => p.id === postId);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  if (post.userId !== currentUserId && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized to edit this post' });
  }

  if (content !== undefined) {
    post.content = content;
    post.hashtags = content.match(/#[a-zA-Z0-9_]+/g) || [];
  }
  if (privacy) post.privacy = privacy;
  if (feeling !== undefined) post.feeling = feeling;

  dbManager.persist();
  io.emit('update_post', post);

  res.json(post);
});

// Delete Post
app.delete('/api/posts/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const postId = req.params.id;

  const index = dbManager.db.posts.findIndex(p => p.id === postId);
  if (index === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const post = dbManager.db.posts[index];
  if (post.userId !== currentUserId && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized to delete this post' });
  }

  dbManager.db.posts.splice(index, 1);
  // remove any saved posts
  dbManager.db.savedPosts = dbManager.db.savedPosts.filter(s => s.postId !== postId);
  dbManager.persist();

  io.emit('delete_post', { postId });
  res.json({ message: 'Post deleted successfully' });
});

// React to Post (like, love, haha, wow, sad, angry)
app.post('/api/posts/:id/react', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const postId = req.params.id;
  const { reaction } = req.body as { reaction: ReactionType | 'remove' };

  const post = dbManager.db.posts.find(p => p.id === postId);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  if (!post.reactions) {
    post.reactions = {};
  }

  if (reaction === 'remove' || post.reactions[currentUserId] === reaction) {
    delete post.reactions[currentUserId];
  } else {
    post.reactions[currentUserId] = reaction;

    // Send notification if not reacting to own post
    if (post.userId !== currentUserId) {
      const notif: Notification = {
        id: `notif_${uuidv4().substring(0, 8)}`,
        userId: post.userId,
        fromUserId: currentUserId,
        fromUserName: req.user!.name,
        fromUserAvatar: req.user!.avatar,
        type: 'reaction',
        postId: post.id,
        content: `reacted ${reaction} to your post.`,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      dbManager.db.notifications.unshift(notif);

      const targetSocketId = onlineUsers.get(post.userId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('notification', notif);
      }
    }
  }

  dbManager.persist();
  io.emit('post_reactions_updated', { postId, reactions: post.reactions });

  res.json({ reactions: post.reactions });
});

// Comment on Post
app.post('/api/posts/:id/comment', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const postId = req.params.id;
  const { content, mediaUrl, parentCommentId } = req.body;

  if (!content && !mediaUrl) {
    return res.status(400).json({ error: 'Comment must contain text or image' });
  }

  const post = dbManager.db.posts.find(p => p.id === postId);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  if (!post.comments) {
    post.comments = [];
  }

  const newComment = {
    id: `comm_${uuidv4().substring(0, 8)}`,
    postId,
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar,
    content: content || '',
    mediaUrl: mediaUrl || undefined,
    createdAt: new Date().toISOString(),
    likes: [],
    replies: []
  };

  if (parentCommentId) {
    const parent = post.comments.find(c => c.id === parentCommentId);
    if (parent) {
      if (!parent.replies) parent.replies = [];
      parent.replies.push(newComment);
    } else {
      post.comments.push(newComment);
    }
  } else {
    post.comments.push(newComment);
  }

  post.commentsCount = (post.commentsCount || 0) + 1;

  // Notification for post owner
  if (post.userId !== user.id) {
    const notif: Notification = {
      id: `notif_${uuidv4().substring(0, 8)}`,
      userId: post.userId,
      fromUserId: user.id,
      fromUserName: user.name,
      fromUserAvatar: user.avatar,
      type: 'comment',
      postId: post.id,
      content: `commented on your post: "${content ? (content.length > 40 ? content.slice(0, 37) + '...' : content) : 'image'}"`,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    dbManager.db.notifications.unshift(notif);

    const targetSocketId = onlineUsers.get(post.userId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('notification', notif);
    }
  }

  dbManager.persist();
  io.emit('post_comments_updated', { postId, comments: post.comments, commentsCount: post.commentsCount });

  res.status(201).json(newComment);
});

// Delete Comment
app.delete('/api/posts/:postId/comment/:commentId', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const { postId, commentId } = req.params;

  const post = dbManager.db.posts.find(p => p.id === postId);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  let deleted = false;
  // Check top-level comments
  const idx = post.comments.findIndex(c => c.id === commentId);
  if (idx !== -1) {
    const comm = post.comments[idx];
    if (comm.userId === currentUserId || post.userId === currentUserId || req.user!.role === 'admin') {
      post.comments.splice(idx, 1);
      post.commentsCount = Math.max(0, post.commentsCount - 1);
      deleted = true;
    }
  } else {
    // Check replies
    for (const topComm of post.comments) {
      if (topComm.replies) {
        const rIdx = topComm.replies.findIndex(r => r.id === commentId);
        if (rIdx !== -1) {
          const reply = topComm.replies[rIdx];
          if (reply.userId === currentUserId || post.userId === currentUserId || req.user!.role === 'admin') {
            topComm.replies.splice(rIdx, 1);
            post.commentsCount = Math.max(0, post.commentsCount - 1);
            deleted = true;
            break;
          }
        }
      }
    }
  }

  if (deleted) {
    dbManager.persist();
    io.emit('post_comments_updated', { postId, comments: post.comments, commentsCount: post.commentsCount });
    return res.json({ message: 'Comment deleted successfully' });
  }

  return res.status(403).json({ error: 'Not authorized or comment not found' });
});

// Share Post
app.post('/api/posts/:id/share', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const postId = req.params.id;
  const { quote } = req.body;

  const originalPost = dbManager.db.posts.find(p => p.id === postId);
  if (!originalPost) {
    return res.status(404).json({ error: 'Post not found' });
  }

  originalPost.sharesCount = (originalPost.sharesCount || 0) + 1;

  const sharedPost: Post = {
    id: `post_${uuidv4().substring(0, 8)}`,
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar,
    content: quote ? `${quote}\n\n[Shared post from ${originalPost.userName}]: ${originalPost.content}` : `[Shared post from ${originalPost.userName}]: ${originalPost.content}`,
    mediaUrl: originalPost.mediaUrl,
    mediaType: originalPost.mediaType,
    privacy: 'public',
    createdAt: new Date().toISOString(),
    reactions: {},
    commentsCount: 0,
    comments: [],
    sharesCount: 0,
    isSaved: false
  };

  dbManager.db.posts.unshift(sharedPost);

  if (originalPost.userId !== user.id) {
    const notif: Notification = {
      id: `notif_${uuidv4().substring(0, 8)}`,
      userId: originalPost.userId,
      fromUserId: user.id,
      fromUserName: user.name,
      fromUserAvatar: user.avatar,
      type: 'share',
      postId: originalPost.id,
      content: 'shared your post.',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    dbManager.db.notifications.unshift(notif);
  }

  dbManager.persist();
  io.emit('new_post', sharedPost);

  res.status(201).json(sharedPost);
});

// Toggle Save Post
app.post('/api/posts/:id/save', authMiddleware, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const postId = req.params.id;

  const existingIdx = dbManager.db.savedPosts.findIndex(s => s.userId === userId && s.postId === postId);
  let isSaved = false;

  if (existingIdx !== -1) {
    dbManager.db.savedPosts.splice(existingIdx, 1);
    isSaved = false;
  } else {
    dbManager.db.savedPosts.push({
      userId,
      postId,
      savedAt: new Date().toISOString()
    });
    isSaved = true;
  }

  dbManager.persist();
  res.json({ isSaved, postId });
});

// Report Post / User
app.post('/api/reports', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { targetType, targetId, reason, targetContent } = req.body;

  if (!targetType || !targetId || !reason) {
    return res.status(400).json({ error: 'Target type, target ID, and reason are required' });
  }

  const report: Report = {
    id: `rep_${uuidv4().substring(0, 8)}`,
    reportedBy: user.id,
    reportedByName: user.name,
    targetType,
    targetId,
    targetContent,
    reason,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  dbManager.db.reports.unshift(report);
  dbManager.persist();

  res.status(201).json({ message: 'Thank you for reporting. Our moderation team will review this.', report });
});

// ==========================================
// 5. STORIES SYSTEM
// ==========================================

// Get active stories
app.get('/api/stories', authMiddleware, (req: AuthRequest, res: Response) => {
  const now = new Date().toISOString();
  // Filter stories not expired
  const activeStories = dbManager.db.stories.filter(s => new Date(s.expiresAt) > new Date(now));
  res.json(activeStories);
});

// Create Story
app.post('/api/stories', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { mediaUrl, textContent, backgroundGradient } = req.body;

  if (!mediaUrl && !textContent) {
    return res.status(400).json({ error: 'Story must have an image or text' });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  const newStory: Story = {
    id: `story_${uuidv4().substring(0, 8)}`,
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar,
    mediaUrl: mediaUrl || undefined,
    textContent: textContent || undefined,
    backgroundGradient: backgroundGradient || undefined,
    createdAt: now.toISOString(),
    expiresAt,
    viewers: []
  };

  dbManager.db.stories.unshift(newStory);
  dbManager.persist();

  io.emit('new_story', newStory);
  res.status(201).json(newStory);
});

// View Story
app.post('/api/stories/:id/view', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const storyId = req.params.id;

  const story = dbManager.db.stories.find(s => s.id === storyId);
  if (story) {
    if (!story.viewers.includes(currentUserId)) {
      story.viewers.push(currentUserId);
      dbManager.persist();
    }
  }

  res.json({ viewersCount: story?.viewers.length || 0 });
});

// ==========================================
// 6. MESSENGER SYSTEM (Real-time Socket.IO)
// ==========================================

// Get conversations list
app.get('/api/messages/conversations', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;

  // Find all distinct other users communicated with
  const convMap = new Map<string, { lastMessage: Message; unreadCount: number }>();

  dbManager.db.messages.forEach(msg => {
    let otherId = '';
    if (msg.senderId === currentUserId) otherId = msg.receiverId;
    else if (msg.receiverId === currentUserId) otherId = msg.senderId;

    if (!otherId) return;

    const existing = convMap.get(otherId);
    if (!existing || new Date(msg.createdAt) > new Date(existing.lastMessage.createdAt)) {
      const isUnread = msg.receiverId === currentUserId && !msg.isRead;
      convMap.set(otherId, {
        lastMessage: msg,
        unreadCount: (existing?.unreadCount || 0) + (isUnread ? 1 : 0)
      });
    } else if (msg.receiverId === currentUserId && !msg.isRead) {
      existing.unreadCount += 1;
    }
  });

  // If no previous chats exist, also include friends in conversation list
  const friendIds = dbManager.getFriendIds(currentUserId);
  friendIds.forEach(fId => {
    if (!convMap.has(fId)) {
      convMap.set(fId, {
        lastMessage: {
          id: '',
          conversationId: '',
          senderId: '',
          receiverId: '',
          content: 'Say hi to your friend!',
          createdAt: new Date().toISOString(),
          isRead: true
        },
        unreadCount: 0
      });
    }
  });

  const result = Array.from(convMap.entries()).map(([otherId, data]) => {
    const otherUser = dbManager.findUserById(otherId);
    return {
      otherUser,
      lastMessage: data.lastMessage.content,
      lastMessageTime: data.lastMessage.createdAt,
      lastMessageSenderId: data.lastMessage.senderId,
      unreadCount: data.unreadCount
    };
  }).filter(c => c.otherUser);

  result.sort((a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime());

  res.json(result);
});

// Get messages with a specific user
app.get('/api/messages/:otherUserId', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const otherUserId = req.params.otherUserId;

  const msgs = dbManager.db.messages.filter(
    m => (m.senderId === currentUserId && m.receiverId === otherUserId) ||
         (m.senderId === otherUserId && m.receiverId === currentUserId)
  );

  msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Mark received messages as read
  let updated = false;
  msgs.forEach(m => {
    if (m.receiverId === currentUserId && !m.isRead) {
      m.isRead = true;
      updated = true;
    }
  });

  if (updated) {
    dbManager.persist();
  }

  res.json(msgs);
});

// Send Message
app.post('/api/messages/:otherUserId', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const receiverId = req.params.otherUserId;
  const { content, mediaUrl, fileType } = req.body;

  if (!content && !mediaUrl) {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }

  const conversationId = [user.id, receiverId].sort().join('_');

  const newMsg: Message = {
    id: `msg_${uuidv4().substring(0, 8)}`,
    conversationId,
    senderId: user.id,
    receiverId,
    content: content || '',
    mediaUrl: mediaUrl || undefined,
    fileType: fileType || undefined,
    createdAt: new Date().toISOString(),
    isRead: false
  };

  dbManager.db.messages.push(newMsg);
  dbManager.persist();

  // Socket notification to receiver
  const receiverSocketId = onlineUsers.get(receiverId);
  if (receiverSocketId) {
    io.to(receiverSocketId).emit('private_message', newMsg);
  }

  res.status(201).json(newMsg);
});

// Mark message as read
app.put('/api/messages/:id/read', authMiddleware, (req: AuthRequest, res: Response) => {
  const messageId = req.params.id;
  const msg = dbManager.db.messages.find(m => m.id === messageId);
  if (msg && msg.receiverId === req.user!.id) {
    msg.isRead = true;
    dbManager.persist();
  }
  res.json({ message: 'Marked as read' });
});

// Delete / Unsend message
app.delete('/api/messages/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const messageId = req.params.id;

  const idx = dbManager.db.messages.findIndex(m => m.id === messageId);
  if (idx !== -1) {
    const msg = dbManager.db.messages[idx];
    if (msg.senderId === currentUserId || req.user!.role === 'admin') {
      dbManager.db.messages.splice(idx, 1);
      dbManager.persist();
      io.emit('message_deleted', { messageId, receiverId: msg.receiverId });
      return res.json({ message: 'Message removed' });
    }
  }

  res.status(403).json({ error: 'Cannot delete message' });
});

// ==========================================
// 7. NOTIFICATIONS
// ==========================================

app.get('/api/notifications', authMiddleware, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userNotifs = dbManager.db.notifications.filter(n => n.userId === userId);
  userNotifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(userNotifs);
});

app.put('/api/notifications/:id/read', authMiddleware, (req: AuthRequest, res: Response) => {
  const notif = dbManager.db.notifications.find(n => n.id === req.params.id && n.userId === req.user!.id);
  if (notif) {
    notif.isRead = true;
    dbManager.persist();
  }
  res.json({ message: 'Notification marked read' });
});

app.put('/api/notifications/read-all', authMiddleware, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  dbManager.db.notifications.forEach(n => {
    if (n.userId === userId) {
      n.isRead = true;
    }
  });
  dbManager.persist();
  res.json({ message: 'All notifications marked as read' });
});

// ==========================================
// 8. GROUPS & PAGES
// ==========================================

app.get('/api/groups', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const allGroups = dbManager.db.groups.map(g => ({
    ...g,
    isMember: g.memberIds.includes(currentUserId),
    isAdmin: g.adminIds.includes(currentUserId)
  }));
  res.json(allGroups);
});

app.get('/api/groups/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const group = dbManager.db.groups.find(g => g.id === req.params.id);
  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }

  const members = group.memberIds.map(id => dbManager.findUserById(id)).filter(Boolean);
  const posts = dbManager.db.posts.filter(p => p.groupId === group.id);

  res.json({
    group: {
      ...group,
      isMember: group.memberIds.includes(currentUserId),
      isAdmin: group.adminIds.includes(currentUserId)
    },
    members,
    posts
  });
});

app.post('/api/groups', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { name, description, coverImage, privacy } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Group name is required' });
  }

  const newGroup: Group = {
    id: `group_${uuidv4().substring(0, 8)}`,
    name: name.trim(),
    description: description || '',
    coverImage: coverImage || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
    avatarImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=300&q=80',
    privacy: privacy || 'public',
    createdBy: user.id,
    adminIds: [user.id],
    memberIds: [user.id],
    createdAt: new Date().toISOString(),
    postsCount: 0
  };

  dbManager.db.groups.push(newGroup);
  dbManager.persist();

  res.status(201).json(newGroup);
});

app.post('/api/groups/:id/join', authMiddleware, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const group = dbManager.db.groups.find(g => g.id === req.params.id);
  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }

  if (!group.memberIds.includes(userId)) {
    group.memberIds.push(userId);
    dbManager.persist();
  }

  res.json({ message: 'Joined group successfully', group });
});

app.post('/api/groups/:id/leave', authMiddleware, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const group = dbManager.db.groups.find(g => g.id === req.params.id);
  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }

  group.memberIds = group.memberIds.filter(id => id !== userId);
  group.adminIds = group.adminIds.filter(id => id !== userId);
  dbManager.persist();

  res.json({ message: 'Left group successfully', group });
});

// ==========================================
// 9. ADMIN DASHBOARD
// ==========================================

app.get('/api/admin/stats', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  const stats = dbManager.getAdminStats();
  res.json(stats);
});

app.get('/api/admin/users', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  const users = dbManager.db.users.map(({ passwordHash, ...u }) => u);
  res.json(users);
});

app.put('/api/admin/users/:id/status', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  const targetId = req.params.id;
  const { isBlocked } = req.body;

  if (targetId === req.user!.id) {
    return res.status(400).json({ error: 'You cannot block your own admin account' });
  }

  const user = dbManager.db.users.find(u => u.id === targetId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.isBlocked = !!isBlocked;
  dbManager.persist();

  res.json({ message: `User account ${user.isBlocked ? 'suspended' : 'activated'} successfully` });
});

app.put('/api/admin/users/:id/role', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  const targetId = req.params.id;
  const { role } = req.body;

  if (targetId === req.user!.id) {
    return res.status(400).json({ error: 'Cannot change your own role' });
  }

  const user = dbManager.db.users.find(u => u.id === targetId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.role = role === 'admin' ? 'admin' : 'user';
  dbManager.persist();

  res.json({ message: `User role updated to ${user.role}` });
});

app.delete('/api/admin/users/:id', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response) => {
  const targetId = req.params.id;
  if (targetId === req.user!.id) {
    return res.status(400).json({ error: 'Cannot delete yourself' });
  }

  const index = dbManager.db.users.findIndex(u => u.id === targetId);
  if (index === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  dbManager.db.users.splice(index, 1);
  // clean up posts
  dbManager.db.posts = dbManager.db.posts.filter(p => p.userId !== targetId);
  dbManager.persist();

  res.json({ message: 'User and their posts removed' });
});

app.get('/api/admin/reports', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  res.json(dbManager.db.reports);
});

app.put('/api/admin/reports/:id/resolve', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  const reportId = req.params.id;
  const { status, action } = req.body; // status: 'resolved' | 'dismissed', action: 'delete_content' | 'block_user'

  const report = dbManager.db.reports.find(r => r.id === reportId);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  report.status = status || 'resolved';

  if (action === 'delete_content' && report.targetType === 'post') {
    dbManager.db.posts = dbManager.db.posts.filter(p => p.id !== report.targetId);
  }

  dbManager.persist();
  res.json({ message: 'Report updated', report });
});

// ==========================================
// 10. DEV SERVER & VITE INTEGRATION
// ==========================================

async function startServer() {
  // If running in Vercel Serverless environment, Vercel will handle requests through /api/index.ts
  if (process.env.VERCEL) {
    return;
  }

  const isDev = process.env.NODE_ENV !== 'production';
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[TAIMOOR SOCIAL] Server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
  });
}

export { app, server };
export default app;
