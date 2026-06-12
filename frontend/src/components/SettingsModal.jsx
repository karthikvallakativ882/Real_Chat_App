import { useState, useContext } from "react";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";
import { X, Camera, Lock, User } from "lucide-react";

const SettingsModal = ({ isOpen, onClose }) => {
  const { user, setUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("profile"); 
  const [uploading, setUploading] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
  });

  if (!isOpen) return null;

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
         await API.put("/auth/update-profile", { profilePic: cloudData.secure_url });
         const updatedUser = { ...user, profilePic: cloudData.secure_url };
         setUser(updatedUser);
         localStorage.setItem("user", JSON.stringify(updatedUser));
         toast.success("Profile picture updated!");
      }
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      const res = await API.put("/auth/change-password", passwordData);
      toast.success(res.data.message || "Password updated successfully");
      setPasswordData({ currentPassword: "", newPassword: "" });
      onClose(); 
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update password");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Settings</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex border-b">
          <button 
            onClick={() => setActiveTab("profile")}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition ${activeTab === "profile" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:bg-gray-50"}`}
          >
            <User size={16} /> Profile
          </button>
          <button 
            onClick={() => setActiveTab("security")}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition ${activeTab === "security" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:bg-gray-50"}`}
          >
            <Lock size={16} /> Security
          </button>
        </div>

        <div className="p-6">
          {activeTab === "profile" ? (
            <div className="flex flex-col items-center">
              <label className="cursor-pointer relative group mb-4">
                <div className="w-28 h-28 rounded-full border-4 border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden shadow-md transition group-hover:border-blue-200">
                  {user?.profilePic ? (
                    <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-bold text-gray-400">{user?.username?.[0]?.toUpperCase()}</span>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600 animate-pulse">Wait...</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 w-full bg-black/50 py-1 flex justify-center opacity-0 group-hover:opacity-100 transition">
                    <Camera size={16} className="text-white" />
                  </div>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
              </label>
              <h3 className="text-lg font-bold text-gray-800">{user?.username}</h3>
              <p className="text-gray-500 text-sm mb-6">{user?.email}</p>
              <p className="text-xs text-gray-400 text-center">Click your picture to upload a new one.</p>
            </div>
          ) : (
            <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Current Password</label>
                <input 
                  type="password" 
                  required
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  className="w-full p-3 border rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">New Password</label>
                <input 
                  type="password" 
                  required
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="w-full p-3 border rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button type="submit" className="w-full mt-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition shadow-sm">
                Update Password
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;