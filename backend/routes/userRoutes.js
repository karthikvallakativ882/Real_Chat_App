import express from "express";
import { getUsers } from "../controllers/userController.js";
// FIX: Import protect from the new middleware folder
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getUsers);

export default router;