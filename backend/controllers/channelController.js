import { ChannelModel } from "../models/ChannelModel.js";

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
    // Find ALL channels in the database so any logged-in user can click and chat
    const channels = await ChannelModel.find({});
    res.status(200).json(channels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};