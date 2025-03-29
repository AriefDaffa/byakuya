import { createServer } from 'node:http';
import next from 'next';
import { Server } from 'socket.io';

import { prisma } from './lib/prisma';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer);

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('send_message', async (data) => {
      const { senderId, content, chatId, isGroup } = data;

      const message = await prisma.message.create({
        data: {
          senderId,
          content,
          privateChatId: isGroup ? null : chatId,
          groupChatId: isGroup ? chatId : null,
        },
      });

      io.to(chatId).emit('receive_message', message);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
