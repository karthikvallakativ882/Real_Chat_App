import { useState } from "react";

import API from "../api/axios";

import { useNavigate, Link } from "react-router-dom";

import { toast, ToastContainer } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

import { Eye, EyeOff } from "lucide-react";

const Register = () => {

  const navigate = useNavigate();

  const [showPassword, setShowPassword] =
    useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {

    e.preventDefault();

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

        <div className="text-center mb-8">

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
            Create Account
          </h1>

          <p className="text-gray-500 mt-2 text-sm sm:text-base">
            Join and start chatting instantly
          </p>

        </div>

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
          className="w-full bg-green-500 hover:bg-green-600 text-white py-3 sm:py-4 rounded-xl font-semibold text-lg shadow-md hover:shadow-lg transition-all duration-200"
        >
          Register
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