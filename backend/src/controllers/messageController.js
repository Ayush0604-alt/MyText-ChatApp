const Message=require("../models/Message");
const Chat=require("../models/Chat");

const sendMessage=async(req,res)=>{
    try{
        const {chatId,text}=req.body
        ;
        if(!chatId || !text){
            return res.status(400).json({message:"not valide"});
        }

        const message=await Message.create({
            chatId,
            senderId:req.user._id,
            text,
        });
        const fullMessage=await Message.findById(message._id).populate("senderId","username email").populate("chatId");


        await Chat.findByIdAndUpdate(chatId,{
            lastMessage:fullMessage._id
        });
        const io=req.app.get("io");
        const chat = await Chat.findById(chatId);

            if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
            }    
            chat.participants.forEach((userId)=>{
            if (userId.toString() !== req.user._id.toString()) {
        io.to(userId.toString()).emit("messageReceived", fullMessage);
      }
        })
      return  res.status(201).json(fullMessage);

    }catch(e){
     console.log("SEND MESSAGE ERROR:", e);
    return res.status(500).json({message:e.message})
    }
}

const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    if (!chatId) {
      return res.status(400).json({ message: "Chat ID required" });
    }

    const messages = await Message.find({ chatId })
      .populate("senderId", "username email")
      .sort({ createdAt: 1 }) // oldest first
      .limit(50);

    res.status(200).json(messages);

  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};


const markAsSeen = async (req, res) => {
  try {
    const { chatId } = req.body;

    if (!chatId) {
      return res.status(400).json({ message: "Chat ID required" });
    }

    // Update all unseen messages where current user is NOT sender
    await Message.updateMany(
      {
        chatId,
        senderId: { $ne: req.user._id },
        seen: false,
      },
      { $set: { seen: true } }
    );

    // 🔥 Emit real-time event
    const io = req.app.get("io");

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    chat.participants.forEach((userId) => {
      if (userId.toString() !== req.user._id.toString()) {
        io.to(userId.toString()).emit("messagesSeen", {
          chatId,
          seenBy: req.user._id,
        });
      }
    });

    res.status(200).json({ message: "Messages marked as seen" });

  } catch (e) {
    console.log("SEEN ERROR:", e);
    res.status(500).json({ message: e.message });
  }
};
module.exports = {
  sendMessage,
  getMessages,
  markAsSeen
};