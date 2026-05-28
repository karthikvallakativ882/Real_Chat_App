const Message = ({
  msg,
  currentUser,
}) => {

  // IMPORTANT FIX
  const isMine =
    String(msg.senderId) ===
    String(currentUser._id);

  return (
    <div
      className={`flex mb-4 ${
        isMine
          ? "justify-end"
          : "justify-start"
      }`}
    >

      <div
        className={`px-4 py-2 rounded-2xl max-w-[300px]
        
        ${
          isMine
            ? "bg-blue-500 text-white rounded-br-none"
            : "bg-gray-300 text-black rounded-bl-none"
        }`}
      >

        <p>{msg.text}</p>

      </div>

    </div>
  );
};

export default Message;