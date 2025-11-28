const mongoose=require('mongoose'); 
require("dotenv").config({quiet:true})
const DbConnect =async()=>{
      try{
      const conn=await  mongoose.connect(process.env.MONGO_URL);
      if(conn){
        console.log("Database connected");  
      }
      }catch(err){
        console.log("Error in Db connection",err);
      }
}

// DbCOnnect()
module.exports=DbConnect;