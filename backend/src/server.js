const dotenv = require("dotenv");
dotenv.config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

connectDB();

// Create HTTP server
const server = http.createServer(app);

// Attach Socket.IO
const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

// Make io accessible inside controllers
app.set("io", io);

// In-memory store for online users
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // 🔹 Setup: Join personal room + track online
  socket.on("setup", (userData) => {
    socket.join(userData._id);

    onlineUsers.set(userData._id, socket.id);

    console.log("User joined personal room:", userData._id);

    // Notify others user is online
    socket.broadcast.emit("userOnline", userData._id);

    // Send list of currently online users
    socket.emit("onlineUsers", Array.from(onlineUsers.keys()));
  });

  // 🔹 Join Chat Room
  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
    console.log("Joined chat room:", chatId);
  });

  // 🔹 Typing Indicator
  socket.on("typing", ({ chatId, senderId }) => {
    socket.to(chatId).emit("typing", senderId);
  });

  socket.on("stopTyping", ({ chatId, senderId }) => {
    socket.to(chatId).emit("stopTyping", senderId);
  });

  // 🔹 Disconnect Handling
  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);

    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        socket.broadcast.emit("userOffline", userId);
        break;
      }
    }
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server is running at ${PORT}`);
});