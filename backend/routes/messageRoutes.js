import express from "express";
import { saveMessage, getMessages } from "../controllers/messageController.js";
// FIX: Import protect from the new middleware folder
import { protect } from "../middleware/authMiddleware.js"; 

const router = express.Router();

router.post("/", protect, saveMessage);
router.get("/:roomId", protect, getMessages);

export default router;