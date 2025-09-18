import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Layout/Sidebar';
import ChatList from '../components/Chat/ChatList';
import ChatWindow from '../components/Chat/ChatWindow';
import FriendsList from '../components/Friends/FriendsList';
import FriendRequests from '../components/Friends/FriendRequests';
import { Chat, User } from '../types';
import { useAuth } from '../contexts/AuthContext';

const ChatPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('chats');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const { user } = useAuth();

  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat);
  };

  const handleStartChat = (friend: User) => {
    // Crear un chat privado con el amigo
    const newChat: Chat = {
      id: `private-${friend.id}`,
      type: 'private',
      participants: [user!, friend],
      unreadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setSelectedChat(newChat);
    setActiveTab('chats');
  };

  const renderMainContent = () => {
    switch (activeTab) {
      case 'chats':
        return (
          <div className="flex h-full">
            <div className="w-full lg:w-96 border-r border-gray-200 dark:border-gray-700">
              <ChatList 
                onChatSelect={handleChatSelect}
                selectedChatId={selectedChat?.id}
              />
            </div>
            <div className="hidden lg:flex flex-1">
              {selectedChat ? (
                <ChatWindow chat={selectedChat} />
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      💬
                    </div>
                    <h3 className="text-lg font-medium mb-2">
                      Selecciona un chat
                    </h3>
                    <p>
                      Elige una conversación para comenzar a chatear
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 'friends':
        return <FriendsList onStartChat={handleStartChat} />;
      case 'requests':
        return <FriendRequests />;
      case 'settings':
        return (
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Configuración
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Próximamente: configuración de perfil, notificaciones y privacidad
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex bg-gray-100 dark:bg-gray-900">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 flex flex-col lg:flex-row">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="flex-1"
          >
            {renderMainContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Modal para chat en móvil */}
      <AnimatePresence>
        {selectedChat && activeTab === 'chats' && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="lg:hidden fixed inset-0 z-50 bg-white dark:bg-gray-800"
          >
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
                <button
                  onClick={() => setSelectedChat(null)}
                  className="mr-3 p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  ←
                </button>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Volver a chats
                </h3>
              </div>
              <div className="flex-1">
                <ChatWindow chat={selectedChat} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatPage;
