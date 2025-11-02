import express from "express";

import { protect } from "../middlewares/auth.js";
import { createChat, deleteChat, getChats } from "../controllers/chatController.js";

const chatRouter = express.Router();

chatRouter.post('/create', protect, createChat)
chatRouter.get('/get', protect, getChats)
chatRouter.delete('/delete/:chatId', protect, deleteChat)


export default chatRouter;