import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Send, Image as ImageIcon, Smile, Phone, Video,
  Info, Check, CheckCheck, MoreHorizontal, User as UserIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useSocket } from '../context/SocketContext.tsx';
import { Message, User } from '../types.ts';

interface MessengerViewProps {
  onOpenProfile: (userId: string) => void;
}

export const MessengerView: React.FC<MessengerViewProps> = ({ onOpenProfile }) => {
  const { user, token } = useAuth();
  const { socket, onlineUserIds, typingUsers, sendTyping, sendStopTyping } = useSocket();

  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchChat, setSearchChat] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<any>(null);

  const isPartnerTyping = selectedUser ? typingUsers.has(selectedUser.id) : false;

  const fetchConversations = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/messages/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        if (data.length > 0 && !selectedUser) {
          setSelectedUser(data[0].otherUser);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [token]);

  // Load messages for selected user
  useEffect(() => {
    if (!selectedUser || !token) return;
    fetch(`/api/messages/${selectedUser.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setMessages(data))
      .catch(console.error);
  }, [selectedUser?.id, token]);

  // Socket listener for new messages
  useEffect(() => {
    if (!socket || !selectedUser) return;

    const handlePrivateMessage = (msg: Message) => {
      if (msg.senderId === selectedUser.id || msg.receiverId === selectedUser.id) {
        setMessages(prev => [...prev, msg]);
      }
      fetchConversations();
    };

    socket.on('private_message', handlePrivateMessage);
    return () => {
      socket.off('private_message', handlePrivateMessage);
    };
  }, [socket, selectedUser?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPartnerTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (selectedUser) {
      sendTyping(selectedUser.id);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        sendStopTyping(selectedUser.id);
      }, 1500);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedUser || !token) return;

    const content = inputText.trim();
    setInputText('');
    sendStopTyping(selectedUser.id);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/messages/${selectedUser.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });

      if (res.ok) {
        const newMsg: Message = await res.json();
        setMessages(prev => [...prev, newMsg]);
        fetchConversations();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendSampleImage = (url: string) => {
    if (!selectedUser || !token) return;
    fetch(`/api/messages/${selectedUser.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ content: 'Sent a photo', mediaUrl: url })
    })
      .then(res => res.json())
      .then(newMsg => {
        setMessages(prev => [...prev, newMsg]);
        fetchConversations();
      })
      .catch(console.error);
  };

  const filteredConversations = conversations.filter(c =>
    c.otherUser?.name.toLowerCase().includes(searchChat.toLowerCase()) ||
    c.otherUser?.username.toLowerCase().includes(searchChat.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-4rem)] p-2 sm:p-4 select-none">
      <div className="bg-white dark:bg-[#242526] rounded-2xl shadow-md border border-[#E4E6EB] dark:border-[#393A3B] h-full flex overflow-hidden">
        {/* Left Chats List Sidebar */}
        <div className="w-80 sm:w-96 border-r border-[#E4E6EB] dark:border-[#393A3B] flex flex-col h-full shrink-0">
          <div className="p-4 border-b border-gray-100 dark:border-[#393A3B]">
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-gray-100 mb-3">Chats</h1>
            <div className="flex items-center bg-[#F0F2F5] dark:bg-[#3A3B3C] rounded-full px-3 py-2 text-xs text-gray-700 dark:text-gray-200">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input
                type="text"
                value={searchChat}
                onChange={(e) => setSearchChat(e.target.value)}
                placeholder="Search Messenger..."
                className="bg-transparent border-none outline-none w-full"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredConversations.map((c, i) => {
              const isSelected = selectedUser?.id === c.otherUser?.id;
              const isOnline = onlineUserIds.includes(c.otherUser?.id);
              return (
                <button
                  key={i}
                  onClick={() => setSelectedUser(c.otherUser)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/50'
                      : 'hover:bg-[#F2F2F2] dark:hover:bg-[#3A3B3C]'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={c.otherUser?.avatar}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-[#242526]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                        {c.otherUser?.name}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(c.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                      {c.lastMessageSenderId === user?.id && <span>You: </span>}
                      <span>{c.lastMessage}</span>
                    </div>
                  </div>

                  {c.unreadCount > 0 && (
                    <span className="w-2.5 h-2.5 bg-[#1877F2] rounded-full shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Active Chat Panel */}
        <div className="flex-1 flex flex-col h-full bg-[#F0F2F5]/40 dark:bg-[#18191A]/60">
          {selectedUser ? (
            <>
              {/* Active Chat Header */}
              <div className="px-4 py-3 bg-white dark:bg-[#242526] border-b border-[#E4E6EB] dark:border-[#393A3B] flex items-center justify-between shadow-xs">
                <div
                  onClick={() => onOpenProfile(selectedUser.id)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <div className="relative">
                    <img
                      src={selectedUser.avatar}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {onlineUserIds.includes(selectedUser.id) && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-[#242526]" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                      {selectedUser.name}
                    </h3>
                    <span className="text-[11px] text-emerald-600 font-semibold block leading-tight">
                      Active Now
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[#1877F2]">
                  <button className="p-2 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-full">
                    <Phone className="w-5 h-5" />
                  </button>
                  <button className="p-2 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-full">
                    <Video className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onOpenProfile(selectedUser.id)}
                    className="p-2 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-full"
                  >
                    <Info className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Message History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="text-center py-6">
                  <img
                    src={selectedUser.avatar}
                    alt=""
                    className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-white shadow-md mb-2"
                  />
                  <h4 className="font-bold text-base text-gray-900 dark:text-gray-100">
                    {selectedUser.name}
                  </h4>
                  <p className="text-xs text-gray-500">@{selectedUser.username} • TAIMOOR SOCIAL</p>
                  <p className="text-[11px] text-gray-400 mt-1">You are connected on TAIMOOR SOCIAL</p>
                </div>

                {messages.map((m) => {
                  const isMine = m.senderId === user?.id;
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm ${
                          isMine
                            ? 'bg-[#1877F2] text-white rounded-br-xs'
                            : 'bg-white dark:bg-[#3A3B3C] text-gray-900 dark:text-gray-100 border border-gray-200/60 dark:border-transparent rounded-bl-xs shadow-xs'
                        }`}
                      >
                        {m.mediaUrl && (
                          <img
                            src={m.mediaUrl}
                            alt=""
                            className="rounded-lg mb-2 max-h-60 object-cover"
                          />
                        )}
                        <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 px-1">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}

                {/* Typing Indicator */}
                {isPartnerTyping && (
                  <div className="flex items-center gap-2 text-gray-400 text-xs py-1">
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-100" />
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-200" />
                    <span className="text-xs ml-1">{selectedUser.name} is typing...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer Bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 bg-white dark:bg-[#242526] border-t border-[#E4E6EB] dark:border-[#393A3B] flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={() => handleSendSampleImage('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80')}
                  className="p-2 text-[#1877F2] hover:bg-gray-100 dark:hover:bg-[#3A3B3C] rounded-full cursor-pointer"
                  title="Send sample photo"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder="Type a message..."
                  className="flex-1 bg-[#F0F2F5] dark:bg-[#3A3B3C] rounded-full py-2 px-4 text-xs sm:text-sm text-gray-800 dark:text-gray-100 outline-none"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() || isSubmitting}
                  className="p-2 rounded-full bg-[#1877F2] hover:bg-[#166FE5] disabled:opacity-40 text-white cursor-pointer transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
              <UserIcon className="w-16 h-16 stroke-[1.5] mb-2 text-gray-300" />
              <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">Select a conversation</h3>
              <p className="text-xs text-gray-500 mt-1">Choose from your existing chats or start a new message.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
