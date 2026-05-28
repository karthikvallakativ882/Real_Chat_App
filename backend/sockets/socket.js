import { ChannelModel } from "../models/ChannelModel.js";

let onlineUsers = new Map();

export const socketConnection = (io) => {
  io.on("connection", (socket) => {
    console.log("User Connected to Socket Layer:", socket.id);

    // 1. INITIAL SETUP & SYSTEM-WIDE ROOM JOINING
    socket.on("setup", async (userData) => {
      onlineUsers.set(userData._id, socket.id);
      
      // Force user into their own private room for receiving secure 1-to-1 DMs
      socket.join(userData._id.toString()); 

      try {
        // Force the socket to join every channel room so they receive public updates
        const allChannels = await ChannelModel.find({}, "_id");
        allChannels.forEach((channel) => {
          socket.join(channel._id.toString());
        });
      } catch (err) {
        console.error("Socket room synchronization failure:", err);
      }
      
      io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
    });

    // 2. FIXED MESSAGE BROADCASTER (Ensures DMs stay out of channels)
    socket.on("sendMessage", (messageData) => {
      const incomingChannelId = messageData.channelId;
      const incomingReceiverId = messageData.receiverId;

      // Rule A: Is it a sub-thread reply?
      if (messageData.parentMessageId) {
        const targetRoom = incomingChannelId || incomingReceiverId || messageData.senderId;
        io.to(targetRoom.toString()).emit("receiveMessage", messageData);
        return;
      }

      // Rule B: Is it a Public Channel broadcast?
      if (incomingChannelId) {
        socket.to(incomingChannelId.toString()).emit("receiveMessage", messageData);
        return;
      }

      // Rule C: Is it a Private 1-to-1 DM?
      if (incomingReceiverId) {
        // Target only the receiver's private room. Channels will never see this.
        socket.to(incomingReceiverId.toString()).emit("receiveMessage", messageData);
      }
    });

    // 3. EDIT MESSAGE BROADCAST
    socket.on("editMessage", (updatedMessage) => {
      const destination = updatedMessage.channelId || updatedMessage.receiverId;
      if (destination) {
        socket.to(destination.toString()).emit("messageUpdated", updatedMessage);
      }
    });

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