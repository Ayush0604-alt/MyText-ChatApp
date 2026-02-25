const express=require('express');
const cors=require('cors');
const authRoutes = require("./routes/authRoutes");
const { protect } = require("./middleware/authMiddleware");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");

const app=express();

app.use(express.json());
app.use(cors({
    origin:process.env.CLIENT_URL,
    credentials:true
}));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);
app.get("/", (req, res) => {
  res.send("MYTEXT Backend is running...");
});
app.get("/api/test", protect, (req, res) => {
  res.json({
    message: "Protected route working",
    user: req.user,
  });
});


module.exports=app;