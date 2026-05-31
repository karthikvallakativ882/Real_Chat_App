import express from "express";
import { saveMessage, getMessages, editMessage ,toggleReaction,deleteMessage, clearChat} from "../controllers/messageController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Core Message Operations (Fully Protected)
router.post("/", protect, saveMessage);
router.get("/:destinationId", protect, getMessages); // destinationId handles both channelId or receiverId
router.put("/:messageId", protect, editMessage);
router.put("/:messageId/react", protect, toggleReaction);
router.put("/:messageId/delete", protect, deleteMessage);
router.delete("/clear/:destinationId", protect, clearChat);

export default router;