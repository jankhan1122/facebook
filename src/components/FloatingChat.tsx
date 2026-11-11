import React, { useState, useEffect, useRef } from 'react';
import {
  X, Minus, Send, Image as ImageIcon, Smile, Phone, Video,
  Paperclip, MoreVertical
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useSocket } from '../context/SocketContext.tsx';
import { Message, User } from '../types.ts';

export const FloatingChat: React.FC = () => {
  const { user, token } = useAuth();
  const {
    activeChatUserId,
    setActiveChatUserId,
    socket,
    typingUsers,
    sendTyping,
    sendStopTyping
  } = useSocket();

  const [chatPartner, setChatPartner] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  const isPartnerTyping = activeChatUserId ? typingUsers.has(activeChatUserId) : false;

  useEffect(() => {
    if (!activeChatUserId || !token) return;

    // Fetch user details
    fetch(`/api/users/${activeChatUserId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setChatPartner(data.user))
      .catch(console.error);

    // Fetch messages
    fetch(`/api/messages/${activeChatUserId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setMessages(data))
      .catch(console.error);
  }, [activeChatUserId, token]);

  // Listen for incoming socket messages
  useEffect(() => {
    if (!socket || !activeChatUserId) return;

    const handlePrivateMessage = (msg: Message) => {
      if (msg.senderId === activeChatUserId || msg.receiverId === activeChatUserId) {
        setMessages(prev => [...prev, msg]);
      }
    };

    socket.on('private_message', handlePrivateMessage);
    return () => {
      socket.off('private_message', handlePrivateMessage);
    };
  }, [socket, activeChatUserId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPartnerTyping]);

  if (!activeChatUserId || !chatPartner) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    sendTyping(activeChatUserId);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendStopTyping(activeChatUserId);
    }, 1500);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !token || !user) return;

    const textToSend = inputText.trim();
    setInputText('');
    sendStopTyping(activeChatUserId);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/messages/${activeChatUserId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: textToSend })
      });

      if (res.ok) {
        const newMsg: Message = await res.json();
        setMessages(prev => [...prev, newMsg]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendPhoto = (url: string) => {
    if (!token) return;
    fetch(`/api/messages/${activeChatUserId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        content: 'Sent a photo',
        mediaUrl: url
      })
    })
      .then(res => res.json())
      .then(newMsg => setMessages(prev => [...prev, newMsg]))
      .catch(console.error);
  };

  return (
    <div className="fixed bottom-14 md:bottom-0 right-2 sm:right-16 z-50 w-[calc(100vw-16px)] sm:w-84 max-w-sm shadow-2xl rounded-t-2xl bg-white dark:bg-[#242526] border border-gray-200 dark:border-[#393A3B] overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-[#242526] px-3 py-2.5 flex items-center justify-between border-b border-gray-100 dark:border-[#393A3B] shadow-xs">
        <div className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
          <div className="relative">
            <img
              src={chatPartner.avatar}
              alt={chatPartner.name}
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-[#242526]" />
          </div>
          <div className="truncate">
            <h4 className="font-bold text-xs text-gray-900 dark:text-gray-100 truncate">
              {chatPartner.name}
            </h4>
            <span className="text-[10px] text-emerald-600 font-semibold block leading-tight">
              Active Now
            </span>
          </div>
        </div>

        {/* Header icons */}
        <div className="flex items-center gap-1 text-gray-500">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#3A3B3C]"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveChatUserId(null)}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#3A3B3C]"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Body */}
          <div className="h-72 overflow-y-auto p-3 space-y-2.5 text-xs bg-gray-50/50 dark:bg-[#18191A]">
            <div className="text-center py-2 text-gray-400 text-[11px]">
              Connected with {chatPartner.name} on TAIMOOR SOCIAL
            </div>

            {messages.map((m) => {
              const isMine = m.senderId === user?.id;
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[78%] px-3 py-2 rounded-2xl ${
                      isMine
                        ? 'bg-[#1877F2] text-white rounded-br-xs'
                        : 'bg-[#E4E6EB] dark:bg-[#3A3B3C] text-gray-900 dark:text-gray-100 rounded-bl-xs'
                    }`}
                  >
                    {m.mediaUrl && (
                      <img
                        src={m.mediaUrl}
                        alt="attachment"
                        className="rounded-lg mb-1.5 max-h-40 object-cover"
                      />
                    )}
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                  <span className="text-[9px] text-gray-400 mt-0.5 px-1">
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isPartnerTyping && (
              <div className="flex items-center gap-1.5 text-gray-400 text-xs py-1">
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-100" />
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-200" />
                <span className="text-[11px] ml-1">{chatPartner.name} is typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-2 bg-white dark:bg-[#242526] border-t border-gray-100 dark:border-[#393A3B] flex items-center gap-1.5"
          >
            <button
              type="button"
              onClick={() => handleSendPhoto('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80')}
              className="text-[#1877F2] p-1.5 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] rounded-full cursor-pointer"
              title="Send sample photo"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder="Aa"
              className="flex-1 bg-[#F0F2F5] dark:bg-[#3A3B3C] rounded-full py-1.5 px-3 text-xs text-gray-800 dark:text-gray-100 outline-none"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isSubmitting}
              className="text-[#1877F2] hover:text-[#166FE5] disabled:opacity-40 p-1.5 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </>
      )}
    </div>
  );
};
