import { useState, useContext } from "react";

import API from "../api/axios";

import { AuthContext } from "../context/AuthContext";

import { useNavigate, Link } from "react-router-dom";

const Login = () => {

  const navigate = useNavigate();

  const { setUser } = useContext(AuthContext);

  const [formData, setFormData] = useState({
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
        "/auth/login",
        formData
      );

      localStorage.setItem(
        "user",
        JSON.stringify(res.data.user)
      );

      localStorage.setItem(
        "token",
        res.data.token
      );

      setUser(res.data.user);

      navigate("/");

    } catch (error) {

      alert(error.response.data.message);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-100 via-white to-blue-200 px-4">

      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-md p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-200"
      >

        <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-center text-gray-800">
          Login
        </h1>

        <input
          type="email"
          name="email"
          placeholder="Email"
          className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none p-3 mb-4 rounded-lg transition"
          onChange={handleChange}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none p-3 mb-5 rounded-lg transition"
          onChange={handleChange}
        />

        <button
          className="bg-blue-500 hover:bg-blue-600 transition text-white w-full py-3 rounded-lg font-semibold text-lg"
        >
          Login
        </button>

        <p className="mt-5 text-center text-sm sm:text-base text-gray-600">

          No Account?

          <Link
            to="/register"
            className="text-blue-500 hover:text-blue-700 font-medium ml-2"
          >
            Register
          </Link>

        </p>

      </form>

    </div>
  );
};

export default Login;