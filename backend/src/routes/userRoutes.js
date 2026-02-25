const express=require("express");
const router=express.Router();

const { searchUsers, updateAvatar } = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, searchUsers);
router.put("/avatar", protect, updateAvatar);

module.exports = router;