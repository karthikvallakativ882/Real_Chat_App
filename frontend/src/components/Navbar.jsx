import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Navbar = () => {
  const navigate = useNavigate();
  
  // FIX: Destructure both user and setUser from AuthContext
  const { user, setUser } = useContext(AuthContext);

  const logoutHandler = () => {
    // Clear local storage
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    
    // FIX: Clear the context state to trigger re-renders instantly
    setUser(null);
    
    navigate("/login");
  };

  return (
    <div className="bg-gray-900 text-white px-8 py-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold">RealChat</h1>

      <div className="flex gap-4 items-center">
        {user && (
          <>
            <Link to="/">
              <button className="bg-blue-500 px-4 py-2 rounded">
                Home
              </button>
            </Link>

            <Link to="/chat">
              <button className="bg-green-500 px-4 py-2 rounded">
                Chat
              </button>
            </Link>

            <button
              onClick={logoutHandler}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded transition"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Navbar;