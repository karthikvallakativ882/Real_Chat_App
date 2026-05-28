import { MessageModel } from "../models/MessageModel.js";

// SAVE NEW MESSAGE OR THREAD REPLY
export const saveMessage = async (req, res) => {
  try {
    const { receiverId, channelId, parentMessageId, text, fileUrl } = req.body;

    const message = await MessageModel.create({
      senderId: req.user, // From protect middleware
      receiverId: receiverId || null,
      channelId: channelId || null,
      parentMessageId: parentMessageId || null, // If present, it's a thread reply
      text,
      fileUrl: fileUrl || "",
    });

    // Populate sender info before sending back to frontend
    await message.populate("senderId", "username profilePic");
    
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// EDIT EXISTING MESSAGE
export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;

    const updatedMessage = await MessageModel.findByIdAndUpdate(
      messageId,
      { text, isEdited: true },
      { new: true }
    ).populate("senderId", "username");

    res.status(200).json(updatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET MESSAGES (Handles Channel, DM, and Threads)
// GET MESSAGES (Handles Channel, DM, and Threads)
export const getMessages = async (req, res) => {
  try {
    const { destinationId } = req.params; 
    const { isThread, isChannel } = req.query; 

    let query = {};

    if (isThread === "true") {
      // Fetch replies to a specific thread
      query = { parentMessageId: destinationId };
    } else if (isChannel === "true") {
      // Fetch channel messages
      query = { parentMessageId: null, channelId: destinationId };
    } else {
      // Fetch 1-on-1 Direct Messages between current user and destinationId
      query = {
        parentMessageId: null,
        channelId: null,
        $or: [
          { senderId: req.user, receiverId: destinationId },
          { senderId: destinationId, receiverId: req.user }
        ]
      };
    }

    const messages = await MessageModel.find(query)
      .populate("senderId", "username profilePic")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// TOGGLE EMOJI REACTION
export const toggleReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user;

    const message = await MessageModel.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    // Check if this emoji already exists on the message
    const reactionIndex = message.reactions.findIndex(r => r.emoji === emoji);

    if (reactionIndex > -1) {
      // Emoji exists. Did THIS user already click it?
      const userIndex = message.reactions[reactionIndex].users.indexOf(userId);
      if (userIndex > -1) {
        // User already reacted -> Remove their reaction
        message.reactions[reactionIndex].users.splice(userIndex, 1);
        // If no users are left for this emoji, remove the emoji entirely
        if (message.reactions[reactionIndex].users.length === 0) {
          message.reactions.splice(reactionIndex, 1);
        }
      } else {
        // User hasn't reacted yet -> Add their ID
        message.reactions[reactionIndex].users.push(userId);
      }
    } else {
      // Brand new emoji for this message
      message.reactions.push({ emoji, users: [userId] });
    }

    await message.save();
    await message.populate("senderId", "username profilePic");

    res.status(200).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};