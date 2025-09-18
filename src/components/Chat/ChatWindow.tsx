import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Paperclip, Smile, MoreVertical, Phone, Video } from 'lucide-react';
import { Chat, Message, User } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface ChatWindowProps {
  chat: Chat;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chat }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Simulación de mensajes - reemplazar con llamada real al API
    const mockMessages: Message[] = [
      {
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
        chatId: chat.id,
        timestamp: new Date(Date.now() - 300000).toISOString(),
        type: 'text'
      },
      {
        id: '2',
        content: '¡Hola Ana! Todo bien por aquí, gracias por preguntar 😊',
        senderId: user!.id,
        sender: user!,
        chatId: chat.id,
        timestamp: new Date(Date.now() - 240000).toISOString(),
        type: 'text'
      },
      {
        id: '3',
        content: '¿Te parece si nos vemos mañana para revisar el proyecto?',
        senderId: '2',
        sender: {
          id: '2',
          username: 'Ana García',
          email: 'ana@example.com',
          status: 'online',
          lastSeen: new Date().toISOString()
        },
        chatId: chat.id,
        timestamp: new Date(Date.now() - 120000).toISOString(),
        type: 'text'
      }
    ];
    setMessages(mockMessages);
  }, [chat.id, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        content: newMessage,
        senderId: user!.id,
        sender: user!,
        chatId: chat.id,
        timestamp: new Date().toISOString(),
        type: 'text'
      };
      
      setMessages(prev => [...prev, message]);
      setNewMessage('');
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getChatDisplayName = () => {
    if (chat.type === 'group') {
      return chat.name || 'Grupo sin nombre';
    } else {
      const otherParticipant = chat.participants.find(p => p.id !== user?.id);
      return otherParticipant?.username || 'Usuario desconocido';
    }
  };

  const getChatStatus = () => {
    if (chat.type === 'group') {
      return `${chat.participants.length} miembros`;
    } else {
      const otherParticipant = chat.participants.find(p => p.id !== user?.id);
      return otherParticipant?.status === 'online' ? 'En línea' : 'Desconectado';
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header del chat */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {getChatDisplayName().charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {getChatDisplayName()}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getChatStatus()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Phone size={20} />
            </button>
            <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Video size={20} />
            </button>
            <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md ${message.senderId === user?.id ? 'order-2' : 'order-1'}`}>
              <div className={`rounded-lg px-4 py-2 ${
                message.senderId === user?.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}>
                <p className="text-sm">{message.content}</p>
              </div>
              <p className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${
                message.senderId === user?.id ? 'text-right' : 'text-left'
              }`}>
                {formatTime(message.timestamp)}
              </p>
            </div>
          </motion.div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input de mensaje */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <button
            type="button"
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Paperclip size={20} />
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="w-full px-4 py-2 pr-12 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <Smile size={18} />
            </button>
          </div>
          
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
