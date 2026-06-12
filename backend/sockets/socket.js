import { ChannelModel } from "../models/ChannelModel.js";
import { UserModel } from "../models/UserModel.js"; 

let onlineUsers = new Map();

export const socketConnection = (io) => {
  io.on("connection", (socket) => {
    console.log("User Connected to Socket Layer:", socket.id);

    // 1. SETUP
    socket.on("setup", (userData) => {
      onlineUsers.set(userData._id, socket.id);
      socket.join(userData._id.toString()); 
      io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
    });

    socket.on("joinRoom", (roomId) => {
      if (roomId) socket.join(roomId.toString());
    });

    // --- NEW LOGIC ADDED: Typing Indicator Listeners ---
    socket.on("typing", (data) => {
      const targetRoom = data.channelId || data.receiverId;
      if (targetRoom) {
        socket.to(targetRoom.toString()).emit("typing", data);
      }
    });

    socket.on("stopTyping", (data) => {
      const targetRoom = data.channelId || data.receiverId;
      if (targetRoom) {
        socket.to(targetRoom.toString()).emit("stopTyping", data);
      }
    });
    // ---------------------------------------------------

    // 2. MESSAGE BROADCASTER
    socket.on("sendMessage", (messageData) => {
      const channelId = messageData.channelId?._id?.toString() || messageData.channelId?.toString();
      const receiverId = messageData.receiverId?._id?.toString() || messageData.receiverId?.toString();
      const senderId = messageData.senderId?._id?.toString() || messageData.senderId?.toString();

      if (messageData.parentMessageId) {
        const targetRoom = channelId || receiverId || senderId;
        io.to(targetRoom).emit("receiveMessage", messageData);
        return;
      }

      if (channelId) {
        socket.to(channelId).emit("receiveMessage", messageData);
        return;
      }

      if (receiverId) {
        socket.to(receiverId).emit("receiveMessage", messageData);
      }
    });

    // 3. SMART UPDATE BROADCASTER
    const broadcastUpdate = (eventName, updatedMessage) => {
      const channelId = updatedMessage.channelId?._id?.toString() || updatedMessage.channelId?.toString();
      const senderId = updatedMessage.senderId?._id?.toString() || updatedMessage.senderId?.toString();
      const receiverId = updatedMessage.receiverId?._id?.toString() || updatedMessage.receiverId?.toString();

      if (channelId) {
        socket.to(channelId).emit(eventName, updatedMessage);
      } else if (receiverId && senderId) {
        socket.to(receiverId).to(senderId).emit(eventName, updatedMessage);
      }
    };

    socket.on("editMessage", (updatedMessage) => broadcastUpdate("messageUpdated", updatedMessage));
    socket.on("addReaction", (updatedMessage) => broadcastUpdate("messageReacted", updatedMessage));
    socket.on("deleteMessage", (updatedMessage) => {
      if (updatedMessage.isDeletedForEveryone) broadcastUpdate("messageDeleted", updatedMessage);
    });

    // 4. DISCONNECT
    socket.on("disconnect", async () => {
      for (let [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          try {
            await UserModel.findByIdAndUpdate(userId, { lastSeen: new Date() });
          } catch (error) {
            console.error("Failed to update last seen", error);
          }
          break;
        }
      }
      io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
      console.log("User Socket Disconnected");
    });
  });
};