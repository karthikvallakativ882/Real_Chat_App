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
    <div
      className="min-h-screen flex flex-col justify-center items-center text-gray-800 font-sans p-4 bg-cover bg-center bg-no-repeat relative overflow-hidden"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop')",
      }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

      <div className="relative z-10 max-w-md w-full bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 text-center border border-white/20">
        
        {/* Branding / Logo Area */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-[#3F0E40] to-[#1164A3] rounded-2xl mx-auto flex justify-center items-center mb-6 shadow-lg">
          <span className="text-white text-3xl sm:text-4xl">💬</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-3 tracking-tight">
          Slack Clone
        </h1>

        <p className="text-gray-200 mb-8 text-sm sm:text-base px-2 leading-relaxed">
          Connect with your team, share files, and collaborate in real-time.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4">
          <Link
            to="/login"
            className="w-full bg-[#1164A3] hover:bg-[#0B4C80] text-white font-semibold py-3 px-4 rounded-2xl transition duration-300 shadow-lg hover:scale-[1.02] flex justify-center items-center gap-2"
          >
            Sign In to Workspace
          </Link>

          <Link
            to="/register"
            className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 font-semibold py-3 px-4 rounded-2xl transition duration-300 shadow-lg hover:scale-[1.02] flex justify-center items-center gap-2 backdrop-blur-md"
          >
            Create an Account
          </Link>
        </div>
        
      </div>
    </div>
  );
};

export default Home;