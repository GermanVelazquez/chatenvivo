const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_super_segura';

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de la base de datos SQLite
const db = new sqlite3.Database('./chat.db');

// Crear tablas si no existen
db.serialize(() => {
  // Tabla de usuarios
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    avatar TEXT,
    status TEXT DEFAULT 'offline',
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Tabla de chats
  db.run(`CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK(type IN ('private', 'group')),
    name TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users (id)
  )`);

  // Tabla de participantes en chats
  db.run(`CREATE TABLE IF NOT EXISTS chat_participants (
    id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES chats (id),
    FOREIGN KEY (user_id) REFERENCES users (id),
    UNIQUE(chat_id, user_id)
  )`);

  // Tabla de mensajes
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    chat_id TEXT NOT NULL,
    type TEXT DEFAULT 'text' CHECK(type IN ('text', 'image', 'file')),
    reply_to TEXT,
    edited BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users (id),
    FOREIGN KEY (chat_id) REFERENCES chats (id),
    FOREIGN KEY (reply_to) REFERENCES messages (id)
  )`);

  // Tabla de solicitudes de amistad
  db.run(`CREATE TABLE IF NOT EXISTS friend_requests (
    id TEXT PRIMARY KEY,
    from_user_id TEXT NOT NULL,
    to_user_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_user_id) REFERENCES users (id),
    FOREIGN KEY (to_user_id) REFERENCES users (id),
    UNIQUE(from_user_id, to_user_id)
  )`);

  // Tabla de amistades
  db.run(`CREATE TABLE IF NOT EXISTS friendships (
    id TEXT PRIMARY KEY,
    user1_id TEXT NOT NULL,
    user2_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_id) REFERENCES users (id),
    FOREIGN KEY (user2_id) REFERENCES users (id),
    UNIQUE(user1_id, user2_id)
  )`);
});

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Rutas de autenticación
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Verificar si el usuario ya existe
    db.get(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email],
      async (err, row) => {
        if (err) {
          return res.status(500).json({ error: 'Error del servidor' });
        }

        if (row) {
          return res.status(400).json({ error: 'Usuario o email ya existe' });
        }

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4();

        // Insertar nuevo usuario
        db.run(
          'INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)',
          [userId, username, email, hashedPassword],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Error al crear usuario' });
            }

            // Generar token JWT
            const token = jwt.sign({ userId, username }, JWT_SECRET);

            res.status(201).json({
              message: 'Usuario creado exitosamente',
              token,
              user: {
                id: userId,
                username,
                email,
                status: 'online'
              }
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username y contraseña son requeridos' });
    }

    // Buscar usuario
    db.get(
      'SELECT * FROM users WHERE username = ?',
      [username],
      async (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Error del servidor' });
        }

        if (!user) {
          return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Verificar contraseña
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Actualizar estado a online
        db.run(
          'UPDATE users SET status = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?',
          ['online', user.id]
        );

        // Generar token JWT
        const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET);

        res.json({
          message: 'Login exitoso',
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            status: 'online'
          }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Rutas de chat
app.get('/api/chats', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  db.all(`
    SELECT DISTINCT 
      c.id,
      c.type,
      c.name,
      c.created_at,
      c.updated_at,
      (
        SELECT COUNT(*) 
        FROM messages m 
        WHERE m.chat_id = c.id 
        AND m.sender_id != ? 
        AND m.created_at > COALESCE(
          (SELECT last_read FROM user_chat_status WHERE user_id = ? AND chat_id = c.id),
          '1970-01-01'
        )
      ) as unread_count
    FROM chats c
    INNER JOIN chat_participants cp ON c.id = cp.chat_id
    WHERE cp.user_id = ?
    ORDER BY c.updated_at DESC
  `, [userId, userId, userId], (err, chats) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener chats' });
    }

    res.json(chats);
  });
});

app.get('/api/chats/:chatId/messages', authenticateToken, (req, res) => {
  const { chatId } = req.params;
  const userId = req.user.userId;
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;

  // Verificar que el usuario es participante del chat
  db.get(
    'SELECT id FROM chat_participants WHERE chat_id = ? AND user_id = ?',
    [chatId, userId],
    (err, participant) => {
      if (err) {
        return res.status(500).json({ error: 'Error del servidor' });
      }

      if (!participant) {
        return res.status(403).json({ error: 'No tienes acceso a este chat' });
      }

      // Obtener mensajes
      db.all(`
        SELECT 
          m.id,
          m.content,
          m.type,
          m.edited,
          m.created_at,
          u.id as sender_id,
          u.username as sender_username,
          u.avatar as sender_avatar
        FROM messages m
        INNER JOIN users u ON m.sender_id = u.id
        WHERE m.chat_id = ?
        ORDER BY m.created_at DESC
        LIMIT ? OFFSET ?
      `, [chatId, limit, offset], (err, messages) => {
        if (err) {
          return res.status(500).json({ error: 'Error al obtener mensajes' });
        }

        res.json(messages.reverse());
      });
    }
  );
});

// Rutas de amigos
app.get('/api/friends', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  db.all(`
    SELECT 
      u.id,
      u.username,
      u.email,
      u.avatar,
      u.status,
      u.last_seen
    FROM users u
    INNER JOIN friendships f ON (
      (f.user1_id = ? AND f.user2_id = u.id) OR
      (f.user2_id = ? AND f.user1_id = u.id)
    )
    WHERE u.id != ?
  `, [userId, userId, userId], (err, friends) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener amigos' });
    }

    res.json(friends);
  });
});

app.get('/api/friend-requests', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  db.all(`
    SELECT 
      fr.id,
      fr.status,
      fr.created_at,
      u.id as from_user_id,
      u.username as from_username,
      u.email as from_email,
      u.avatar as from_avatar
    FROM friend_requests fr
    INNER JOIN users u ON fr.from_user_id = u.id
    WHERE fr.to_user_id = ? AND fr.status = 'pending'
    ORDER BY fr.created_at DESC
  `, [userId], (err, requests) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener solicitudes' });
    }

    res.json(requests);
  });
});

app.post('/api/friend-requests', authenticateToken, (req, res) => {
  const { toUsername } = req.body;
  const fromUserId = req.user.userId;

  // Buscar usuario destinatario
  db.get(
    'SELECT id FROM users WHERE username = ?',
    [toUsername],
    (err, toUser) => {
      if (err) {
        return res.status(500).json({ error: 'Error del servidor' });
      }

      if (!toUser) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      if (toUser.id === fromUserId) {
        return res.status(400).json({ error: 'No puedes enviarte una solicitud a ti mismo' });
      }

      // Verificar si ya son amigos
      db.get(`
        SELECT id FROM friendships 
        WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
      `, [fromUserId, toUser.id, toUser.id, fromUserId], (err, friendship) => {
        if (err) {
          return res.status(500).json({ error: 'Error del servidor' });
        }

        if (friendship) {
          return res.status(400).json({ error: 'Ya son amigos' });
        }

        // Insertar solicitud
        const requestId = uuidv4();
        db.run(
          'INSERT OR REPLACE INTO friend_requests (id, from_user_id, to_user_id) VALUES (?, ?, ?)',
          [requestId, fromUserId, toUser.id],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Error al enviar solicitud' });
            }

            res.status(201).json({ message: 'Solicitud enviada exitosamente' });
          }
        );
      });
    }
  );
});

app.put('/api/friend-requests/:requestId', authenticateToken, (req, res) => {
  const { requestId } = req.params;
  const { action } = req.body; // 'accept' o 'reject'
  const userId = req.user.userId;

  // Verificar que la solicitud existe y es para este usuario
  db.get(
    'SELECT * FROM friend_requests WHERE id = ? AND to_user_id = ? AND status = "pending"',
    [requestId, userId],
    (err, request) => {
      if (err) {
        return res.status(500).json({ error: 'Error del servidor' });
      }

      if (!request) {
        return res.status(404).json({ error: 'Solicitud no encontrada' });
      }

      const newStatus = action === 'accept' ? 'accepted' : 'rejected';

      // Actualizar estado de la solicitud
      db.run(
        'UPDATE friend_requests SET status = ? WHERE id = ?',
        [newStatus, requestId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Error al actualizar solicitud' });
          }

          // Si se acepta, crear amistad
          if (action === 'accept') {
            const friendshipId = uuidv4();
            db.run(
              'INSERT INTO friendships (id, user1_id, user2_id) VALUES (?, ?, ?)',
              [friendshipId, request.from_user_id, userId],
              function(err) {
                if (err) {
                  return res.status(500).json({ error: 'Error al crear amistad' });
                }

                res.json({ message: 'Solicitud aceptada exitosamente' });
              }
            );
          } else {
            res.json({ message: 'Solicitud rechazada' });
          }
        }
      );
    }
  );
});

// Socket.IO para tiempo real
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  // Autenticación del socket
  socket.on('authenticate', (token) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.userId;
      socket.username = decoded.username;
      
      connectedUsers.set(decoded.userId, socket.id);
      
      // Actualizar estado del usuario
      db.run(
        'UPDATE users SET status = ? WHERE id = ?',
        ['online', decoded.userId]
      );

      socket.emit('authenticated', { success: true });
      socket.broadcast.emit('user_status_change', {
        userId: decoded.userId,
        status: 'online'
      });
    } catch (error) {
      socket.emit('authenticated', { success: false, error: 'Token inválido' });
    }
  });

  // Unirse a un chat
  socket.on('join_chat', (chatId) => {
    socket.join(chatId);
  });

  // Salir de un chat
  socket.on('leave_chat', (chatId) => {
    socket.leave(chatId);
  });

  // Enviar mensaje
  socket.on('send_message', async (data) => {
    const { chatId, content, type = 'text' } = data;
    
    if (!socket.userId) {
      return socket.emit('error', { message: 'No autenticado' });
    }

    // Verificar que el usuario es participante del chat
    db.get(
      'SELECT id FROM chat_participants WHERE chat_id = ? AND user_id = ?',
      [chatId, socket.userId],
      (err, participant) => {
        if (err || !participant) {
          return socket.emit('error', { message: 'No tienes acceso a este chat' });
        }

        // Insertar mensaje en la base de datos
        const messageId = uuidv4();
        db.run(
          'INSERT INTO messages (id, content, sender_id, chat_id, type) VALUES (?, ?, ?, ?, ?)',
          [messageId, content, socket.userId, chatId, type],
          function(err) {
            if (err) {
              return socket.emit('error', { message: 'Error al enviar mensaje' });
            }

            // Actualizar timestamp del chat
            db.run(
              'UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
              [chatId]
            );

            // Obtener información completa del mensaje
            db.get(`
              SELECT 
                m.id,
                m.content,
                m.type,
                m.created_at,
                u.id as sender_id,
                u.username as sender_username,
                u.avatar as sender_avatar
              FROM messages m
              INNER JOIN users u ON m.sender_id = u.id
              WHERE m.id = ?
            `, [messageId], (err, message) => {
              if (err) {
                return socket.emit('error', { message: 'Error al obtener mensaje' });
              }

              // Enviar mensaje a todos los participantes del chat
              io.to(chatId).emit('new_message', message);
            });
          }
        );
      }
    );
  });

  // Usuario escribiendo
  socket.on('typing', (data) => {
    socket.to(data.chatId).emit('user_typing', {
      userId: socket.userId,
      username: socket.username,
      chatId: data.chatId
    });
  });

  socket.on('stop_typing', (data) => {
    socket.to(data.chatId).emit('user_stop_typing', {
      userId: socket.userId,
      chatId: data.chatId
    });
  });

  // Desconexión
  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
    
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      
      // Actualizar estado del usuario
      db.run(
        'UPDATE users SET status = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?',
        ['offline', socket.userId]
      );

      socket.broadcast.emit('user_status_change', {
        userId: socket.userId,
        status: 'offline'
      });
    }
  });
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
});

// Manejo de errores
process.on('uncaughtException', (err) => {
  console.error('Error no capturado:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Promesa rechazada no manejada:', err);
});
