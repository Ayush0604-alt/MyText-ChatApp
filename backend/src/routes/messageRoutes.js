const express = require("express");
const router = express.Router();

const { sendMessage, getMessages, markAsSeen } = require("../controllers/messageController");const { protect } = require("../middleware/authMiddleware");

// Send a message
router.post("/", protect, sendMessage);
router.get("/:chatId", protect, getMessages);
router.put("/seen", protect, markAsSeen);
module.exports = router;