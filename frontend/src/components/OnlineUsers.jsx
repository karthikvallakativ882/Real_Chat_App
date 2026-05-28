import {
  useEffect,
  useState,
} from "react";

import API from "../api/axios";

import { socket } from "../socket/socket";

const OnlineUsers = ({
  setSelectedUser,
}) => {

  const [allUsers, setAllUsers] =
    useState([]);

  const [onlineUsers, setOnlineUsers] =
    useState([]);

  const currentUser = JSON.parse(
    localStorage.getItem("user")
  );


  // FETCH ALL USERS
  useEffect(() => {

    const getUsers = async () => {

      const res = await API.get(
        "/users"
      );

      const filteredUsers =
        res.data.filter(
          (user) =>
            user._id !== currentUser._id
        );

      setAllUsers(filteredUsers);
    };

    getUsers();

  }, []);


  // GET ONLINE USERS
  useEffect(() => {

    socket.on(
      "getOnlineUsers",
      (data) => {

        setOnlineUsers(data);
      }
    );

    return () => {
      socket.off("getOnlineUsers");
    };

  }, []);


  // CHECK ONLINE
  const isUserOnline = (userId) => {

    return onlineUsers.some(
      (user) =>
        user.userId === userId
    );
  };


  return (
    <div className="w-[25%] bg-gray-900 text-white p-4 overflow-y-auto">

      <h2 className="text-2xl font-bold mb-6">
        Users
      </h2>


      {
        allUsers.map((user) => (

          <div
            key={user._id}
            onClick={() =>
              setSelectedUser(user)
            }
            className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 p-3 rounded mb-3 cursor-pointer transition"
          >

            {/* Avatar */}
            <div className="relative">

              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-xl font-bold">

                {user.username[0]}

              </div>


              {/* ONLINE DOT */}
              {
                isUserOnline(user._id) && (

                  <div className="w-4 h-4 bg-green-500 rounded-full absolute bottom-0 right-0 border-2 border-gray-900"></div>

                )
              }

            </div>


            {/* USER INFO */}
            <div>

              <h3 className="font-semibold">
                {user.username}
              </h3>

              <p className="text-sm text-gray-400">

                {
                  isUserOnline(user._id)
                    ? "Online"
                    : "Offline"
                }

              </p>

            </div>

          </div>
        ))
      }

    </div>
  );
};

export default OnlineUsers;