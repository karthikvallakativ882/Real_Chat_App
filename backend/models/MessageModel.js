import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // IF THIS IS A DM:
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // IF THIS IS A CHANNEL MESSAGE:
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
    },
    // IF THIS IS A THREAD REPLY:
    parentMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message", 
      default: null, // If null, it's a main message. If it has an ID, it belongs in a thread.
    },
    text: {
      type: String,
      default: "",
    },
    fileUrl: {
      type: String, // Cloudinary URL goes here
      default: "",
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    reactions: [
      {
        emoji: String,
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
      }
    ]
  },
  { timestamps: true }
);

export const MessageModel = mongoose.model("Message", messageSchema);