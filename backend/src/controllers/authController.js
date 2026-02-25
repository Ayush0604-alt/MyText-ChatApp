const User=require('../models/User');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');

const generateToken=(id)=>{
    return jwt.sign({id},process.env.JWT_SECRET,{expiresIn:"3d"});
};

const registerUser=async (req,res)=>{
    try{
       const {username,email,password}=req.body;
       const userExists= await User.findOne({email});
       if(userExists){
        return res.status(400).json({message:"User exists"});
       }
       const salt=await bcrypt.genSalt(10);
       const hashedPassword=await bcrypt.hash(password,salt);

       const user=await User.create({
        username,email,
        password:hashedPassword
       });
       res.status(201).json({
        _id:user._id,
        username:user.username,
        email:user.email,
        avatar: user.avatar,
        token: generateToken(user._id)
       });

    } catch(e){
       res.status(500).json({message:e.message});
    }
}

const loginUser= async(req,res)=>{
    try{
       const {email,password}=req.body;
       const userExists=await User.findOne({email});
       if(userExists && (await bcrypt.compare(password,userExists.password))){
        res.status(200).json({
        _id:userExists._id,
        username:userExists.username,
        email:userExists.email,
        avatar: userExists.avatar,
        token:generateToken(userExists._id)
       });
       }else{
        res.status(401).json({message:"Invalid user"});
       }
    }catch(e){
     res.status(500).json({message:e.message});
    }
}

module.exports={registerUser,loginUser};