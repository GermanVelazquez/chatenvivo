import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, MessageCircle } from 'lucide-react';
import { Chat, User } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface ChatListProps {
  onChatSelect: (chat: Chat) => void;
  selectedChatId?: string;
}

const ChatList: React.FC<ChatListProps> = ({ onChatSelect, selectedChatId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    // Simulación de chats - reemplazar con llamada real al API
    const mockChats: Chat[] = [
      {
        id: '1',
        type: 'private',
        participants: [
          user!,
          {
            id: '2',
            username: 'Ana García',
            email: 'ana@example.com',
            status: 'online',
            lastSeen: new Date().toISOString()
          }
        ],
        lastMessage: {
          id: '1',
          content: '¡Hola! ¿Cómo estás?',
          senderId: '2',
          sender: {
            id: '2',
            username: 'Ana García',
            email: 'ana@example.com',
            status: 'online',
            lastSeen: new Date().toISOString()
          },
          chatId: '1',
          timestamp: new Date().toISOString(),
          type: 'text'
        },
        unreadCount: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        type: 'group',
        name: 'Equipo de Desarrollo',
        participants: [
          user!,
          {
            id: '3',
            username: 'Carlos López',
            email: 'carlos@example.com',
            status: 'away',
            lastSeen: new Date().toISOString()
          },
          {
            id: '4',
            username: 'María Rodríguez',
            email: 'maria@example.com',
            status: 'offline',
            lastSeen: new Date().toISOString()
          }
        ],
        lastMessage: {
          id: '2',
          content: 'La reunión es a las 3pm',
          senderId: '3',
          sender: {
            id: '3',
            username: 'Carlos López',
            email: 'carlos@example.com',
            status: 'away',
            lastSeen: new Date().toISOString()
          },
          chatId: '2',
          timestamp: new Date().toISOString(),
          type: 'text'
        },
        unreadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    setChats(mockChats);
  }, [user]);

  const filteredChats = chats.filter(chat => {
    if (chat.type === 'group') {
      return chat.name?.toLowerCase().includes(searchTerm.toLowerCase());
    } else {
      const otherParticipant = chat.participants.find(p => p.id !== user?.id);
      return otherParticipant?.username.toLowerCase().includes(searchTerm.toLowerCase());
    }
  });

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes < 1 ? 'ahora' : `${minutes}m`;
    } else if (hours < 24) {
      return `${hours}h`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getChatDisplayName = (chat: Chat) => {
    if (chat.type === 'group') {
      return chat.name || 'Grupo sin nombre';
    } else {
      const otherParticipant = chat.participants.find(p => p.id !== user?.id);
      return otherParticipant?.username || 'Usuario desconocido';
    }
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.type === 'group') {
      return (
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold">
          <MessageCircle size={20} />
        </div>
      );
    } else {
      const otherParticipant = chat.participants.find(p => p.id !== user?.id);
      return (
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
            {otherParticipant?.username.charAt(0).toUpperCase()}
          </div>
          <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
            otherParticipant?.status === 'online' ? 'bg-green-500' :
            otherParticipant?.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
          }`} />
        </div>
      );
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Chats</h2>
          <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Plus size={20} />
          </button>
        </div>
        
        {/* Barra de búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>
      </div>

      {/* Lista de chats */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
            <p>No hay chats disponibles</p>
          </div>
        ) : (
          <div className="p-2">
            {filteredChats.map((chat) => (
              <motion.button
                key={chat.id}
                onClick={() => onChatSelect(chat)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full p-3 rounded-lg mb-2 transition-colors text-left ${
                  selectedChatId === chat.id
                    ? 'bg-blue-100 dark:bg-blue-900'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {getChatAvatar(chat)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {getChatDisplayName(chat)}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {chat.lastMessage && formatTime(chat.lastMessage.timestamp)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {chat.lastMessage?.content || 'Sin mensajes'}
                      </p>
                      {chat.unreadCount > 0 && (
                        <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;
