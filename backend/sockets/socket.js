let onlineUsers = [];

export const socketConnection = (io) => {

  io.on("connection", (socket) => {

    console.log("User Connected:", socket.id);


    // ADD USER
    socket.on("addUser", (userData) => {

      const exists = onlineUsers.find(
        (user) =>
          user.userId === userData.userId
      );

      if (!exists) {

        onlineUsers.push({
          userId: userData.userId,
          socketId: socket.id,
        });
      }

      io.emit(
        "getOnlineUsers",
        onlineUsers
      );
    });


    // SEND MESSAGE
    socket.on("sendMessage", (messageData) => {

      const receiver = onlineUsers.find(
        (user) =>
          user.userId === messageData.receiverId
      );


      // SEND TO RECEIVER
      if (receiver) {

        io.to(receiver.socketId).emit(
          "receiveMessage",
          messageData
        );
      }


      // SEND BACK TO SENDER
      socket.emit(
        "messageSent",
        messageData
      );
    });


    // DISCONNECT
    socket.on("disconnect", () => {

      onlineUsers = onlineUsers.filter(
        (user) =>
          user.socketId !== socket.id
      );

      io.emit(
        "getOnlineUsers",
        onlineUsers
      );

      console.log("Disconnected");
    });

  });

};