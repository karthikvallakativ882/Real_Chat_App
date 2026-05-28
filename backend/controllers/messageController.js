import { MessageModel } from "../models/MessageModel.js";


// save message
export const saveMessage = async (
  req,
  res
) => {

  try {

    const message =
      await MessageModel.create(
        req.body
      );

    res.status(201).json(message);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};


// get messages
export const getMessages = async (req, res) => {
  try {

    const { roomId } = req.params;

    const messages = await MessageModel.find({
  roomId,
}).sort({ createdAt: 1 });

    res.status(200).json(messages);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};