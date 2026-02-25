const express=require("express");
const router=express.Router();

const { accessChat, getMyChats } = require("../controllers/chatController");const {protect}=require("../middleware/authMiddleware");

router.post("/",protect,accessChat);
router.get("/", protect, getMyChats);
module.exports=router;