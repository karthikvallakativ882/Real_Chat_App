import { ChannelModel } from "../models/ChannelModel.js";
// --- NEW LOGIC ADDED: Import MessageModel for sorting ---
import { MessageModel } from "../models/MessageModel.js";
// --------------------------------------------------------

// CREATE CHANNEL
export const createChannel = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Create channel completely open to the public system
    const newChannel = await ChannelModel.create({
      name,
      description,
      adminId: req.user, 
      members: [req.user],
    });

    res.status(201).json(newChannel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL CHANNELS (FIXED: Visible to everyone)
export const getChannels = async (req, res) => {
  try {
    // --- NEW LOGIC ADDED: Use .lean() to modify objects and sort by recent ---
    const channels = await ChannelModel.find({}).lean();
    
    for (let i = 0; i < channels.length; i++) {
      const lastMsg = await MessageModel.findOne({ channelId: channels[i]._id }).sort({ createdAt: -1 });
      channels[i].lastMessageAt = lastMsg ? lastMsg.createdAt : channels[i].createdAt;
    }
    
    // Sort channels by the most recent message descending
    channels.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
    // -------------------------------------------------------------------------
    
    res.status(200).json(channels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};