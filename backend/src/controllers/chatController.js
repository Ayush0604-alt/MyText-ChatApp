const Chat=require('../models/Chat');
const User=require('../models/User');
const Message = require("../models/Message");

const accessChat=async(req,res)=>{
    try{
     const {userId}=req.body;
     if(!userId){
        return res.status(404).json({message:"No User to chat entered"});
     }
     const userExists=await User.findById(userId);
     if(!userExists){
        return res.status(404).json({message:"Not a valid user"});
     }
    let chat=await Chat.findOne({
        participants:{$all:[req.user._id,userId]}
    }).populate("participants","-password").populate("lastMessage");

    if(chat){
        return res.status(200).json(chat);
    }
    const newChat=await Chat.create({
        participants:[req.user._id,userId]
    });
    const fullChat=await Chat.findById(newChat._id).populate("participants","-password");
       return res.status(201).json(fullChat);
    }catch(e){
        return res.status(404).json({message:e.message});
    }
}


const getMyChats=async(req,res)=>{
    try{
        const chats=await Chat.find({
            participants:{$in:[req.user._id]}
        }).populate("participants","-password").populate("lastMessage").sort({updatedAt:-1});
        res.status(200).json(chats);
    }catch(e){
        res.status(500).json({message:e.message});
    }
}

module.exports = {
  accessChat,
  getMyChats
};