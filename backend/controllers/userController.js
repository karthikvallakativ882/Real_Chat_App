import { UserModel } from "../models/UserModel.js";
// --- NEW LOGIC ADDED: Import MessageModel for sorting ---
import { MessageModel } from "../models/MessageModel.js";
// --------------------------------------------------------

export const getUsers = async (req, res) => {
  try {
    // --- NEW LOGIC ADDED: Use .lean() to allow modifying the objects ---
    const users = await UserModel.find().select("-password").lean();
    
    // Fetch the latest message timestamp for each user to sort them (WhatsApp style)
    const currentUserId = req.user; 
    
    if (currentUserId) {
      for (let i = 0; i < users.length; i++) {
        const lastMsg = await MessageModel.findOne({
          $or: [
            { senderId: currentUserId, receiverId: users[i]._id },
            { senderId: users[i]._id, receiverId: currentUserId }
          ]
        }).sort({ createdAt: -1 });
        
        users[i].lastMessageAt = lastMsg ? lastMsg.createdAt : new Date(0);
      }
      
      // Sort users by the most recent message descending
      users.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
    }
    // -------------------------------------------------------------------

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};