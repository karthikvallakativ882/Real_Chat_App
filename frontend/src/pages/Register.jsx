import { useState } from "react";

import API from "../api/axios";

import { useNavigate, Link } from "react-router-dom";

const Register = () => {

  const navigate = useNavigate();

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

      alert(res.data.message);

      navigate("/login");

    } catch (error) {

      alert(error.response.data.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 via-white to-blue-100 px-4 py-8">

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

        <input
          type="password"
          name="password"
          placeholder="Password"
          className="w-full border border-gray-300 bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none p-3 sm:p-4 mb-5 rounded-xl transition-all duration-200"
          onChange={handleChange}
        />

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