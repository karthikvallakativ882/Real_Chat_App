import { useState } from "react";

import API from "../api/axios";

import { useNavigate, Link } from "react-router-dom";

import { toast, ToastContainer } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

// --- NEW LOGIC ADDED: Imported Camera icon for the upload button ---
import { Eye, EyeOff, Camera } from "lucide-react";
// -------------------------------------------------------------------

const Register = () => {

  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  // --- NEW LOGIC ADDED: Added profilePic to initial state & uploading state ---
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    profilePic: "", 
  });
  // --------------------------------------------------------------------------

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // --- NEW LOGIC ADDED: Cloudinary Image Upload Handler ---
  const handleImageUpload = async (e) => {
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
         setFormData({ ...formData, profilePic: cloudData.secure_url });
         toast.success("Profile picture uploaded!");
      } else {
         toast.error("Cloudinary connection rejected.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };
  // --------------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    // --- NEW LOGIC ADDED: Prevent submission if still uploading ---
    if (uploading) {
      return toast.warning("Please wait for the image to finish uploading.");
    }
    // --------------------------------------------------------------

    try {
      const res = await API.post(
        "/auth/register",
        formData
      );

      toast.success(res.data.message);

      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Something went wrong"
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 via-white to-blue-100 px-4 py-8">

      <ToastContainer position="top-right" />

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white/90 backdrop-blur-md shadow-2xl rounded-3xl p-6 sm:p-8 border border-gray-200"
      >

        <div className="text-center mb-6">

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
            Create Account
          </h1>

          <p className="text-gray-500 mt-2 text-sm sm:text-base">
            Join and start chatting instantly
          </p>

        </div>

        {/* --- NEW LOGIC ADDED: Profile Picture Upload UI --- */}
        <div className="flex flex-col items-center justify-center mb-6">
          <label className="cursor-pointer relative group">
            <div className="w-24 h-24 rounded-full border-4 border-green-100 bg-gray-100 flex items-center justify-center overflow-hidden shadow-sm transition-all group-hover:border-green-300">
              {formData.profilePic ? (
                <img src={formData.profilePic} alt="Profile preview" className="w-full h-full object-cover" />
              ) : (
                <Camera size={32} className="text-gray-400 group-hover:text-green-500 transition-colors" />
              )}
              {uploading && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                  <span className="text-xs font-bold text-green-600 animate-pulse">Wait...</span>
                </div>
              )}
            </div>
            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
          </label>
          <span className="text-xs text-gray-400 mt-2">Optional: Add a profile photo</span>
        </div>
        {/* -------------------------------------------------- */}

        <input
          type="text"
          name="username"
          placeholder="Username"
          className="w-full border border-gray-300 bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none p-3 sm:p-4 mb-4 rounded-xl transition-all duration-200"
          onChange={handleChange}
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          className="w-full border border-gray-300 bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none p-3 sm:p-4 mb-4 rounded-xl transition-all duration-200"
          onChange={handleChange}
        />

        {/* Password Input */}
        <div className="relative mb-5">

          <input
            type={
              showPassword
                ? "text"
                : "password"
            }
            name="password"
            placeholder="Password"
            className="w-full border border-gray-300 bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none p-3 sm:p-4 rounded-xl transition-all duration-200 pr-12"
            onChange={handleChange}
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword(!showPassword)
            }
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {
              showPassword
                ? <EyeOff size={22} />
                : <Eye size={22} />
            }
          </button>

        </div>

        <button
          disabled={uploading} // Disable if still uploading image
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white py-3 sm:py-4 rounded-xl font-semibold text-lg shadow-md hover:shadow-lg transition-all duration-200"
        >
          {uploading ? "Uploading..." : "Register"}
        </button>

        <p className="mt-6 text-center text-gray-600 text-sm sm:text-base">

          Already have account?

          <Link
            to="/login"
            className="text-blue-500 hover:text-blue-700 font-semibold ml-2 transition"
          >
            Login
          </Link>

        </p>

      </form>

    </div>
  );
};

export default Register;