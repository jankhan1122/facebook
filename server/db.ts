import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Post, Story, FriendRequest, Message, Notification, Group, Report, AdminStats } from '../src/types.ts';

const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL;
const DB_FILE = isVercel
  ? path.resolve('/tmp', 'taimoor_social_db.json')
  : path.resolve(process.cwd(), 'data', 'taimoor_social_db.json');
const JWT_SECRET = process.env.JWT_SECRET || 'taimoor-social-super-secret-jwt-key-2026';

export interface DatabaseSchema {
  users: (User & { passwordHash: string })[];
  posts: Post[];
  stories: Story[];
  friendRequests: FriendRequest[];
  friendships: { user1Id: string; user2Id: string; createdAt: string }[];
  savedPosts: { userId: string; postId: string; savedAt: string }[];
  messages: Message[];
  notifications: Notification[];
  groups: Group[];
  reports: Report[];
}

// Default initial seed data
const getInitialSeed = (): DatabaseSchema => {
  const salt = bcrypt.genSaltSync(10);
  const defaultPasswordHash = bcrypt.hashSync('taimoor123', salt);

  const now = new Date();
  const timeAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
  const timeAgoDays = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
  const hoursFromNow = (hours: number) => new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();

  const users: (User & { passwordHash: string })[] = [
    {
      id: 'user_taimoor',
      name: 'Taimoor Khan',
      username: 'taimoorkhan',
      email: 'taimoor@social.com',
      passwordHash: defaultPasswordHash,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      coverPhoto: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      bio: 'Full Stack Website Developer & Founder of TAIMOOR SOCIAL 🚀 | Building modern web apps with passion.',
      work: 'Full Stack Engineer & Tech Lead',
      education: 'Computer Science, B.S.',
      location: 'Dubai, UAE',
      relationshipStatus: 'In a relationship',
      joinedDate: 'January 2024',
      role: 'admin',
      friendsCount: 4,
      followersCount: 1250,
    },
    {
      id: 'user_sarah',
      name: 'Sarah Jenkins',
      username: 'sarahj',
      email: 'sarah@social.com',
      passwordHash: defaultPasswordHash,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      coverPhoto: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      bio: 'Product Designer & UI/UX Specialist 🎨 Passionate about clean interfaces and friendly communities.',
      work: 'Lead Designer at CreativePulse',
      education: 'Design Academy',
      location: 'San Francisco, CA',
      relationshipStatus: 'Single',
      joinedDate: 'March 2024',
      role: 'user',
      friendsCount: 3,
      followersCount: 890,
    },
    {
      id: 'user_alex',
      name: 'Alex Rivera',
      username: 'alexrivera',
      email: 'alex@social.com',
      passwordHash: defaultPasswordHash,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      coverPhoto: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
      bio: 'Travel photographer & cloud enthusiast 📸 Exploring mountain trails and high-frequency code.',
      work: 'Cloud Solutions Architect',
      education: 'University of Washington',
      location: 'Seattle, WA',
      joinedDate: 'April 2024',
      role: 'user',
      friendsCount: 3,
      followersCount: 640,
    },
    {
      id: 'user_sophia',
      name: 'Sophia Chen',
      username: 'sophiac',
      email: 'sophia@social.com',
      passwordHash: defaultPasswordHash,
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      coverPhoto: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
      bio: 'AI Researcher & Coffee addict ☕ Building the future with intelligent multi-agent systems.',
      work: 'AI Research Scientist',
      education: 'Stanford University',
      location: 'Palo Alto, CA',
      joinedDate: 'May 2024',
      role: 'user',
      friendsCount: 2,
      followersCount: 1100,
    },
    {
      id: 'user_marcus',
      name: 'Marcus Vance',
      username: 'marcusv',
      email: 'marcus@social.com',
      passwordHash: defaultPasswordHash,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      coverPhoto: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
      bio: 'Marathon runner & fitness coach 🏃‍♂️ No shortcuts, just hard work and positive energy.',
      work: 'Head Trainer at Peak Athletics',
      education: 'UCLA Kinesiology',
      location: 'Los Angeles, CA',
      joinedDate: 'June 2024',
      role: 'user',
      friendsCount: 2,
      followersCount: 420,
    }
  ];

  const friendships = [
    { user1Id: 'user_taimoor', user2Id: 'user_sarah', createdAt: timeAgoDays(20) },
    { user1Id: 'user_taimoor', user2Id: 'user_alex', createdAt: timeAgoDays(15) },
    { user1Id: 'user_taimoor', user2Id: 'user_sophia', createdAt: timeAgoDays(10) },
    { user1Id: 'user_taimoor', user2Id: 'user_marcus', createdAt: timeAgoDays(5) },
    { user1Id: 'user_sarah', user2Id: 'user_alex', createdAt: timeAgoDays(12) },
    { user1Id: 'user_sarah', user2Id: 'user_sophia', createdAt: timeAgoDays(8) },
  ];

  const posts: Post[] = [
    {
      id: 'post_1',
      userId: 'user_taimoor',
      userName: 'Taimoor Khan',
      userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      content: '🚀 Welcome to TAIMOOR SOCIAL! "Connect • Share • Communicate". Built with full-stack React, Express, real-time messaging, stories, and Facebook-inspired UI. What features would you like to see next? Drop a comment below! 👇✨ #TaimoorSocial #WebDev #FullStack',
      mediaUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
      mediaType: 'image',
      privacy: 'public',
      feeling: 'excited',
      hashtags: ['#TaimoorSocial', '#WebDev', '#FullStack'],
      createdAt: timeAgo(2),
      reactions: {
        user_sarah: 'love',
        user_alex: 'like',
        user_sophia: 'wow',
        user_marcus: 'like'
      },
      commentsCount: 3,
      sharesCount: 5,
      comments: [
        {
          id: 'comm_1',
          postId: 'post_1',
          userId: 'user_sarah',
          userName: 'Sarah Jenkins',
          userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
          content: 'The UI is incredibly smooth Taimoor! Exactly like Facebook but super fast. Love the story viewer and reactions!',
          createdAt: timeAgo(1.5),
          likes: ['user_taimoor', 'user_alex'],
          replies: [
            {
              id: 'reply_1',
              postId: 'post_1',
              userId: 'user_taimoor',
              userName: 'Taimoor Khan',
              userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
              content: 'Thank you Sarah! Clean user experience was the #1 goal.',
              createdAt: timeAgo(1.2),
              likes: ['user_sarah']
            }
          ]
        },
        {
          id: 'comm_2',
          postId: 'post_1',
          userId: 'user_alex',
          userName: 'Alex Rivera',
          userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
          content: 'Messenger and group feed work seamlessly. Outstanding work!',
          createdAt: timeAgo(1),
          likes: ['user_taimoor']
        }
      ]
    },
    {
      id: 'post_2',
      userId: 'user_sarah',
      userName: 'Sarah Jenkins',
      userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      content: 'Morning coffee & creative design sprint. Testing out new typography scales and micro-interactions today. ☕🎨 #DesignSystem #UIUX',
      mediaUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
      mediaType: 'image',
      privacy: 'public',
      feeling: 'creative',
      createdAt: timeAgo(5),
      reactions: {
        user_taimoor: 'love',
        user_sophia: 'care'
      },
      commentsCount: 1,
      sharesCount: 1,
      comments: [
        {
          id: 'comm_3',
          postId: 'post_2',
          userId: 'user_sophia',
          userName: 'Sophia Chen',
          userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
          content: 'That setup looks pristine Sarah! 💻',
          createdAt: timeAgo(4),
          likes: ['user_sarah']
        }
      ]
    },
    {
      id: 'post_3',
      userId: 'user_alex',
      userName: 'Alex Rivera',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      content: 'Weekend backpacking in the North Cascades. Nothing beats the crisp mountain air and starry night skies. 🌲🏔️ #Nature #Hiking #Photography',
      mediaUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
      mediaType: 'image',
      privacy: 'public',
      feeling: 'peaceful',
      createdAt: timeAgo(14),
      reactions: {
        user_taimoor: 'wow',
        user_sarah: 'love',
        user_marcus: 'like'
      },
      commentsCount: 1,
      sharesCount: 2,
      comments: [
        {
          id: 'comm_4',
          postId: 'post_3',
          userId: 'user_marcus',
          userName: 'Marcus Vance',
          userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
          content: 'Epic view man! Which trail is this?',
          createdAt: timeAgo(12),
          likes: ['user_alex']
        }
      ]
    }
  ];

  const stories: Story[] = [
    {
      id: 'story_1',
      userId: 'user_taimoor',
      userName: 'Taimoor Khan',
      userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      mediaUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
      textContent: 'Building late night features for TAIMOOR SOCIAL 💻⚡',
      createdAt: timeAgo(4),
      expiresAt: hoursFromNow(20),
      viewers: ['user_sarah', 'user_alex']
    },
    {
      id: 'story_2',
      userId: 'user_sarah',
      userName: 'Sarah Jenkins',
      userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      mediaUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80',
      textContent: 'Design meeting in downtown SF ☕',
      createdAt: timeAgo(6),
      expiresAt: hoursFromNow(18),
      viewers: ['user_taimoor']
    },
    {
      id: 'story_3',
      userId: 'user_alex',
      userName: 'Alex Rivera',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      textContent: 'Sunset hike at the ridge 🌅',
      createdAt: timeAgo(8),
      expiresAt: hoursFromNow(16),
      viewers: ['user_taimoor', 'user_sarah', 'user_sophia']
    },
    {
      id: 'story_4',
      userId: 'user_sophia',
      userName: 'Sophia Chen',
      userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      textContent: 'New machine learning experiment finished with 98.4% accuracy! 🤖📈',
      backgroundGradient: 'from-purple-600 via-pink-600 to-indigo-700',
      createdAt: timeAgo(10),
      expiresAt: hoursFromNow(14),
      viewers: ['user_taimoor']
    }
  ];

  const groups: Group[] = [
    {
      id: 'group_1',
      name: 'Full Stack Web Developers',
      description: 'A thriving community of passionate coders sharing tips, tutorials, code reviews, and latest web tech.',
      coverImage: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80',
      avatarImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=300&q=80',
      privacy: 'public',
      createdBy: 'user_taimoor',
      adminIds: ['user_taimoor'],
      memberIds: ['user_taimoor', 'user_sarah', 'user_alex', 'user_sophia'],
      createdAt: timeAgoDays(30),
      postsCount: 142
    },
    {
      id: 'group_2',
      name: 'UI/UX & Modern Product Design',
      description: 'Critiques, wireframes, design systems, and Figma tips for creators worldwide.',
      coverImage: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1200&q=80',
      avatarImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=300&q=80',
      privacy: 'public',
      createdBy: 'user_sarah',
      adminIds: ['user_sarah'],
      memberIds: ['user_taimoor', 'user_sarah', 'user_alex'],
      createdAt: timeAgoDays(25),
      postsCount: 88
    },
    {
      id: 'group_3',
      name: 'Global Photographers & Travelers',
      description: 'Share your breathtaking landscapes, street photography, camera gear, and travel destinations.',
      coverImage: 'https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?auto=format&fit=crop&w=1200&q=80',
      avatarImage: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=300&q=80',
      privacy: 'public',
      createdBy: 'user_alex',
      adminIds: ['user_alex'],
      memberIds: ['user_taimoor', 'user_alex', 'user_marcus'],
      createdAt: timeAgoDays(18),
      postsCount: 65
    }
  ];

  const messages: Message[] = [
    {
      id: 'msg_1',
      conversationId: 'conv_taimoor_sarah',
      senderId: 'user_sarah',
      receiverId: 'user_taimoor',
      content: 'Hey Taimoor! The new TAIMOOR SOCIAL interface looks stunning!',
      createdAt: timeAgo(3),
      isRead: true
    },
    {
      id: 'msg_2',
      conversationId: 'conv_taimoor_sarah',
      senderId: 'user_taimoor',
      receiverId: 'user_sarah',
      content: 'Thanks Sarah! Really appreciate your feedback on the layout.',
      createdAt: timeAgo(2.8),
      isRead: true
    },
    {
      id: 'msg_3',
      conversationId: 'conv_taimoor_sarah',
      senderId: 'user_sarah',
      receiverId: 'user_taimoor',
      content: 'Are you working on the real-time messenger right now?',
      createdAt: timeAgo(2),
      isRead: false
    },
    {
      id: 'msg_4',
      conversationId: 'conv_taimoor_alex',
      senderId: 'user_alex',
      receiverId: 'user_taimoor',
      content: 'Loved that team photo you shared earlier!',
      createdAt: timeAgo(6),
      isRead: true
    }
  ];

  const notifications: Notification[] = [
    {
      id: 'notif_1',
      userId: 'user_taimoor',
      fromUserId: 'user_sarah',
      fromUserName: 'Sarah Jenkins',
      fromUserAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      type: 'reaction',
      postId: 'post_1',
      content: 'loved your post: "Welcome to TAIMOOR SOCIAL!"',
      isRead: false,
      createdAt: timeAgo(1.5)
    },
    {
      id: 'notif_2',
      userId: 'user_taimoor',
      fromUserId: 'user_alex',
      fromUserName: 'Alex Rivera',
      fromUserAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      type: 'comment',
      postId: 'post_1',
      content: 'commented: "Messenger and group feed work seamlessly..."',
      isRead: false,
      createdAt: timeAgo(1)
    },
    {
      id: 'notif_3',
      userId: 'user_taimoor',
      fromUserId: 'user_sophia',
      fromUserName: 'Sophia Chen',
      fromUserAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      type: 'reaction',
      postId: 'post_1',
      content: 'reacted wow to your post',
      isRead: true,
      createdAt: timeAgo(2)
    }
  ];

  const friendRequests: FriendRequest[] = [];
  const savedPosts: { userId: string; postId: string; savedAt: string }[] = [];
  const reports: Report[] = [];

  return {
    users,
    posts,
    stories,
    friendRequests,
    friendships,
    savedPosts,
    messages,
    notifications,
    groups,
    reports
  };
};

