import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    roomId: {
      type: String,
    },

    text: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const MessageModel = mongoose.model(
  "Message",
  messageSchema
);