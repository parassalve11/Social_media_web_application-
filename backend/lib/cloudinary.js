
import {v2 as cloudinary} from 'cloudinary';
import dotenv from 'dotenv';
import multer from 'multer';
import * as fs from 'fs'

dotenv.config();

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_SECRET
});



export const uploadToClouduinary = (file) =>{
    const options = {
        resource_type:file.mimetype.startsWith('video/') ? "video" : "image"
    };

    return new Promise((resovle,reject ) =>{
        const uploader = file.mimetype.startsWith('video') ? cloudinary.uploader.upload_large : cloudinary.uploader.upload;
        uploader(file.path,options,(error,result) =>{
            fs.unlink(file.path,() =>{})
            if(error){
                return reject(error)
            }
            resovle(result)
        })
    } )
    
};


export const multerMiddleware = multer({ dest: "uploads/" }).array("media", 10);



export default cloudinary;