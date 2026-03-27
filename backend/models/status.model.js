import mongoose, { Schema } from "mongoose";




const statusSchema = new Schema({
    user:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
    content:{type:String,required:true},
    contentType:{type:String,enum:["video","image","text"],default:"text"},
    viewers:[{type:mongoose.Schema.Types.ObjectId,ref:"User"}],
    expiresAt:{type:Date}
},{timestamps:true});


const Status = mongoose.model("Status",statusSchema);

export default Status;