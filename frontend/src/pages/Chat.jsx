import { useState } from "react";

import Navbar from "../components/Navbar";

import OnlineUsers from "../components/OnlineUsers";

import ChatBox from "../components/ChatBox";

const Chat = () => {

  const [selectedUser, setSelectedUser] =
    useState(null);

  return (
    <div className="h-screen flex flex-col overflow-hidden">

      <Navbar />

      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">

        {/* Sidebar */}
        <div className="w-full md:w-[320px] border-b md:border-b-0 md:border-r overflow-y-auto">
          <OnlineUsers
            setSelectedUser={setSelectedUser}
          />
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden">
          <ChatBox
            selectedUser={selectedUser}
          />
        </div>

      </div>

    </div>
  );
};

export default Chat;