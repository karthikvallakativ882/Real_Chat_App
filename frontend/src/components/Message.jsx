import { useState } from "react";

const Message = ({
  msg,
  currentUser,
  onDeleteMessage
}) => {
  // --- NEW LOGIC ADDED: State to handle showing/hiding the delete menu ---
  const [showMenu, setShowMenu] = useState(false);
  // ----------------------------------------------------------------------

  // IMPORTANT FIX
  // --- NEW LOGIC ADDED: Minor safety check (?._id) added just in case the backend populates the senderId ---
  const isMine =
    String(msg.senderId?._id || msg.senderId) ===
    String(currentUser._id);

  // --- NEW LOGIC ADDED: If this user deleted the message for themselves, do not render it ---
  if (msg.deletedFor?.includes(currentUser._id)) {
    return null; 
  }
  // ----------------------------------------------------------------------------------------

  return (
    <div
      className={`flex mb-4 relative ${ // --- NEW LOGIC ADDED: Added 'relative' so the dropdown positions correctly ---
        isMine
          ? "justify-end"
          : "justify-start"
      }`}
    >

      <div
        // --- NEW LOGIC ADDED: Added 'cursor-pointer' to make it clickable, and styling if deleted for everyone ---
        className={`px-4 py-2 rounded-2xl max-w-[300px] cursor-pointer
        
        ${
          isMine
            ? "bg-blue-500 text-white rounded-br-none"
            : "bg-gray-300 text-black rounded-bl-none"
        }
        ${msg.isDeletedForEveryone ? "italic opacity-70" : ""}
        `}
        onClick={() => setShowMenu(!showMenu)}
        // ---------------------------------------------------------------------------------------------------------
      >

        <p>{msg.text}</p>

      </div>

      {/* --- NEW LOGIC ADDED: The actual dropdown menu for deletion options --- */}
      {showMenu && !msg.isDeletedForEveryone && (
        <div className={`absolute top-full mt-1 bg-white border shadow-md rounded p-1 text-sm text-black z-10 w-36 ${isMine ? "right-0" : "left-0"}`}>
          <button 
            onClick={() => { setShowMenu(false); onDeleteMessage(msg._id, "me"); }} 
            className="block px-2 py-1 hover:bg-gray-100 w-full text-left"
          >
            Delete for me
          </button>
          
          {isMine && (
            <button 
              onClick={() => { setShowMenu(false); onDeleteMessage(msg._id, "everyone"); }} 
              className="block px-2 py-1 hover:bg-gray-100 w-full text-left text-red-500"
            >
              Delete for everyone
            </button>
          )}
        </div>
      )}
      {/* ------------------------------------------------------------------------ */}

    </div>
  );
};

export default Message;