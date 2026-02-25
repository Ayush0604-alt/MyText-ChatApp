const mongoose=require('mongoose');

const connectDB=async()=>{
 try{
  const connect=await mongoose.connect(process.env.MONGO_URI);
  console.log(`MongoDB connected`);
 }catch(e){
    console.log("MongoDB failed to connect:",e.message);
    process.exit(1);
 }
}

module.exports=connectDB;
