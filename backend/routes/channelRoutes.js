import express from "express";
import { createChannel, getChannels } from "../controllers/channelController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Both routes must be protected
router.post("/", protect, createChannel);
router.get("/", protect, getChannels);

export default router;