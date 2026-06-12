import { ChannelModel } from "../models/ChannelModel.js";
// --- NEW LOGIC ADDED: Import UserModel to save Last Seen timestamp ---
import { UserModel } from "../models/UserModel.js"; 
// --------------------------------------------------------------------

let onlineUsers = new Map();

export const socketConnection = (io) => {
  io.on("connection", (socket) => {
    console.log("User Connected to Socket Layer:", socket.id);

    // 1. INITIAL SETUP
    socket.on("setup", async (userData) => {
      onlineUsers.set(userData._id, socket.id);
      socket.join(userData._id.toString()); 

      try {
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

    // 3. SMART UPDATE BROADCASTER
    const broadcastUpdate = (eventName, updatedMessage) => {
      const channelId = updatedMessage.channelId;
      const senderId = updatedMessage.senderId?._id || updatedMessage.senderId;
      const receiverId = updatedMessage.receiverId?._id || updatedMessage.receiverId;

      if (channelId) {
        socket.to(channelId.toString()).emit(eventName, updatedMessage);
      } else if (receiverId && senderId) {
        socket.to(receiverId.toString()).to(senderId.toString()).emit(eventName, updatedMessage);
      }
    };

    socket.on("editMessage", (updatedMessage) => broadcastUpdate("messageUpdated", updatedMessage));
    socket.on("addReaction", (updatedMessage) => broadcastUpdate("messageReacted", updatedMessage));
    socket.on("deleteMessage", (updatedMessage) => {
      if (updatedMessage.isDeletedForEveryone) broadcastUpdate("messageDeleted", updatedMessage);
    });

    // 4. DISCONNECT LOGIC (UPDATED WITH LAST SEEN)
    socket.on("disconnect", async () => {
      for (let [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          
          // --- NEW LOGIC ADDED: Save Last Seen to Database ---
          try {
            await UserModel.findByIdAndUpdate(userId, { lastSeen: new Date() });
          } catch (error) {
            console.error("Failed to update last seen", error);
          }
          // ---------------------------------------------------
          break;
        }
      }
      io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
      console.log("User Socket Disconnected Safely");
    });
  });
};