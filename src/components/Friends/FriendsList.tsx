import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, UserPlus, MessageCircle, MoreVertical } from 'lucide-react';
import { User } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface FriendsListProps {
  onStartChat: (friend: User) => void;
}

const FriendsList: React.FC<FriendsListProps> = ({ onStartChat }) => {
  const [friends, setFriends] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    // Simulación de amigos - reemplazar con llamada real al API
    const mockFriends: User[] = [
      {
        id: '2',
        username: 'Ana García',
        email: 'ana@example.com',
        status: 'online',
        lastSeen: new Date().toISOString()
      },
      {
        id: '3',
        username: 'Carlos López',
        email: 'carlos@example.com',
        status: 'away',
        lastSeen: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '4',
        username: 'María Rodríguez',
        email: 'maria@example.com',
        status: 'offline',
        lastSeen: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: '5',
        username: 'David Martín',
        email: 'david@example.com',
        status: 'online',
        lastSeen: new Date().toISOString()
      }
    ];
    setFriends(mockFriends);
  }, []);

  const filteredFriends = friends.filter(friend =>
    friend.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status: User['status']) => {
    switch (status) {
      case 'online':
        return 'En línea';
      case 'away':
        return 'Ausente';
      case 'offline':
        return 'Desconectado';
      default:
        return 'Desconocido';
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Amigos</h2>
          <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <UserPlus size={20} />
          </button>
        </div>
        
        {/* Barra de búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar amigos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>
      </div>

      {/* Lista de amigos */}
      <div className="flex-1 overflow-y-auto">
        {filteredFriends.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <UserPlus size={48} className="mx-auto mb-4 opacity-50" />
            <p>No tienes amigos agregados</p>
          </div>
        ) : (
          <div className="p-2">
            {filteredFriends.map((friend) => (
              <motion.div
                key={friend.id}
                whileHover={{ scale: 1.02 }}
                className="p-3 rounded-lg mb-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {friend.username.charAt(0).toUpperCase()}
                    </div>
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(friend.status)}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {friend.username}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {getStatusText(friend.status)}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onStartChat(friend)}
                      className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors"
                      title="Enviar mensaje"
                    >
                      <MessageCircle size={18} />
                    </button>
                    <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsList;
