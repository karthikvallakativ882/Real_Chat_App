import express from "express";
import {
  registerUser,
  loginUser,
  changePassword, // <-- NEW
  updateProfilePic  // <-- NEW
} from "../controllers/authController.js";

// --- NEW LOGIC ADDED: Import your auth middleware to protect the new routes ---
import { protect } from "../middleware/authMiddleware.js"; 
// -----------------------------------------------------------------------------

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// --- NEW LOGIC ADDED: Protected Routes for Settings ---
router.put("/change-password", protect, changePassword);
router.put("/update-profile", protect, updateProfilePic);
// ------------------------------------------------------

export default router;