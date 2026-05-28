import { useEffect, useState, useContext, useRef } from "react";
import { socket } from "../socket/socket";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import CreateChannelModal from "../components/CreateChannelModal";

const Workspace = () => {
  const { user } = useContext(AuthContext);
  const scrollRef = useRef();
  const threadScrollRef = useRef();
  
  // State Management
  const [channels, setChannels] = useState([]);
  const [users, setUsers] = useState([]); 
  const [activeDestination, setActiveDestination] = useState(null); 
  const [messages, setMessages] = useState([]);
  const [activeThread, setActiveThread] = useState(null); 
  const [threadMessages, setThreadMessages] = useState([]);
  const [editingMessage, setEditingMessage] = useState(null); 
  const [uploading, setUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Refs for Socket Listeners
  const activeDestRef = useRef(activeDestination);
  const activeThreadRef = useRef(activeThread);

  useEffect(() => {
    activeDestRef.current = activeDestination;
  }, [activeDestination]);

  useEffect(() => {
    activeThreadRef.current = activeThread;
  }, [activeThread]);

  // 1. Initial Fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [channelsRes, usersRes] = await Promise.all([
          API.get("/channels"),
          API.get("/users")
        ]);
        setChannels(channelsRes.data);
        setUsers(usersRes.data.filter(u => u._id !== user._id));
      } catch (error) {
        console.error("Failed to fetch initial data", error);
      }
    };
    if (user?._id) fetchInitialData();
  }, [user?._id]);

  // 2. Fetch History on Change
  useEffect(() => {
    if (!activeDestination) return;
    const fetchHistory = async () => {
      try {
        const isChannel = activeDestination.isChannel ? "true" : "false";
        const res = await API.get(`/messages/${activeDestination._id}?isChannel=${isChannel}`);
        setMessages(res.data);
      } catch (error) {
        console.error("Failed to fetch messages", error);
      }
    };
    fetchHistory();
  }, [activeDestination]);

  // 3. BULLETPROOF REAL-TIME SOCKET SYNC
  useEffect(() => {
    if (!user) return;

    const joinRooms = () => {
      socket.emit("setup", user);
    };

    if (socket.connected) {
      joinRooms();
    }

    socket.on("connect", joinRooms);

    const handleReceive = (newMsg) => {
      const currentDest = activeDestRef.current;
      const currentThread = activeThreadRef.current;

      const incomingSenderId = typeof newMsg.senderId === 'object' ? newMsg.senderId._id : newMsg.senderId;
      const incomingReceiverId = typeof newMsg.receiverId === 'object' ? newMsg.receiverId._id : newMsg.receiverId;
      const incomingChannelId = typeof newMsg.channelId === 'object' ? newMsg.channelId?._id : newMsg.channelId;

      // Handle Thread Replies
      if (newMsg.parentMessageId) {
        if (currentThread && newMsg.parentMessageId === currentThread._id) {
          setThreadMessages((prev) => [...prev, newMsg]);
        }
        return;
      }

      // CRITICAL FIX: If no chat is active, drop the message safely
      if (!currentDest) return;

      // Live Channel Injection
      if (currentDest.isChannel) {
        if (incomingChannelId === currentDest._id) {
          setMessages((prev) => [...prev, newMsg]);
        }
      } 
      // Live Private DM Injection
      else {
        const isFromMeToActiveUser = incomingSenderId === user._id && incomingReceiverId === currentDest._id;
        const isFromActiveUserToMe = incomingSenderId === currentDest._id && incomingReceiverId === user._id;

        if (isFromMeToActiveUser || isFromActiveUserToMe) {
          setMessages((prev) => [...prev, newMsg]);
        }
      }
    };

    const handleEdit = (updatedMsg) => {
      setMessages((prev) => 
        prev.map(msg => msg._id === updatedMsg._id ? updatedMsg : msg)
      );
    };

    socket.on("receiveMessage", handleReceive);
    socket.on("messageUpdated", handleEdit);

    return () => {
      socket.off("connect", joinRooms);
      socket.off("receiveMessage", handleReceive);
      socket.off("messageUpdated", handleEdit);
    };
  }, [user]); 

  // Auto Scroll Engine
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    threadScrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadMessages]);

  // 4. Send Message Controller
  const handleSubmit = async (text, fileUrl = "") => {
    if (!text.trim() && !fileUrl) return;

    try {
      if (editingMessage) {
        const res = await API.put(`/messages/${editingMessage._id}`, { text });
        socket.emit("editMessage", res.data);
        setMessages((prev) => prev.map(msg => msg._id === res.data._id ? res.data : msg));
        setEditingMessage(null);
        return;
      }

      const payload = {
        text,
        fileUrl,
        channelId: activeDestination?.isChannel ? activeDestination._id : null,
        receiverId: !activeDestination?.isChannel ? activeDestination._id : null,
        parentMessageId: activeThread ? activeThread._id : null,
      };

      const res = await API.post("/messages", payload);
      
      if (activeThread) {
        setThreadMessages((prev) => [...prev, res.data]);
      } else {
        setMessages((prev) => [...prev, res.data]);
      }

      socket.emit("sendMessage", res.data);
    } catch (error) {
      console.error("Message transmission failed", error);
    }
  };

  // 5. Cloudinary Storage Management
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "defb65ant";
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "chatapp";

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", uploadPreset); 
    data.append("cloud_name", cloudName);           
    
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: data,
      });
      const cloudData = await res.json();
      
      if (cloudData.secure_url) {
         handleSubmit("Sent an attachment 📎", cloudData.secure_url);
      } else {
         alert("Cloudinary connection rejected.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const getDownloadUrl = (url) => {
    if (!url) return "";
    return url.replace("/upload/", "/upload/fl_attachment/");
  };

  const handleChannelCreated = (newChannel) => {
    setChannels((prev) => [...prev, newChannel]);
    setActiveDestination({ ...newChannel, isChannel: true });
    socket.emit("setup", user);
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <div className="w-64 bg-[#3F0E40] text-white flex flex-col shadow-lg">
        <div className="p-4 font-bold text-xl border-b border-white/10">
          Slack Workspace
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 select-none">
          <div className="flex justify-between items-center mb-3 mt-2 text-gray-300">
            <h3 className="font-semibold text-xs uppercase tracking-wider">Channels</h3>
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2 py-1 rounded transition font-medium shadow-sm"
            >
              + Create
            </button>
          </div>
          
          <div className="mb-6 border-b border-white/10 pb-4 flex flex-col gap-1">
            {channels.map(c => (
              <div 
                key={c._id} 
                onClick={() => { setActiveDestination({ ...c, isChannel: true }); setActiveThread(null); }}
                className={`cursor-pointer px-3 py-2 rounded-md transition font-medium text-sm flex items-center gap-1 ${activeDestination?.isChannel && activeDestination?._id === c._id ? "bg-[#1164A3] text-white shadow" : "hover:bg-white/10 text-gray-300"}`}
              >
                <span className="text-gray-400">#</span> {c.name}
              </div>
            ))}
          </div>

          <div className="mb-3 text-gray-300">
            <h3 className="font-semibold text-xs uppercase tracking-wider">Direct Messages</h3>
          </div>
          <div className="flex flex-col gap-1">
            {users.map(u => (
              <div 
                key={u._id} 
                onClick={() => { setActiveDestination({ ...u, isChannel: false }); setActiveThread(null); }}
                className={`cursor-pointer px-3 py-2 rounded-md transition flex items-center gap-2 text-sm ${!activeDestination?.isChannel && activeDestination?._id === u._id ? "bg-[#1164A3] text-white shadow" : "hover:bg-white/10 text-gray-300"}`}
              >
                <div className="w-5 h-5 rounded-full bg-blue-500 flex justify-center items-center text-[10px] font-bold text-white shadow-sm">
                  {u.username[0].toUpperCase()}
                </div>
                <span>{u.username}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CORE DISPLAY HUB */}
      <div className="flex-1 flex flex-col bg-white">
        <div className="p-4 border-b font-bold text-lg shadow-sm flex items-center gap-2 bg-white">
          {activeDestination ? (
            <>
              {activeDestination.isChannel ? <span className="text-gray-400 text-xl">#</span> : <div className="w-6 h-6 rounded bg-blue-500 flex justify-center items-center text-xs text-white shadow-sm">{activeDestination.username[0].toUpperCase()}</div>}
              <span>{activeDestination.name || activeDestination.username}</span>
            </>
          ) : (
            <span className="text-gray-400 font-normal text-base">Select a conversation context to begin chatting</span>
          )}
        </div>
        
        {/* NEW HIGH-VISIBILITY MESSAGES CHAT LOG */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3 bg-gray-50">
          {messages.map(msg => {
            const isMe = (typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId) === user._id;
            
            return (
              <div 
                key={msg._id} 
                className={`flex flex-col max-w-[70%] group ${isMe ? "self-end items-end" : "self-start items-start"}`}
              >
                {/* Username Header Labels */}
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-xs font-bold text-gray-600">
                    {isMe ? "You" : (msg.senderId?.username || "User")}
                  </span>
                  <span className="text-[9px] text-gray-400">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Styled Chat Bubble */}
                <div className={`p-3 rounded-2xl text-sm shadow-xs ${
                  isMe 
                    ? "bg-[#1164A3] text-white rounded-tr-none" 
                    : "bg-white text-gray-800 border border-gray-200 rounded-tl-none"
                }`}>
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  
                  {msg.fileUrl && (
                    <div className="mt-2 rounded-lg overflow-hidden border bg-gray-100 p-1 flex flex-col gap-1 max-w-[240px]">
                      <img src={msg.fileUrl} alt="attachment" className="w-full h-auto max-h-32 object-cover rounded" />
                      <a 
                        href={getDownloadUrl(msg.fileUrl)} 
                        download 
                        className="bg-white text-[#1164A3] hover:bg-gray-50 text-[11px] font-bold py-1 px-2 rounded border text-center block shadow-2xs transition"
                      >
                        📥 Download
                      </a>
                    </div>
                  )}
                </div>

                {/* Inline Interaction Triggers */}
                <div className={`flex gap-3 text-[10px] font-semibold mt-1 px-1 opacity-0 group-hover:opacity-100 transition ${isMe ? "flex-row-reverse" : ""}`}>
                  <button 
                    onClick={async () => {
                      setActiveThread(msg);
                      try {
                        const res = await API.get(`/messages/${msg._id}?isThread=true`);
                        setThreadMessages(res.data);
                      } catch (err) {
                        console.error(err);
                      }
                    }} 
                    className="text-blue-600 hover:underline"
                  >
                    💬 Reply
                  </button>
                  {isMe && (
                    <button onClick={() => setEditingMessage(msg)} className="text-amber-600 hover:underline">✏️ Edit</button>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={scrollRef}></div>
        </div>

        {/* INPUT COMPOSER DOCK BAR */}
        <div className="p-4 border-t bg-gray-50 flex flex-col gap-2">
          {editingMessage && (
            <div className="text-xs text-amber-700 flex justify-between bg-amber-50 p-2 rounded border border-amber-200 items-center">
              <span>Modifying current selection entry...</span>
              <button onClick={() => setEditingMessage(null)} className="font-bold hover:underline">Cancel</button>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-100 text-gray-600 p-3 rounded-xl flex justify-center items-center transition shadow-sm active:scale-95">
              <span className="text-lg leading-none">📎</span>
              <input type="file" onChange={handleFileUpload} className="hidden" accept="image/*" disabled={!activeDestination || uploading} />
            </label>
            
            <div className="flex-1 border border-gray-300 rounded-xl bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500 overflow-hidden flex items-center">
              <input 
                type="text" 
                placeholder={uploading ? "Uploading attachment asset..." : !activeDestination ? "Please click on a conversation" : `Message ${activeDestination?.name ? '#' + activeDestination.name : activeDestination?.username}`}
                disabled={!activeDestination || uploading}
                onKeyDown={(e) => { 
                  if(e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e.target.value); 
                    e.target.value="";
                  } 
                }}
                className="w-full p-3 text-sm outline-none disabled:bg-gray-100 text-gray-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SUB-THREAD CONTEXT SIDE PANEL */}
      {activeThread && (
        <div className="w-80 bg-gray-50 shadow-2xl flex flex-col border-l">
          <div className="p-4 border-b font-bold flex justify-between items-center bg-white shadow-sm">
            <span className="text-sm font-bold">Thread Window</span>
            <button onClick={() => setActiveThread(null)} className="text-gray-400 hover:text-gray-700 text-sm">✖</button>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
             <div className="pb-3 border-b border-gray-200">
               <strong className="font-semibold text-gray-900 text-sm">{activeThread.senderId?.username}</strong>
               <p className="text-gray-700 text-sm mt-0.5">{activeThread.text}</p>
               {activeThread.fileUrl && (
                 <div className="mt-2 rounded-lg border max-w-full shadow-sm bg-white p-2 flex flex-col gap-2">
                   <img src={activeThread.fileUrl} alt="thread asset" className="max-w-full rounded h-auto" />
                   <a 
                     href={getDownloadUrl(activeThread.fileUrl)} 
                     download={`Thread_File_${activeThread._id}.jpg`}
                     className="w-full bg-blue-50 hover:bg-blue-100 text-[#1164A3] text-xs font-semibold py-1 px-2 rounded text-center block transition border border-blue-200"
                   >
                     📥 Download
                   </a>
                 </div>
               )}
             </div>
             
             {threadMessages.map(reply => (
                <div key={reply._id} className="flex flex-col bg-white p-2 rounded border border-gray-100 shadow-2xs">
                  <strong className="font-semibold text-xs text-gray-800">{reply.senderId?.username || "User"}</strong>
                  <p className="text-gray-600 text-xs mt-0.5">{reply.text}</p>
                </div>
             ))}
             <div ref={threadScrollRef}></div>
          </div>

          <div className="p-4 border-t bg-white">
            <input 
              type="text" 
              placeholder="Reply to thread..."
              onKeyDown={(e) => { 
                if (e.key === "Enter" && e.target.value.trim()) {
                  handleSubmit(e.target.value); 
                  e.target.value = "";
                } 
              }}
              className="w-full p-2 text-xs border rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
      
      <CreateChannelModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onChannelCreated={handleChannelCreated} 
      />
    </div>
  );
};

export default Workspace;