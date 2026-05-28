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