import { useState } from "react";

import Navbar from "../components/Navbar";

import OnlineUsers from "../components/OnlineUsers";

import ChatBox from "../components/ChatBox";

const Chat = () => {

  const [selectedUser, setSelectedUser] =
    useState(null);

  return (
    <div className="h-screen flex flex-col">

      <Navbar />

      <div className="flex flex-1">

        <OnlineUsers
          setSelectedUser={setSelectedUser}
        />

        <ChatBox
          selectedUser={selectedUser}
        />

      </div>

    </div>
  );
};

export default Chat;