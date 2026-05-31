import { ChannelModel } from "../models/ChannelModel.js";

let onlineUsers = new Map();

export const socketConnection = (io) => {
  io.on("connection", (socket) => {
    console.log("User Connected to Socket Layer:", socket.id);

    // 1. INITIAL SETUP & SYSTEM-WIDE ROOM JOINING
    socket.on("setup", async (userData) => {
      onlineUsers.set(userData._id, socket.id);
      
      // Force user into their own private room for DMs
      socket.join(userData._id.toString()); 

      try {
        // Force the socket to join every channel room
        const allChannels = await ChannelModel.find({}, "_id");
        allChannels.forEach((channel) => {
          socket.join(channel._id.toString());
        });
      } catch (err) {
        console.error("Socket room synchronization failure:", err);
      }
      
      io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
    });

    // 2. MESSAGE BROADCASTER
    socket.on("sendMessage", (messageData) => {
      const incomingChannelId = messageData.channelId;
      const incomingReceiverId = messageData.receiverId;

      if (messageData.parentMessageId) {
        const targetRoom = incomingChannelId || incomingReceiverId || messageData.senderId;
        io.to(targetRoom.toString()).emit("receiveMessage", messageData);
        return;
      }

      if (incomingChannelId) {
        socket.to(incomingChannelId.toString()).emit("receiveMessage", messageData);
        return;
      }

      if (incomingReceiverId) {
        socket.to(incomingReceiverId.toString()).emit("receiveMessage", messageData);
      }
    });

    //  3. THE FIX: SMART UPDATE BROADCASTER FOR EDITS & REACTIONS 🚨
    const broadcastUpdate = (eventName, updatedMessage) => {
      const channelId = updatedMessage.channelId;
      
      // FIX: Use optional chaining (?.) to safely handle null values!
      const senderId = updatedMessage.senderId?._id || updatedMessage.senderId;
      const receiverId = updatedMessage.receiverId?._id || updatedMessage.receiverId;

      if (channelId) {
        // If it's a channel, broadcast to everyone in the channel
        socket.to(channelId.toString()).emit(eventName, updatedMessage);
      } else if (receiverId && senderId) {
        // If it's a DM, we MUST broadcast to BOTH the sender's room AND the receiver's room!
        socket.to(receiverId.toString()).to(senderId.toString()).emit(eventName, updatedMessage);
      }
    };

    // Route edits through the smart broadcaster
    socket.on("editMessage", (updatedMessage) => {
      broadcastUpdate("messageUpdated", updatedMessage);
    });

    // Route emojis through the smart broadcaster
    socket.on("addReaction", (updatedMessage) => {
      broadcastUpdate("messageReacted", updatedMessage);
    });

//  NEW: Route deletions through the smart broadcaster
    socket.on("deleteMessage", (updatedMessage) => {
      // If deleted for everyone, broadcast it so the other person's UI updates
      if (updatedMessage.isDeletedForEveryone) {
        broadcastUpdate("messageDeleted", updatedMessage);
      }
    });

    // 4. DISCONNECT LOGIC
    socket.on("disconnect", () => {
      for (let [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
      io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
      console.log("User Socket Disconnected Safely");
    });
  });
};