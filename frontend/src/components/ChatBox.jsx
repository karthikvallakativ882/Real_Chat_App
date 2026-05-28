import { useEffect, useState, useContext, useRef } from "react";
import { socket } from "../socket/socket";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import Message from "./Message";

const ChatBox = ({ selectedUser }) => {
  const { user } = useContext(AuthContext);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const scrollRef = useRef();

  // FIX: Added 'user &&' to prevent crash if unauthenticated user hits the route
  const roomId = user && selectedUser
    ? [user._id, selectedUser._id].sort().join("-")
    : "";

  // ADD USER TO SOCKET
  useEffect(() => {
    if (!user) return;
    socket.emit("addUser", {
      userId: user._id,
    });
  }, [user]);

  // LOAD OLD MESSAGES
  useEffect(() => {
    if (!roomId) return;

    const getMessages = async () => {
      try {
        const res = await API.get(`/messages/${roomId}`);
        setMessages(res.data);
      } catch (error) {
        console.log(error);
      }
    };

    getMessages();
  }, [roomId]);

  // REALTIME RECEIVE
  useEffect(() => {
    const receiveMessage = (newMessage) => {
      setMessages((prev) => {
        // PREVENT DUPLICATES
        const exists = prev.find((msg) => msg._id === newMessage._id);
        if (exists) return prev;
        
        return [...prev, newMessage];
      });
    };

    socket.on("receiveMessage", receiveMessage);
    socket.on("messageSent", receiveMessage);

    return () => {
      socket.off("receiveMessage", receiveMessage);
      socket.off("messageSent", receiveMessage);
    };
  }, []);

  // AUTO SCROLL
  useEffect(() => {
    scrollRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // SEND MESSAGE
  const handleSend = async () => {
    if (!message.trim()) return;
    if (!selectedUser) return;

    try {
      const messageData = {
        senderId: user._id,
        receiverId: selectedUser._id,
        roomId,
        text: message,
      };

      // SAVE TO DB
      const res = await API.post("/messages", messageData);

      // FIX/IMPROVEMENT: Optimistic UI Update. 
      // Update local state immediately so the sender doesn't have to wait for the socket round-trip.
      setMessages((prev) => [...prev, res.data]);

      // REALTIME SOCKET
      socket.emit("sendMessage", res.data);
      setMessage("");
    } catch (error) {
      console.log(error);
    }
  };

  // NO USER SELECTED
  if (!selectedUser) {
    return (
      <div className="flex-1 flex justify-center items-center bg-gray-100">
        <h1 className="text-2xl text-gray-500">
          Select User To Chat
        </h1>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-100">
      {/* HEADER */}
      <div className="bg-white shadow p-4 flex items-center gap-3 border-b">
        <div className="w-12 h-12 rounded-full bg-blue-500 flex justify-center items-center text-white text-xl font-bold">
          {selectedUser.username[0].toUpperCase()}
        </div>
        <div>
          <h2 className="font-bold text-lg">{selectedUser.username}</h2>
          <p className="text-green-500 text-sm">Chat Active</p>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <Message key={msg._id} msg={msg} currentUser={user} />
        ))}
        <div ref={scrollRef}></div>
      </div>

      {/* INPUT */}
      <div className="bg-white p-4 border-t flex gap-3">
        <input
          type="text"
          placeholder="Type message..."
          className="flex-1 border rounded-lg px-4 py-3 outline-none"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSend();
            }
          }}
        />
        <button
          onClick={handleSend}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBox;