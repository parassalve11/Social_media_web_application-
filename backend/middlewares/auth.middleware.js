import jwt from "jsonwebtoken";
import User from "../models/user.model.js";


export const protectRoute = async(req,res,next) =>{
    try {
        const bearer = req.headers.authorization;
        const token =
          req.cookies?.jwt_social || (bearer ? bearer.split(" ")[1] : null);

        if(!token){
            return res.status(401).json({message:"Unauthorized token"})
        };

        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        if(!decoded){
            return res.status(401).json({message:'Token not found'});
        };

        const user = await User.findById(decoded.userId).select("-password");

        if(!user){
            return res.status(400).json({message:"user not found"})
        };

        if(!user.emailVerified){
            return res.status(403).json({message:"Email not verified"})
        }

        req.user = user;
        next()

    } catch (error) {
        console.log("Erorr in protect route MiddleWare",error.message);
        res.status(401).json({message:"Unauthorized"})
      
    }
}
