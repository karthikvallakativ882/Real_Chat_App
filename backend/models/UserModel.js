import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      minlength: 3,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    profilePic: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      default: "Hey there!",
    },
    
    // --- NEW LOGIC ADDED: For tracking Online/Offline status later ---
    lastSeen: {
      type: Date,
      default: Date.now,
    }
    // -----------------------------------------------------------------
  },
  {
    timestamps: true,
  }
);

export const UserModel = mongoose.model("User", userSchema);