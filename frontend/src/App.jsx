import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
// 1. Import your new Workspace page component
import Workspace from "./pages/Workspace"; 

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* 2. CHANGE THIS LINE to render Workspace instead of Chat */}
      <Route path="/chat" element={<Workspace />} />
    </Routes>
  );
}

export default App;