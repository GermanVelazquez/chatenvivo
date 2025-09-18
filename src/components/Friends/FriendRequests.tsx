import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, UserPlus, Send } from 'lucide-react';
import { FriendRequest, User } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const FriendRequests: React.FC = () => {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchUsername, setSearchUsername] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Simulación de solicitudes - reemplazar con llamada real al API
    const mockRequests: FriendRequest[] = [
      {
        id: '1',
        fromUser: {
          id: '6',
          username: 'Luis Fernández',
          email: 'luis@example.com',
          status: 'online',
          lastSeen: new Date().toISOString()
        },
        toUser: user!,
        status: 'pending',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '2',
        fromUser: {
          id: '7',
          username: 'Elena Ruiz',
          email: 'elena@example.com',
          status: 'offline',
          lastSeen: new Date(Date.now() - 86400000).toISOString()
        },
        toUser: user!,
        status: 'pending',
        createdAt: new Date(Date.now() - 7200000).toISOString()
      }
    ];
    setRequests(mockRequests);
  }, [user]);

  const handleAcceptRequest = (requestId: string) => {
    setRequests(prev => prev.filter(req => req.id !== requestId));
    // Aquí enviarías la aceptación al servidor
  };

  const handleRejectRequest = (requestId: string) => {
    setRequests(prev => prev.filter(req => req.id !== requestId));
    // Aquí enviarías el rechazo al servidor
  };

  const handleSendRequest = async () => {
    if (!searchUsername.trim()) return;
    
    setIsSearching(true);
    try {
      // Aquí enviarías la solicitud al servidor
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulación
      setSearchUsername('');
    } catch (error) {
      console.error('Error enviando solicitud:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes < 1 ? 'hace un momento' : `hace ${minutes} minutos`;
    } else if (hours < 24) {
      return `hace ${hours} horas`;
    } else {
      const days = Math.floor(hours / 24);
      return `hace ${days} días`;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Solicitudes de Amistad
        </h2>
        
        {/* Enviar solicitud */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Agregar nuevo amigo
          </h3>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Nombre de usuario"
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <button
              onClick={handleSendRequest}
              disabled={!searchUsername.trim() || isSearching}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isSearching ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={18} />
              )}
              <span>Enviar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lista de solicitudes */}
      <div className="flex-1 overflow-y-auto">
        {requests.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <UserPlus size={48} className="mx-auto mb-4 opacity-50" />
            <p>No tienes solicitudes pendientes</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {requests.map((request) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {request.fromUser.username.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {request.fromUser.username}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Solicitud enviada {formatTime(request.createdAt)}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleAcceptRequest(request.id)}
                      className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      title="Aceptar solicitud"
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.id)}
                      className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      title="Rechazar solicitud"
                    >
                      <X size={18} />
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

export default FriendRequests;
