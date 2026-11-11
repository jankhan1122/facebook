import React, { useState } from 'react';
import {
  Search, Tag, MapPin, MessageCircle, Filter, Plus, ShieldCheck
} from 'lucide-react';
import { useSocket } from '../context/SocketContext.tsx';

export const MarketplaceView: React.FC = () => {
  const { setActiveChatUserId } = useSocket();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchItem, setSearchItem] = useState('');

  const categories = ['All', 'Electronics', 'Vehicles', 'Property', 'Apparel', 'Hobbies'];

  const items = [
    {
      id: 'item_1',
      title: 'MacBook Pro 16" M3 Max - 36GB RAM / 1TB SSD',
      price: '$2,450',
      location: 'Dubai, Downtown',
      category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
      sellerId: 'user_taimoor',
      sellerName: 'Taimoor Khan'
    },
    {
      id: 'item_2',
      title: 'Sony Alpha A7 IV Mirrorless Camera + 24-70mm GM Lens',
      price: '$1,850',
      location: 'San Francisco, CA',
      category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
      sellerId: 'user_alex',
      sellerName: 'Alex Rivera'
    },
    {
      id: 'item_3',
      title: 'Modern Minimalist Ergonomic Office Chair',
      price: '$280',
      location: 'Seattle, WA',
      category: 'Furniture',
      image: 'https://images.unsplash.com/photo-1580481077197-28d8b6f3ff58?auto=format&fit=crop&w=800&q=80',
      sellerId: 'user_sarah',
      sellerName: 'Sarah Jenkins'
    },
    {
      id: 'item_4',
      title: 'Electric Road Bike - Custom Alloy Frame, 60km Range',
      price: '$950',
      location: 'Los Angeles, CA',
      category: 'Vehicles',
      image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80',
      sellerId: 'user_marcus',
      sellerName: 'Marcus Vance'
    },
    {
      id: 'item_5',
      title: 'Apple iPad Pro 12.9" with Magic Keyboard & Apple Pencil',
      price: '$890',
      location: 'Palo Alto, CA',
      category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80',
      sellerId: 'user_sophia',
      sellerName: 'Sophia Chen'
    },
    {
      id: 'item_6',
      title: 'Designer Minimalist Mechanical Keyboard (Wireless)',
      price: '$140',
      location: 'Dubai, Marina',
      category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
      sellerId: 'user_taimoor',
      sellerName: 'Taimoor Khan'
    }
  ];

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchItem.toLowerCase()) ||
                          item.location.toLowerCase().includes(searchItem.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#E4E6EB] dark:border-[#393A3B] gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">Marketplace</h1>
          <p className="text-xs text-gray-500">Buy and sell items locally or globally</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center bg-[#F0F2F5] dark:bg-[#3A3B3C] rounded-xl px-3 py-2 text-xs flex-1 sm:w-64">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input
              type="text"
              value={searchItem}
              onChange={(e) => setSearchItem(e.target.value)}
              placeholder="Search Marketplace..."
              className="bg-transparent border-none outline-none w-full text-gray-800 dark:text-gray-200"
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 mb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              selectedCategory === cat
                ? 'bg-[#1877F2] text-white shadow-xs'
                : 'bg-white dark:bg-[#242526] text-gray-700 dark:text-gray-300 border border-[#E4E6EB] dark:border-[#393A3B] hover:bg-gray-50 dark:hover:bg-[#3A3B3C]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-[#242526] rounded-2xl overflow-hidden shadow-xs border border-[#E4E6EB] dark:border-[#393A3B] flex flex-col justify-between group hover:shadow-lg transition-all"
          >
            <div className="h-52 overflow-hidden bg-gray-100 relative">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-xs text-white font-extrabold text-sm px-3 py-1 rounded-lg">
                {item.price}
              </span>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
                  {item.title}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{item.location}</span>
                </div>
                <div className="text-[11px] text-gray-400 mt-1">
                  Listed by <span className="font-semibold text-gray-700 dark:text-gray-300">{item.sellerName}</span>
                </div>
              </div>

              <button
                onClick={() => setActiveChatUserId(item.sellerId)}
                className="mt-4 w-full py-2 bg-blue-50 hover:bg-blue-100 text-[#1877F2] dark:bg-blue-950/60 dark:hover:bg-blue-900/60 dark:text-blue-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Message Seller</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
