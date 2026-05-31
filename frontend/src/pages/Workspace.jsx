import { useEffect, useState, useContext, useRef } from "react";
import { socket } from "../socket/socket";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import CreateChannelModal from "../components/CreateChannelModal";
// --- NEW LOGIC ADDED: Import Icons for Mobile Menu ---
import { Menu, X } from "lucide-react";
// ----------------------------------------------------

// Predefined set of quick-reactions
const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "👀", "🚀"];

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
  
  // Emoji Picker State
  const [showPickerFor, setShowPickerFor] = useState(null);

  // --- NEW LOGIC ADDED: State for Mobile Sidebar ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // -------------------------------------------------

  // Refs for Socket Listeners
  const activeDestRef = useRef(activeDestination);
  const activeThreadRef = useRef(activeThread);

  useEffect(() => { activeDestRef.current = activeDestination; }, [activeDestination]);
  useEffect(() => { activeThreadRef.current = activeThread; }, [activeThread]);

  const bubbleToTop = (id, isChannel) => {
    if (isChannel) {
      setChannels(prev => {
        const idx = prev.findIndex(c => c._id === id);
        if (idx <= 0) return prev; 
        const item = prev[idx];
        const newArr = [...prev];
        newArr.splice(idx, 1);
        return [item, ...newArr];
      });
    } else {
      setUsers(prev => {
        const idx = prev.findIndex(u => u._id === id);
        if (idx <= 0) return prev; 
        const item = prev[idx];
        const newArr = [...prev];
        newArr.splice(idx, 1);
        return [item, ...newArr];
      });
    }
  };

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

    const joinRooms = () => socket.emit("setup", user);
    if (socket.connected) joinRooms();
    socket.on("connect", joinRooms);

    const handleReceive = (newMsg) => {
      const currentDest = activeDestRef.current;
      const currentThread = activeThreadRef.current;

      const incomingSenderId = typeof newMsg.senderId === 'object' ? newMsg.senderId._id : newMsg.senderId;
      const incomingReceiverId = typeof newMsg.receiverId === 'object' ? newMsg.receiverId._id : newMsg.receiverId;
      const incomingChannelId = typeof newMsg.channelId === 'object' ? newMsg.channelId?._id : newMsg.channelId;

      if (incomingChannelId) bubbleToTop(incomingChannelId, true);
      else if (incomingSenderId !== user._id) bubbleToTop(incomingSenderId, false);

      if (newMsg.parentMessageId) {
        if (currentThread && newMsg.parentMessageId === currentThread._id) {
          setThreadMessages((prev) => [...prev, newMsg]);
        }
        return;
      }

      if (!currentDest) return;

      if (currentDest.isChannel) {
        if (incomingChannelId === currentDest._id) setMessages((prev) => [...prev, newMsg]);
      } else {
        const isFromMeToActiveUser = incomingSenderId === user._id && incomingReceiverId === currentDest._id;
        const isFromActiveUserToMe = incomingSenderId === currentDest._id && incomingReceiverId === user._id;
        if (isFromMeToActiveUser || isFromActiveUserToMe) setMessages((prev) => [...prev, newMsg]);
      }
    };

    const handleUpdate = (updatedMsg) => {
      setMessages((prev) => prev.map(msg => msg._id === updatedMsg._id ? updatedMsg : msg));
      setThreadMessages((prev) => prev.map(msg => msg._id === updatedMsg._id ? updatedMsg : msg));
      if (activeThreadRef.current && activeThreadRef.current._id === updatedMsg._id) {
        setActiveThread(updatedMsg);
      }
    };

    const handleDeleted = (deletedMsg) => {
      setMessages((prev) => prev.map(msg => msg._id === deletedMsg._id ? deletedMsg : msg));
      setThreadMessages((prev) => prev.map(msg => msg._id === deletedMsg._id ? deletedMsg : msg));
    };

    socket.on("receiveMessage", handleReceive);
    socket.on("messageUpdated", handleUpdate);
    socket.on("messageReacted", handleUpdate);
    socket.on("messageDeleted", handleDeleted); 

    return () => {
      socket.off("connect", joinRooms);
      socket.off("receiveMessage", handleReceive);
      socket.off("messageUpdated", handleUpdate);
      socket.off("messageReacted", handleUpdate);
      socket.off("messageDeleted", handleDeleted); 
    };
  }, [user]); 

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { threadScrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [threadMessages]);

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

      if (activeDestination?.isChannel) bubbleToTop(activeDestination._id, true);
      else bubbleToTop(activeDestination._id, false);

    } catch (error) {
      console.error("Message transmission failed", error);
    }
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      const res = await API.put(`/messages/${messageId}/react`, { emoji });
      
      setMessages((prev) => prev.map(msg => msg._id === res.data._id ? res.data : msg));
      setThreadMessages((prev) => prev.map(msg => msg._id === res.data._id ? res.data : msg));
      if (activeThread?._id === res.data._id) setActiveThread(res.data);
      
      socket.emit("addReaction", res.data);
      setShowPickerFor(null);
    } catch (error) {
      console.error("Reaction failed", error);
    }
  };

  const handleDeleteMessage = async (msgId, type) => {
    try {
      const res = await API.put(`/messages/${msgId}/delete`, { type });
      setMessages(prev => prev.map(m => m._id === msgId ? res.data : m));
      setThreadMessages(prev => prev.map(m => m._id === msgId ? res.data : m));
      
      if (type === "everyone") {
        socket.emit("deleteMessage", res.data);
      }
    } catch (error) {
      console.error("Failed to delete message", error);
    }
  };

  const handleClearChat = async () => {
    if (!activeDestination || !window.confirm("Are you sure you want to clear this chat for yourself?")) return;
    try {
      const isChannel = activeDestination.isChannel ? "true" : "false";
      await API.delete(`/messages/clear/${activeDestination._id}?isChannel=${isChannel}`);
      setMessages([]); 
    } catch (error) {
      console.error("Failed to clear chat", error);
    }
  };

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
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: data });
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

  const getDownloadUrl = (url) => url ? url.replace("/upload/", "/upload/fl_attachment/") : "";

  const handleChannelCreated = (newChannel) => {
    setChannels((prev) => [newChannel, ...prev]); 
    setActiveDestination({ ...newChannel, isChannel: true });
    socket.emit("setup", user);
    setIsSidebarOpen(false); // --- NEW LOGIC ADDED: Close sidebar on mobile after creation ---
  };

  const MessageBubble = ({ msg, isThreadView = false }) => {
    const isMe = (typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId) === user._id;
    
    if (msg.deletedFor?.includes(user._id)) return null;

    return (
      <div className={`flex flex-col max-w-[85%] md:max-w-[70%] group ${isMe && !isThreadView ? "self-end items-end" : "self-start items-start"} relative`}>
        <div className="flex items-center gap-2 mb-1 px-1">
          <span className="text-xs font-bold text-gray-600">{isMe ? "You" : (msg.senderId?.username || "User")}</span>
          <span className="text-[9px] text-gray-400">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        <div className={`p-3 rounded-2xl text-sm shadow-xs relative ${isMe && !isThreadView ? "bg-[#1164A3] text-white rounded-tr-none" : "bg-white text-gray-800 border border-gray-200 rounded-tl-none"}`}>
          
          <p className={`whitespace-pre-wrap break-words ${msg.isDeletedForEveryone ? "italic opacity-80" : ""}`}>{msg.text}</p>
          
          {msg.fileUrl && !msg.isDeletedForEveryone && ( 
            <div className="mt-2 rounded-lg overflow-hidden border bg-gray-100 p-1 flex flex-col gap-1 max-w-[240px]">
              <img src={msg.fileUrl} alt="attachment" className="w-full h-auto max-h-32 object-cover rounded" />
              <a href={getDownloadUrl(msg.fileUrl)} download className="bg-white text-[#1164A3] hover:bg-gray-50 text-[11px] font-bold py-1 px-2 rounded border text-center block shadow-2xs transition">
                📥 Download
              </a>
            </div>
          )}
        </div>

        {msg.reactions && msg.reactions.length > 0 && !msg.isDeletedForEveryone && ( 
          <div className={`flex flex-wrap gap-1 mt-1 ${isMe && !isThreadView ? "justify-end" : "justify-start"}`}>
            {msg.reactions.map(r => {
              const hasReacted = r.users.includes(user._id);
              return (
                <button 
                  key={r.emoji} 
                  onClick={() => handleReaction(msg._id, r.emoji)}
                  className={`text-[11px] px-1.5 py-0.5 rounded-full border flex items-center gap-1 transition ${hasReacted ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-300 hover:bg-gray-100'}`}
                >
                  <span>{r.emoji}</span>
                  <span className={hasReacted ? 'text-blue-700 font-bold' : 'text-gray-600'}>{r.users.length}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* --- NEW LOGIC ADDED: Mobile friendly hover actions (opacity-100 on touch devices) --- */}
        {!msg.isDeletedForEveryone && ( 
          <div className={`flex gap-3 text-[11px] font-semibold mt-1 px-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition absolute ${isMe && !isThreadView ? "md:-left-36 md:top-4 right-0 -bottom-8 md:-bottom-auto" : "md:-right-36 md:top-4 left-0 -bottom-8 md:-bottom-auto"} bg-white border shadow-sm rounded-lg p-1 z-10`}>
            <div className="relative">
              <button onClick={() => setShowPickerFor(showPickerFor === msg._id ? null : msg._id)} className="hover:bg-gray-100 p-1 rounded" title="Add Reaction">😀</button>
              
              {showPickerFor === msg._id && (
                <div className="absolute top-8 md:top-auto md:bottom-8 -left-4 bg-white border shadow-xl rounded-lg p-2 flex gap-1 z-50 w-max">
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => handleReaction(msg._id, e)} className="hover:bg-gray-100 text-lg p-1 rounded transition hover:scale-125">{e}</button>
                  ))}
                </div>
              )}
            </div>
            
            {!isThreadView && (
              <button onClick={async () => {
                setActiveThread(msg);
                try {
                  const res = await API.get(`/messages/${msg._id}?isThread=true`);
                  setThreadMessages(res.data);
                } catch (err) { console.error(err); }
              }} className="hover:bg-gray-100 p-1 rounded" title="Reply in Thread">💬</button>
            )}
            
            {isMe && <button onClick={() => setEditingMessage(msg)} className="hover:bg-gray-100 p-1 rounded" title="Edit Message">✏️</button>}

            <button onClick={() => handleDeleteMessage(msg._id, "me")} className="hover:bg-gray-100 p-1 rounded text-red-500" title="Delete for me">🗑️</button>
            {isMe && (
              <button onClick={() => handleDeleteMessage(msg._id, "everyone")} className="hover:bg-gray-100 p-1 rounded text-red-700 font-bold" title="Delete for everyone">🚫</button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans overflow-hidden relative">
      
      {/* --- NEW LOGIC ADDED: Mobile Overlay to close sidebar --- */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      {/* -------------------------------------------------------- */}

      {/* SIDEBAR NAVIGATION - Updated with responsive classes */}
      <div className={`w-64 bg-[#3F0E40] text-white flex flex-col shadow-lg z-40 absolute h-full transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-4 font-bold text-xl border-b border-white/10 flex justify-between items-center">
          <span>Slack Workspace</span>
          {/* --- NEW LOGIC ADDED: Close button for mobile sidebar --- */}
          <button className="md:hidden text-gray-300 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 select-none">
          <div className="flex justify-between items-center mb-3 mt-2 text-gray-300">
            <h3 className="font-semibold text-xs uppercase tracking-wider">Channels</h3>
            <button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2 py-1 rounded transition font-medium shadow-sm">+ Create</button>
          </div>
          <div className="mb-6 border-b border-white/10 pb-4 flex flex-col gap-1">
            {channels.map(c => (
              <div key={c._id} onClick={() => { 
                setActiveDestination({ ...c, isChannel: true }); 
                setActiveThread(null); 
                setIsSidebarOpen(false); // --- NEW LOGIC ADDED: Auto close on mobile ---
              }} className={`cursor-pointer px-3 py-2 rounded-md transition font-medium text-sm flex items-center gap-1 ${activeDestination?.isChannel && activeDestination?._id === c._id ? "bg-[#1164A3] text-white shadow" : "hover:bg-white/10 text-gray-300"}`}>
                <span className="text-gray-400">#</span> {c.name}
              </div>
            ))}
          </div>
          <div className="mb-3 text-gray-300">
            <h3 className="font-semibold text-xs uppercase tracking-wider">Direct Messages</h3>
          </div>
          <div className="flex flex-col gap-1">
            {users.map(u => (
              <div key={u._id} onClick={() => { 
                setActiveDestination({ ...u, isChannel: false }); 
                setActiveThread(null);
                setIsSidebarOpen(false); // --- NEW LOGIC ADDED: Auto close on mobile ---
              }} className={`cursor-pointer px-3 py-2 rounded-md transition flex items-center gap-2 text-sm ${!activeDestination?.isChannel && activeDestination?._id === u._id ? "bg-[#1164A3] text-white shadow" : "hover:bg-white/10 text-gray-300"}`}>
                <div className="w-5 h-5 rounded-full bg-blue-500 flex justify-center items-center text-[10px] font-bold text-white shadow-sm">{u.username[0].toUpperCase()}</div>
                <span>{u.username}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN DISPLAY HUB */}
      <div className="flex-1 flex flex-col bg-white relative z-10 w-full overflow-hidden">
        <div className="p-4 border-b font-bold text-lg shadow-sm flex justify-between items-center bg-white z-10">
          <div className="flex items-center gap-2">
            {/* --- NEW LOGIC ADDED: Hamburger Menu Button --- */}
            <button 
              className="md:hidden mr-2 text-gray-600 hover:text-gray-900" 
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            {/* ---------------------------------------------- */}
            {activeDestination ? (
              <>{activeDestination.isChannel ? <span className="text-gray-400 text-xl">#</span> : <div className="w-6 h-6 rounded bg-blue-500 flex justify-center items-center text-xs text-white shadow-sm">{activeDestination.username[0].toUpperCase()}</div>}<span className="truncate max-w-[150px] md:max-w-none">{activeDestination.name || activeDestination.username}</span></>
            ) : <span className="text-gray-400 font-normal text-sm md:text-base">Select a conversation</span>}
          </div>
          
          {activeDestination && (
            <button 
              onClick={handleClearChat}
              className="text-xs text-red-500 hover:bg-red-50 px-2 md:px-3 py-1.5 rounded border border-red-200 transition font-medium whitespace-nowrap"
            >
              🧹 <span className="hidden md:inline">Clear Chat</span>
            </button>
          )}
        </div>
        
        {/* MESSAGES LOG */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-8 md:gap-6 bg-gray-50 pb-24 md:pb-20">
          {messages.map(msg => <MessageBubble key={msg._id} msg={msg} />)}
          <div ref={scrollRef}></div>
        </div>

        {/* COMPOSER DOCK */}
        <div className="p-3 md:p-4 border-t bg-white flex flex-col gap-2 z-10 relative shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          {editingMessage && (
            <div className="text-xs text-amber-700 flex justify-between bg-amber-50 p-2 rounded border border-amber-200 items-center">
              <span>Modifying entry...</span><button onClick={() => setEditingMessage(null)} className="font-bold hover:underline">Cancel</button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <label className="cursor-pointer bg-gray-100 border border-gray-300 hover:bg-gray-200 text-gray-600 p-2 md:p-3 rounded-xl flex justify-center items-center transition shadow-sm active:scale-95">
              <span className="text-lg leading-none">📎</span>
              <input type="file" onChange={handleFileUpload} className="hidden" accept="image/*" disabled={!activeDestination || uploading} />
            </label>
            <div className="flex-1 border border-gray-300 rounded-xl bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500 overflow-hidden flex items-center">
              <input 
                type="text" 
                placeholder={uploading ? "Uploading..." : !activeDestination ? "Select conversation" : `Message ${activeDestination?.name ? '#' + activeDestination.name : activeDestination?.username}`}
                disabled={!activeDestination || uploading}
                onKeyDown={(e) => { if(e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e.target.value); e.target.value=""; } }}
                className="w-full p-2 md:p-3 text-sm outline-none disabled:bg-gray-100 text-gray-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* THREAD SYSTEM CONTEXT SLIDEOUT - Updated for mobile overlay */}
      {activeThread && (
        <div className="fixed right-0 h-full w-full sm:w-80 bg-gray-50 shadow-2xl flex flex-col border-l z-50 md:relative md:z-30 transition-all duration-300">
          <div className="p-4 border-b font-bold flex justify-between items-center bg-white shadow-sm z-10">
            <span className="text-sm font-bold">Thread</span>
            <button onClick={() => setActiveThread(null)} className="text-gray-400 hover:text-gray-700 text-sm p-2">✖</button>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
             <div className="pb-3 border-b border-gray-200"><MessageBubble msg={activeThread} isThreadView={true} /></div>
             {threadMessages.map(reply => <MessageBubble key={reply._id} msg={reply} isThreadView={true} />)}
             <div ref={threadScrollRef}></div>
          </div>

          <div className="p-4 border-t bg-white z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
            <input 
              type="text" 
              placeholder="Reply..."
              onKeyDown={(e) => { if (e.key === "Enter" && e.target.value.trim()) { handleSubmit(e.target.value); e.target.value = ""; } }}
              className="w-full p-2 text-sm border rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>
        </div>
      )}
      <CreateChannelModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onChannelCreated={handleChannelCreated} />
    </div>
  );
};

export default Workspace;