// Database persistence wrapper
class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(content);
      }
    } catch (err) {
      console.warn('Error loading DB file, fallback to seed:', err);
    }

    const seed = getInitialSeed();
    this.saveData(seed);
    return seed;
  }

  private saveData(dataToSave: DatabaseSchema = this.data): void {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save DB:', err);
    }
  }

  public get db(): DatabaseSchema {
    return this.data;
  }

  public persist(): void {
    this.saveData();
  }

  // Token helper
  public generateToken(user: User): string {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
  }

  public verifyToken(token: string): { id: string; email: string; role: string; name: string } | null {
    try {
      return jwt.verify(token, JWT_SECRET) as any;
    } catch {
      return null;
    }
  }

  // Helpers for users
  public findUserById(id: string): User | undefined {
    const u = this.data.users.find(user => user.id === id);
    if (!u) return undefined;
    const { passwordHash, ...userClean } = u;
    return userClean;
  }

  public findUserWithPassword(emailOrUsername: string) {
    const query = emailOrUsername.toLowerCase().trim();
    return this.data.users.find(
      u => u.email.toLowerCase() === query || u.username.toLowerCase() === query
    );
  }

  public areFriends(user1Id: string, user2Id: string): boolean {
    return this.data.friendships.some(
      f => (f.user1Id === user1Id && f.user2Id === user2Id) ||
           (f.user1Id === user2Id && f.user2Id === user1Id)
    );
  }

  public getFriendIds(userId: string): string[] {
    const ids: string[] = [];
    for (const f of this.data.friendships) {
      if (f.user1Id === userId) ids.push(f.user2Id);
      else if (f.user2Id === userId) ids.push(f.user1Id);
    }
    return ids;
  }

  public getAdminStats(): AdminStats {
    return {
      totalUsers: this.data.users.length,
      activeUsers: this.data.users.filter(u => !u.isBlocked).length,
      totalPosts: this.data.posts.length,
      totalComments: this.data.posts.reduce((acc, p) => acc + (p.comments?.length || 0), 0),
      totalFriends: this.data.friendships.length,
      totalReports: this.data.reports.length,
      totalGroups: this.data.groups.length
    };
  }
}

export const dbManager = new DatabaseManager();
