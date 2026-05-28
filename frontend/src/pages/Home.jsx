import { Link, useNavigate } from "react-router-dom";
import { useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";

const Home = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Auto-redirect: If the user is already logged in, skip the home page
  useEffect(() => {
    if (user) {
      navigate("/chat");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center text-gray-800 font-sans p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
        
        {/* Branding / Logo Area */}
        <div className="w-16 h-16 bg-[#3F0E40] rounded-xl mx-auto flex justify-center items-center mb-6 shadow-md">
          <span className="text-white text-3xl">💬</span>
        </div>

        <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
          Slack Clone
        </h1>
        <p className="text-gray-500 mb-8 text-sm px-2">
          Connect with your team, share files, and collaborate in real-time.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Link
            to="/login"
            className="w-full bg-[#1164A3] hover:bg-[#0B4C80] text-white font-semibold py-3 px-4 rounded-xl transition shadow-sm flex justify-center items-center gap-2"
          >
            Sign In to Workspace
          </Link>

          <Link
            to="/register"
            className="w-full bg-white hover:bg-gray-50 text-[#1164A3] border-2 border-[#1164A3] font-semibold py-3 px-4 rounded-xl transition shadow-sm flex justify-center items-center gap-2"
          >
            Create an Account
          </Link>
        </div>
        
      </div>
    </div>
  );
};

export default Home;