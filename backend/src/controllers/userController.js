const User=require("../models/User");
const cloudinary = require("../config/cloudinary");
const searchUsers= async(req,res)=>{
    try{
        let keyword={};
        if(req.query.search){
           keyword={ username:{$regex:req.query.search,$options: "i"}};
        }else{
          keyword= {};
        }

        const users=await User.find(keyword).find({_id:{$ne:req.user._id}}).select("-password");
        res.status(200).json(users);
    }catch(e){
        res.status(500).json({message:e.message})
    }
}
const updateAvatar = async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ message: "No image provided" });
    }

    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: "mytext_avatars",
    });

    const user = await User.findById(req.user._id);

    user.avatar = uploadResponse.secure_url;
    await user.save();

    res.json({
      message: "Avatar updated",
      avatar: user.avatar,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { searchUsers, updateAvatar };