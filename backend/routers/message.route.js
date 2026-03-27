import { Router } from "express";

import { multerMiddleware } from "../lib/cloudinary.js";
import { deleteMessage, getConversation, getMessages, markAsRead, sendMessage } from "../controllers/message.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";



const router = Router();


router.post('/send-message',protectRoute,multerMiddleware,sendMessage);
router.get('/conversations',protectRoute,getConversation)
router.get('/conversation/:conversationId/messages',protectRoute,getMessages);
router.put('/messages/read',protectRoute,markAsRead);

router.delete('/messages/:messageId',protectRoute,deleteMessage);



export default router